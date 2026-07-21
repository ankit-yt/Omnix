import { z } from "zod";

export const updatePlanSchema = z.object({
  displayName: z.string().trim().min(2).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  razorpayPlanId: z
    .string()
    .trim()
    .startsWith("plan_", "Invalid Razorpay Plan ID format. It should start with 'plan_'.")
    .min(10, "Razorpay Plan ID is too short.") // Razorpay IDs are usually ~14+ chars
    .optional(),
}).strict();



export type updatePlanDto = z.infer<typeof updatePlanSchema>;