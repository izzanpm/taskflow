import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { BoardPageClient } from "@/components/board/BoardPageClient";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { auth } from "@/lib/auth";
import { getBoardDetails } from "@/lib/board";
import { toBoardView } from "@/lib/board-view";

export const metadata = {
  title: "Board | TaskFlow",
  description: "Move TaskFlow work from idea to done.",
};

export default async function BoardPage(
  props: PageProps<"/[workspaceSlug]/boards/[boardId]">,
) {
  const { workspaceSlug, boardId } = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const board = await getBoardDetails(boardId);
  if (!board || board.workspace.slug !== workspaceSlug) notFound();

  const currentMember = board.workspace.members.find(
    (member) => member.userId === session.user.id,
  );
  if (!currentMember) redirect("/workspaces");

  const boardView = toBoardView(board, session.user.id);

  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1440px]">
        <header className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#004BB0] transition-colors hover:text-[#033476] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
              href="/workspaces"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-[#004BB0]"
              />
              TaskFlow
            </Link>
            <span aria-hidden="true" className="text-[#CBD5E1]">
              /
            </span>
            <Link
              className="hidden truncate text-sm text-[#64748B] transition-colors hover:text-[#004BB0] sm:inline"
              href={`/${board.workspace.slug}/boards`}
            >
              {board.workspace.name}
            </Link>
            <span
              aria-hidden="true"
              className="hidden text-[#CBD5E1] sm:inline"
            >
              /
            </span>
            <span className="truncate text-sm font-medium text-[#0F172A]">
              {board.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBadge />
            <Link
              className="hidden text-sm font-medium text-[#64748B] transition-colors hover:text-[#004BB0] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30 sm:inline"
              href="/settings/profile"
            >
              Profile
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="py-10 sm:py-14">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-[#004BB0]">
                Kanban board
              </p>
              <h1 className="mt-3 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
                {board.name}.
              </h1>
              <p className="mt-4 max-w-[56ch] text-base leading-7 text-[#64748B]">
                A clear view of the work, with enough room for the details that
                keep your team moving.
              </p>
            </div>
            <Link
              className="text-sm font-medium text-[#64748B] transition-colors hover:text-[#004BB0] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
              href={`/${board.workspace.slug}/settings`}
            >
              Workspace settings
            </Link>
          </div>

          <div className="mt-10">
            <BoardPageClient initialBoard={boardView} />
          </div>
        </section>
      </div>
    </main>
  );
}
