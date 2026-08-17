import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");

  const membership = await db.workspaceMember.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { workspace: { select: { slug: true } } },
  });

  if (!membership) redirect("/workspaces/new");

  redirect(`/${membership.workspace.slug}/boards`);
}
