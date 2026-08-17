import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isInviteExpired } from "@/lib/invites";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const invite = await db.invite.findUnique({
    where: { token },
    select: {
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
      workspace: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found." }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...invite,
      status: invite.acceptedAt
        ? "accepted"
        : isInviteExpired(invite.expiresAt)
          ? "expired"
          : "pending",
    },
  });
}
