export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type BoardMember = {
  userId: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type BoardTask = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  assigneeId: string | null;
  dueDate: string | null;
  priority: TaskPriority;
  order: number;
  updatedAt: string;
  assignee: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type BoardColumn = {
  id: string;
  name: string;
  order: number;
  tasks: BoardTask[];
};

export type BoardView = {
  id: string;
  name: string;
  workspaceId: string;
  workspace: {
    name: string;
    slug: string;
  };
  members: BoardMember[];
  columns: BoardColumn[];
  currentUserId: string;
};

export type BoardSummary = {
  id: string;
  name: string;
  createdAt: string;
  columnCount: number;
};
