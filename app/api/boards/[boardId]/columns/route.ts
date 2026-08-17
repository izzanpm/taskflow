import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getBoardScope } from "@/lib/board";
import { db } from "@/lib/db";
import { getNextOrder } from "@/lib/reorder";
import { createColumnSchema } from "@/lib/validation";

export async function POST(
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
        { error: "The column request was not valid JSON." },
        { status: 400 },
      );
    }

    const result = createColumnSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Check the column name." },
        { status: 400 },
      );
    }

    const columns = await db.column.findMany({
      where: { boardId },
      select: { id: true, order: true },
    });
    const column = await db.column.create({
      data: {
        boardId,
        name: result.data.name,
        order: getNextOrder(columns),
      },
      select: { id: true, name: true, order: true },
    });

    return NextResponse.json({ data: column }, { status: 201 });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not create this column. Please try again." },
      { status: 500 },
    );
  }
}
