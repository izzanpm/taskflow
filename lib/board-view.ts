import type { BoardDetails } from "@/lib/board";
import type { BoardView } from "@/types/board";

export function toBoardView(
  board: BoardDetails,
  currentUserId: string,
): BoardView {
  return {
    id: board.id,
    name: board.name,
    workspaceId: board.workspaceId,
    workspace: {
      name: board.workspace.name,
      slug: board.workspace.slug,
    },
    members: board.workspace.members,
    columns: board.columns.map((column) => ({
      id: column.id,
      name: column.name,
      order: column.order,
      tasks: column.tasks.map((task) => ({
        id: task.id,
        columnId: task.columnId,
        title: task.title,
        description: task.description,
        assigneeId: task.assigneeId,
        dueDate: task.dueDate?.toISOString() ?? null,
        priority: task.priority,
        order: task.order,
        updatedAt: task.updatedAt.toISOString(),
        assignee: task.assignee,
      })),
    })),
    currentUserId,
  };
}
