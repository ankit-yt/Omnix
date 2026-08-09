import { z } from "zod";

export const chatMessageSchema = z.object({
  workspaceId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid workspace ID."),
  sessionId: z.string().optional(),
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty.")
    .max(4000, "Message exceeds the maximum allowed length (4000 characters)."),

  page: z.object({
    url: z.string().url(),
    title: z.string().trim().max(200),
  }),
  visitorId: z
    .string()
    .trim()
    .optional(),
  client: z.object({
    userAgent: z.string().trim().max(1000),
  }),
}).strict();

export type ChatMessageDto = z.infer<typeof chatMessageSchema>;