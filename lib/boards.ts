import { db } from "@/lib/db";
import type { BoardSummary } from "@/types/board";

export async function getWorkspaceBoards(
  workspaceId: string,
): Promise<BoardSummary[]> {
  const boards = await db.board.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { columns: true } },
    },
  });

  return boards.map((board) => ({
    id: board.id,
    name: board.name,
    createdAt: board.createdAt.toISOString(),
    columnCount: board._count.columns,
  }));
}
