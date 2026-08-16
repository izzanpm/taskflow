# TaskFlow Phase 0 Diagrams

These diagrams describe the MVP scope in `PRD.md` before implementation begins.

## Use Case Diagram

```mermaid
flowchart LR
    Admin([Admin])
    Member([Member])

    subgraph TaskFlow
        Auth[Register and log in]
        Profile[Manage profile]
        Workspace[Create workspace]
        Invite[Invite members]
        Roles[Manage member roles]
        Remove[Remove members]
        DeleteWorkspace[Delete workspace]
        Boards[View workspace boards]
        BoardManagement[Manage boards and columns]
        Tasks[Create and edit tasks]
        Reorder[Reorder and move tasks]
        Assigned[View assigned tasks]
        Comments[Comment on tasks]
        Attachments[Upload task attachments]
        Notifications[View notifications]
    end

    Admin --> Auth
    Member --> Auth
    Admin --> Profile
    Member --> Profile
    Admin --> Workspace
    Admin --> Invite
    Admin --> Roles
    Admin --> Remove
    Admin --> DeleteWorkspace
    Admin --> Boards
    Member --> Boards
    Admin --> BoardManagement
    Member --> BoardManagement
    Admin --> Tasks
    Member --> Tasks
    Admin --> Reorder
    Member --> Reorder
    Admin --> Assigned
    Member --> Assigned
    Admin --> Comments
    Member --> Comments
    Admin --> Attachments
    Member --> Attachments
    Admin --> Notifications
    Member --> Notifications

    Invite -.-> Auth
```

`Admin` has the same task and collaboration capabilities as `Member`, plus workspace
and membership administration capabilities.

## Process Flowcharts

### Authentication

```mermaid
flowchart TD
    A[Open login or register] --> B[Submit email and password]
    B --> C{Input valid?}
    C -->|No| D[Show validation error]
    D --> B
    C -->|Yes| E[Better-Auth creates session]
    E --> F{User has a workspace?}
    F -->|No| G[Open Create Workspace]
    F -->|Yes| H[Open Board List]
```

### Invite and Accept

```mermaid
flowchart TD
    A[Admin opens Workspace Settings] --> B[Enter email and role]
    B --> C{Admin authorized and input valid?}
    C -->|No| D[Show permission or validation error]
    D --> B
    C -->|Yes| E[Create invite token and expiry]
    E --> F[Send invite email]
    F --> G[Recipient opens invite link]
    G --> H{Recipient has a session?}
    H -->|No| I[Register or log in]
    I --> J[Return to invite]
    H -->|Yes| J
    J --> K{Invite valid and not expired?}
    K -->|No| L[Show invalid invite error]
    K -->|Yes| M[Create WorkspaceMember]
    M --> N[Mark invite accepted]
    N --> O[Redirect to Board List]
```

### Task Creation

```mermaid
flowchart TD
    A[User opens Board Detail] --> B[Click add task in a column]
    B --> C[Enter title and optional fields]
    C --> D{Input valid?}
    D -->|No| E[Show validation error]
    E --> C
    D -->|Yes| F[POST task mutation]
    F --> G{User is workspace member?}
    G -->|No| H[Return FORBIDDEN]
    G -->|Yes| I[Create task with column and order]
    I --> J[Return created task]
    J --> K[Render task in column]
```

### Drag-and-Drop Reorder

```mermaid
flowchart TD
    A[User drags task card] --> B[Determine target column and position]
    B --> C[Optimistically update client board]
    C --> D[Calculate fractional order]
    D --> E[PATCH task with column and order]
    E --> F{Mutation succeeds?}
    F -->|Yes| G[Keep optimistic board state]
    F -->|No| H[Rollback board state]
    H --> I[Show mutation error]
```

## Class Diagram

```mermaid
classDiagram
    class User {
        +String id
        +String email
        +String name
        +String avatarUrl
        +String passwordHash
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Workspace {
        +String id
        +String name
        +String slug
        +DateTime createdAt
        +DateTime updatedAt
    }

    class WorkspaceMember {
        +String id
        +String userId
        +String workspaceId
        +WorkspaceRole role
        +DateTime createdAt
    }

    class Invite {
        +String id
        +String workspaceId
        +String email
        +WorkspaceRole role
        +String token
        +String invitedById
        +DateTime expiresAt
        +DateTime acceptedAt
        +DateTime createdAt
    }

    class Board {
        +String id
        +String workspaceId
        +String name
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Column {
        +String id
        +String boardId
        +String name
        +Float order
        +DateTime createdAt
    }

    class Task {
        +String id
        +String columnId
        +String title
        +String description
        +String assigneeId
        +DateTime dueDate
        +TaskPriority priority
        +Float order
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Comment {
        +String id
        +String taskId
        +String userId
        +String body
        +DateTime createdAt
    }

    class Attachment {
        +String id
        +String taskId
        +String fileUrl
        +String fileName
        +Int fileSize
        +String uploadedById
        +DateTime createdAt
    }

    class WorkspaceRole {
        <<enumeration>>
        ADMIN
        MEMBER
    }

    class TaskPriority {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
        URGENT
    }

    User "1" --> "0..*" WorkspaceMember : memberships
    Workspace "1" --> "0..*" WorkspaceMember : members
    User "1" --> "0..*" Invite : invites sent
    Workspace "1" --> "0..*" Invite : invites
    Workspace "1" --> "0..*" Board : boards
    Board "1" --> "0..*" Column : columns
    Column "1" --> "0..*" Task : tasks
    User "0..1" --> "0..*" Task : assignee
    Task "1" --> "0..*" Comment : comments
    User "1" --> "0..*" Comment : author
    Task "1" --> "0..*" Attachment : attachments
    User "1" --> "0..*" Attachment : uploader
    WorkspaceMember --> WorkspaceRole : role
    Invite --> WorkspaceRole : role
    Task --> TaskPriority : priority
```

The relationships and nullable fields mirror `PRD.md` §10.2. Deleting workspace-owned
records cascades; deleting an assignee sets `Task.assigneeId` to `null`.
