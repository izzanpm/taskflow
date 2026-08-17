import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { markNotificationsReadSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json(
      { error: "You need to be signed in to view notifications." },
      { status: 401 },
    );
  }

  try {
    const [unreadCount, notifications] = await Promise.all([
      db.notification.count({
        where: { userId: session.user.id, readAt: null },
      }),
      db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          type: true,
          readAt: true,
          createdAt: true,
          actor: { select: { id: true, name: true } },
          task: {
            select: {
              id: true,
              title: true,
              column: {
                select: {
                  board: {
                    select: {
                      id: true,
                      workspace: { select: { slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
      }),
    ]);

    return NextResponse.json({ data: { unreadCount, notifications } });
  } catch {
    return NextResponse.json(
      { error: "We could not load notifications. Please try again." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return NextResponse.json(
      { error: "You need to be signed in to update notifications." },
      { status: 401 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The notification request was not valid JSON." },
      { status: 400 },
    );
  }

  const result = markNotificationsReadSchema.safeParse(payload);
  if (!result.success) {
    return NextResponse.json(
      { error: "Mark all notifications as read to continue." },
      { status: 400 },
    );
  }

  try {
    await db.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    });
    return NextResponse.json({ data: { success: result.data.all } });
  } catch {
    return NextResponse.json(
      { error: "We could not update notifications. Please try again." },
      { status: 500 },
    );
  }
}
