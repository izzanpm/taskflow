"use client";

import { type FormEvent, useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TaskPriority } from "@/types/board";

type CreateTaskFormProps = {
  columnId: string;
  onCreate: (input: {
    columnId: string;
    title: string;
    priority: TaskPriority;
  }) => Promise<void>;
};

export function CreateTaskForm({ columnId, onCreate }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onCreate({ columnId, title: title.trim(), priority });
      setTitle("");
      setPriority("MEDIUM");
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) {
    return (
      <Button
        className="w-full justify-start border-dashed border-[#CBD5E1] px-3 text-xs text-[#64748B] hover:border-[#004BB0] hover:bg-[#F8FBFF] hover:text-[#004BB0]"
        onClick={() => setIsOpen(true)}
        type="button"
        variant="outline"
      >
        <Plus aria-hidden="true" />
        Add task
      </Button>
    );
  }

  return (
    <form
      className="space-y-3 rounded-lg border border-[#CBD5E1] bg-white p-3"
      onSubmit={handleSubmit}
    >
      <Input
        aria-label="Task title"
        autoFocus
        className="h-9 border-[#CBD5E1] text-sm"
        maxLength={140}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="What needs to happen?"
        value={title}
      />
      <div className="flex items-center gap-2">
        <select
          aria-label="Task priority"
          className="h-8 min-w-0 flex-1 rounded-lg border border-[#CBD5E1] bg-white px-2 text-xs text-[#0F172A] outline-none focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20"
          onChange={(event) => setPriority(event.target.value as TaskPriority)}
          value={priority}
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <Button disabled={isSubmitting} size="sm" type="submit">
          {isSubmitting ? "Adding" : "Add"}
        </Button>
        <Button
          onClick={() => setIsOpen(false)}
          size="sm"
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
