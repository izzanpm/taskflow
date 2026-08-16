# TaskFlow UI and Screen Flow

This document defines the MVP screen inventory and navigation before implementation.
It complements `PRD.md`, `AGENTS.md`, and `DESIGN.md`.

## Screen Inventory

| Screen | Route | Access | Purpose |
| --- | --- | --- | --- |
| Login | `/login` | Public | Sign in |
| Register | `/register` | Public | Create an account |
| Create Workspace | `/workspaces/new` | Authenticated | Create the first workspace |
| Board List | `/[workspaceSlug]/boards` | Workspace member | List workspace boards |
| Board Detail | `/[workspaceSlug]/boards/[boardId]` | Workspace member | Use the Kanban board |
| Task Detail | Overlay on Board Detail | Workspace member | Edit task, comments, and attachments |
| Workspace Settings | `/[workspaceSlug]/settings` | Member; admin for mutations | Manage members, roles, and invites |
| Invite Accept | `/invite/[token]` | Public, then authenticated | Accept an invitation |
| Profile Settings | `/settings/profile` | Authenticated | Update name and avatar |

## Primary User Flows

### Authentication

```mermaid
flowchart TD
    A[Login] -->|No account| B[Register]
    B --> C[Session created]
    A -->|Valid credentials| C
    C --> D{Has workspace?}
    D -->|No| E[Create Workspace]
    D -->|Yes| F[Board List]
    E --> F
```

### Invite and Join Workspace

```mermaid
flowchart TD
    A[Invite email] --> B[Open /invite/token]
    B --> C{Logged in?}
    C -->|No| D[Register or Login]
    D --> E[Accept Invite]
    C -->|Yes| E
    E --> F[Create WorkspaceMember]
    F --> G[Board List]
```

### Kanban Task Lifecycle

```mermaid
flowchart TD
    A[Board Detail] --> B[Click add task]
    B --> C[Quick-create form]
    C --> D[Task appears in column]
    D --> E[Open Task Detail overlay]
    E --> F[Edit, comment, or upload attachment]
    F --> G[Close overlay]
    G --> A
    A --> H[Drag task card]
    H --> I[Reorder or move column]
    I --> A
```

### Workspace Administration

```mermaid
flowchart TD
    A[Workspace Settings] --> B[Members list]
    B --> C[Invite member]
    C --> D[Enter email and role]
    D --> E[Invite sent]
    B --> F[Change member role]
    B --> G[Remove member]
    G --> H[Confirm removal]
```

## Sitemap

```mermaid
flowchart LR
    Login --> Register
    Login --> BoardList
    Register --> CreateWorkspace
    CreateWorkspace --> BoardList
    BoardList --> BoardDetail
    BoardDetail --> TaskDetail
    BoardList --> WorkspaceSettings
    WorkspaceSettings --> ProfileSettings
    InviteAccept --> Login
    InviteAccept --> Register
    InviteAccept --> BoardList
```

## Required Screen States

Data-fetching and mutation screens must define these states:

- Loading: initial data or mutation is in progress.
- Empty: no boards, tasks, or members exist yet.
- Error: fetch or mutation failed.
- Permission denied: a member attempts an admin-only action.

## Confirmed Assumptions

- Task Detail is an overlay on Board Detail so board context remains visible.
- Password reset is outside the MVP scope.
- A user without a workspace goes to Create Workspace after authentication.
- Board List and Create Workspace are dashboard routes and should be reflected in the
  implementation folder structure when Phase 1 begins.
