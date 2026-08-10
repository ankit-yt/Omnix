import { z } from "zod";

const limitsSchema = z.object({
  messagesPerMonth: z.number().min(0).optional(),
  knowledgeBaseSizeMB: z.number().min(0).optional(),
  teamMembers: z.number().min(0).optional(),
  maxWorkspaces: z.number().min(0).optional(),
  crawlingEnabled: z.boolean().optional(),
  maxPagesPerCrawl: z.number().min(0).optional(),
}).strict();

export const updatePlanSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  razorpayPlanId: z
    .string()
    .trim()
    .startsWith("plan_", "Invalid Razorpay Plan ID format. It should start with 'plan_'.")
    .min(10, "Razorpay Plan ID is too short.")
    .optional(),
  priceInPaise: z.number().min(0).optional(),
  sortOrder: z.number().optional(),
  limits: limitsSchema.optional(),
  features: z.array(z.string()).optional(),
}).strict();

export const setPlanActiveStatusSchema = z.object({
  isActive: z.boolean(),
}).strict();

export const createPlanSchema = z.object({
  code: z.string().trim().toLowerCase().min(2).max(50),
  displayName: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional(),
  priceInPaise: z.number().min(0),
  currency: z.string().trim().optional(),
  sortOrder: z.number().optional(),
  limits: z.object({
    messagesPerMonth: z.number().min(0),
    knowledgeBaseSizeMB: z.number().min(0),
    teamMembers: z.number().min(0),
    maxWorkspaces: z.number().min(0),
    crawlingEnabled: z.boolean(),
    maxPagesPerCrawl: z.number().min(0),
  }).strict(),
  features: z.array(z.string()).optional(),
  razorpayPlanId: z.string().trim().optional(),
}).strict();

export type updatePlanDto = z.infer<typeof updatePlanSchema>;
export type setPlanActiveStatusDto = z.infer<typeof setPlanActiveStatusSchema>;
export type createPlanDto = z.infer<typeof createPlanSchema>;