"use client";

import { type FormEvent, useState } from "react";
import { Check, GripVertical, MoreHorizontal, Trash2, X } from "lucide-react";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { CreateTaskForm } from "@/components/board/CreateTaskForm";
import { EditTaskForm } from "@/components/board/EditTaskForm";
import { TaskCard } from "@/components/board/TaskCard";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type {
  BoardColumn as BoardColumnData,
  BoardMember,
  TaskPriority,
} from "@/types/board";

type BoardColumnProps = {
  column: BoardColumnData;
  members: BoardMember[];
  onRename: (columnId: string, name: string) => Promise<boolean>;
  onDelete: (columnId: string) => Promise<boolean>;
  onCreateTask: (input: {
    columnId: string;
    title: string;
    priority: TaskPriority;
  }) => Promise<boolean>;
  onEditTask: (
    taskId: string,
    input: {
      title: string;
      description: string | null;
      assigneeId: string | null;
      dueDate: string | null;
      priority: TaskPriority;
    },
  ) => Promise<boolean>;
  onOpenTask: (task: BoardColumnData["tasks"][number]) => void;
  onDeleteTask: (taskId: string) => Promise<boolean>;
  hasActiveFilters: boolean;
  totalTaskCount: number;
};

export function BoardColumn({
  column,
  members,
  onRename,
  onDelete,
  onCreateTask,
  onOpenTask,
  onEditTask,
  onDeleteTask,
  hasActiveFilters,
  totalTaskCount,
}: BoardColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    disabled: hasActiveFilters,
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    const renamed = await onRename(column.id, name.trim());
    if (renamed) setIsRenaming(false);
  }

  return (
    <section
      aria-label={`${column.name} column`}
      className={`flex h-fit min-h-[28rem] w-[min(20rem,calc(100vw-2rem))] shrink-0 touch-pan-y flex-col rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]/75 p-3 sm:w-80 ${isDragging ? "opacity-50" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-1 pb-3">
        <Button
          aria-label={`Drag ${column.name}`}
          className="size-11 cursor-grab touch-none text-taskflow-muted hover:bg-taskflow-surface hover:text-taskflow-brand active:cursor-grabbing sm:size-8"
          ref={setActivatorNodeRef}
          size="icon"
          title={`Drag ${column.name}`}
          type="button"
          variant="ghost"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </Button>

        {isRenaming ? (
          <form
            className="flex min-w-0 flex-1 items-center gap-1"
            onSubmit={handleRename}
          >
            <Input
              aria-label="Column name"
              autoFocus
              className="h-8 min-w-0 bg-white text-sm"
              maxLength={60}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
            <Button
              aria-label="Save column name"
              className="size-11 sm:size-8"
              size="icon"
              type="submit"
            >
              <Check aria-hidden="true" />
            </Button>
            <Button
              aria-label="Cancel rename"
              className="size-11 sm:size-8"
              onClick={() => {
                setName(column.name);
                setIsRenaming(false);
              }}
              size="icon"
              type="button"
              variant="ghost"
            >
              <X aria-hidden="true" />
            </Button>
          </form>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-[#0F172A]">
                {column.name}
              </h2>
              <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                {hasActiveFilters && totalTaskCount !== column.tasks.length
                  ? `${column.tasks.length}/${totalTaskCount}`
                  : column.tasks.length}
              </span>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    aria-label={`Column actions for ${column.name}`}
                    className="size-11 text-taskflow-muted hover:bg-taskflow-surface hover:text-taskflow-brand sm:size-8"
                    size="icon"
                    title={`Column actions for ${column.name}`}
                    type="button"
                    variant="ghost"
                  />
                }
              >
                <MoreHorizontal aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-36">
                <DropdownMenuItem onClick={() => setIsRenaming(true)}>
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  variant="destructive"
                >
                  <Trash2 aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialog
              onOpenChange={(open, eventDetails) => {
                if (isDeleting && !open) {
                  eventDetails.cancel();
                  return;
                }
                setIsDeleteDialogOpen(open);
              }}
              open={isDeleteDialogOpen}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete &quot;{column.name}&quot;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the column and all tasks inside it.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={isDeleting}
                    onClick={async () => {
                      setIsDeleting(true);
                      const deleted = await onDelete(column.id);
                      setIsDeleting(false);
                      if (deleted) setIsDeleteDialogOpen(false);
                    }}
                    variant="destructive"
                  >
                    {isDeleting ? "Deleting" : "Delete column"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      <SortableContext
        items={column.tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="mt-3 flex min-h-36 flex-1 flex-col gap-3">
          {column.tasks.map((task) => (
            <div key={task.id}>
              {editingTaskId === task.id ? (
                <div className="rounded-lg border border-[#CBD5E1] bg-white p-4">
                  <EditTaskForm
                    members={members}
                    onCancel={() => setEditingTaskId(null)}
                    onSave={async (taskId, input) => {
                      const saved = await onEditTask(taskId, input);
                      if (saved) setEditingTaskId(null);
                      return saved;
                    }}
                    task={task}
                  />
                </div>
              ) : (
                <TaskCard
                  columnId={column.id}
                  onDelete={onDeleteTask}
                  onEdit={() => setEditingTaskId(task.id)}
                  onOpen={onOpenTask}
                  task={task}
                />
              )}
            </div>
          ))}
          {column.tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center border border-dashed border-[#CBD5E1] px-4 py-8 text-center">
              {hasActiveFilters && totalTaskCount > 0 ? (
                <div>
                  <p className="text-xs font-medium text-[#64748B]">
                    No matching tasks.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                    Clear a filter to see more work.
                  </p>
                </div>
              ) : (
                <p className="text-xs leading-5 text-[#94A3B8]">
                  Drop a task here or create the first one.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </SortableContext>

      <div className="mt-3">
        <CreateTaskForm columnId={column.id} onCreate={onCreateTask} />
      </div>
    </section>
  );
}
