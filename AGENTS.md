You are an expert Next.js, TypeScript, and PostgreSQL/Prisma engineer helping me build TaskFlow.
Write clean, simple, maintainable code. Prioritize clarity over unnecessary abstraction.
Think like a senior fullstack developer.

--

## Project Overview
We are building TaskFlow, a multi-tenant SaaS Kanban task manager for small teams.

The app includes:
- Email/password authentication with workspaces
- Workspace roles (admin/member) and email invites
- Kanban boards with drag-and-drop columns and tasks
- Task comments and file attachments
- Basic in-app notifications

Keep the implementation simple and readable. Refer to `PRD.md` for full feature scope
(including the database schema), this file (`AGENTS.md`) for technical architecture
and diagrams, `DESIGN.md` for the visual design system, and `UIFLOW.md` for the
screen inventory and navigation flow.

--

## Tech Stack

| Layer            | Choice                                   |
|--------------------|---------------------------------------------|
| Framework           | Next.js (App Router) + TypeScript          |
| Styling             | Tailwind CSS                               |
| UI Components       | shadcn/ui                                  |
| Server State         | TanStack Query                             |
| Drag & Drop          | dnd-kit                                    |
| Auth                 | Better-Auth (fallback: Auth.js)            |
| Database             | PostgreSQL                                 |
| ORM                  | Prisma                                     |
| File Storage          | Cloudflare R2 (S3-compatible)              |
| Email                 | Resend + React Email                       |
| Containerization       | Docker + Docker Compose                    |
| CI/CD                  | GitHub Actions                             |
| Testing                | Vitest (unit), Playwright (E2E)            |

Do not introduce new major libraries unless there is a strong reason. Ask before
installing anything new.

--

## Development Philosophy
Build feature by feature, following `TASK.md` in order.

**Phase 0 gate:** `TASK.md` starts with a Phase 0 (use case diagram, process
flowcharts, and class diagram — all documented in this file, `AGENTS.md`; screen
flow in `UIFLOW.md`). Do not
start Phase 1 or any code until Phase 0 is checked off and the user has explicitly
confirmed the planning docs. If the user asks for a Phase 1+ feature while Phase 0
is still incomplete, say so and offer to do Phase 0 first rather than skipping it
silently.

For every feature:
1. Read this file first.
2. Read `TASK.md` to find the next unchecked item.
3. Keep the implementation simple.
4. Avoid overengineering.
5. Prefer readable code over clever code.
6. Build the smallest useful version first.
7. Refactor only when repetition appears.

--

## Decision Making
If something is unclear or could be improved, suggest a better approach. If a new
library would significantly help, recommend it, explain why, and ask before adding it.

Do not install new libraries without approval.

If a requirement is ambiguous and not covered in `PRD.md` or this file's architecture
sections, make the
most reasonable assumption consistent with existing decisions, state that assumption
explicitly, and log it under "Open Questions" in `TASK.md` if it needs later
confirmation. Never silently guess on anything involving auth, roles/permissions, or
payment-adjacent logic — flag these for confirmation instead.

--

## System Architecture Overview
Single Next.js app (monolith, not microservices) using Route Handlers as the API
layer. No separate backend service for MVP — keeps deployment simple while still
demonstrating full-stack skills. Structure is written to make a future extraction to
a separate API service straightforward if needed.

```
Client (React) → Next.js Route Handlers (/app/api/*) → Prisma → PostgreSQL
                                                       → R2 (file storage)
                                                       → Resend (email)
```

--

## Architecture
Use this folder structure:
```
/app
  /(auth)/login
  /(auth)/register
  /(dashboard)/[workspaceSlug]/boards/[boardId]
  /(dashboard)/[workspaceSlug]/settings
  /api/auth/[...all]
  /api/workspaces
  /api/boards
  /api/tasks
  /api/tasks/[id]/comments
  /api/tasks/[id]/attachments
  /api/invites
/components
  /ui          -> shared primitives (button, modal, input)
  /board       -> kanban-specific components
  /workspace
/lib
  /db.ts       -> Prisma client singleton
  /auth.ts     -> auth config
  /storage.ts  -> R2 client helpers
  /email.ts    -> Resend client + templates trigger
/prisma
  schema.prisma
  /migrations
/emails         -> React Email templates
/data
/types
```

