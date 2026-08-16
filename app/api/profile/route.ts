import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
  avatarUrl: z
    .union([z.string().trim().url().max(500), z.literal("")])
    .optional(),
});

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function PATCH(request: Request) {
  const session = await auth.api.getSession({
    headers: request.headers,
  });

  if (!session) {
    return errorResponse(
      "You need to be signed in to update your profile.",
      401,
    );
  }

  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return errorResponse("The profile update was not valid JSON.", 400);
  }

  const result = updateProfileSchema.safeParse(payload);

  if (!result.success) {
    return NextResponse.json(
      {
        error: result.error.issues[0]?.message ?? "Check your profile details.",
      },
      { status: 400 },
    );
  }

  const user = await db.user.update({
    where: { id: session.user.id },
    data: {
      name: result.data.name,
      avatarUrl: result.data.avatarUrl || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ data: user });
}
