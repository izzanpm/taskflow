import {
  CalendarDays,
  CircleUserRound,
  GripVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  onOpen: (task: BoardTask) => void;
  onEdit: (task: BoardTask) => void;
  onDelete: (taskId: string) => Promise<boolean>;
};

export function TaskCard({
  task,
  columnId,
  onOpen,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
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
      className={`group touch-pan-y rounded-lg border border-taskflow-border bg-taskflow-surface p-4 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-taskflow-border-strong hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] ${isDragging ? "opacity-40" : ""}`}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="min-w-0 flex-1">
          <button
            className="min-h-11 w-full py-2 text-left text-sm font-semibold leading-5 text-taskflow-ink transition-colors hover:text-taskflow-brand focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-taskflow-brand/20 sm:min-h-0 sm:py-0"
            onClick={() => onOpen(task)}
            type="button"
          >
            {task.title}
          </button>
        </h3>
        <div className="flex shrink-0 items-center gap-1">
          <div className="flex items-center gap-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <Button
              aria-label={`Edit ${task.title}`}
              className="size-11 text-taskflow-muted hover:bg-taskflow-muted-surface hover:text-taskflow-brand sm:size-8"
              onClick={() => onEdit(task)}
              size="icon"
              title={`Edit ${task.title}`}
              type="button"
              variant="ghost"
            >
              <Pencil aria-hidden="true" />
            </Button>
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
              <AlertDialogTrigger
                render={
                  <Button
                    aria-label={`Delete ${task.title}`}
                    className="size-11 text-taskflow-muted hover:bg-taskflow-danger-surface hover:text-taskflow-danger-border sm:size-8"
                    size="icon"
                    title={`Delete ${task.title}`}
                    type="button"
                    variant="ghost"
                  />
                }
              >
                <Trash2 aria-hidden="true" />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete &quot;{task.title}&quot;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This permanently deletes the task, its comments, and its
                    attachments.
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
                      const deleted = await onDelete(task.id);
                      setIsDeleting(false);
                      if (deleted) setIsDeleteDialogOpen(false);
                    }}
                    variant="destructive"
                  >
                    {isDeleting ? "Deleting" : "Delete task"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Button
            aria-label={`Drag ${task.title}`}
            className="size-11 cursor-grab touch-none text-taskflow-muted hover:bg-taskflow-muted-surface hover:text-taskflow-brand active:cursor-grabbing sm:size-8"
            ref={setActivatorNodeRef}
            size="icon"
            title={`Drag ${task.title}`}
            type="button"
            variant="ghost"
            {...attributes}
            {...listeners}
          >
            <GripVertical aria-hidden="true" />
          </Button>
        </div>
      </div>

      {task.description ? (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-taskflow-muted">
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
          <span className="inline-flex items-center gap-1 text-xs font-medium text-taskflow-muted">
            <CalendarDays aria-hidden="true" className="size-3.5" />
            <time dateTime={task.dueDate}>
              {new Intl.DateTimeFormat("en", {
                month: "short",
                day: "numeric",
              }).format(new Date(task.dueDate))}
            </time>
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-center border-t border-taskflow-muted-surface pt-3">
        {task.assignee ? (
          <span className="inline-flex min-w-0 items-center gap-1.5 text-xs text-taskflow-muted">
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-taskflow-blue-subtle text-[10px] font-bold text-taskflow-brand">
              {task.assignee.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="truncate">{task.assignee.name}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs text-taskflow-muted">
            <CircleUserRound aria-hidden="true" className="size-4" />
            Unassigned
          </span>
        )}
      </div>
    </article>
  );
}
