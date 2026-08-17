import { WorkspaceRole } from "@/app/generated/prisma/enums";
import type { WorkspaceRole as WorkspaceRoleValue } from "@/app/generated/prisma/enums";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type AuthenticatedSession = NonNullable<
  Awaited<ReturnType<typeof auth.api.getSession>>
>;

export class AuthorizationError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireRole(
  headers: Headers,
  workspaceId: string,
  allowedRoles: readonly WorkspaceRoleValue[] = [
    WorkspaceRole.ADMIN,
    WorkspaceRole.MEMBER,
  ],
): Promise<{
  session: AuthenticatedSession;
  member: {
    id: string;
    userId: string;
    workspaceId: string;
    role: WorkspaceRoleValue;
  };
}> {
  const session = await auth.api.getSession({ headers });

  if (!session) {
    throw new AuthorizationError(
      401,
      "You need to be signed in to access this workspace.",
    );
  }

  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: session.user.id,
        workspaceId,
      },
    },
    select: {
      id: true,
      userId: true,
      workspaceId: true,
      role: true,
    },
  });

  if (!member) {
    throw new AuthorizationError(
      403,
      "You are not a member of this workspace.",
    );
  }

  if (!allowedRoles.includes(member.role)) {
    throw new AuthorizationError(
      403,
      "You do not have permission to perform this action.",
    );
  }

  return { session, member };
}

export function authorizationErrorResponse(error: unknown) {
  if (error instanceof AuthorizationError) {
    return Response.json({ error: error.message }, { status: error.status });
  }

  return null;
}
