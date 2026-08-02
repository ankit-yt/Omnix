import { Subscription } from '@/models/base/index.js'
import { ISubscription, ISubscriptionDoc } from '@/models/base/types.js'
import { ISubscriptionHistory } from '@/models/Subscription.js';
import mongoose, { ClientSession, UpdateQuery } from 'mongoose'
import { subscribe } from 'node:diagnostics_channel';

class SubscriptionRepository {


  async create(data: Partial<ISubscription>, session?: ClientSession): Promise<ISubscriptionDoc> {
    const [subscription] = await Subscription.create([data], { session });
    return subscription;
  }

  async findByOrganization(orgId: string): Promise<ISubscription | null> {
    return Subscription.findOne({ organization: orgId }).lean();
  }

  async findById(subscriptionId: string): Promise<ISubscription | null> {
    return Subscription.findById(subscriptionId);
  }

  async recordRenewal(
    subscriptionId: mongoose.Types.ObjectId,
    paymentId: mongoose.Types.ObjectId,
    historyEntry: ISubscriptionHistory,
    session?: ClientSession
  ) {
    return Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $push: {
          payments: paymentId,
          history: historyEntry
        },
        $set: {
          lastPayment: paymentId
        }
      },
      {
        returnDocument: 'after',
        session
      }
    );
  }


  async reactivate(subscriptionId: mongoose.Types.ObjectId, data: UpdateQuery<ISubscription>, session?: ClientSession) {
    const update: any = {
      $set: {
        status: "active",
        plan: data.plan,
        razorPaySubscriptionId: data.razorPaySubscriptionId,
        lockedLimits: data.lockedLimits,
        lastPayment: data.paymentId ?? null,
      },
      $push: {
        history: data.history,
      },
    };

    if (data.paymentId) {
      update.$push.payments = data.paymentId;
    }

    return Subscription.findByIdAndUpdate(subscriptionId, update, { session });
  }


  async cancel(
    subscriptionId: mongoose.Types.ObjectId,
    historyEntry: ISubscriptionHistory,
    session?: ClientSession
  ) {
    return Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date()
        },
        $push: {
          history: historyEntry
        }
      },
      {
        returnDocument: 'after',
        session
      }
    );
  }

  async findByRazorpaySubscriptionId(razorpaySubscriptionId: mongoose.Types.ObjectId): Promise<ISubscription | null> {
    return Subscription.findById(razorpaySubscriptionId).lean();
  }

}

export default new SubscriptionRepository();