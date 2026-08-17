import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";
import { getNextOrder } from "@/lib/reorder";
import { createTaskSchema } from "@/lib/validation";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The task request was not valid JSON." },
      { status: 400 },
    );
  }

  const result = createTaskSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Check the task details." },
      { status: 400 },
    );
  }

  const column = await db.column.findUnique({
    where: { id: result.data.columnId },
    select: { id: true, board: { select: { workspaceId: true } } },
  });

  if (!column) {
    return NextResponse.json({ error: "Column not found." }, { status: 404 });
  }

  try {
    await requireRole(request.headers, column.board.workspaceId);

    if (result.data.assigneeId) {
      const assignee = await db.workspaceMember.findFirst({
        where: {
          workspaceId: column.board.workspaceId,
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

    const tasks = await db.task.findMany({
      where: { columnId: column.id },
      select: { id: true, order: true },
    });
    const task = await db.task.create({
      data: {
        columnId: column.id,
        title: result.data.title,
        description: result.data.description ?? null,
        assigneeId: result.data.assigneeId ?? null,
        dueDate: result.data.dueDate
          ? new Date(`${result.data.dueDate}T00:00:00.000Z`)
          : null,
        priority: result.data.priority,
        order: getNextOrder(tasks),
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

    return NextResponse.json({ data: task }, { status: 201 });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not create this task. Please try again." },
      { status: 500 },
    );
  }
}
