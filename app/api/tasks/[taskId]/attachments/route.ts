import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getTaskScope } from "@/lib/board";
import { db } from "@/lib/db";
import {
  createPresignedR2Url,
  getPublicR2Url,
  StorageConfigurationError,
} from "@/lib/storage";
import { createAttachmentSchema } from "@/lib/validation";

type AttachmentRouteContext = {
  params: Promise<{ taskId: string }>;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[\\/]/g, "-").replace(/[^\x20-\x7E]/g, "");
}

export async function POST(request: Request, context: AttachmentRouteContext) {
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
      { error: "The attachment request was not valid JSON." },
      { status: 400 },
    );
  }

  const result = createAttachmentSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Check the attachment." },
      { status: 400 },
    );
  }

  try {
    const { session } = await requireRole(
      request.headers,
      task.column.board.workspaceId,
    );
    const fileName = sanitizeFileName(result.data.fileName).trim();
    if (!fileName) {
      return NextResponse.json(
        { error: "Choose a file with a valid name." },
        { status: 400 },
      );
    }

    const objectKey = `tasks/${taskId}/${crypto.randomUUID()}-${fileName}`;
    const uploadUrl = await createPresignedR2Url(
      "PUT",
      objectKey,
      result.data.fileType,
    );
    const attachment = await db.attachment.create({
      data: {
        taskId,
        fileUrl: getPublicR2Url(objectKey),
        fileName,
        fileSize: result.data.fileSize,
        uploadedById: session.user.id,
      },
      select: {
        id: true,
        taskId: true,
        fileUrl: true,
        fileName: true,
        fileSize: true,
        createdAt: true,
        uploadedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(
      {
        data: {
          attachment,
          uploadUrl,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;
    if (error instanceof StorageConfigurationError) {
      return NextResponse.json(
        { error: "File uploads are not configured on this server." },
        { status: 503 },
      );
    }

    return NextResponse.json(
      { error: "We could not prepare the upload. Please try again." },
      { status: 500 },
    );
  }
}
