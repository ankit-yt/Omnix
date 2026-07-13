import { z } from "zod";


export const workspaceIdSchema = z.object({
  workspaceId: z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid workspace ID."
  )
});

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Workspace name must be at least 3 characters.")
    .max(100, "Workspace name cannot exceed 100 characters."),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters.")
    .nullable()
    .optional(),

  avatarUrl: z
    .string()
    .trim()
    .url("Avatar URL must be a valid URL.")
    .nullable()
    .optional(),

  allowedDomains: z
    .array(
      z.string().trim().min(1, "Domain cannot be empty.")
    )
    .default([]),

  settings: z
    .object({
      botName: z
        .string()
        .trim()
        .min(2, "Bot name must be at least 2 characters.")
        .max(50, "Bot name cannot exceed 50 characters.")
        .default("ERP Assistant"),

      primaryColor: z
        .string()
        .regex(
          /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/,
          "Primary color must be a valid HEX color."
        )
        .default("#6366f1"),

      welcomeMessage: z
        .string()
        .trim()
        .max(500, "Welcome message cannot exceed 500 characters.")
        .default("HI! how can I help you today?")
    })

}).strict();

export const updateWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3)
    .max(100)
    .optional(),

  description: z
    .string()
    .trim()
    .max(500)
    .nullable()
    .optional(),

  avatarUrl: z
    .string()
    .trim()
    .url()
    .nullable()
    .optional(),

  allowedDomains: z
    .array(z.string().trim())
    .optional(),

  settings: z
    .object({
      botName: z.string().trim().min(2).max(50).optional(),

      primaryColor: z
        .string()
        .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
        .optional(),

      welcomeMessage: z
        .string()
        .trim()
        .max(500)
        .optional()
    })
    .optional()
}).strict();


export type UpdateWorkspaceDto = z.infer<typeof updateWorkspaceSchema>;
export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;