"use client";

import { useState } from "react";
import { ShieldCheck, Users } from "lucide-react";

import { InviteMemberForm } from "@/components/workspace/InviteMemberForm";
import { DeleteWorkspaceButton } from "@/components/workspace/DeleteWorkspaceButton";
import { WorkspaceMembersList } from "@/components/workspace/WorkspaceMembersList";
import type {
  WorkspaceInviteSummary,
  WorkspaceMemberSummary,
} from "@/types/workspace";

type WorkspaceSettingsPanelProps = {
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
  members: WorkspaceMemberSummary[];
  pendingInvites: WorkspaceInviteSummary[];
};

export function WorkspaceSettingsPanel({
  workspaceId,
  currentUserId,
  isAdmin,
  members: initialMembers,
  pendingInvites: initialInvites,
}: WorkspaceSettingsPanelProps) {
  const [pendingInvites, setPendingInvites] = useState(initialInvites);

  function handleInviteCreated(invite: WorkspaceInviteSummary) {
    setPendingInvites((current) => [invite, ...current]);
  }

  return (
    <div className="space-y-6">
      {isAdmin ? (
        <section className="border border-[#E2E8F0] bg-white p-5 sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#E8F0FB] text-[#004BB0]">
              <Users aria-hidden="true" className="size-4" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-[#0F172A]">
                Invite a teammate
              </h2>
              <p className="mt-1 text-sm leading-6 text-[#64748B]">
                Create a secure link for someone to join this workspace.
              </p>
            </div>
          </div>
          <InviteMemberForm
            onInviteCreated={handleInviteCreated}
            workspaceId={workspaceId}
          />
        </section>
      ) : null}

      <section className="border border-[#E2E8F0] bg-white p-5 sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#F1F5F9] text-[#475569]">
            <ShieldCheck aria-hidden="true" className="size-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[#0F172A]">Members</h2>
            <p className="mt-1 text-sm leading-6 text-[#64748B]">
              {isAdmin
                ? "Manage who can access this workspace and what they can do."
                : "See the people who have access to this workspace."}
            </p>
          </div>
        </div>
        <WorkspaceMembersList
          currentUserId={currentUserId}
          initialMembers={initialMembers}
          isAdmin={isAdmin}
          workspaceId={workspaceId}
        />

        {pendingInvites.length > 0 ? (
          <div className="mt-8 border-t border-[#E2E8F0] pt-6">
            <p className="text-xs font-semibold tracking-[0.08em] text-[#64748B] uppercase">
              Pending invites
            </p>
            <ul className="mt-3 divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
              {pendingInvites.map((invite) => (
                <li
                  className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                  key={invite.id}
                >
                  <span className="break-all text-[#0F172A]">
                    {invite.email}
                  </span>
                  <span className="text-xs text-[#64748B]">
                    {invite.role === "ADMIN" ? "Admin" : "Member"} · expires in
                    {` ${new Date(invite.expiresAt).toLocaleDateString()}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {isAdmin ? (
        <section className="border border-[#FECACA] bg-[#FFF7F7] p-5 sm:p-7">
          <h2 className="text-lg font-semibold text-[#7F1D1D]">Danger zone</h2>
          <p className="mt-1 text-sm leading-6 text-[#991B1B]">
            This action cannot be undone.
          </p>
          <div className="mt-5">
            <DeleteWorkspaceButton workspaceId={workspaceId} />
          </div>
        </section>
      ) : null}
    </div>
  );
}
