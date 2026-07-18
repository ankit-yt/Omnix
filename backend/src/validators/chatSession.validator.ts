import { z } from "zod";

export const createChatSessionSchema = z.object({
   title: z
    .string()
    .trim()
    .max(150)
    .optional(),
  page: z.object({
    url: z
      .string()
      .trim()
      .url("Page URL must be a valid URL."),

    title: z
      .string()
      .trim()
      .max(200, "Page title cannot exceed 200 characters.")
      .default(""),
  }),

  client: z.object({
    userAgent: z
      .string()
      .trim()
      .max(1000, "User agent cannot exceed 1000 characters.")
      .default(""),
  }),
}).strict();

export const updateChatSessionSchema = z.object({
  title: z
    .string()
    .trim()
    .max(150)
    .optional(),

  conversationSummary: z
    .string()
    .trim()
    .max(5000)
    .optional(),

  isActive: z
    .boolean()
    .optional(),
}).strict();

export type UpdateChatSessionDto = z.infer<typeof updateChatSessionSchema>;

export type CreateChatSessionDto = z.infer<typeof createChatSessionSchema>;