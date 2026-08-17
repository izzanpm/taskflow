"use client";

import { useState } from "react";
import { Check, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { WorkspaceMemberSummary, WorkspaceRole } from "@/types/workspace";

type WorkspaceMembersListProps = {
  workspaceId: string;
  currentUserId: string;
  isAdmin: boolean;
  initialMembers: WorkspaceMemberSummary[];
};

type MemberResponse = {
  data?: WorkspaceMemberSummary;
  error?: string;
};

export function WorkspaceMembersList({
  workspaceId,
  currentUserId,
  isAdmin,
  initialMembers,
}: WorkspaceMembersListProps) {
  const [members, setMembers] = useState(initialMembers);
  const [busyMemberId, setBusyMemberId] = useState("");
  const [confirmMemberId, setConfirmMemberId] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function updateRole(memberId: string, role: WorkspaceRole) {
    setErrorMessage("");
    setBusyMemberId(memberId);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        },
      );
      const result = (await response.json()) as MemberResponse;

      if (!response.ok || !result.data) {
        setErrorMessage(result.error ?? "We could not update this member.");
        return;
      }

      setMembers((current) =>
        current.map((member) =>
          member.id === memberId
            ? { ...member, role: result.data?.role ?? role }
            : member,
        ),
      );
    } catch {
      setErrorMessage("We could not update this member. Please try again.");
    } finally {
      setBusyMemberId("");
    }
  }

  async function removeMember(memberId: string) {
    setErrorMessage("");
    setBusyMemberId(memberId);

    try {
      const response = await fetch(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as { error?: string };

      if (!response.ok) {
        setErrorMessage(result.error ?? "We could not remove this member.");
        return;
      }

      setMembers((current) =>
        current.filter((member) => member.id !== memberId),
      );
      setConfirmMemberId("");
    } catch {
      setErrorMessage("We could not remove this member. Please try again.");
    } finally {
      setBusyMemberId("");
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {members.length === 0 ? (
        <div className="border border-dashed border-[#CBD5E1] px-4 py-8 text-center">
          <UserRound
            aria-hidden="true"
            className="mx-auto size-5 text-[#94A3B8]"
          />
          <p className="mt-3 text-sm font-semibold text-[#0F172A]">
            No members yet.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E2E8F0] border-y border-[#E2E8F0]">
          {members.map((member) => {
            const isCurrentUser = member.userId === currentUserId;
            const isBusy = busyMemberId === member.id;

            return (
              <li
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                key={member.id}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0FB] text-xs font-semibold text-[#004BB0]">
                    {member.user.name.trim().slice(0, 1).toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#0F172A]">
                      {member.user.name}
                      {isCurrentUser ? (
                        <span className="ml-2 text-xs font-normal text-[#64748B]">
                          You
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-[#64748B]">
                      {member.user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:shrink-0">
                  {isAdmin ? (
                    <select
                      aria-label={`Role for ${member.user.name}`}
                      className="h-9 min-w-24 rounded-lg border border-[#CBD5E1] bg-white px-2.5 text-xs text-[#0F172A] outline-none focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20 disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:text-[#94A3B8]"
                      disabled={isCurrentUser || isBusy}
                      onChange={(event) =>
                        updateRole(
                          member.id,
                          event.target.value as WorkspaceRole,
                        )
                      }
                      value={member.role}
                    >
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  ) : (
                    <span className="text-xs font-medium text-[#64748B]">
                      {member.role === "ADMIN" ? "Admin" : "Member"}
                    </span>
                  )}

                  {isAdmin && !isCurrentUser ? (
                    confirmMemberId === member.id ? (
                      <div className="flex items-center gap-1">
                        <Button
                          className="h-9 px-2.5 text-xs text-[#991B1B] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                          disabled={isBusy}
                          onClick={() => removeMember(member.id)}
                          type="button"
                          variant="ghost"
                        >
                          <Check aria-hidden="true" />
                          Confirm
                        </Button>
                        <Button
                          className="h-9 px-2.5 text-xs text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                          onClick={() => setConfirmMemberId("")}
                          type="button"
                          variant="ghost"
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        aria-label={`Remove ${member.user.name}`}
                        className="h-9 px-2.5 text-xs text-[#991B1B] hover:bg-[#FEF2F2] hover:text-[#991B1B]"
                        onClick={() => setConfirmMemberId(member.id)}
                        title={`Remove ${member.user.name}`}
                        type="button"
                        variant="ghost"
                      >
                        <Trash2 aria-hidden="true" />
                        Remove
                      </Button>
                    )
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
