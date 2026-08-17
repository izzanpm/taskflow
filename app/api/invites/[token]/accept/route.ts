import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isInviteExpired } from "@/lib/invites";
import { acceptInviteSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "You need to be signed in to accept an invite." },
      { status: 401 },
    );
  }

  const { token } = await params;
  const tokenResult = acceptInviteSchema.safeParse({ token });

  if (!tokenResult.success) {
    return NextResponse.json(
      { error: "Invite token is invalid." },
      { status: 400 },
    );
  }

  const invite = await db.invite.findUnique({
    where: { token: tokenResult.data.token },
    select: {
      id: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      workspaceId: true,
      workspace: { select: { slug: true, name: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  if (invite.acceptedAt) {
    return NextResponse.json(
      { error: "This invite has already been accepted." },
      { status: 409 },
    );
  }

  if (isInviteExpired(invite.expiresAt)) {
    return NextResponse.json(
      { error: "This invite has expired. Ask an admin for a new link." },
      { status: 410 },
    );
  }

  if (session.user.email.toLowerCase() !== invite.email.toLowerCase()) {
    return NextResponse.json(
      { error: "Sign in with the email address this invite was sent to." },
      { status: 403 },
    );
  }

  try {
    const membership = await db.$transaction(async (transaction) => {
      const existingMembership = await transaction.workspaceMember.findUnique({
        where: {
          userId_workspaceId: {
            userId: session.user.id,
            workspaceId: invite.workspaceId,
          },
        },
        select: { id: true, role: true },
      });

      const membership =
        existingMembership ??
        (await transaction.workspaceMember.create({
          data: {
            userId: session.user.id,
            workspaceId: invite.workspaceId,
            role: invite.role,
          },
          select: { id: true, role: true },
        }));

      await transaction.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });

      return membership;
    });

    return NextResponse.json({
      data: {
        membership,
        workspace: invite.workspace,
      },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "You are already a member of this workspace." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "We could not accept the invite. Please try again." },
      { status: 500 },
    );
  }
}
