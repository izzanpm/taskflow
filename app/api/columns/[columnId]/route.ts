import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { getColumnScope } from "@/lib/board";
import { db } from "@/lib/db";
import { updateColumnSchema } from "@/lib/validation";

type ColumnRouteContext = {
  params: Promise<{ columnId: string }>;
};

export async function PATCH(request: Request, context: ColumnRouteContext) {
  const { columnId } = await context.params;
  const column = await getColumnScope(columnId);

  if (!column) {
    return NextResponse.json({ error: "Column not found." }, { status: 404 });
  }

  try {
    await requireRole(request.headers, column.board.workspaceId);

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The column update was not valid JSON." },
        { status: 400 },
      );
    }

    const result = updateColumnSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0]?.message ?? "Check the column name." },
        { status: 400 },
      );
    }

    const updatedColumn = await db.column.update({
      where: { id: columnId },
      data: { name: result.data.name },
      select: { id: true, name: true, order: true },
    });

    return NextResponse.json({ data: updatedColumn });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not rename this column. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: ColumnRouteContext) {
  const { columnId } = await context.params;
  const column = await getColumnScope(columnId);

  if (!column) {
    return NextResponse.json({ error: "Column not found." }, { status: 404 });
  }

  try {
    await requireRole(request.headers, column.board.workspaceId);

    const columnCount = await db.column.count({
      where: { boardId: column.boardId },
    });
    if (columnCount <= 1) {
      return NextResponse.json(
        { error: "A board needs at least one column." },
        { status: 409 },
      );
    }

    await db.column.delete({ where: { id: columnId } });
    return NextResponse.json({ data: { id: columnId } });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;

    return NextResponse.json(
      { error: "We could not delete this column. Please try again." },
      { status: 500 },
    );
  }
}
