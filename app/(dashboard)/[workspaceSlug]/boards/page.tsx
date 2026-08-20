import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { BoardListClient } from "@/components/board/BoardListClient";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { auth } from "@/lib/auth";
import { getWorkspaceBoards } from "@/lib/boards";
import { db } from "@/lib/db";

export const metadata = {
  title: "Boards | TaskFlow",
  description: "Choose a TaskFlow board and keep the work moving.",
};

export default async function BoardListPage(
  props: PageProps<"/[workspaceSlug]/boards">,
) {
  const { workspaceSlug } = await props.params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const workspace = await db.workspace.findUnique({
    where: { slug: workspaceSlug },
    select: {
      id: true,
      name: true,
      slug: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!workspace) notFound();

  const currentMember = workspace.members.find(
    (member) => member.userId === session.user.id,
  );
  if (!currentMember) redirect("/workspaces");

  const adminContact =
    workspace.members.find((member) => member.role === "ADMIN")?.user ?? null;
  const boards = await getWorkspaceBoards(workspace.id);

  return (
    <main className="min-h-svh bg-taskflow-canvas px-5 py-6 text-taskflow-ink sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1200px]">
        <header className="flex items-center justify-between border-b border-taskflow-border pb-5">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <Link
              className="flex shrink-0 items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-taskflow-brand transition-colors hover:text-taskflow-brand-hover focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taskflow-brand/60"
              href="/workspaces"
            >
              <span
                aria-hidden="true"
                className="size-2 rounded-full bg-taskflow-brand"
              />
              TaskFlow
            </Link>
            <span aria-hidden="true" className="text-taskflow-border-strong">
              /
            </span>
            <Link
              className="truncate text-sm text-taskflow-muted transition-colors hover:text-taskflow-brand focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taskflow-brand/60"
              href={`/${workspace.slug}/settings`}
            >
              {workspace.name}
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBadge />
            <Link
              className="hidden text-sm font-medium text-taskflow-muted transition-colors hover:text-taskflow-brand focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taskflow-brand/60 sm:inline"
              href="/settings/profile"
            >
              Profile
            </Link>
            <LogoutButton />
          </div>
        </header>

        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-taskflow-ink sm:text-5xl">
              {workspace.name} boards.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-7 text-taskflow-muted">
              Choose a board to see the work in motion, or create a focused
              space for the next project.
            </p>
          </div>

          <BoardListClient
            adminContact={adminContact}
            initialBoards={boards}
            isAdmin={currentMember.role === "ADMIN"}
            workspaceId={workspace.id}
            workspaceSlug={workspace.slug}
          />
        </section>
      </div>
    </main>
  );
}
