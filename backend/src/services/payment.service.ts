import paymentOrderRepository from '@/repositories/paymentOrder.repository.js';
import planRepository from '@/repositories/plan.repository.js';
import AppError from '@/utils/AppError.js';
import mongoose from 'mongoose';
import Razorpay from 'razorpay';
import crypto from 'crypto';
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
    if (!plan.razorpayPlanId) throw new AppError(`The ${plan.displayName} plan is not configured for external billing.`, 400);

    const activePromo = await promotionRepository.findBestActiveForPlan(planId);
    let finalAmountInPaise = plan.priceInPaise;
    let appliedPromtionNotes = undefined;

    if (activePromo) {
      const discountAmount = Math.floor((plan.priceInPaise * activePromo.discountPercentage) / 100);
      finalAmountInPaise = Math.max(0, plan.priceInPaise - discountAmount);
      appliedPromtionNotes = `Automatic sale Applied: ${activePromo.name} (-${activePromo.discountPercentage}%)`;
    }

    try {
      const existingPendingOrder = await mongoose.model('PaymentOrder').findOne({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        status: 'pending',
        amount: finalAmountInPaise
      });

      if (existingPendingOrder) {
        return {
          razorpaySubscriptionId: existingPendingOrder.razorpaySubscriptionId,
          amount: finalAmountInPaise,
          currency: plan.currency,
          dbOrderId: existingPendingOrder._id
        };
      }

      const rzpSubscription = await this.razorpay.subscriptions.create({
        plan_id: plan.razorpayPlanId,
        customer_notify: 1,
        total_count: 120,
      });

      const paymentOrder = await paymentOrderRepository.create({
        organizationId: new mongoose.Types.ObjectId(organizationId),
        amount: finalAmountInPaise,
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
      throw new AppError('Failed to initiate payment gateway session.', 502);
    }
  }

  async processWebHook(rawBody: string, signature: string) {
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      throw new AppError('Invalid webhook signature. Possible tampering detected.', 400);
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;

    if (!['subscription.activated', 'subscription.charged', 'subscription.cancelled'].includes(eventType)) {
      return { status: 'ignored', message: `Unhandled event type: ${eventType}` };
    }

    const rzpSubId = payload.payload.subscription.entity.id;

    const result = await this.syncRazorpaySubscription(rzpSubId);
    return result;
  }

  async syncRazorpaySubscription(rzpSubscriptionId: string) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Ask Razorpay for the absolute real-world status
      const rzpSub = await this.razorpay.subscriptions.fetch(rzpSubscriptionId);

      // 2. Resolve the Organization ID directly from our database (crucial for webhooks)
      let organizationId: string;
      let subscriptionOrder = await paymentOrderRepository.findByrazorpaySubscriptionId(rzpSubscriptionId);


      if (subscriptionOrder) {
        organizationId = subscriptionOrder.organizationId.toString();
      }  else {
        throw new AppError(`No internal mapping found for Razorpay Subscription: ${rzpSubscriptionId}`, 404);
      }

      // Fetch the actual DB Subscription now that we know the Org ID
      let dbSubscription = await subscriptionRepository.findByOrganization(organizationId);

      // FLOW A: CANCELLED OR HALTED 
      if (rzpSub.status === 'cancelled' || rzpSub.status === 'halted') {
        if (dbSubscription && dbSubscription.status !== 'cancelled') {
          await subscriptionRepository.cancel(dbSubscription._id!, {
            event: 'cancelled',
            fromPlan: dbSubscription.plan,
            toPlan: 'free',
            toStatus: 'cancelled',
            note: 'System Sync: Subscription found cancelled in Razorpay.'
          }, session);

          const freePlan = await planRepository.findByCode('free');
          if (freePlan) {
            await organizationRepository.update(
              organizationId,
              {
                "subscription.status": "cancelled",
                cachedPlan: freePlan.code,
                cachedLimits: freePlan.limits
              },
              session
            );
          }
        }
        await session.commitTransaction();
        return { status: 'success', message: 'Subscription synced as cancelled. Limits downgraded.' };
      }

      // FLOW B: ACTIVE OR AUTHENTICATED 
      if (rzpSub.status === 'active' || rzpSub.status === 'authenticated') {

        if (subscriptionOrder && subscriptionOrder.status !== 'success') {
          await paymentOrderRepository.updatePaymentState(
            subscriptionOrder._id,
            { status: 'success' },
            session
          );
        }

        const plan = await planRepository.findByRazorpayPlanId(rzpSub.plan_id.toString());
        if (!plan) throw new AppError('Associated plan not found in database.', 404);

        if (!dbSubscription) {
          // First ever subscription
          await subscriptionRepository.create({
            organization: new mongoose.Types.ObjectId(organizationId),
            plan: plan.code,
            status: 'active',
            razorPaySubscriptionId: rzpSubscriptionId,
            lockedLimits: plan.limits,
            payments: subscriptionOrder ? [subscriptionOrder._id] : [],
            lastPayment: subscriptionOrder ? subscriptionOrder._id : null,
            history: [{
              event: 'activated',
              toPlan: plan.code,
              toStatus: 'active',
              note: 'System Sync: First subscription activated.'
            }]
          }, session);
        }
        else if (dbSubscription.status === 'cancelled') {
          await subscriptionRepository.reactivate(
            dbSubscription._id!,
            {
              razorPaySubscriptionId: rzpSubscriptionId,
              plan: plan.code,
              lockedLimits: plan.limits,
              paymentId: subscriptionOrder?._id,
              history: {
                event: 'reactivated',
                fromPlan: dbSubscription.plan,
                toPlan: plan.code,
                fromStatus: 'cancelled',
                toStatus: 'active',
                note: 'System Sync: Subscription reactivated with a new Razorpay subscription.'
              }
            },
            session
          );
        }
        else {
          if (subscriptionOrder) {
            await subscriptionRepository.recordRenewal(
              dbSubscription._id!,
              subscriptionOrder._id,
              {
                event: 'renewed',
                toPlan: plan.code,
                toStatus: 'active',
                note: 'System Sync: Subscription renewed.'
              },
              session
            );
          }
        }

        await organizationRepository.update(
          organizationId,
          {
            "subscription.status": "active",
            cachedPlan: plan.code,
            cachedLimits: plan.limits
          },
          session
        );

        await session.commitTransaction();
        return { status: 'success', message: 'Subscription synced as active. Limits upgraded.' };
      }

      // FLOW C: STILL PENDING
      await session.abortTransaction();
      return { status: 'pending', message: `Subscription is currently ${rzpSub.status}. Waiting for payment clearance.` };

    } catch (error) {
      await session.abortTransaction();
      throw new AppError('Failed to synchronize subscription with Razorpay.', 500);
    } finally {
      session.endSession();
    }
  }

  async cancelUserSubscription(organizationId: string) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const dbSubscription = await subscriptionRepository.findByOrganization(organizationId);

        if (!dbSubscription || !dbSubscription.razorPaySubscriptionId) {
          throw new AppError('No active external subscription found for this organization.', 404);
        }

        if (dbSubscription.status === 'cancelled') {
          throw new AppError('Subscription is already cancelled.', 400);
        }
        await this.razorpay.subscriptions.cancel(dbSubscription.razorPaySubscriptionId);
      })
    } catch (error: any) {
      throw new AppError('Failed to cancel subscription with Razorpay.', 500);
    }
  }
}

export default new PaymentService();