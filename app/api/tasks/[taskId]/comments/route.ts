import { NextResponse } from "next/server";

import { NotificationType } from "@/app/generated/prisma/enums";
import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getTaskScope } from "@/lib/board";
import { db } from "@/lib/db";
import { createCommentSchema } from "@/lib/validation";

type CommentRouteContext = {
  params: Promise<{ taskId: string }>;
};

export async function POST(request: Request, context: CommentRouteContext) {
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
      { error: "The comment request was not valid JSON." },
      { status: 400 },
    );
  }

  const result = createCommentSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Check the comment." },
      { status: 400 },
    );
  }

  try {
    const { session } = await requireRole(
      request.headers,
      task.column.board.workspaceId,
    );
    const comment = await db.$transaction(async (transaction) => {
      const createdComment = await transaction.comment.create({
        data: {
          taskId,
          userId: session.user.id,
          body: result.data.body,
        },
        select: {
          id: true,
          taskId: true,
          body: true,
          createdAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      });

      if (task.assigneeId && task.assigneeId !== session.user.id) {
        await transaction.notification.create({
          data: {
            userId: task.assigneeId,
            type: NotificationType.COMMENT,
            taskId,
            actorId: session.user.id,
          },
        });
      }

      return createdComment;
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not add the comment. Please try again." },
      { status: 500 },
    );
  }
}
