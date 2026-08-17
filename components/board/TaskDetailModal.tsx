"use client";

import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { MessageCircle, Paperclip, Trash2, Upload, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { EditTaskForm } from "@/components/board/EditTaskForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type {
  BoardMember,
  BoardTask,
  TaskAttachment,
  TaskComment,
  TaskDetail,
  TaskPriority,
} from "@/types/board";

type ApiResponse<T> = { data?: T; error?: string };

async function requestApi<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const result = (await response.json()) as ApiResponse<T>;

  if (!response.ok || result.data === undefined) {
    throw new Error(result.error ?? "The request could not be completed.");
  }

  return result.data;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function CommentItem({ comment }: { comment: TaskComment }) {
  return (
    <li className="border-b border-[#F1F5F9] py-4 first:pt-0 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8F0FB] text-[11px] font-bold text-[#004BB0]">
          {initials(comment.user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <p className="text-sm font-semibold text-[#0F172A]">
              {comment.user.name}
            </p>
            <time className="text-[11px] text-[#94A3B8]">
              {formatDate(comment.createdAt)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
            {comment.body}
          </p>
        </div>
      </div>
    </li>
  );
}

function formatFileSize(value: number) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.ceil(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export function TaskDetailModal({
  task,
  taskId,
  members,
  currentUserId,
  onEditTask,
  onClose,
}: {
  task: BoardTask;
  taskId: string;
  members: BoardMember[];
  currentUserId: string;
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
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [attachmentError, setAttachmentError] = useState("");
  const [attachmentMessage, setAttachmentMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryKey = ["task-detail", taskId] as const;
  const { data, isLoading, isError } = useQuery<TaskDetail>({
    queryKey,
    queryFn: () => requestApi<TaskDetail>(`/api/tasks/${taskId}`),
  });

  const commentMutation = useMutation({
    mutationFn: (commentBody: string) =>
      requestApi<TaskComment>(`/api/tasks/${taskId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody }),
      }),
    onSuccess: () => {
      setBody("");
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const prepared = await requestApi<{
        uploadUrl: string;
        attachment: TaskAttachment;
      }>(`/api/tasks/${taskId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type || "application/octet-stream",
          fileSize: file.size,
        }),
      });
      const uploadResponse = await fetch(prepared.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });

      if (!uploadResponse.ok) {
        await fetch(
          `/api/tasks/${taskId}/attachments/${prepared.attachment.id}`,
          { method: "DELETE" },
        ).catch(() => undefined);
        throw new Error("The file could not be uploaded. Please try again.");
      }

      return prepared.attachment;
    },
    onMutate: () => {
      setAttachmentError("");
      setAttachmentMessage("");
    },
    onSuccess: (attachment) => {
      setAttachmentMessage(`${attachment.fileName} uploaded.`);
      void queryClient.invalidateQueries({ queryKey });
    },
    onError: (error) => setAttachmentError(error.message),
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: (attachmentId: string) =>
      requestApi<{ id: string }>(
        `/api/tasks/${taskId}/attachments/${attachmentId}`,
        { method: "DELETE" },
      ),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey }),
    onError: (error) => setAttachmentError(error.message),
  });

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedBody = body.trim();
    if (!trimmedBody || commentMutation.isPending) return;
    commentMutation.mutate(trimmedBody);
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) {
      setAttachmentError("Files must be 25 MB or smaller.");
      event.target.value = "";
      return;
    }
    uploadMutation.mutate(file);
    event.target.value = "";
  }

  const detail = data ?? null;
  const assignee = detail?.assignee ?? task.assignee;

  return (
    <div
      aria-label={`Task details for ${task.title}`}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#0F172A]/35 p-0 sm:items-center sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="dialog"
    >
      <section className="flex max-h-[92svh] w-full max-w-4xl flex-col overflow-hidden rounded-t-xl border border-[#CBD5E1] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.2)] sm:rounded-xl">
        <header className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] px-5 py-4 sm:px-7">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
              Task detail
            </p>
            <h2 className="mt-2 truncate text-lg font-semibold text-[#0F172A]">
              {detail?.title ?? task.title}
            </h2>
          </div>
          <Button
            aria-label="Close task details"
            className="size-8 shrink-0 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            onClick={onClose}
            size="icon-sm"
            title="Close task details"
            type="button"
            variant="ghost"
          >
            <X aria-hidden="true" />
          </Button>
        </header>

        <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]">
          <section className="border-b border-[#E2E8F0] px-5 py-5 sm:px-7 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748B]">
              Overview
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#475569]">
              {detail?.description || "No description added yet."}
            </p>

            <dl className="mt-7 space-y-4 text-sm">
              <div className="flex items-start justify-between gap-4 border-t border-[#F1F5F9] pt-4">
                <dt className="text-[#64748B]">Column</dt>
                <dd className="text-right font-medium text-[#0F172A]">
                  {detail?.column.name ?? "Loading"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-[#F1F5F9] pt-4">
                <dt className="text-[#64748B]">Assignee</dt>
                <dd className="text-right font-medium text-[#0F172A]">
                  {assignee?.name ?? "Unassigned"}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-[#F1F5F9] pt-4">
                <dt className="text-[#64748B]">Priority</dt>
                <dd className="text-right font-medium text-[#0F172A]">
                  {detail?.priority ?? task.priority}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-[#F1F5F9] pt-4">
                <dt className="text-[#64748B]">Due date</dt>
                <dd className="text-right font-medium text-[#0F172A]">
                  {detail?.dueDate
                    ? new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                      }).format(new Date(detail.dueDate))
                    : "No due date"}
                </dd>
              </div>
            </dl>

            {members.length > 0 ? (
              <p className="mt-7 text-xs leading-5 text-[#94A3B8]">
                Use Edit task details to update the task or change its assignee.
              </p>
            ) : null}

            {isEditing ? (
              <div className="mt-7 border-t border-[#E2E8F0] pt-5">
                <EditTaskForm
                  members={members}
                  onCancel={() => setIsEditing(false)}
                  onSave={async (taskId, input) => {
                    await onEditTask(taskId, input);
                    setIsEditing(false);
                    void queryClient.invalidateQueries({ queryKey });
                  }}
                  task={detail ?? task}
                />
              </div>
            ) : (
              <div className="mt-7 border-t border-[#E2E8F0] pt-5">
                <Button
                  className="w-full sm:w-auto"
                  onClick={() => setIsEditing(true)}
                  type="button"
                  variant="outline"
                >
                  Edit task details
                </Button>
              </div>
            )}

            <div className="mt-7 border-t border-[#E2E8F0] pt-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Paperclip
                    aria-hidden="true"
                    className="size-4 text-[#004BB0]"
                  />
                  <h3 className="text-sm font-semibold text-[#0F172A]">
                    Attachments
                  </h3>
                </div>
                <input
                  accept="*/*"
                  className="sr-only"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  type="file"
                />
                <Button
                  disabled={uploadMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Upload aria-hidden="true" />
                  {uploadMutation.isPending ? "Uploading" : "Attach"}
                </Button>
              </div>
              {attachmentError ? (
                <p className="mt-2 text-xs text-[#B91C1C]">{attachmentError}</p>
              ) : attachmentMessage ? (
                <p className="mt-2 text-xs text-[#047857]">
                  {attachmentMessage}
                </p>
              ) : null}
              {detail?.attachments.length ? (
                <ul className="mt-3 divide-y divide-[#F1F5F9] border-y border-[#F1F5F9]">
                  {detail.attachments.map((attachment) => (
                    <li
                      className="flex items-center justify-between gap-3 py-3"
                      key={attachment.id}
                    >
                      <div className="min-w-0">
                        <a
                          className="block truncate text-xs font-medium text-[#004BB0] hover:underline"
                          href={attachment.fileUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          {attachment.fileName}
                        </a>
                        <p className="mt-1 text-[11px] text-[#94A3B8]">
                          {formatFileSize(attachment.fileSize)} -{" "}
                          {attachment.uploadedBy.name}
                        </p>
                      </div>
                      {attachment.uploadedBy.id === currentUserId ? (
                        <Button
                          aria-label={`Delete ${attachment.fileName}`}
                          className="size-7 shrink-0 text-[#94A3B8] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                          disabled={deleteAttachmentMutation.isPending}
                          onClick={() => {
                            if (
                              !window.confirm(`Delete ${attachment.fileName}?`)
                            )
                              return;
                            deleteAttachmentMutation.mutate(attachment.id);
                          }}
                          size="icon-sm"
                          title={`Delete ${attachment.fileName}`}
                          type="button"
                          variant="ghost"
                        >
                          <Trash2 aria-hidden="true" />
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-[#94A3B8]">
                  No files attached.
                </p>
              )}
            </div>
          </section>

          <section className="flex min-h-0 flex-col px-5 py-5 sm:px-7">
            <div className="flex items-center gap-2">
              <MessageCircle
                aria-hidden="true"
                className="size-4 text-[#004BB0]"
              />
              <h3 className="text-sm font-semibold text-[#0F172A]">Comments</h3>
              {detail ? (
                <span className="rounded-full bg-[#F1F5F9] px-2 py-0.5 text-[11px] font-semibold text-[#64748B]">
                  {detail.comments.length}
                </span>
              ) : null}
            </div>

            <div className="mt-4 min-h-36 flex-1">
              {isLoading ? (
                <p className="text-sm text-[#64748B]">Loading comments...</p>
              ) : isError ? (
                <p className="text-sm text-[#B91C1C]">
                  We could not load the comments. Close and try again.
                </p>
              ) : detail?.comments.length ? (
                <ul>
                  {detail.comments.map((comment) => (
                    <CommentItem comment={comment} key={comment.id} />
                  ))}
                </ul>
              ) : (
                <div className="border border-dashed border-[#CBD5E1] px-4 py-8 text-center">
                  <p className="text-sm font-medium text-[#475569]">
                    No comments yet.
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[#94A3B8]">
                    Add the first update for the team.
                  </p>
                </div>
              )}
            </div>

            <form
              className="mt-5 border-t border-[#E2E8F0] pt-5"
              onSubmit={handleSubmit}
            >
              <Label htmlFor={`comment-${taskId}`}>Add a comment</Label>
              <textarea
                aria-describedby={
                  commentMutation.error ? `comment-error-${taskId}` : undefined
                }
                className="mt-2 min-h-24 w-full resize-y rounded-lg border border-[#CBD5E1] bg-white px-3 py-2 text-sm leading-6 text-[#0F172A] outline-none transition-colors placeholder:text-[#94A3B8] focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20"
                id={`comment-${taskId}`}
                maxLength={2000}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Share an update with the team..."
                value={body}
              />
              {commentMutation.error ? (
                <p
                  className="mt-2 text-xs text-[#B91C1C]"
                  id={`comment-error-${taskId}`}
                >
                  {commentMutation.error.message}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end">
                <Button
                  disabled={!body.trim() || commentMutation.isPending}
                  type="submit"
                >
                  {commentMutation.isPending ? "Adding" : "Add comment"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      </section>
    </div>
  );
}
