import "server-only";

import { Resend } from "resend";

import { WorkspaceInviteEmail } from "@/emails/WorkspaceInviteEmail";

type SendInviteEmailInput = {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
  role: "ADMIN" | "MEMBER";
  expiresAt: Date;
};

export type InviteEmailResult =
  | { sent: true; status: "sent" }
  | { sent: false; status: "not-configured" | "provider-error" };

export async function sendWorkspaceInviteEmail(
  input: SendInviteEmailInput,
): Promise<InviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { sent: false, status: "not-configured" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from,
      react: WorkspaceInviteEmail(input),
      subject: `You are invited to ${input.workspaceName} on TaskFlow`,
      to: [input.to],
    });

    if (error) return { sent: false, status: "provider-error" };
    return { sent: true, status: "sent" };
  } catch {
    return { sent: false, status: "provider-error" };
  }
}
