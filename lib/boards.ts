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
      columns: {
        select: {
          _count: { select: { tasks: true } },
          tasks: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { updatedAt: true },
          },
        },
      },
    },
  });

  return boards.map((board) => {
    const activityDates = board.columns.flatMap((column) =>
      column.tasks.map((task) => task.updatedAt),
    );
    const lastActivityAt = activityDates.sort(
      (left, right) => right.getTime() - left.getTime(),
    )[0];

    return {
      id: board.id,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      columnCount: board._count.columns,
      taskCount: board.columns.reduce(
        (total, column) => total + column._count.tasks,
        0,
      ),
      lastActivityAt: lastActivityAt?.toISOString() ?? null,
    };
  });
}
