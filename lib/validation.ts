import { WorkspaceRole } from "@/app/generated/prisma/enums";
import { TaskPriority } from "@/app/generated/prisma/enums";

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

export const createBoardSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Board name must be at least 2 characters.")
    .max(80, "Board name must be 80 characters or fewer."),
});

const nullableId = z.union([z.string().trim().min(1), z.null()]).optional();

const dueDate = z
  .union([
    z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter a valid due date."),
    z.null(),
  ])
  .optional();

export const createColumnSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Column name is required.")
    .max(60, "Column name must be 60 characters or fewer."),
});

export const updateColumnSchema = createColumnSchema;

export const reorderColumnSchema = z.object({
  columnId: z.string().trim().min(1),
  previousColumnId: nullableId,
  nextColumnId: nullableId,
});

const taskFields = {
  title: z
    .string()
    .trim()
    .min(1, "Task title is required.")
    .max(140, "Task title must be 140 characters or fewer."),
  description: z.union([z.string().trim().max(5000), z.null()]).optional(),
  assigneeId: nullableId,
  dueDate,
  priority: z.enum([
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
  ]),
};

export const createTaskSchema = z.object({
  columnId: z.string().trim().min(1, "Column is required."),
  title: taskFields.title,
  description: taskFields.description,
  assigneeId: taskFields.assigneeId,
  dueDate: taskFields.dueDate,
  priority: taskFields.priority.default(TaskPriority.MEDIUM),
});

export const updateTaskSchema = z.object({
  title: taskFields.title.optional(),
  description: taskFields.description,
  assigneeId: taskFields.assigneeId,
  dueDate: taskFields.dueDate,
  priority: taskFields.priority.optional(),
  columnId: z.string().trim().min(1).optional(),
  previousTaskId: nullableId,
  nextTaskId: nullableId,
});

export const reorderTaskSchema = z.object({
  columnId: z.string().trim().min(1).optional(),
  previousTaskId: nullableId,
  nextTaskId: nullableId,
});
