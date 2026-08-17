import { NextResponse } from "next/server";

import { WorkspaceRole } from "@/app/generated/prisma/enums";
import { authorizationErrorResponse, requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";
import { updateMemberRoleSchema } from "@/lib/validation";

type MemberRouteContext = {
  params: Promise<{ workspaceId: string; memberId: string }>;
};

async function findMember(workspaceId: string, memberId: string) {
  return db.workspaceMember.findFirst({
    where: { id: memberId, workspaceId },
    select: {
      id: true,
      userId: true,
      role: true,
      user: { select: { name: true, email: true, avatarUrl: true } },
    },
  });
}

export async function PATCH(request: Request, context: MemberRouteContext) {
  const { workspaceId, memberId } = await context.params;

  try {
    const { member: actor } = await requireRole(request.headers, workspaceId, [
      WorkspaceRole.ADMIN,
    ]);
    const member = await findMember(workspaceId, memberId);

    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: "The role update was not valid JSON." },
        { status: 400 },
      );
    }

    const result = updateMemberRoleSchema.safeParse(payload);
    if (!result.success) {
      return NextResponse.json(
        { error: "Choose a valid workspace role." },
        { status: 400 },
      );
    }

    if (
      actor.userId === member.userId &&
      result.data.role !== WorkspaceRole.ADMIN
    ) {
      return NextResponse.json(
        { error: "You cannot remove your own admin access." },
        { status: 400 },
      );
    }

    if (
      member.role === WorkspaceRole.ADMIN &&
      result.data.role === WorkspaceRole.MEMBER
    ) {
      const adminCount = await db.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.ADMIN },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Keep at least one workspace admin." },
          { status: 409 },
        );
      }
    }

    const updatedMember = await db.workspaceMember.update({
      where: { id: member.id },
      data: { role: result.data.role },
      select: {
        id: true,
        role: true,
        user: { select: { name: true, email: true, avatarUrl: true } },
      },
    });

    return NextResponse.json({ data: updatedMember });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;
    return NextResponse.json(
      { error: "We could not update this member. Please try again." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, context: MemberRouteContext) {
  const { workspaceId, memberId } = await context.params;

  try {
    const { member: actor } = await requireRole(request.headers, workspaceId, [
      WorkspaceRole.ADMIN,
    ]);
    const member = await findMember(workspaceId, memberId);

    if (!member) {
      return NextResponse.json({ error: "Member not found." }, { status: 404 });
    }

    if (actor.userId === member.userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the workspace." },
        { status: 400 },
      );
    }

    if (member.role === WorkspaceRole.ADMIN) {
      const adminCount = await db.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.ADMIN },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "Keep at least one workspace admin." },
          { status: 409 },
        );
      }
    }

    await db.workspaceMember.delete({ where: { id: member.id } });
    return NextResponse.json({ data: { id: member.id } });
  } catch (error) {
    const response = authorizationErrorResponse(error);
    if (response) return response;
    return NextResponse.json(
      { error: "We could not remove this member. Please try again." },
      { status: 500 },
    );
  }
}
