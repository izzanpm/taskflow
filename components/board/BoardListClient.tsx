"use client";

import Link from "next/link";
import { type FormEvent, useRef, useState } from "react";
import { ArrowRight, LayoutGrid, LockKeyhole, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { BoardSummary } from "@/types/board";

type BoardListClientProps = {
  adminContact: { name: string; email: string } | null;
  initialBoards: BoardSummary[];
  isAdmin: boolean;
  workspaceId: string;
  workspaceSlug: string;
};

type BoardResponse = {
  data?: BoardSummary;
  error?: string;
};

const inputClassName =
  "h-11 rounded-lg border-taskflow-border-strong bg-taskflow-surface px-3 text-sm text-taskflow-ink placeholder:text-taskflow-muted-light focus-visible:border-taskflow-brand focus-visible:ring-taskflow-brand/60";

const boardDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeZone: "UTC",
});

export function BoardListClient({
  adminContact,
  initialBoards,
  isAdmin,
  workspaceId,
  workspaceSlug,
}: BoardListClientProps) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const errorRef = useRef<HTMLParagraphElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setErrorMessage("Give your board a name with at least 2 characters.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });
      const result = (await response.json()) as BoardResponse;

      if (!response.ok || !result.data) {
        setErrorMessage(result.error ?? "We could not create the board.");
        return;
      }

      setBoards((current) => [result.data as BoardSummary, ...current]);
      router.push(`/${workspaceSlug}/boards/${result.data.id}`);
    } catch {
      setErrorMessage("We could not create the board. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <section
        aria-labelledby="boards-heading"
        className={
          isAdmin && boards.length === 0 ? "order-2 lg:order-1" : undefined
        }
      >
        <div className="flex items-end justify-between gap-4 border-b border-taskflow-border pb-4">
          <div>
            <h2
              className="text-lg font-semibold text-taskflow-ink"
              id="boards-heading"
            >
              Boards
            </h2>
            <p className="mt-1 text-sm text-taskflow-muted">
              {boards.length === 1 ? "1 board" : `${boards.length} boards`}
            </p>
          </div>
          <LayoutGrid
            aria-hidden="true"
            className="size-5 text-taskflow-muted-light"
          />
        </div>

        {boards.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {boards.map((board) => (
              <Link
                className="group flex min-h-32 flex-col justify-between border border-taskflow-border bg-taskflow-surface p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-taskflow-border-strong hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] focus-visible:border-taskflow-brand focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-taskflow-brand/60"
                href={`/${workspaceSlug}/boards/${board.id}`}
                key={board.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="min-w-0 break-words text-base font-semibold leading-6 text-taskflow-ink">
                    {board.name}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-taskflow-muted-light transition-transform group-hover:translate-x-0.5 group-hover:text-taskflow-brand"
                  />
                </div>
                <div className="flex items-end justify-between gap-3 text-xs text-taskflow-muted">
                  <span>
                    {board.taskCount === 1
                      ? "1 task"
                      : `${board.taskCount} tasks`}
                  </span>
                  {board.lastActivityAt ? (
                    <time dateTime={board.lastActivityAt}>
                      Updated{" "}
                      {boardDateFormatter.format(
                        new Date(board.lastActivityAt),
                      )}
                    </time>
                  ) : (
                    <span>No task activity yet</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-taskflow-border-strong px-6 py-12 text-center">
            <LayoutGrid
              aria-hidden="true"
              className="mx-auto size-6 text-taskflow-muted-light"
            />
            <h3 className="mt-4 text-sm font-semibold text-taskflow-ink">
              No boards yet.
            </h3>
            {isAdmin ? (
              <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-taskflow-muted">
                Use the new board form to give this workspace a place for work
                to land.
              </p>
            ) : (
              <>
                <p className="mx-auto mt-2 max-w-[34ch] whitespace-normal break-words text-sm leading-6 text-taskflow-muted">
                  {adminContact
                    ? `${adminContact.name} can create the first board for this workspace.`
                    : "Ask a workspace admin to create the first board."}
                </p>
                {adminContact ? (
                  <a
                    className="mt-4 inline-flex min-h-11 max-w-full items-center justify-center rounded-lg px-4 text-sm font-semibold whitespace-normal break-words text-taskflow-brand transition-colors hover:bg-taskflow-blue-subtle hover:text-taskflow-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taskflow-brand/60"
                    href={`mailto:${adminContact.email}`}
                  >
                    <span className="min-w-0 whitespace-normal break-words">
                      Email {adminContact.name}
                    </span>
                  </a>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>

      {isAdmin ? (
        <section
          className={`h-fit border border-taskflow-border bg-taskflow-surface p-5 sm:p-6 ${
            boards.length === 0 ? "order-1 lg:order-2" : ""
          }`}
          id="new-board"
        >
          <h2 className="mt-5 text-lg font-semibold text-taskflow-ink">
            New board
          </h2>
          <p className="mt-2 text-sm leading-6 text-taskflow-muted">
            Start a focused space for a project, team, or workflow.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label className="text-taskflow-ink" htmlFor="board-name">
                Board name
              </Label>
              <Input
                autoComplete="off"
                className={inputClassName}
                id="board-name"
                maxLength={80}
                name="name"
                onChange={(event) => setName(event.target.value)}
                placeholder="Product launch"
                value={name}
              />
            </div>

            {errorMessage ? (
              <p
                aria-live="assertive"
                className="rounded-lg border border-taskflow-danger-border/20 bg-taskflow-danger-surface px-3 py-2.5 text-sm leading-5 text-taskflow-danger"
                ref={errorRef}
                role="alert"
                tabIndex={-1}
              >
                {errorMessage}
              </p>
            ) : null}

            <Button
              className="h-11 w-full rounded-lg bg-taskflow-brand text-sm text-white hover:bg-taskflow-brand-hover focus-visible:border-taskflow-brand focus-visible:ring-taskflow-brand/60"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating board..." : "Create board"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </section>
      ) : (
        <aside className="h-fit border border-taskflow-border bg-taskflow-surface p-5 sm:p-6">
          <LockKeyhole
            aria-hidden="true"
            className="size-5 text-taskflow-muted"
          />
          <h2 className="mt-4 text-base font-semibold text-taskflow-ink">
            Board access
          </h2>
          <p className="mt-2 text-sm leading-6 text-taskflow-muted">
            You can open and work in these boards. Board creation is managed by
            workspace admins.
          </p>
        </aside>
      )}
    </div>
  );
}
