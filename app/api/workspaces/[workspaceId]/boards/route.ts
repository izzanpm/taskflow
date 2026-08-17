import { NextResponse } from "next/server";

import { WorkspaceRole } from "@/app/generated/prisma/enums";
import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getWorkspaceBoards } from "@/lib/boards";
import { db } from "@/lib/db";
import { createBoardSchema } from "@/lib/validation";

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;

  try {
    await requireRole(request.headers, workspaceId);

    return NextResponse.json({
      data: await getWorkspaceBoards(workspaceId),
    });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not load the workspace boards. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  const { workspaceId } = await context.params;

  try {
    await requireRole(request.headers, workspaceId, [WorkspaceRole.ADMIN]);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The board request was not valid JSON." },
        { status: 400 },
      );
    }

    const result = createBoardSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Check the board name." },
        { status: 400 },
      );
    }

    const board = await db.board.create({
      data: { workspaceId, name: result.data.name },
      select: { id: true, name: true, createdAt: true },
    });

    return NextResponse.json(
      {
        data: {
          ...board,
          createdAt: board.createdAt.toISOString(),
          columnCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not create the board. Please try again." },
      { status: 500 },
    );
  }
}
