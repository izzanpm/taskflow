import { NextResponse } from "next/server";

import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { sendWorkspaceInviteEmail } from "@/lib/email";
import { createInviteToken, getInviteExpiry } from "@/lib/invites";
import { consumeRateLimit } from "@/lib/rate-limit";
import { db } from "@/lib/db";
import { createInviteSchema } from "@/lib/validation";
import { isUniqueConstraintError } from "@/lib/workspaces";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The invite request was not valid JSON." },
      { status: 400 },
    );
  }

  const result = createInviteSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Check the invite details." },
      { status: 400 },
    );
  }

  try {
    const { session } = await requireRole(
      request.headers,
      result.data.workspaceId,
      ["ADMIN"],
    );

    if (
      !consumeRateLimit(`invite:${session.user.id}:${result.data.workspaceId}`)
    ) {
      return NextResponse.json(
        { error: "Too many invites. Please wait a minute and try again." },
        { status: 429 },
      );
    }

    const existingMember = await db.workspaceMember.findFirst({
      where: {
        workspaceId: result.data.workspaceId,
        user: { email: result.data.email },
      },
      select: { id: true },
    });

    if (existingMember) {
      return NextResponse.json(
        { error: "This person is already a member of the workspace." },
        { status: 409 },
      );
    }

    const pendingInvite = await db.invite.findFirst({
      where: {
        workspaceId: result.data.workspaceId,
        email: result.data.email,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (pendingInvite) {
      return NextResponse.json(
        { error: "An active invite already exists for this email address." },
        { status: 409 },
      );
    }

    const invite = await db.invite.create({
      data: {
        workspaceId: result.data.workspaceId,
        email: result.data.email,
        role: result.data.role,
        token: createInviteToken(),
        invitedById: session.user.id,
        expiresAt: getInviteExpiry(),
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
      },
    });
    const workspace = await db.workspace.findUnique({
      where: { id: result.data.workspaceId },
      select: { name: true },
    });
    const inviteUrl = new URL(
      `/invite/${invite.token}`,
      request.url,
    ).toString();
    const emailResult = workspace
      ? await sendWorkspaceInviteEmail({
          to: invite.email,
          workspaceName: workspace.name,
          inviterName: session.user.name,
          inviteUrl,
          role: invite.role,
          expiresAt: invite.expiresAt,
        })
      : { sent: false as const, status: "provider-error" as const };

    return NextResponse.json(
      {
        data: {
          ...invite,
          inviteUrl,
          emailSent: emailResult.sent,
          emailStatus: emailResult.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    const authorizationResponse = authorizationErrorResponse(error);
    if (authorizationResponse) return authorizationResponse;

    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "An invite for this email was created already." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "We could not create the invite. Please try again." },
      { status: 500 },
    );
  }
}
