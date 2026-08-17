import { NextResponse } from "next/server";

import { WorkspaceRole } from "@/app/generated/prisma/enums";
import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getTaskScope } from "@/lib/board";
import { db } from "@/lib/db";
import { deleteR2Object, StorageConfigurationError } from "@/lib/storage";

type AttachmentRouteContext = {
  params: Promise<{ taskId: string; attachmentId: string }>;
};

export async function DELETE(
  request: Request,
  context: AttachmentRouteContext,
) {
  const { taskId, attachmentId } = await context.params;
  const task = await getTaskScope(taskId);

  if (!task) {
    return NextResponse.json({ error: "Task not found." }, { status: 404 });
  }

  try {
    const { session, member } = await requireRole(
      request.headers,
      task.column.board.workspaceId,
    );
    const attachment = await db.attachment.findFirst({
      where: { id: attachmentId, taskId },
      select: { id: true, fileUrl: true, uploadedById: true },
    });

    if (!attachment) {
      return NextResponse.json(
        { error: "Attachment not found." },
        { status: 404 },
      );
    }

    if (
      member.role !== WorkspaceRole.ADMIN &&
      attachment.uploadedById !== session.user.id
    ) {
      return NextResponse.json(
        { error: "You can only delete attachments you uploaded." },
        { status: 403 },
      );
    }

    await deleteR2Object(attachment.fileUrl);
    await db.attachment.delete({ where: { id: attachment.id } });

    return NextResponse.json({ data: { id: attachment.id } });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;
    if (error instanceof StorageConfigurationError) {
      return NextResponse.json(
        { error: "File storage is not configured on this server." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "We could not delete the attachment. Please try again." },
      { status: 500 },
    );
  }
}
