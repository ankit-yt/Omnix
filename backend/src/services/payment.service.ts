import paymentOrderRepository from '@/repositories/paymentOrder.repository.js';
import planRepository from '@/repositories/plan.repository.js';
import AppError from '@/utils/AppError.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto'
import promotionRepository from '@/repositories/promotion.repository.js';

class PaymentService{
  private razorpay: Razorpay;
  private webhookSecret:string;
  

  constructor(){
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if(!keyId || !keySecret || !webhookSecret){
      throw new Error('CRITICAL: Razorpay credentials or webhook secret is missing from the environment variables.');
    }

    this.razorpay = new Razorpay({key_id:keyId, key_secret:keySecret});
    this.webhookSecret = webhookSecret;
  }

  async createCheckOutSession(organizationId:string , planId:string){
    const plan = await planRepository.findById(planId);
    if(!plan) throw new AppError('Requested plan does not exist.',404);

    const activePromo = await promotionRepository.findBestActiveForPlan(planId);

    let finalAmountInPaise = plan.priceInPaise;
    let appliedPromtionNotes = undefined;

    if(activePromo){
      const discountAmount = Math.floor((plan.priceInPaise * activePromo.discountPercentage)/100);
      finalAmountInPaise = Math.max(0,plan.priceInPaise - discountAmount);
      appliedPromtionNotes = `Automatic sale Applied: ${activePromo.name} (-${activePromo.discountPercentage}%)`;
    }
    try{
      const razorpayOrder = await this.razorpay.orders.create({
        amount:plan.priceInPaise,
        currency:plan.currency,
        receipt:`receipt_${organizationId}_${Date.now()}`,
      })

      const paymentOrder = await paymentOrderRepository.create({
        organizationId:new mongoose.Types.ObjectId(organizationId),
        amount:plan.priceInPaise,
        currency:plan.currency,
        status:'pending',
        razorpayOrderId:razorpayOrder.id,
        errorMessage:appliedPromtionNotes
      });

      return {
        razorpayOrder:razorpayOrder.id,
        amount:plan.priceInPaise,
        currency:plan.currency,
        dbOrderId:paymentOrder._id
      };
    }catch(error:any){
      console.log('[RAZORPAY_ORDER_ERROR',error);
      throw new AppError('Failed to initiate payment gateway session.',502);
    }
  }

  async processWebHook(rawBody:string,signature:string){
    const expectedSignature = crypto
      .createHmac('sha256',this.webhookSecret)
      .update(rawBody)
      .digest('hex');

      if(expectedSignature != signature){
        throw new AppError('Invalid webhook signature. Possible tampering detected.',400);
      }

      const payload = JSON.parse(rawBody);
      const eventType = payload.event;

      if(eventType != 'payment.captured' && eventType != 'order.paid'){
        return {status:'ignored',message:`Unhandled event type: ${eventType}`};
      }

      const paymentEntity = payload.payload.payment.entity;


      }
}

export default new PaymentService();