**app/** is for routes and screens only. Route segments compose components and call
hooks, Route Handlers, or Prisma queries. They should not contain large reusable UI
blocks or business logic.

**components/** is for reusable UI. Create a component when it is reused in multiple
places, when it makes a screen easier to read, or when it represents a clear UI
concept. Examples for this app: `TaskCard`, `BoardColumn`, `InviteMemberDialog`,
`CommentList`. Do not create components too early.

Use shadcn/ui components from `/components/ui` for shared primitives such as buttons,
inputs, dialogs, menus, and forms. Add components with the shadcn CLI when available,
then customize the copied source to match `DESIGN.md` rather than wrapping it in a
second abstraction layer.

**data/** holds hardcoded/reference content (e.g. priority labels, status options).
Keep it typed.

**lib/** holds server-side and external service helpers (`db.ts`, `auth.ts`,
`storage.ts`, `email.ts`). Never expose secret keys here to the client — these files
are server-only unless explicitly marked otherwise.

**prisma/** holds the schema and migrations. The schema here must always match
`PRD.md` section 10 (Database Schema) — see the Database Schema section below.

**types/** holds shared TypeScript types not generated by Prisma.

--

## API Design (high level)

| Method | Route                              | Purpose                        |
|--------|-------------------------------------|---------------------------------|
| POST   | /api/workspaces                    | Create workspace                |
| POST   | /api/invites                       | Send invite email               |
| POST   | /api/invites/[token]/accept         | Accept invite                   |
| GET    | /api/boards/[id]                   | Get board with columns+tasks    |
| POST   | /api/tasks                         | Create task                     |
| PATCH  | /api/tasks/[id]                    | Update task (incl. reorder/move)|
| POST   | /api/tasks/[id]/comments           | Add comment                     |
| POST   | /api/tasks/[id]/attachments         | Get presigned upload URL        |

All routes except auth/invite-accept require an authenticated session and workspace
membership check.

--

## File Storage Strategy
- Client requests a presigned PUT URL from `/api/tasks/[id]/attachments`.
- Client uploads directly to R2 (not proxied through the server).
- Server only stores the resulting file URL/metadata in Postgres.

--

## Email Strategy
- Transactional only (invites). Templates built with React Email, sent via Resend.
- No marketing email in MVP.

--

## Non-Functional Requirements
- All mutation endpoints validated with Zod.
- No secrets committed — all via `.env` (see `README.md`).
- Basic rate limiting on invite endpoint to prevent abuse.
- Optimistic UI updates on drag-and-drop; rollback on server error.

Future/roadmap items (real-time sync, billing, multi-workspace switcher) are tracked
in `TASK.md` under Backlog / Stretch Goals — not implemented for MVP.

--

## Database Schema
`PRD.md` section 10 is the **single source of truth** for the data model — not
`DESIGN.md`, not `prisma/schema.prisma` directly.

1. `prisma/schema.prisma` must always be an exact implementation of the schema in
   `PRD.md` section 10.2. Never edit `prisma/schema.prisma` with a model, field, or
   relation that isn't reflected there first.
2. If a feature requires a schema change (new field, new model, new relation):
   - Update `PRD.md` section 10 first (both the ERD summary and the Prisma code block).
   - Then apply the same change to `prisma/schema.prisma`.
   - Then run `npx prisma migrate dev --name <description>`.
3. If you find `prisma/schema.prisma` and `PRD.md` section 10 have drifted apart
   (e.g. after manual edits), stop and flag it — do not silently pick one as correct.
4. `DESIGN.md` is the visual/UI design system only (colors, typography, spacing,
   components) — it does not hold data model or architecture content. Do not add
   schema detail there.

--

## Use Case Diagram
The Phase 0 use case diagram is documented in `docs/phase-0-diagrams.md`.

--

## Process Flowcharts
The Phase 0 process flowcharts are documented in `docs/phase-0-diagrams.md`.

--

## Class Diagram
The Phase 0 class diagram is documented in `docs/phase-0-diagrams.md` and mirrors the
Prisma schema in `PRD.md` §10.

--

## UI Rules
`DESIGN.md` is the visual design system for this app (colors, typography, spacing,
component styles, motion). Use its tokens and component specs as the source of truth
for any UI work — don't invent colors, fonts, or spacing values outside it.

For any UI task:
- Replicate the provided design exactly.
- Match layout, spacing, padding, font sizes, font hierarchy, colors, border radius,
  shadows, alignment, and proportions.
- Do not approximate. Do not simplify unless explicitly asked.
- Prefer existing shadcn/ui primitives before creating a new shared UI primitive.
- Use the local `impeccable` skill for UI/page design work. Before editing UI, run
  `node .agents/skills/impeccable/scripts/context.mjs --target <path>`, load the
  applicable playbook and `reference/craft-floor.md`, then inspect responsive states
  and run the skill's detector on changed targets.

--

## Styling Rules
Use Tailwind CSS utility classes. Do not use CSS Modules or styled-components unless
it is not possible to style with `className`.

Use shadcn/ui as the component layer on top of Tailwind CSS. Add missing primitives
with `npx shadcn@latest add <component>` and import them from `@/components/ui`.
Use `cn()` from `@/lib/utils` when combining conditional or caller-provided classes.

Use the Tailwind version installed in this project. Check `package.json`. Do not
upgrade without approval.

Reuse class patterns through shared components in `components/ui/`, or `@apply` in
`globals.css` if a pattern repeats across many one-off elements.

### Style Exception List
Use inline styles or a CSS-in-JS escape hatch for:
- Values computed at runtime (e.g. dynamic drag-and-drop transform/position from dnd-kit)
- Third-party components that don't accept `className` props
- Animations driven by JS state rather than Tailwind's transition classes

Everywhere else, use Tailwind.

--

## Asset Rule
Use centralized asset imports for icons/logos/static images.
1. Check if `constants/images.ts` exists.
2. If not, create it.
3. Import all app images/icons there.
4. Use them through the centralized object.

```ts
// constants/images.ts
import logo from "@/public/images/logo.svg";

export const images = {
  logo,
};
```

```tsx
import { images } from "@/constants/images";

<Image src={images.logo} alt="TaskFlow logo" />
```

Do not import image assets directly inside route files or components.

--

## State Management
- **TanStack Query** for all server state (fetching, caching, optimistic updates on
  drag-and-drop, mutations).
- **Local component state** (`useState`) for temporary UI state (open/closed dialogs,
  input values before submit).
- Do not introduce a global client store (e.g. Zustand) unless a genuine cross-page
  client-only state need appears — ask before adding one.

--

## TypeScript
- Strict mode.
- No `any`.
- Keep types simple and readable.
- Prefer types inferred from Prisma/Zod schemas over hand-duplicated types.

--

## Feature Implementation
When building a feature:
1. Read this file first.
2. Read the relevant `TASK.md` item and its phase context.
3. Identify the files to change.
4. Keep changes focused.
5. Do not rewrite unrelated code.
6. Follow existing patterns and `CONVENTIONS.md`.
7. Make sure the feature works end to end (UI → Route Handler → Prisma → DB).
8. Fix lint and type errors before finishing.
9. Update `TASK.md` and `CHANGELOG.md`, then suggest a commit message — per
   `AGENTS.md` §Working Process and §Git & Version Control above.

--

## Git & Version Control
- **Never run `git add`, `git commit`, or `git push`** — not even to "wrap up" or
  "finish" a task, and not even if it seems like the natural next step. This applies
  regardless of how the request is phrased.
- Staging, committing, and pushing are done manually by the user only.
- When a task is complete, instead suggest a commit message following the format in
  `CONVENTIONS.md` (Conventional Commits), e.g.:
  ```
  Suggested commit message:
  feat(board): add drag-and-drop reordering for tasks
  ```
- You may still run other git read-only commands if useful for context (e.g.
  `git status`, `git diff`, `git log`) — the restriction is specifically on
  `add`, `commit`, and `push`.

--

## Working Process (Docs Update Loop)
1. Pick the next unchecked task from `TASK.md`.
2. State which task you're doing and your plan before writing code.
3. Implement the smallest coherent unit of work.
4. Run lint, typecheck, and relevant tests.
5. Mark the item `[x]` in `TASK.md`.
6. Append an entry to `CHANGELOG.md` under "Unreleased".
7. Suggest a commit message following the format defined in `CONVENTIONS.md`. Do not
   run `git add`, `git commit`, or `git push` yourself — see Git & Version Control.

--

## Secrets
- Never expose secret keys in client code.
- Use Route Handlers (server-side) for tokens, R2 presigned URLs, Resend email
  sending, and any external API access.
- All secrets live in `.env` and are read only inside `lib/` server helpers.

--

## Authentication
Use Better-Auth. Do not build custom auth.
- Session via Better-Auth (session cookie).
- Every workspace-scoped Route Handler must check session and `WorkspaceMember` role
  via the shared `requireRole(workspaceId, ["admin"])` helper before performing a
  mutation.

--

## Communication
Be concise. Explain what changed and how to test it.

--

## Final Reminder
Before every feature:
- Read this file.
- Read `TASK.md` for the current task.
- Follow it strictly.
- Build clean, simple code.
- Replicate UI exactly when designs are provided.
- Update `TASK.md` and `CHANGELOG.md` when done.
- Suggest a commit message — never run `git add`, `git commit`, or `git push`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
