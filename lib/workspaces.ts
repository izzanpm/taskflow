import type { PrismaClient } from "@/app/generated/prisma/client";

import { db } from "@/lib/db";
import type { WorkspaceSummary } from "@/types/workspace";

type WorkspaceClient = Pick<PrismaClient, "workspace">;

export function slugifyWorkspaceName(name: string) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

  return slug || "workspace";
}

export async function generateUniqueWorkspaceSlug(
  name: string,
  client: WorkspaceClient = db,
) {
  const baseSlug = slugifyWorkspaceName(name);

  for (let suffix = 0; suffix < 1000; suffix += 1) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const existing = await client.workspace.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) return candidate;
  }

  throw new Error("Could not generate a unique workspace slug.");
}

export function isUniqueConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function getUserWorkspaces(
  userId: string,
): Promise<WorkspaceSummary[]> {
  const workspaces = await db.workspace.findMany({
    where: { members: { some: { userId } } },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      members: {
        orderBy: { createdAt: "asc" },
        select: {
          userId: true,
          role: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return workspaces.flatMap((workspace) => {
    const membership = workspace.members.find(
      (member) => member.userId === userId,
    );
    if (!membership) return [];

    const host = workspace.members.find((member) => member.role === "ADMIN");

    return [
      {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        role: membership.role,
        host: host?.user ?? null,
      },
    ];
  });
}
