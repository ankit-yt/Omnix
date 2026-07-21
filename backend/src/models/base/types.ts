import { Types } from "mongoose"

export type { IChatSession, IChatSessionDoc } from '../ChatSession.js';
export type { IChunk, IChunkDoc } from '../Chunk.js';
export type { IKnowledgeDocument, IKnowledgeDocumentDoc } from '../KnowledgeDocument.js';
export type { IMessage, IMessageDoc } from '../Message.js';
export type { IOrganization, IOrganizationDoc } from '../Organization.js';
export type { IPlan, IPlanDoc } from '../Plan.js';
export type { IPromotion, IPromotionDoc } from '../Promotion.js';
export type { ISubscription, ISubscriptionDoc } from '../Subscription.js';
export type { IUser, IUserDoc } from '../User.js';
export type { IWorkspace, IWorkspaceDoc } from '../Workspace.js';
export interface IAudit {
  createdBy: Types.ObjectId
  updatedBy: Types.ObjectId | null
}

export interface ISoftDelete {
  isDeleted: boolean;
  deletedAt: Date | null;
  softDelete(): Promise<void>;
}

export interface ISubscriptionCacheUpdate {
  'subscription.activeSubscriptionId'?: Types.ObjectId | string;
  'subscription.status'?: 'trial' | 'active' | 'cancelled' | 'past_due' | 'expired';
  'subscription.trialEndsAt'?: Date;
  'subscription.currentPeriodEnd'?: Date;
  'subscription.razorpayCustomerId'?: string;
  'subscription.razorpayPaymentId'?: string;
}