import { NextResponse } from "next/server";

import { WorkspaceRole } from "@/app/generated/prisma/enums";
import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  const { workspaceId } = await params;

  try {
    await requireRole(request.headers, workspaceId, [WorkspaceRole.ADMIN]);
    await db.workspace.delete({ where: { id: workspaceId } });
    return NextResponse.json({ data: { id: workspaceId } });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;
    return NextResponse.json(
      { error: "We could not delete this workspace. Please try again." },
      { status: 500 },
    );
  }
}
