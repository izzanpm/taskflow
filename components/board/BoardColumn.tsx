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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  BoardColumn as BoardColumnData,
  BoardMember,
  TaskPriority,
} from "@/types/board";

type BoardColumnProps = {
  column: BoardColumnData;
  members: BoardMember[];
  onRename: (columnId: string, name: string) => Promise<void>;
  onDelete: (columnId: string) => Promise<void>;
  onCreateTask: (input: {
    columnId: string;
    title: string;
    priority: TaskPriority;
  }) => Promise<void>;
  onEditTask: (
    taskId: string,
    input: {
      title: string;
      description: string | null;
      assigneeId: string | null;
      dueDate: string | null;
      priority: TaskPriority;
    },
  ) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
};

export function BoardColumn({
  column,
  members,
  onRename,
  onDelete,
  onCreateTask,
  onEditTask,
  onDeleteTask,
}: BoardColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [name, setName] = useState(column.name);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: { type: "column", columnId: column.id },
  });

  async function handleRename(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;

    await onRename(column.id, name.trim());
    setIsRenaming(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete ${column.name} and its tasks?`)) return;
    await onDelete(column.id);
  }

  return (
    <section
      className={`flex h-fit min-h-[28rem] w-[min(20rem,calc(100vw-3rem))] shrink-0 flex-col rounded-xl border border-[#E2E8F0] bg-[#F1F5F9]/75 p-3 ${isDragging ? "opacity-50" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex items-center gap-2 border-b border-[#E2E8F0] px-1 pb-3">
        <button
          aria-label={`Drag ${column.name}`}
          className="cursor-grab text-[#94A3B8] transition-colors hover:text-[#004BB0] active:cursor-grabbing"
          title={`Drag ${column.name}`}
          type="button"
          {...attributes}
          {...listeners}
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>

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
            <Button aria-label="Save column name" size="icon-sm" type="submit">
              <Check aria-hidden="true" />
            </Button>
            <Button
              aria-label="Cancel rename"
              onClick={() => {
                setName(column.name);
                setIsRenaming(false);
              }}
              size="icon-sm"
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
                {column.tasks.length}
              </span>
            </div>
            <div className="relative">
              <Button
                aria-expanded={isMenuOpen}
                aria-label={`Column actions for ${column.name}`}
                className="size-7 text-[#64748B] hover:bg-white hover:text-[#004BB0]"
                onClick={() => setIsMenuOpen((open) => !open)}
                size="icon-sm"
                title={`Column actions for ${column.name}`}
                type="button"
                variant="ghost"
              >
                <MoreHorizontal aria-hidden="true" />
              </Button>
              {isMenuOpen ? (
                <div className="absolute right-0 top-8 z-10 w-32 rounded-lg border border-[#E2E8F0] bg-white p-1 shadow-[0_8px_24px_rgba(15,23,42,0.1)]">
                  <Button
                    className="w-full justify-start px-2 text-xs text-[#0F172A]"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsRenaming(true);
                    }}
                    type="button"
                    variant="ghost"
                  >
                    Rename
                  </Button>
                  <Button
                    className="w-full justify-start px-2 text-xs text-[#B91C1C] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                    onClick={() => {
                      setIsMenuOpen(false);
                      void handleDelete();
                    }}
                    type="button"
                    variant="ghost"
                  >
                    <Trash2 aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              ) : null}
            </div>
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
                      await onEditTask(taskId, input);
                      setEditingTaskId(null);
                    }}
                    task={task}
                  />
                </div>
              ) : (
                <TaskCard
                  columnId={column.id}
                  onDelete={onDeleteTask}
                  onEdit={() => setEditingTaskId(task.id)}
                  task={task}
                />
              )}
            </div>
          ))}
          {column.tasks.length === 0 ? (
            <div className="flex flex-1 items-center justify-center border border-dashed border-[#CBD5E1] px-4 py-8 text-center">
              <p className="text-xs leading-5 text-[#94A3B8]">
                Drop a task here or create the first one.
              </p>
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
