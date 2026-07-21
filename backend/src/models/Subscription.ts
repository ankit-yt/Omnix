import mongoose, { Document, Schema } from "mongoose";

export interface ISubscriptionHistory {
  event:
  | 'activated'
  | 'renewed'
  | 'upgraded'
  | 'cancelled'
  | 'past_due'
  | 'expired';
  fromPlan?: string;
  toPlan: string;
  fromStatus?: string;
  toStatus: string;
  SubscriptionOrder?: mongoose.Types.ObjectId;
  occurredAt?: Date;
  note?: string;
}

export interface ISubscription {
  _id?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  plan: string;
  status: 'active' | 'past_due' | 'cancelled' | 'expired';
  currentPeriodStarts?: Date;
  currentPeriodEnds?: Date;
  razorPaySubscriptionId: string;
  lockedLimits: {
    messagesPerMonth: number;
    knowledgeBaseSizeMB: number;
    teamMembers: number;
  };
  history: ISubscriptionHistory[];
  payments: mongoose.Types.ObjectId[];
  lastPayment?: mongoose.Types.ObjectId;
  cancelledAt?: Date;
  cancellationReason: string;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISubscriptionDoc extends Omit<ISubscription, '_id'>, Document { }

const subscriptionSchema = new Schema<ISubscriptionDoc>({
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  plan: {
    type: String,
    required: true,
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'expired'],
    default: 'active'
  },
  currentPeriodStarts: {
    type: Date,
  },
  currentPeriodEnds: {
    type: Date,
  },
  razorPaySubscriptionId: {
    type: String,
    default: ''
  },
  lockedLimits: {
    messagesPerMonth: { type: Number, required: true },
    knowledgeBaseSizeMB: { type: Number, required: true },
    teamMembers: { type: Number, required: true }
  },
  history: [{
    event: { type: String, required: true },
    fromPlan: { type: String, default: '' },
    toPlan: { type: String, default: '' },
    fromStatus: { type: String, default: '' },
    toStatus: { type: String, default: '' },
    SubscriptionOrder: { type: Schema.Types.ObjectId, ref: 'SubscriptionOrder' },
    occurredAt: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  }],
  payments: [{
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionOrder'
  }],
  lastPayment: {
    type: Schema.Types.ObjectId,
    ref: 'SubscriptionOrder'
  },
  cancelledAt: {
    type: Date,
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform(doc, ret) {
      const { __v, ...safeJson } = ret;
      return safeJson;
    }
  }
});

subscriptionSchema.index({ organization: 1 });
subscriptionSchema.index({ status: 1, currentPeriodEnds: 1 });

export default mongoose.model<ISubscriptionDoc>('Subscription', subscriptionSchema);