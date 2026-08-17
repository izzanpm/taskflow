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
  "h-11 rounded-lg border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:border-[#004BB0] focus-visible:ring-[#004BB0]/20";

export function BoardListClient({
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
      <section aria-labelledby="boards-heading">
        <div className="flex items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <h2
              className="text-lg font-semibold text-[#0F172A]"
              id="boards-heading"
            >
              Boards
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              {boards.length === 1 ? "1 board" : `${boards.length} boards`}
            </p>
          </div>
          <LayoutGrid aria-hidden="true" className="size-5 text-[#94A3B8]" />
        </div>

        {boards.length > 0 ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {boards.map((board) => (
              <Link
                className="group flex min-h-32 flex-col justify-between border border-[#E2E8F0] bg-white p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] focus-visible:border-[#004BB0] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/20"
                href={`/${workspaceSlug}/boards/${board.id}`}
                key={board.id}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-base font-semibold leading-6 text-[#0F172A]">
                    {board.name}
                  </span>
                  <ArrowRight
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#004BB0]"
                  />
                </div>
                <span className="text-xs text-[#64748B]">
                  {board.columnCount === 1
                    ? "1 column"
                    : `${board.columnCount} columns`}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-4 border border-dashed border-[#CBD5E1] px-6 py-12 text-center">
            <LayoutGrid
              aria-hidden="true"
              className="mx-auto size-6 text-[#94A3B8]"
            />
            <h3 className="mt-4 text-sm font-semibold text-[#0F172A]">
              No boards yet.
            </h3>
            <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-[#64748B]">
              {isAdmin
                ? "Create the first board to give this workspace a place for work to land."
                : "Ask a workspace admin to create the first board."}
            </p>
          </div>
        )}
      </section>

      {isAdmin ? (
        <section className="h-fit border border-[#E2E8F0] bg-white p-5 sm:p-6">
          <div className="flex size-10 items-center justify-center rounded-lg bg-[#E8F0FB] text-[#004BB0]">
            <Plus aria-hidden="true" className="size-5" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-[#0F172A]">
            New board
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            Start a focused space for a project, team, or workflow.
          </p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-2">
              <Label className="text-[#0F172A]" htmlFor="board-name">
                Board name
              </Label>
              <Input
                autoComplete="off"
                autoFocus={boards.length === 0}
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
                className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
                ref={errorRef}
                role="alert"
                tabIndex={-1}
              >
                {errorMessage}
              </p>
            ) : null}

            <Button
              className="h-11 w-full rounded-lg bg-[#004BB0] text-sm text-white hover:bg-[#033476]"
              disabled={isSubmitting}
              type="submit"
            >
              {isSubmitting ? "Creating board..." : "Create board"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
        </section>
      ) : (
        <aside className="h-fit border border-[#E2E8F0] bg-white p-5 sm:p-6">
          <LockKeyhole aria-hidden="true" className="size-5 text-[#64748B]" />
          <h2 className="mt-4 text-base font-semibold text-[#0F172A]">
            Board access
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#64748B]">
            You can open and work in these boards. Board creation is managed by
            workspace admins.
          </p>
        </aside>
      )}
    </div>
  );
}
