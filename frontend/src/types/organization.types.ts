export type PlanType = "free" | "pro" | "enterprise";

export type SubscriptionStatus =
  | "active"
  | "cancelled"
  | "past_due"
  | "expired";

export interface CachedLimits {
  messagesPerMonth: number;
  knowledgeBaseSizeMB: number;
  teamMembers: number;
  maxWorkspaces: number;
  crawlingEnabled: boolean;
    maxPagesPerCrawl: number;
}

export interface CachedUsage {
  messagesThisMonth: number;
  totalMessages: number;
  totalWorkspaces:number
  usedKnowledgeBaseSizeMB:number
  lastResetDate: string;
}

export interface Subscription {
  activeSubscriptionId: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: string | null;
  razorpayCustomerId?: string;
  razorpayPaymentId?: string;
}

export interface OnboardingStatus {
  slugConfigured: boolean;
  knowledgeBaseUploaded: boolean;
  firstSuccessfulMessage: boolean;
  completedAt: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  website?: string;

  cachedPlan: PlanType;

  cachedLimits: CachedLimits;

  cachedUsage: CachedUsage;

  subscription: Subscription;

  onboardingStatus: OnboardingStatus;

  apiPrefix: string;
}