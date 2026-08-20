"use client";

import { type FormEvent, useMemo, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListFilter, Plus, RefreshCw, Search, X } from "lucide-react";

import { BoardColumn } from "@/components/board/BoardColumn";
import { TaskDetailModal } from "@/components/board/TaskDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast, type ToastVariant } from "@/components/ui/toast";
import { hasStructuredTaskFilters } from "@/lib/board-ui.mjs";
import {
  countBoardTasks,
  emptyTaskFilters,
  filterBoardColumns,
  hasActiveTaskFilters,
  type TaskFilterState,
} from "@/lib/task-filters";
import type {
  BoardColumn as BoardColumnData,
  BoardTask,
  BoardView,
  TaskPriority,
} from "@/types/board";

type ApiResponse<T> = {
  data?: T;
  error?: string;
};

type ColumnReorderInput = {
  columnId: string;
  previousColumnId: string | null;
  nextColumnId: string | null;
  optimisticColumns: BoardColumnData[];
};

type TaskReorderInput = {
  taskId: string;
  columnId: string;
  previousTaskId: string | null;
  nextTaskId: string | null;
  optimisticColumns: BoardColumnData[];
};

type BoardToast = {
  message: string;
  variant: ToastVariant;
};

async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.data === undefined) {
    throw new Error(result.error ?? "The request could not be completed.");
  }

  return result.data;
}

function moveColumn(
  columns: BoardColumnData[],
  columnId: string,
  targetColumnId: string,
) {
  const fromIndex = columns.findIndex((column) => column.id === columnId);
  const targetIndex = columns.findIndex(
    (column) => column.id === targetColumnId,
  );
  if (fromIndex < 0 || targetIndex < 0 || fromIndex === targetIndex) {
    return null;
  }

  const adjustedTargetIndex =
    fromIndex < targetIndex ? targetIndex - 1 : targetIndex;
  const nextColumns = arrayMove(columns, fromIndex, adjustedTargetIndex);
  const insertedIndex = nextColumns.findIndex(
    (column) => column.id === columnId,
  );

  return {
    columns: nextColumns,
    previousColumnId: nextColumns[insertedIndex - 1]?.id ?? null,
    nextColumnId: nextColumns[insertedIndex + 1]?.id ?? null,
  };
}

function moveTask(
  columns: BoardColumnData[],
  taskId: string,
  sourceColumnId: string,
  targetColumnId: string,
  targetIndex: number,
  dropOnColumn: boolean,
) {
  const sourceColumn = columns.find((column) => column.id === sourceColumnId);
  const targetColumn = columns.find((column) => column.id === targetColumnId);
  if (!sourceColumn || !targetColumn) return null;

  const sourceIndex = sourceColumn.tasks.findIndex(
    (task) => task.id === taskId,
  );
  if (sourceIndex < 0) return null;

  const task = sourceColumn.tasks[sourceIndex];
  const sourceTasks = sourceColumn.tasks.filter((item) => item.id !== taskId);
  const targetTasks =
    sourceColumnId === targetColumnId ? sourceTasks : [...targetColumn.tasks];
  let insertionIndex = dropOnColumn
    ? targetTasks.length
    : Math.min(targetIndex, targetTasks.length);

  if (
    !dropOnColumn &&
    sourceColumnId === targetColumnId &&
    sourceIndex < insertionIndex
  ) {
    insertionIndex -= 1;
  }

  if (sourceColumnId === targetColumnId && sourceIndex === insertionIndex) {
    return null;
  }

  targetTasks.splice(insertionIndex, 0, task);
  const nextColumns = columns.map((column) => {
    if (sourceColumnId === targetColumnId && column.id === sourceColumnId) {
      return { ...column, tasks: targetTasks };
    }
    if (column.id === sourceColumnId) return { ...column, tasks: sourceTasks };
    if (column.id === targetColumnId) return { ...column, tasks: targetTasks };
    return column;
  });

  return {
    columns: nextColumns,
    previousTaskId: targetTasks[insertionIndex - 1]?.id ?? null,
    nextTaskId: targetTasks[insertionIndex + 1]?.id ?? null,
  };
}

function updateTask(
  columns: BoardColumnData[],
  taskId: string,
  update: (task: BoardTask) => BoardTask,
) {
  return columns.map((column) => ({
    ...column,
    tasks: column.tasks.map((task) =>
      task.id === taskId ? update(task) : task,
    ),
  }));
}

