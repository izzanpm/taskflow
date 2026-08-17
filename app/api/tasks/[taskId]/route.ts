import { NextResponse } from "next/server";

import { NotificationType } from "@/app/generated/prisma/enums";
import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getTaskDetails, getTaskScope } from "@/lib/board";
import { db } from "@/lib/db";
import { calculateFractionalOrder, getNextOrder } from "@/lib/reorder";
import { updateTaskSchema } from "@/lib/validation";

type TaskRouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function GET(request: Request, context: TaskRouteContext) {
  const { taskId } = await context.params;
  const task = await getTaskDetails(taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  try {
    await requireRole(request.headers, task.column.board.workspaceId);
    return NextResponse.json({ data: task });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not load this task. Please try again." },
      { status: 500 },
    );
  }
}

function parseDueDate(value: string | null | undefined) {
  return value ? new Date(`${value}T00:00:00.000Z`) : null;
}

export async function PATCH(request: Request, context: TaskRouteContext) {
  const { taskId } = await context.params;
  const task = await getTaskScope(taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The task update was not valid JSON." },
      { status: 400 },
    );
  }

  const result = updateTaskSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Check the task details." },
      { status: 400 },
    );
  }

  try {
    const { session } = await requireRole(
      request.headers,
      task.column.board.workspaceId,
    );

    const targetColumnId = result.data.columnId ?? task.columnId;
    const targetColumn = await db.column.findFirst({
      where: {
        id: targetColumnId,
        boardId: task.column.boardId,
      },
      select: { id: true },
    });

    if (!targetColumn) {
      return NextResponse.json(
        { error: "Choose a column from this board." },
        { status: 400 },
      );
    }

    if (result.data.assigneeId) {
      const assignee = await db.workspaceMember.findFirst({
        where: {
          workspaceId: task.column.board.workspaceId,
          userId: result.data.assigneeId,
        },
        select: { userId: true },
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "Choose an assignee from this workspace." },
          { status: 400 },
        );
      }
    }

    const hasExplicitPosition =
      "previousTaskId" in result.data || "nextTaskId" in result.data;
    const isMovingColumn = targetColumnId !== task.columnId;
    const order = await getTaskOrder({
      taskId,
      targetColumnId,
      previousTaskId: result.data.previousTaskId,
      nextTaskId: result.data.nextTaskId,
      currentOrder: task.order,
      shouldReorder: hasExplicitPosition || isMovingColumn,
    });

    const updatedTask = await db.$transaction(async (transaction) => {
      const updated = await transaction.task.update({
        where: { id: taskId },
        data: {
          ...(result.data.title !== undefined && { title: result.data.title }),
          ...(result.data.description !== undefined && {
            description: result.data.description,
          }),
          ...(result.data.assigneeId !== undefined && {
            assigneeId: result.data.assigneeId,
          }),
          ...(result.data.dueDate !== undefined && {
            dueDate: parseDueDate(result.data.dueDate),
          }),
          ...(result.data.priority !== undefined && {
            priority: result.data.priority,
          }),
          ...(isMovingColumn && { columnId: targetColumnId }),
          ...(order !== null && { order }),
        },
        select: {
          id: true,
          columnId: true,
          title: true,
          description: true,
          assigneeId: true,
          dueDate: true,
          priority: true,
          order: true,
          updatedAt: true,
          assignee: { select: { id: true, name: true, email: true } },
        },
      });

      if (
        result.data.assigneeId &&
        result.data.assigneeId !== task.assigneeId &&
        result.data.assigneeId !== session.user.id
      ) {
        await transaction.notification.create({
          data: {
            userId: result.data.assigneeId,
            type: NotificationType.ASSIGNMENT,
            taskId,
            actorId: session.user.id,
          },
        });
      }

      return updated;
    });

    return NextResponse.json({ data: updatedTask });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not update this task. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: TaskRouteContext) {
  const { taskId } = await context.params;
  const task = await getTaskScope(taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  try {
    await requireRole(request.headers, task.column.board.workspaceId);
    await db.task.delete({ where: { id: taskId } });
    return NextResponse.json({ data: { id: taskId } });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not delete this task. Please try again." },
      { status: 500 },
    );
  }
}

async function getTaskOrder({
  taskId,
  targetColumnId,
  previousTaskId,
  nextTaskId,
  currentOrder,
  shouldReorder,
}: {
  taskId: string;
  targetColumnId: string;
  previousTaskId?: string | null;
  nextTaskId?: string | null;
  currentOrder: number;
  shouldReorder: boolean;
}) {
  if (!shouldReorder) return null;

  if (previousTaskId === taskId || nextTaskId === taskId) {
    throw new Error("A task cannot be placed next to itself.");
  }

  const neighbors = await db.task.findMany({
    where: {
      columnId: targetColumnId,
      id: { in: [previousTaskId, nextTaskId].filter(Boolean) as string[] },
    },
    select: { id: true, order: true },
  });
  const previousOrder =
    neighbors.find((neighbor) => neighbor.id === previousTaskId)?.order ?? null;
  const nextOrder =
    neighbors.find((neighbor) => neighbor.id === nextTaskId)?.order ?? null;

  if (
    (previousTaskId && previousOrder === null) ||
    (nextTaskId && nextOrder === null)
  ) {
    throw new Error("Choose neighboring tasks from the target column.");
  }

  if (previousTaskId || nextTaskId) {
    return calculateFractionalOrder(previousOrder, nextOrder);
  }

  if (targetColumnId === (await getTaskColumnId(taskId))) {
    return currentOrder;
  }

  const targetTasks = await db.task.findMany({
    where: { columnId: targetColumnId },
    select: { id: true, order: true },
  });
  return getNextOrder(targetTasks);
}

async function getTaskColumnId(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { columnId: true },
  });
  return task?.columnId;
}
