import { z } from "zod";

export const syncRazorpaySubscriptionSchema  = z
  .object({
    razorpaySubscriptionId: z
      .string()
      .trim()
      .min(1, "Subscription ID is required.")
      .startsWith("sub_", "Invalid Razorpay Subscription ID."),
  })
  .strict();

export type syncRazorpaySubscriptionDto = z.infer<typeof syncRazorpaySubscriptionSchema >;