export function BoardPageClient({ initialBoard }: { initialBoard: BoardView }) {
  const queryClient = useQueryClient();
  const queryKey = ["board", initialBoard.id] as const;
  const [columnName, setColumnName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [toast, setToast] = useState<BoardToast | null>(null);
  const [filters, setFilters] = useState<TaskFilterState>(emptyTaskFilters);
  const [showFilters, setShowFilters] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const {
    data: board = initialBoard,
    error: boardQueryError,
    isError: isBoardError,
    isFetching: isBoardFetching,
    refetch: refetchBoard,
  } = useQuery<BoardView>({
    queryKey,
    queryFn: () => requestApi<BoardView>(`/api/boards/${initialBoard.id}`),
    initialData: initialBoard,
  });

  function showMutationError(error: Error) {
    setErrorMessage(error.message);
    setToast({ message: error.message, variant: "error" });
  }

  function showMutationSuccess(message: string) {
    setErrorMessage("");
    setToast({ message, variant: "success" });
  }

  function updateBoard(updater: (current: BoardView) => BoardView) {
    queryClient.setQueryData<BoardView>(queryKey, (current) =>
      current ? updater(current) : current,
    );
  }

  const createColumnMutation = useMutation({
    mutationFn: (name: string) =>
      requestApi<{ id: string; name: string; order: number }>(
        `/api/boards/${initialBoard.id}/columns`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        },
      ),
    onSuccess: (column) => {
      updateBoard((current) => ({
        ...current,
        columns: [...current.columns, { ...column, tasks: [] }],
      }));
      setColumnName("");
      showMutationSuccess("Column added.");
    },
    onError: showMutationError,
  });

  const renameColumnMutation = useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      requestApi<{ id: string; name: string }>(`/api/columns/${columnId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      }),
    onSuccess: (column) => {
      updateBoard((current) => ({
        ...current,
        columns: current.columns.map((item) =>
          item.id === column.id ? { ...item, name: column.name } : item,
        ),
      }));
      showMutationSuccess("Column renamed.");
    },
    onError: showMutationError,
  });

  const deleteColumnMutation = useMutation({
    mutationFn: (columnId: string) =>
      requestApi<{ id: string }>(`/api/columns/${columnId}`, {
        method: "DELETE",
      }),
    onSuccess: ({ id }) => {
      updateBoard((current) => ({
        ...current,
        columns: current.columns.filter((column) => column.id !== id),
      }));
      showMutationSuccess("Column deleted.");
    },
    onError: showMutationError,
  });

  const createTaskMutation = useMutation({
    mutationFn: (input: {
      columnId: string;
      title: string;
      priority: TaskPriority;
    }) =>
      requestApi<BoardTask>("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: (task, input) => {
      updateBoard((current) => ({
        ...current,
        columns: current.columns.map((column) =>
          column.id === input.columnId
            ? { ...column, tasks: [...column.tasks, task] }
            : column,
        ),
      }));
      showMutationSuccess("Task added.");
    },
    onError: showMutationError,
  });

  const editTaskMutation = useMutation({
    mutationFn: ({
      taskId,
      input,
    }: {
      taskId: string;
      input: {
        title: string;
        description: string | null;
        assigneeId: string | null;
        dueDate: string | null;
        priority: TaskPriority;
      };
    }) =>
      requestApi<BoardTask>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    onSuccess: (task) => {
      updateBoard((current) => ({
        ...current,
        columns: updateTask(current.columns, task.id, (currentTask) => ({
          ...currentTask,
          ...task,
        })),
      }));
      showMutationSuccess("Task updated.");
    },
    onError: showMutationError,
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      requestApi<{ id: string }>(`/api/tasks/${taskId}`, {
        method: "DELETE",
      }),
    onSuccess: ({ id }) => {
      updateBoard((current) => ({
        ...current,
        columns: current.columns.map((column) => ({
          ...column,
          tasks: column.tasks.filter((task) => task.id !== id),
        })),
      }));
      if (id === selectedTaskId) setSelectedTaskId(null);
      showMutationSuccess("Task deleted.");
    },
    onError: showMutationError,
  });

  const reorderColumnMutation = useMutation({
    mutationFn: (input: ColumnReorderInput) =>
      requestApi(`/api/boards/${initialBoard.id}/columns/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: input.columnId,
          previousColumnId: input.previousColumnId,
          nextColumnId: input.nextColumnId,
        }),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardView>(queryKey);
      updateBoard((current) => ({
        ...current,
        columns: input.optimisticColumns,
      }));
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      showMutationError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  const reorderTaskMutation = useMutation({
    mutationFn: (input: TaskReorderInput) =>
      requestApi(`/api/tasks/${input.taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: input.columnId,
          previousTaskId: input.previousTaskId,
          nextTaskId: input.nextTaskId,
        }),
      }),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<BoardView>(queryKey);
      updateBoard((current) => ({
        ...current,
        columns: input.optimisticColumns,
      }));
      return { previous };
    },
    onError: (error, _input, context) => {
      if (context?.previous)
        queryClient.setQueryData(queryKey, context.previous);
      showMutationError(error);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });

  function handleDragStart(event: DragStartEvent) {
    setErrorMessage("");
    setActiveId(String(event.active.id));
    setActiveType(String(event.active.data.current?.type ?? ""));
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    setActiveType(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;
    if (activeData?.type === "column" && overData?.type === "column") {
      const result = moveColumn(
        board.columns,
        String(active.id),
        String(over.id),
      );
      if (result) {
        reorderColumnMutation.mutate({
          columnId: String(active.id),
          previousColumnId: result.previousColumnId,
          nextColumnId: result.nextColumnId,
          optimisticColumns: result.columns,
        });
      }
      return;
    }

    if (activeData?.type !== "task") return;
    const sourceColumnId = String(activeData.columnId);
    const targetColumnId = String(
      overData?.type === "task" ? overData.columnId : over.id,
    );
    const targetColumn = board.columns.find(
      (column) => column.id === targetColumnId,
    );
    if (!targetColumn) return;

    const targetIndex =
      overData?.type === "task"
        ? targetColumn.tasks.findIndex((task) => task.id === String(over.id))
        : targetColumn.tasks.length;
    const result = moveTask(
      board.columns,
      String(active.id),
      sourceColumnId,
      targetColumnId,
      targetIndex < 0 ? targetColumn.tasks.length : targetIndex,
      overData?.type === "column",
    );
    if (result) {
      reorderTaskMutation.mutate({
        taskId: String(active.id),
        columnId: targetColumnId,
        previousTaskId: result.previousTaskId,
        nextTaskId: result.nextTaskId,
        optimisticColumns: result.columns,
      });
    }
  }

  function handleDragCancel() {
    setActiveId(null);
    setActiveType(null);
  }

  async function handleRenameColumn(
    columnId: string,
    name: string,
  ): Promise<boolean> {
    try {
      await renameColumnMutation.mutateAsync({ columnId, name });
      return true;
    } catch {
      return false;
    }
  }

  async function handleDeleteColumn(columnId: string): Promise<boolean> {
    try {
      await deleteColumnMutation.mutateAsync(columnId);
      return true;
    } catch {
      return false;
    }
  }

  async function handleCreateTask(input: {
    columnId: string;
    title: string;
    priority: TaskPriority;
  }): Promise<boolean> {
    try {
      await createTaskMutation.mutateAsync(input);
      return true;
    } catch {
      return false;
    }
  }

  async function handleEditTask(
    taskId: string,
    input: {
      title: string;
      description: string | null;
      assigneeId: string | null;
      dueDate: string | null;
      priority: TaskPriority;
    },
  ): Promise<boolean> {
    try {
      await editTaskMutation.mutateAsync({ taskId, input });
      return true;
    } catch {
      return false;
    }
  }

  async function handleDeleteTask(taskId: string): Promise<boolean> {
    try {
      await deleteTaskMutation.mutateAsync(taskId);
      return true;
    } catch {
      return false;
    }
  }

  function handleCreateColumn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!columnName.trim()) return;
    setErrorMessage("");
    createColumnMutation.mutate(columnName.trim());
  }

  const activeColumn = activeId
    ? board.columns.find((column) => column.id === activeId)
    : null;
  const activeTask = activeId
    ? board.columns
        .flatMap((column) => column.tasks)
        .find((task) => task.id === activeId)
    : null;
  const selectedTask = selectedTaskId
    ? board.columns
        .flatMap((column) => column.tasks)
        .find((task) => task.id === selectedTaskId)
    : null;
  const filteredColumns = useMemo(
    () => filterBoardColumns(board.columns, filters),
    [board.columns, filters],
  );
  const totalTaskCount = countBoardTasks(board.columns);
  const visibleTaskCount = countBoardTasks(filteredColumns);
  const hasActiveFilters = hasActiveTaskFilters(filters);
  const hasStructuredFilters = hasStructuredTaskFilters(filters);
  const filtersVisible = showFilters || hasStructuredFilters;
  const boardErrorMessage = isBoardError
    ? boardQueryError instanceof Error
      ? boardQueryError.message
      : "We could not refresh this board."
    : "";

  return (
    <div>
      {errorMessage || boardErrorMessage ? (
        <div
          aria-live="assertive"
          className="mb-5 flex items-start gap-3 rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          role="alert"
        >
          <p className="min-w-0 flex-1">{boardErrorMessage || errorMessage}</p>
          {boardErrorMessage ? (
            <Button
              className="-my-1 -mr-1 shrink-0 gap-1 px-2 text-xs text-[#991B1B] hover:bg-[#FEE2E2] hover:text-[#7F1D1D]"
              onClick={() => void refetchBoard()}
              size="sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw aria-hidden="true" />
              Retry
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="flex justify-end border-b border-taskflow-border pb-4">
        <form
          className="flex w-full gap-2 sm:w-auto"
          onSubmit={handleCreateColumn}
        >
          <Input
            aria-label="New column name"
            className="h-9 min-w-0 sm:w-48"
            maxLength={60}
            onChange={(event) => setColumnName(event.target.value)}
            placeholder="New column"
            value={columnName}
          />
          <Button
            disabled={createColumnMutation.isPending}
            size="sm"
            type="submit"
          >
            <Plus aria-hidden="true" />
            {createColumnMutation.isPending ? "Adding" : "Add column"}
          </Button>
        </form>
      </div>

      {isBoardFetching && !isBoardError ? (
        <p className="mt-3 text-xs text-[#64748B]" role="status">
          Refreshing board...
        </p>
      ) : null}

      <section
        aria-label="Task search and filters"
        className="mt-4 rounded-lg border border-taskflow-border bg-taskflow-surface p-3 sm:p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-taskflow-muted"
            />
            <Input
              aria-label="Search tasks"
              className="h-11 border-taskflow-border-strong pr-12 pl-9 text-sm sm:h-10"
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  search: event.target.value,
                }))
              }
              placeholder="Search tasks"
              type="search"
              value={filters.search}
            />
            {filters.search ? (
              <Button
                aria-label="Clear task search"
                className="absolute right-0 top-1/2 size-11 -translate-y-1/2 text-taskflow-muted hover:bg-taskflow-muted-surface sm:size-10"
                onClick={() =>
                  setFilters((current) => ({ ...current, search: "" }))
                }
                size="icon"
                title="Clear task search"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end">
            <p
              aria-live="polite"
              className="mr-auto text-xs text-taskflow-muted sm:mr-1"
            >
              {hasActiveFilters
                ? `${visibleTaskCount} of ${totalTaskCount} tasks shown`
                : `${totalTaskCount} ${totalTaskCount === 1 ? "task" : "tasks"}`}
            </p>
            <Button
              aria-controls="board-task-filters"
              aria-expanded={filtersVisible}
              className="h-11 gap-1.5 text-taskflow-muted sm:h-8"
              disabled={hasStructuredFilters}
              onClick={() => setShowFilters((visible) => !visible)}
              size="sm"
              type="button"
              variant="outline"
            >
              <ListFilter aria-hidden="true" />
              {hasStructuredFilters
                ? "Filters active"
                : filtersVisible
                  ? "Hide filters"
                  : "Filters"}
            </Button>
            {hasActiveFilters ? (
              <Button
                className="h-11 gap-1 px-2 text-xs text-taskflow-brand sm:h-8"
                onClick={() => {
                  setFilters(emptyTaskFilters);
                  setShowFilters(false);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                <X aria-hidden="true" />
                Clear filters
              </Button>
            ) : null}
          </div>
        </div>
        {filtersVisible ? (
          <div
            className="mt-3 grid gap-3 sm:grid-cols-3"
            id="board-task-filters"
          >
            <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-taskflow-muted">
              <span className="sr-only">Filter by assignee</span>
              <select
                aria-label="Filter by assignee"
                className="h-11 min-w-0 w-full rounded-lg border border-taskflow-border-strong bg-taskflow-surface px-2.5 text-sm font-normal text-taskflow-ink outline-none focus:border-taskflow-brand focus:ring-3 focus:ring-taskflow-brand/20 sm:h-9"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    assigneeId: event.target.value,
                  }))
                }
                value={filters.assigneeId}
              >
                <option value="ALL">All assignees</option>
                <option value="UNASSIGNED">Unassigned</option>
                {board.members.map((member) => (
                  <option key={member.userId} value={member.userId}>
                    {member.user.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-taskflow-muted">
              <span className="sr-only">Filter by column</span>
              <select
                aria-label="Filter by column"
                className="h-11 min-w-0 w-full rounded-lg border border-taskflow-border-strong bg-taskflow-surface px-2.5 text-sm font-normal text-taskflow-ink outline-none focus:border-taskflow-brand focus:ring-3 focus:ring-taskflow-brand/20 sm:h-9"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    columnId: event.target.value,
                  }))
                }
                value={filters.columnId}
              >
                <option value="ALL">All columns</option>
                {board.columns.map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-taskflow-muted">
              <span className="sr-only">Filter by due date</span>
              <select
                aria-label="Filter by due date"
                className="h-11 min-w-0 w-full rounded-lg border border-taskflow-border-strong bg-taskflow-surface px-2.5 text-sm font-normal text-taskflow-ink outline-none focus:border-taskflow-brand focus:ring-3 focus:ring-taskflow-brand/20 sm:h-9"
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    dueDate: event.target.value as TaskFilterState["dueDate"],
                  }))
                }
                value={filters.dueDate}
              >
                <option value="ALL">Any due date</option>
                <option value="OVERDUE">Overdue</option>
                <option value="TODAY">Due today</option>
                <option value="NEXT_7_DAYS">Next 7 days</option>
                <option value="NO_DATE">No due date</option>
              </select>
            </label>
          </div>
        ) : null}
        {hasActiveFilters ? (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-taskflow-muted">
            <ListFilter
              aria-hidden="true"
              className="size-3.5 text-taskflow-brand"
            />
            Clear filters to reorder columns or tasks.
          </p>
        ) : null}
      </section>

      <DndContext
        collisionDetection={closestCorners}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        onDragStart={handleDragStart}
        sensors={hasActiveFilters ? [] : sensors}
      >
        <SortableContext
          items={board.columns.map((column) => column.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="mt-6 flex snap-x gap-4 overflow-x-auto pb-6 [scrollbar-gutter:stable]">
            {filteredColumns.map((column) => (
              <BoardColumn
                column={column}
                key={column.id}
                members={board.members}
                hasActiveFilters={hasActiveFilters}
                onCreateTask={handleCreateTask}
                onDelete={handleDeleteColumn}
                onDeleteTask={handleDeleteTask}
                onEditTask={handleEditTask}
                onOpenTask={(task) => setSelectedTaskId(task.id)}
                onRename={handleRenameColumn}
                totalTaskCount={
                  board.columns.find((item) => item.id === column.id)?.tasks
                    .length ?? 0
                }
              />
            ))}
            {board.columns.length === 0 ? (
              <div className="flex min-h-64 w-full flex-col items-center justify-center border border-dashed border-[#CBD5E1] px-6 text-center">
                <p className="text-sm font-semibold text-[#0F172A]">
                  No columns yet.
                </p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Add a column above to give this board its first workflow
                  stage.
                </p>
              </div>
            ) : null}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeType === "column" && activeColumn ? (
            <div className="w-80 rounded-xl border border-[#CBD5E1] bg-white p-4 text-sm font-semibold text-[#0F172A] shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              {activeColumn.name}
            </div>
          ) : null}
          {activeType === "task" && activeTask ? (
            <div className="w-72 rounded-lg border border-[#CBD5E1] bg-white p-4 text-sm font-semibold text-[#0F172A] shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
              {activeTask.title}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask ? (
        <TaskDetailModal
          currentUserId={board.currentUserId}
          members={board.members}
          onEditTask={handleEditTask}
          onClose={() => setSelectedTaskId(null)}
          task={selectedTask}
          taskId={selectedTask.id}
        />
      ) : null}

      <Toast
        message={toast?.message ?? ""}
        onDismiss={() => setToast(null)}
        variant={toast?.variant}
      />
    </div>
  );
}
