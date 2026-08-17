import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getBoardDetails } from "@/lib/board";
import { toBoardView } from "@/lib/board-view";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const board = await getBoardDetails(boardId);

  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  try {
    const { session } = await requireRole(request.headers, board.workspaceId);

    return NextResponse.json({ data: toBoardView(board, session.user.id) });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not load this board. Please try again." },
      { status: 500 },
    );
  }
}
