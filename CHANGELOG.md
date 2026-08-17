# Changelog

## Unreleased

- Completed Phase 5 Collaboration: task detail overlay with comments and direct
  R2 attachment upload/delete flow, Resend invite email template and delivery
  fallback, notification persistence for assignment/comment events, unread badge,
  and mark-all-read action.
- Added the `Notification` Prisma model and migration, with `PRD.md` kept in sync
  as the schema source of truth. Existing `Comment` and `Attachment` models were
  confirmed present in the initial migration.
- Added `R2_PUBLIC_URL` and `RESEND_FROM_EMAIL` environment placeholders for the
  collaboration integrations.
- Added AWS SDK, Resend, and React Email dependencies and wired them into the R2
  storage and workspace invite email helpers.
- Completed Phase 6 board UX polish: board/task loading and error recovery states,
  empty-state messaging, mutation toasts, mobile touch handling, task search, and
  assignee, column, and due-date filters.
- Completed Phase 4.5 Workspace Hub: protected workspace listing, host/admin and
  current-role context, workspace selection, create-workspace navigation, loading/
  empty/error states, and post-auth redirect updates.
- Documented the new post-login Workspace Hub flow, workspace selection, role/host
  context, and the Phase 4.5 implementation scope before collaboration work.
- Added board list and board creation to the Phase 4 task scope.
- Completed the Phase 4 board list flow with member access, admin-only board
  creation, empty/loading/error states, and redirects from workspace setup and
  invite acceptance.
- Added Phase 0 use case, process flow, class, and UI navigation diagrams under
  `docs/`.
- Verified the Next.js App Router and TypeScript foundation with lint, typecheck, and
  production build.
- Configured Tailwind CSS v4 and initialized shadcn/ui with the base-nova preset,
  CSS variables, shared `cn` utility, and Button component.
- Documented shadcn/ui as the standard component layer for UI development.
- Completed ESLint and Prettier setup with flat-config integration and formatting
  scripts.
- Verified the PostgreSQL 16 Docker Compose service, persistent volume, healthcheck,
  and local connection.
- Verified Prisma 7 initialization, configuration, schema validation, and migration
  status against the local PostgreSQL database.
- Verified the initial Prisma data models and first migration are present and applied;
  recorded the Prisma 7 schema representation difference as an open question.
- Added a GitHub Actions CI workflow for dependency installation, lint, and typecheck
  on pull requests and pushes to `main`.
- Verified the deployed skeleton at `https://taskflow-nine-alpha-20.vercel.app`.
- Added Better-Auth account, session, and verification storage to the Prisma schema.
- Configured Better-Auth email/password authentication with Prisma-backed sessions
  and the Next.js auth route.
- Added the English centered register page with Better-Auth sign-up handling, inline
  validation, loading/error/success states, and shadcn input primitives.
- Added the English centered login page with Better-Auth sign-in handling, inline
  validation, and accessible loading, error, and success states.
- Fixed clean CI typechecks by generating Next.js route types before running TypeScript.
- Added a server-side logout action that signs out through Better-Auth and redirects to
  the login page.
- Added a temporary sign-out button to the post-login state for validating logout behavior.
- Added Next.js 16 proxy-based session protection for authenticated dashboard routes.
- Added the authenticated profile settings page with name and avatar preview, plus
  accessible loading, error, and success states.
- Added the session-protected `PATCH /api/profile` mutation with Zod validation for
  updating a user's name and avatar URL.
- Completed Phase 3 workspace and role management: workspace creation with unique
  slugs, admin authorization, invite links with rate limiting, invite acceptance,
  member role changes, member removal, and workspace deletion.
- Added workspace settings, create-workspace, and invite acceptance screens with
  responsive TaskFlow styling and accessible loading, error, empty, and confirmation
  states.
- Confirmed the existing `Invite` model migration is present in the first Prisma
  migration; transactional email delivery remains scoped to Phase 5.
- Completed Phase 4 Kanban core: board detail rendering, column CRUD and
  fractional-index reorder, task CRUD with assignment/due-date/priority editing,
  dnd-kit column/task drag-and-drop, and TanStack Query optimistic updates with
  rollback on failed reorder mutations.
- Added the board/task route handlers and verified the authenticated flow against
  PostgreSQL, including cleanup of temporary smoke-test data.
- Added `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`, and
  `@tanstack/react-query` for the Phase 4 interaction and server-state contracts.
