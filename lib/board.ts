import { db } from "@/lib/db";

export async function getBoardDetails(boardId: string) {
  return db.board.findUnique({
    where: { id: boardId },
    select: {
      id: true,
      name: true,
      workspaceId: true,
      workspace: {
        select: {
          name: true,
          slug: true,
          members: {
            orderBy: { createdAt: "asc" },
            select: {
              userId: true,
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
      columns: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          order: true,
          tasks: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              columnId: true,
              title: true,
              description: true,
              assigneeId: true,
              dueDate: true,
              priority: true,
              order: true,
              updatedAt: true,
              assignee: {
                select: { id: true, name: true, email: true },
              },
            },
          },
        },
      },
    },
  });
}

export type BoardDetails = NonNullable<
  Awaited<ReturnType<typeof getBoardDetails>>
>;

export async function getBoardScope(boardId: string) {
  return db.board.findUnique({
    where: { id: boardId },
    select: { id: true, workspaceId: true },
  });
}

export async function getColumnScope(columnId: string) {
  return db.column.findUnique({
    where: { id: columnId },
    select: {
      id: true,
      boardId: true,
      board: { select: { id: true, workspaceId: true } },
    },
  });
}

export async function getTaskScope(taskId: string) {
  return db.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      columnId: true,
      title: true,
      description: true,
      assigneeId: true,
      dueDate: true,
      priority: true,
      order: true,
      column: {
        select: {
          id: true,
          boardId: true,
          board: { select: { id: true, workspaceId: true } },
        },
      },
    },
  });
}
