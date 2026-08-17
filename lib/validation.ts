import { WorkspaceRole } from "@/app/generated/prisma/enums";

import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Workspace name must be at least 2 characters.")
    .max(80),
});

export const createInviteSchema = z.object({
  workspaceId: z.string().trim().min(1, "Workspace is required."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address.")
    .max(320),
  role: z
    .enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER])
    .default(WorkspaceRole.MEMBER),
});

export const acceptInviteSchema = z.object({
  token: z.string().trim().min(1, "Invite token is required."),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER]),
});
