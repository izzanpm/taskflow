import Link from "next/link";
import { ArrowRight, Building2, Plus } from "lucide-react";

import type { WorkspaceSummary } from "@/types/workspace";

export function WorkspaceList({
  workspaces,
}: {
  workspaces: WorkspaceSummary[];
}) {
  if (workspaces.length === 0) {
    return (
      <section className="border border-dashed border-[#CBD5E1] px-6 py-14 text-center">
        <Building2
          aria-hidden="true"
          className="mx-auto size-7 text-[#94A3B8]"
        />
        <h2 className="mt-4 text-base font-semibold text-[#0F172A]">
          No workspaces yet.
        </h2>
        <p className="mx-auto mt-2 max-w-[38ch] text-sm leading-6 text-[#64748B]">
          Create a workspace to give your team a shared home for projects and
          tasks.
        </p>
        <Link
          className="mx-auto mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#004BB0] px-3 text-sm font-medium text-white transition-colors hover:bg-[#033476] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/30"
          href="/workspaces/new"
        >
          <Plus aria-hidden="true" />
          Add workspace
        </Link>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      {workspaces.map((workspace) => (
        <Link
          className="group flex flex-col gap-5 border border-[#E2E8F0] bg-white p-5 transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-[#CBD5E1] hover:shadow-[0_8px_24px_rgba(15,23,42,0.07)] focus-visible:border-[#004BB0] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/20 sm:flex-row sm:items-center sm:justify-between sm:p-6"
          href={`/${workspace.slug}/boards`}
          key={workspace.id}
        >
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FB] text-[#004BB0]">
              <Building2 aria-hidden="true" className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-[#0F172A]">
                {workspace.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B]">
                <span>Host: {workspace.host?.name ?? "Workspace admin"}</span>
                <span
                  aria-hidden="true"
                  className="hidden text-[#CBD5E1] sm:inline"
                >
                  /
                </span>
                <span
                  className={`rounded-full px-2 py-1 font-semibold ${workspace.role === "ADMIN" ? "bg-[#E8F0FB] text-[#004BB0]" : "bg-[#F1F5F9] text-[#475569]"}`}
                >
                  Your role: {workspace.role === "ADMIN" ? "Admin" : "Member"}
                </span>
              </div>
            </div>
          </div>
          <ArrowRight
            aria-hidden="true"
            className="ml-14 size-5 shrink-0 text-[#94A3B8] transition-transform group-hover:translate-x-0.5 group-hover:text-[#004BB0] sm:ml-4"
          />
        </Link>
      ))}

      <Link
        className="flex min-h-14 items-center justify-center gap-2 border border-dashed border-[#CBD5E1] px-4 text-sm font-medium text-[#004BB0] transition-colors hover:border-[#004BB0] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#004BB0]/20"
        href="/workspaces/new"
      >
        <Plus aria-hidden="true" />
        Add another workspace
      </Link>
    </div>
  );
}
