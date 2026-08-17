import Link from "next/link";

import { LogoutButton } from "@/components/auth/LogoutButton";
import { CreateWorkspaceForm } from "@/components/workspace/CreateWorkspaceForm";

export const metadata = {
  title: "Create workspace | TaskFlow",
  description: "Create a workspace for your TaskFlow team.",
};

export default function CreateWorkspacePage() {
  return (
    <main className="min-h-svh bg-[#F9F8F6] px-5 py-6 text-[#0F172A] sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between border-b border-[#E2E8F0] pb-5">
          <Link
            className="flex items-center gap-2 text-sm font-semibold tracking-[-0.02em] text-[#004BB0] transition-colors hover:text-[#033476] focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#004BB0]/30"
            href="/settings/profile"
          >
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-[#004BB0]"
            />
            TaskFlow
          </Link>
          <LogoutButton />
        </header>

        <section className="mx-auto max-w-xl py-16 sm:py-24">
          <p className="text-sm font-semibold text-[#004BB0]">Get started</p>
          <h1 className="mt-3 font-[family-name:var(--font-instrument-serif)] text-4xl font-normal tracking-[-0.02em] text-[#0F172A] sm:text-5xl">
            Create your workspace.
          </h1>
          <p className="mt-4 max-w-[48ch] text-base leading-7 text-[#64748B]">
            Give your team a home for projects, tasks, and the work that keeps
            moving.
          </p>

          <div className="mt-10 border border-[#E2E8F0] bg-white p-5 sm:p-7">
            <CreateWorkspaceForm />
          </div>
        </section>
      </div>
    </main>
  );
}
