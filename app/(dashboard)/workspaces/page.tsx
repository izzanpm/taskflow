import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { WorkspaceList } from "@/components/workspace/WorkspaceList";
import { auth } from "@/lib/auth";
import { getUserWorkspaces } from "@/lib/workspaces";

export const metadata = {
  title: "Workspaces | TaskFlow",
  description: "Choose a TaskFlow workspace and keep the work moving.",
};

export default async function WorkspacesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const workspaces = await getUserWorkspaces(session.user.id);

  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
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
          <div className="flex items-center gap-3">
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
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <h1 className="font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
                Choose your workspace.
              </h1>
              <p className="mt-4 max-w-[52ch] text-base leading-7 text-[#64748B]">
                Pick the team space you want to work in, or start another one
                for a new project.
              </p>
            </div>
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm font-medium text-[#0F172A] transition-colors hover:border-[#004BB0] hover:text-[#004BB0] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/20"
              href="/workspaces/new"
            >
              <Plus aria-hidden="true" />
              Add workspace
            </Link>
          </div>

          <div className="mt-10">
            <WorkspaceList workspaces={workspaces} />
          </div>
        </section>
      </div>
    </main>
  );
}
