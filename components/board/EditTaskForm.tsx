"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BoardMember, BoardTask, TaskPriority } from "@/types/board";

type EditTaskFormProps = {
  task: BoardTask;
  members: BoardMember[];
  onSave: (
    taskId: string,
    input: {
      title: string;
      description: string | null;
      assigneeId: string | null;
      dueDate: string | null;
      priority: TaskPriority;
    },
  ) => Promise<void>;
  onCancel: () => void;
};

export function EditTaskForm({
  task,
  members,
  onSave,
  onCancel,
}: EditTaskFormProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [assigneeId, setAssigneeId] = useState(task.assigneeId ?? "");
  const [dueDate, setDueDate] = useState(
    task.dueDate ? task.dueDate.slice(0, 10) : "",
  );
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSave(task.id, {
        title: title.trim(),
        description: description.trim() || null,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        priority,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label htmlFor={`task-title-${task.id}`}>Title</Label>
        <Input
          autoFocus
          id={`task-title-${task.id}`}
          maxLength={140}
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`task-description-${task.id}`}>Description</Label>
        <textarea
          className="min-h-20 w-full resize-y rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm text-[#0F172A] outline-none focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20"
          id={`task-description-${task.id}`}
          maxLength={5000}
          onChange={(event) => setDescription(event.target.value)}
          value={description}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor={`task-assignee-${task.id}`}>Assignee</Label>
          <select
            className="h-9 w-full rounded-lg border border-[#CBD5E1] bg-white px-2 text-sm text-[#0F172A] outline-none focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20"
            id={`task-assignee-${task.id}`}
            onChange={(event) => setAssigneeId(event.target.value)}
            value={assigneeId}
          >
            <option value="">Unassigned</option>
            {members.map((member) => (
              <option key={member.userId} value={member.userId}>
                {member.user.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`task-due-date-${task.id}`}>Due date</Label>
          <Input
            id={`task-due-date-${task.id}`}
            onChange={(event) => setDueDate(event.target.value)}
            type="date"
            value={dueDate}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`task-priority-${task.id}`}>Priority</Label>
          <select
            className="h-9 w-full rounded-lg border border-[#CBD5E1] bg-white px-2 text-sm text-[#0F172A] outline-none focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20"
            id={`task-priority-${task.id}`}
            onChange={(event) =>
              setPriority(event.target.value as TaskPriority)
            }
            value={priority}
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancel
        </Button>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Saving" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
