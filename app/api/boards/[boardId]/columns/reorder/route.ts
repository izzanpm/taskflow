import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getBoardScope } from "@/lib/board";
import { db } from "@/lib/db";
import { calculateFractionalOrder } from "@/lib/reorder";
import { reorderColumnSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ boardId: string }> },
) {
  const { boardId } = await params;
  const board = await getBoardScope(boardId);

  if (!board) {
    return NextResponse.json({ error: "Board not found." }, { status: 404 });
  }

  try {
    await requireRole(request.headers, board.workspaceId);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The column reorder was not valid JSON." },
        { status: 400 },
      );
    }

    const result = reorderColumnSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: "Choose valid neighboring columns." },
        { status: 400 },
      );
    }

    const { columnId, previousColumnId, nextColumnId } = result.data;
    const column = await db.column.findFirst({
      where: { id: columnId, boardId },
      select: { id: true },
    });

    if (!column) {
      return NextResponse.json({ error: "Column not found." }, { status: 404 });
    }

    if (previousColumnId === columnId || nextColumnId === columnId) {
      return NextResponse.json(
        { error: "A column cannot be placed next to itself." },
        { status: 400 },
      );
    }

    const neighbors = await db.column.findMany({
      where: {
        boardId,
        id: {
          in: [previousColumnId, nextColumnId].filter(Boolean) as string[],
        },
      },
      select: { id: true, order: true },
    });
    const previousOrder =
      neighbors.find((neighbor) => neighbor.id === previousColumnId)?.order ??
      null;
    const nextOrder =
      neighbors.find((neighbor) => neighbor.id === nextColumnId)?.order ?? null;

    if (
      (previousColumnId && previousOrder === null) ||
      (nextColumnId && nextOrder === null)
    ) {
      return NextResponse.json(
        { error: "Choose neighboring columns from this board." },
        { status: 400 },
      );
    }

    const updatedColumn = await db.column.update({
      where: { id: columnId },
      data: { order: calculateFractionalOrder(previousOrder, nextOrder) },
      select: { id: true, name: true, order: true },
    });

    return NextResponse.json({ data: updatedColumn });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not reorder the columns. Please try again." },
      { status: 500 },
    );
  }
}
