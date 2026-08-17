"use client";

import { type FormEvent, useState } from "react";
import { Check, Copy, MailPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WorkspaceInviteSummary, WorkspaceRole } from "@/types/workspace";

type InviteMemberFormProps = {
  workspaceId: string;
  onInviteCreated: (invite: WorkspaceInviteSummary) => void;
};

type InviteResponse = {
  data?: WorkspaceInviteSummary & { inviteUrl: string };
  error?: string;
};

const inputClassName =
  "h-10 rounded-lg border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus-visible:border-[#004BB0] focus-visible:ring-[#004BB0]/20";
const selectClassName =
  "h-10 w-full rounded-lg border border-[#CBD5E1] bg-white px-3 text-sm text-[#0F172A] outline-none transition-colors focus:border-[#004BB0] focus:ring-3 focus:ring-[#004BB0]/20";

export function InviteMemberForm({
  workspaceId,
  onInviteCreated,
}: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("MEMBER");
  const [inviteUrl, setInviteUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");
    setInviteUrl("");
    setIsCopied(false);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, email, role }),
      });
      const result = (await response.json()) as InviteResponse;

      if (!response.ok || !result.data) {
        setErrorMessage(result.error ?? "We could not create the invite.");
        return;
      }

      setEmail("");
      setInviteUrl(result.data.inviteUrl);
      setMessage("Invite link ready. Share it with your teammate.");
      onInviteCreated(result.data);
    } catch {
      setErrorMessage("We could not create the invite. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function copyInviteUrl() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setIsCopied(true);
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <div className="space-y-2">
          <Label className="text-[#0F172A]" htmlFor="invite-email">
            Teammate email
          </Label>
          <div className="relative">
            <MailPlus
              aria-hidden="true"
              className="pointer-events-none absolute top-3 left-3 size-4 text-[#94A3B8]"
            />
            <Input
              autoComplete="email"
              className={`${inputClassName} pl-9`}
              id="invite-email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="teammate@company.com"
              required
              type="email"
              value={email}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[#0F172A]" htmlFor="invite-role">
            Role
          </Label>
          <select
            className={selectClassName}
            id="invite-role"
            onChange={(event) => setRole(event.target.value as WorkspaceRole)}
            value={role}
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
      </div>

      <p className="text-xs leading-5 text-[#64748B]">
        The link expires in 7 days. Email delivery will be connected in the
        collaboration phase.
      </p>

      {errorMessage ? (
        <p
          aria-live="assertive"
          className="rounded-lg border border-[#B91C1C]/20 bg-[#FEF2F2] px-3 py-2.5 text-sm leading-5 text-[#991B1B]"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      {message ? (
        <div
          aria-live="polite"
          className="space-y-3 rounded-lg border border-[#10B981]/25 bg-[#ECFDF5] p-3 text-sm text-[#047857]"
          role="status"
        >
          <p className="flex items-center gap-2">
            <Check aria-hidden="true" className="size-4 shrink-0" />
            {message}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              aria-label="Invite link"
              className="h-9 border-[#A7F3D0] bg-white text-xs text-[#047857]"
              readOnly
              value={inviteUrl}
            />
            <Button
              className="h-9 shrink-0 border-[#A7F3D0] bg-white text-xs text-[#047857] hover:bg-[#D1FAE5] hover:text-[#047857]"
              onClick={copyInviteUrl}
              type="button"
              variant="outline"
            >
              <Copy aria-hidden="true" />
              {isCopied ? "Copied" : "Copy link"}
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        className="h-10 rounded-lg bg-[#004BB0] px-4 text-sm text-white hover:bg-[#033476]"
        disabled={isSubmitting}
        type="submit"
      >
        <MailPlus aria-hidden="true" />
        {isSubmitting ? "Creating link..." : "Create invite link"}
      </Button>
    </form>
  );
}
