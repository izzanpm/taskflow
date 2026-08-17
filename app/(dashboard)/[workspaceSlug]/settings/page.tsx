import Link from "next/link";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { NotificationBadge } from "@/components/notifications/NotificationBadge";
import { WorkspaceSettingsPanel } from "@/components/workspace/WorkspaceSettingsPanel";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type {
  WorkspaceInviteSummary,
  WorkspaceMemberSummary,
} from "@/types/workspace";

export const metadata = {
  title: "Workspace settings | TaskFlow",
  description: "Manage TaskFlow workspace members and access.",
};

export default async function WorkspaceSettingsPage(
  props: PageProps<"/[workspaceSlug]/settings">,
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
          id: true,
          userId: true,
          role: true,
          user: { select: { name: true, email: true, avatarUrl: true } },
        },
      },
      invites: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          role: true,
          expiresAt: true,
        },
      },
    },
  });

  if (!workspace) notFound();

  const currentMember = workspace.members.find(
    (member) => member.userId === session.user.id,
  );

  if (!currentMember) redirect("/workspaces");

  const members: WorkspaceMemberSummary[] = workspace.members;
  const pendingInvites: WorkspaceInviteSummary[] = workspace.invites.map(
    (invite) => ({ ...invite, expiresAt: invite.expiresAt.toISOString() }),
  );

  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
          <div className="flex items-center gap-4">
            <Link
              className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#004BB0] transition-colors hover:text-[#033476] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
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
              className="max-w-40 truncate text-sm text-[#64748B] transition-colors hover:text-[#004BB0] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
              href={`/${workspace.slug}/boards`}
            >
              {workspace.name}
            </Link>
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

        <section className="py-12 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-[#004BB0]">Workspace</p>
            <h1 className="mt-3 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
              {workspace.name} settings.
            </h1>
            <p className="mt-4 max-w-[52ch] text-base leading-7 text-[#64748B]">
              Keep the right people close to the work and the right access in
              place.
            </p>
          </div>

          <div className="mt-10">
            <WorkspaceSettingsPanel
              currentUserId={session.user.id}
              isAdmin={currentMember.role === "ADMIN"}
              members={members}
              pendingInvites={pendingInvites}
              workspaceId={workspace.id}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
