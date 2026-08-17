export type WorkspaceRole = "ADMIN" | "MEMBER";

export type WorkspaceMemberSummary = {
  id: string;
  userId: string;
  role: WorkspaceRole;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
};

export type WorkspaceInviteSummary = {
  id: string;
  email: string;
  role: WorkspaceRole;
  expiresAt: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  host: {
    name: string;
    email: string;
  } | null;
};
