import { NextResponse } from "next/server";

import { WorkspaceRole } from "@/app/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createWorkspaceSchema } from "@/lib/validation";
import {
  generateUniqueWorkspaceSlug,
  getUserWorkspaces,
  isUniqueConstraintError,
} from "@/lib/workspaces";

export async function GET(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "You need to be signed in to view your workspaces." },
      { status: 401 },
    );
  }

  try {
    return NextResponse.json({
      data: await getUserWorkspaces(session.user.id),
    });
  } catch {
    return NextResponse.json(
      { error: "We could not load your workspaces. Please try again." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return NextResponse.json(
      { error: "You need to be signed in to create a workspace." },
      { status: 401 },
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The workspace request was not valid JSON." },
      { status: 400 },
    );
  }

  const result = createWorkspaceSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error.issues[0]?.message ?? "Check the workspace name." },
      { status: 400 },
    );
  }

  try {
    const workspace = await db.$transaction(async (transaction) => {
      const slug = await generateUniqueWorkspaceSlug(
        result.data.name,
        transaction,
      );

      return transaction.workspace.create({
        data: {
          name: result.data.name,
          slug,
          members: {
            create: {
              userId: session.user.id,
              role: WorkspaceRole.ADMIN,
            },
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
      });
    });

    return NextResponse.json({ data: workspace }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return NextResponse.json(
        { error: "That workspace name is already in use. Try another one." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "We could not create your workspace. Please try again." },
      { status: 500 },
    );
  }
}
