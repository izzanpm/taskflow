import {
  CalendarDays,
  CircleUserRound,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Button } from "@/components/ui/button";
import type { BoardTask } from "@/types/board";

const priorityStyles = {
  LOW: "bg-[#F1F5F9] text-[#64748B]",
  MEDIUM: "bg-[#E8F0FB] text-[#004BB0]",
  HIGH: "bg-[#FFF7ED] text-[#C2410C]",
  URGENT: "bg-[#FEF2F2] text-[#B91C1C]",
} as const;

const priorityLabels = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
} as const;

type TaskCardProps = {
  task: BoardTask;
  columnId: string;
  onEdit: (task: BoardTask) => void;
  onDelete: (taskId: string) => void;
};

export function TaskCard({ task, columnId, onEdit, onDelete }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "task", task, columnId },
  });

  return (
    <article
      className={`group rounded-lg border border-[#E2E8F0] bg-white p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] ${isDragging ? "opacity-40" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 text-sm font-semibold leading-5 text-[#0F172A]">
          {task.title}
        </h3>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <Button
            aria-label={`Edit ${task.title}`}
            className="size-7 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#004BB0]"
            onClick={() => onEdit(task)}
            size="icon-sm"
            title={`Edit ${task.title}`}
            type="button"
            variant="ghost"
          >
            <MoreHorizontal aria-hidden="true" />
          </Button>
          <Button
            aria-label={`Delete ${task.title}`}
            className="size-7 text-[#64748B] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
            onClick={() => onDelete(task.id)}
            size="icon-sm"
            title={`Delete ${task.title}`}
            type="button"
            variant="ghost"
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#64748B]">
          {task.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${priorityStyles[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </span>
        {task.dueDate ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#64748B]">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            {new Intl.DateTimeFormat("en", {
              month: "short",
              day: "numeric",
            }).format(new Date(task.dueDate))}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[#F1F5F9] pt-3">
        {task.assignee ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-[#64748B]">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[#E8F0FB] text-[10px] font-bold text-[#004BB0]">
              {task.assignee.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8]">
            <CircleUserRound aria-hidden="true" className="size-4" />
            Unassigned
          </span>
        )}
        <span className="text-[11px] font-medium text-[#94A3B8]">Drag</span>
      </div>
    </article>
  );
}
