import paymentOrderRepository from '@/repositories/paymentOrder.repository.js';
import planRepository from '@/repositories/plan.repository.js';
import AppError from '@/utils/AppError.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto'
import promotionRepository from '@/repositories/promotion.repository.js';
import subscriptionRepository from '@/repositories/subscription.repository.js';
import organizationRepository from '@/repositories/organization.repository.js';

class PaymentService {
  private razorpay: Razorpay;
  private webhookSecret: string;


  constructor() {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!keyId || !keySecret || !webhookSecret) {
      throw new Error('CRITICAL: Razorpay credentials or webhook secret is missing from the environment variables.');
    }

    this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    this.webhookSecret = webhookSecret;
  }

  async createCheckOutSession(organizationId: string, planId: string) {
    const plan = await planRepository.findById(planId);
    if (!plan) throw new AppError('Requested plan does not exist.', 404);

    if (!plan.razorpayPlanId) {
      throw new AppError(`The ${plan.displayName} plan is not configured for external billing.`, 400);
    }

    const activePromo = await promotionRepository.findBestActiveForPlan(planId);

    let finalAmountInPaise = plan.priceInPaise;
    let appliedPromtionNotes = undefined;

    if (activePromo) {
      const discountAmount = Math.floor((plan.priceInPaise * activePromo.discountPercentage) / 100);
      finalAmountInPaise = Math.max(0, plan.priceInPaise - discountAmount);
      appliedPromtionNotes = `Automatic sale Applied: ${activePromo.name} (-${activePromo.discountPercentage}%)`;
    }
    try {

      const rzpSubscription = await this.razorpay.subscriptions.create({
        plan_id : plan.razorpayPlanId,
        customer_notify: 1,
        total_count: 120,
      })

      const paymentOrder = await paymentOrderRepository.create({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        amount: plan.priceInPaise,
        currency: plan.currency,
        status: 'pending',
        razorpaySubscriptionId: rzpSubscription.id,
        errorMessage: appliedPromtionNotes
      });

      return {
        razorpaySubscriptionId: rzpSubscription.id,
        amount: finalAmountInPaise,
        currency: plan.currency,
        dbOrderId: paymentOrder._id
      };
    } catch (error: any) {
      console.log('[RAZORPAY_ORDER_ERROR', error);
      throw new AppError('Failed to initiate payment gateway session.', 502);
    }
  }

  async processWebHook(rawBody: string, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature != signature) {
      throw new AppError('Invalid webhook signature. Possible tampering detected.', 400);
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;

    if (!['subscription.activated', 'subscription.charged', 'subscription.cancelled'].includes(eventType)) {
      return { status: 'ignored', message: `Unhandled event type: ${eventType}` };
    }

    const rzpSubId = payload.payload.subscription.entity.id;
    const rzpPaymentId = payload.payload.payment?.entity?.id;
    const rzpPlanId = payload.payload.subscription.entity.plan_id;

    const session = await mongoose.startSession();
    session.startTransaction();
    try {

      const paymentOrder = await paymentOrderRepository.findByrazorpaySubscriptionId(rzpSubId);
      if (!paymentOrder) {
        throw new AppError(`Payment order ${rzpSubId} not found in the database.`, 404);
      }

      if (paymentOrder.status === 'success') {
        await session.abortTransaction();
        return { status: 'success', message: 'Webhook already processd previously.' };
      }

      if (eventType === 'subscription.activated' || eventType === 'subscription.charges') {
        await paymentOrderRepository.updatePaymentState(
          paymentOrder._id,
          {
            status: 'success',
            razorpayPaymentId: rzpPaymentId
          }
        )
      }

      const plan = await planRepository.findByRazorpayPlanId(rzpPlanId);
      if (!plan) throw new AppError('Associated plan not found in database.', 404);


      let dbSubscription = await subscriptionRepository.findByOrganization(paymentOrder.organizationId.toString());

      if (!dbSubscription || dbSubscription.status === 'cancelled') {
        dbSubscription = await subscriptionRepository.create({
          organization: paymentOrder.organizationId,
          plan: plan.code,
          status: "active",
          razorPaySubscriptionId: rzpSubId,
          lockedLimits: plan.limits,
          payments: [paymentOrder._id],
          lastPayment: paymentOrder._id,
          history: [{
            event: 'activated',
            toPlan: plan.code,
            toStatus: 'active',
            note: 'Initial Subscription creation on successful payment.'
          }]
        }, session);
      } else {
        await subscriptionRepository.recordRenewal(
          dbSubscription._id!,
          paymentOrder._id,
          {
            event: 'renewed',
            toPlan: plan.code,
            toStatus: 'active',
            note: 'Recurring monthly payment successful.'
          },
          session
        );
      }

      if (eventType === 'subscription.cancelled') {
        const dbSubscription = await subscriptionRepository.findByRazorpaySubscriptionId(rzpSubId);

        if (dbSubscription) {
          await subscriptionRepository.cancel(dbSubscription._id!, {
            event: 'cancelled',
            fromPlan: dbSubscription.plan,
            toPlan: 'free',
            toStatus: 'cancelled',
            note: 'Razorpay subscription gateway cancellation event confirmed.'
          });

          const freePlan = await planRepository.findByCode('free');
          if (freePlan) {
            await organizationRepository.update(
              dbSubscription.organization.toString(),
              {
                "subscription.status": "cancelled",
                cachedPlan: "free",
                cachedLimits: freePlan.limits
              },
              session
            )
          };
          console.log(`Organization data boundaries adjusted down to free tier constraints for subscription: ${rzpSubId}`)
        } else {
          console.error(`Cancellation event received for tracking token containing no baseline DB row matching: ${rzpSubId}`)
        }

        await session.commitTransaction();
        return { status: 'success', message: `Successfully matched execution profile for event: ${eventType}` };
      }
    } catch (error) {
      await session.abortTransaction();
      console.error('[CRITICAL_WEBHOOK_TRANSACTION_ABORT]', error);
      throw new AppError('Billing webhook atomic transaction tracking failure.', 500);
    } finally {
      session.endSession();
    }
  }
}

export default new PaymentService();