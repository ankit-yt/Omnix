import { z } from "zod";

export const linkRazorpayPlanSchema = z.object({
  razorpayPlanId: z
    .string()
    .trim()
    .startsWith("plan_", "Invalid Razorpay Plan ID format. It should start with 'plan_'.")
    .min(10, "Razorpay Plan ID is too short.") // Razorpay IDs are usually ~14+ chars
}).strict();

export type LinkRazorpayPlanDto = z.infer<typeof linkRazorpayPlanSchema>;