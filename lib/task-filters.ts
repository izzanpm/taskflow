import type { BoardColumn, BoardTask } from "@/types/board";

export type TaskDueDateFilter =
  "ALL" | "OVERDUE" | "TODAY" | "NEXT_7_DAYS" | "NO_DATE";

export type TaskFilterState = {
  search: string;
  assigneeId: string;
  columnId: string;
  dueDate: TaskDueDateFilter;
};

export const emptyTaskFilters: TaskFilterState = {
  search: "",
  assigneeId: "ALL",
  columnId: "ALL",
  dueDate: "ALL",
};

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function matchesDueDate(task: BoardTask, filter: TaskDueDateFilter) {
  if (filter === "ALL") return true;
  if (filter === "NO_DATE") return task.dueDate === null;
  if (!task.dueDate) return false;

  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;

  const today = startOfDay(new Date());
  const dueDay = startOfDay(dueDate);

  if (filter === "OVERDUE") return dueDay < today;
  if (filter === "TODAY") return dueDay.getTime() === today.getTime();

  return dueDay >= today && dueDay < addDays(today, 7);
}

export function hasActiveTaskFilters(filters: TaskFilterState) {
  return (
    Boolean(filters.search.trim()) ||
    filters.assigneeId !== "ALL" ||
    filters.columnId !== "ALL" ||
    filters.dueDate !== "ALL"
  );
}

export function matchesTask(
  task: BoardTask,
  columnId: string,
  filters: TaskFilterState,
) {
  const search = filters.search.trim().toLowerCase();
  const searchableText = [
    task.title,
    task.description ?? "",
    task.assignee?.name ?? "",
    task.assignee?.email ?? "",
  ]
    .join(" ")
    .toLowerCase();

  if (search && !searchableText.includes(search)) return false;
  if (filters.columnId !== "ALL" && filters.columnId !== columnId) {
    return false;
  }
  if (filters.assigneeId === "UNASSIGNED" && task.assigneeId !== null) {
    return false;
  }
  if (
    filters.assigneeId !== "ALL" &&
    filters.assigneeId !== "UNASSIGNED" &&
    filters.assigneeId !== task.assigneeId
  ) {
    return false;
  }

  return matchesDueDate(task, filters.dueDate);
}

export function filterBoardColumns(
  columns: BoardColumn[],
  filters: TaskFilterState,
) {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.filter((task) => matchesTask(task, column.id, filters)),
  }));
}

export function countBoardTasks(columns: BoardColumn[]) {
  return columns.reduce((count, column) => count + column.tasks.length, 0);
}
