# Boards Page Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the boards launcher recognizable, actionable, mobile-friendly, visually stable while loading, and consistent with TaskFlow's documented colors.

**Architecture:** Extend the existing `BoardSummary` query contract with task count and latest task activity derived from existing relations. Keep rendering in `BoardListClient`, pass one existing workspace-admin contact from the server page, and scope visual token cleanup to the boards surface instead of changing the global shadcn palette.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5, Prisma 7.9, Tailwind CSS 4, shadcn/ui, Lucide React.

## Global Constraints

- Preserve the current Baseteam light authenticated visual language; scoped contrast
  corrections may minimally darken muted text and strengthen focus rings.
- Optimize for fewer than ten boards; do not add search, sorting, grouping, or favorites.
- Do not add a dependency, schema field, migration, or PRD data-model change.
- Use existing task `updatedAt` values; `lastActivityAt` is `null` when no task exists.
- Keep dates deterministic with `Intl.DateTimeFormat`, not relative-time timers.
- Do not run `git add`, `git commit`, or `git push`; the user owns all Git writes.
- No dedicated unit test is added because the user declined a test-runner dependency.
- Run lint, typecheck, build, detector, and one bounded responsive inspection pass.

## File Map

- `types/board.ts`: extends the board-list data contract.
- `lib/boards.ts`: selects task metadata and maps it to board summaries.
- `app/api/workspaces/[workspaceId]/boards/route.ts`: returns complete summary fields after creation.
- `app/(dashboard)/[workspaceSlug]/boards/page.tsx`: resolves current member and first admin contact.
- `components/board/BoardListClient.tsx`: renders operational cards and role-aware empty states.
- `components/notifications/NotificationBadge.tsx`: raises the icon touch target to 44px.
- `app/(dashboard)/[workspaceSlug]/boards/loading.tsx`: mirrors final layout geometry.
- `app/(dashboard)/[workspaceSlug]/boards/error.tsx`: adopts the scoped semantic colors.
- `app/globals.css`: exposes Baseteam colors as narrowly named Tailwind tokens.
- `TASK.md`: records the completed Phase 6 polish unit.
- `CHANGELOG.md`: records the user-visible changes under Unreleased.

---

### Task 1: Extend The Board Summary Contract

**Files:**
- Modify: `types/board.ts:49-54`
- Modify: `lib/boards.ts:4-24`
- Modify: `app/api/workspaces/[workspaceId]/boards/route.ts:55-68`

**Interfaces:**
- Produces: `BoardSummary` with `taskCount: number` and `lastActivityAt: string | null`.
- Produces: `getWorkspaceBoards(workspaceId: string): Promise<BoardSummary[]>`.
- Consumed by: `BoardListClient` and the create-board POST response.

- [ ] **Step 1: Read the installed Next.js route-handler guide**

Read: `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`

Confirm the existing `NextResponse.json()` route contract remains current for Next.js 16.3.1.

- [ ] **Step 2: Extend the shared type**

Replace `BoardSummary` with:

```ts
export type BoardSummary = {
  id: string;
  name: string;
  createdAt: string;
  columnCount: number;
  taskCount: number;
  lastActivityAt: string | null;
};
```

- [ ] **Step 3: Run typecheck to expose incomplete producers**

Run: `npm run typecheck`

Expected: FAIL in `lib/boards.ts` and the create-board response because the new fields are missing.

- [ ] **Step 4: Select and derive task activity in `getWorkspaceBoards`**

Replace the Prisma selection and mapper in `lib/boards.ts` with:

```ts
export async function getWorkspaceBoards(
  workspaceId: string,
): Promise<BoardSummary[]> {
  const boards = await db.board.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { columns: true } },
      columns: {
        select: {
          _count: { select: { tasks: true } },
          tasks: {
            orderBy: { updatedAt: "desc" },
            take: 1,
            select: { updatedAt: true },
          },
        },
      },
    },
  });

  return boards.map((board) => {
    const activityDates = board.columns.flatMap((column) =>
      column.tasks.map((task) => task.updatedAt),
    );
    const lastActivityAt = activityDates.sort(
      (left, right) => right.getTime() - left.getTime(),
    )[0];

    return {
      id: board.id,
      name: board.name,
      createdAt: board.createdAt.toISOString(),
      columnCount: board._count.columns,
      taskCount: board.columns.reduce(
        (total, column) => total + column._count.tasks,
        0,
      ),
      lastActivityAt: lastActivityAt?.toISOString() ?? null,
    };
  });
}
```

- [ ] **Step 5: Complete the create-board response**

Add these fields beside `columnCount: 0`:

```ts
taskCount: 0,
lastActivityAt: null,
```

- [ ] **Step 6: Verify the contract**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: User Git checkpoint**

Suggested commit message for the user: `feat(board): add board activity summaries`

---

### Task 2: Add Admin Context And Operational Board Cards

**Files:**
- Modify: `app/(dashboard)/[workspaceSlug]/boards/page.tsx:25-98`
- Modify: `components/board/BoardListClient.tsx:13-200`

**Interfaces:**
- Consumes: `BoardSummary.taskCount` and `BoardSummary.lastActivityAt` from Task 1.
- Produces: `adminContact: { name: string; email: string } | null` prop.
- Preserves: existing create-board request and navigation behavior.

- [ ] **Step 1: Resolve member and admin context in the server page**

Change the workspace member selection to:

```ts
members: {
  orderBy: { createdAt: "asc" },
  select: {
    userId: true,
    role: true,
    user: { select: { name: true, email: true } },
  },
},
```

Replace the positional membership lookup with:

```ts
const currentMember = workspace.members.find(
  (member) => member.userId === session.user.id,
);
if (!currentMember) redirect("/workspaces");

const adminContact =
  workspace.members.find((member) => member.role === "ADMIN")?.user ?? null;
```

Pass the added prop:

```tsx
<BoardListClient
  adminContact={adminContact}
  initialBoards={boards}
  isAdmin={currentMember.role === "ADMIN"}
  workspaceId={workspace.id}
  workspaceSlug={workspace.slug}
/>
```

- [ ] **Step 2: Extend the client props and remove mobile-hostile autofocus**

Add to `BoardListClientProps`:

```ts
adminContact: { name: string; email: string } | null;
```

Destructure `adminContact`, then remove this line from the board-name input:

```tsx
autoFocus={boards.length === 0}
```

- [ ] **Step 3: Format activity without timers**

Add this module-level formatter after `inputClassName`:

```ts
const boardDateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
});
```

Replace each card's footer with:

```tsx
<div className="flex items-end justify-between gap-3 text-xs text-taskflow-muted">
  <span>{board.taskCount === 1 ? "1 task" : `${board.taskCount} tasks`}</span>
  {board.lastActivityAt ? (
    <time dateTime={board.lastActivityAt}>
      Updated {boardDateFormatter.format(new Date(board.lastActivityAt))}
    </time>
  ) : (
    <span>No task activity yet</span>
  )}
</div>
```

Give the board name safe wrapping:

```tsx
<span className="min-w-0 break-words text-base font-semibold leading-6 text-taskflow-ink">
  {board.name}
</span>
```

- [ ] **Step 4: Make the no-board states actionable**

Use this member message and action inside the empty state:

```tsx
{isAdmin ? (
  <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-taskflow-muted">
    Use the new board form to give this workspace a place for work to land.
  </p>
) : (
  <>
    <p className="mx-auto mt-2 max-w-[34ch] text-sm leading-6 text-taskflow-muted">
      {adminContact
        ? `${adminContact.name} can create the first board for this workspace.`
        : "Ask a workspace admin to create the first board."}
    </p>
    {adminContact ? (
      <a
        className="mt-4 inline-flex min-h-11 items-center justify-center rounded-lg px-4 text-sm font-semibold text-taskflow-brand transition-colors hover:bg-taskflow-blue-subtle hover:text-taskflow-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-taskflow-brand/30"
        href={`mailto:${adminContact.email}`}
      >
        Email {adminContact.name}
      </a>
    ) : null}
  </>
)}
```

- [ ] **Step 5: Put creation first only for an empty admin workspace on mobile**

Apply conditional order classes directly to the two existing regions:

```tsx
<section
  aria-labelledby="boards-heading"
  className={isAdmin && boards.length === 0 ? "order-2 lg:order-1" : undefined}
>
```

```tsx
<section
  className={`h-fit border border-taskflow-border bg-taskflow-surface p-5 sm:p-6 ${
    boards.length === 0 ? "order-1 lg:order-2" : ""
  }`}
  id="new-board"
>
```

- [ ] **Step 6: Verify the server/client boundary**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: User Git checkpoint**

Suggested commit message for the user: `feat(board): improve board discovery and empty states`

---

### Task 3: Apply Scoped Tokens And Stable Responsive Geometry

**Files:**
- Modify: `app/globals.css:7-49`
- Modify: `app/(dashboard)/[workspaceSlug]/boards/page.tsx:45-101`
- Modify: `components/board/BoardListClient.tsx:25-200`
- Modify: `app/(dashboard)/[workspaceSlug]/boards/loading.tsx:1-25`
- Modify: `app/(dashboard)/[workspaceSlug]/boards/error.tsx:7-34`
- Modify: `components/notifications/NotificationBadge.tsx:78-98`

**Interfaces:**
- Produces: Tailwind utilities `taskflow-canvas`, `taskflow-surface`, `taskflow-brand`, `taskflow-brand-hover`, `taskflow-ink`, `taskflow-muted`, `taskflow-muted-light`, `taskflow-muted-surface`, `taskflow-border`, `taskflow-blue-subtle`, `taskflow-danger`, `taskflow-danger-border`, and `taskflow-danger-surface`.
- Preserves: unrelated shadcn semantic tokens; scoped values may change only to meet
  the 4.5:1 text and 3:1 focus-indicator quality floor.

- [ ] **Step 1: Read the installed Next.js loading convention guide**

Read: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/loading.md`

Confirm the route-level fallback remains a Server Component and should not depend on session or loaded page data.

- [ ] **Step 2: Add scoped Baseteam theme colors**

Add inside `@theme inline` in `app/globals.css`:

```css
  --color-taskflow-canvas: #f9f8f6;
  --color-taskflow-surface: #ffffff;
  --color-taskflow-brand: #004bb0;
  --color-taskflow-brand-hover: #033476;
  --color-taskflow-ink: #0f172a;
  --color-taskflow-muted: #64738b;
  --color-taskflow-muted-light: #68778b;
  --color-taskflow-muted-surface: #f1f5f9;
  --color-taskflow-border: #e2e8f0;
  --color-taskflow-border-strong: #cbd5e1;
  --color-taskflow-blue-subtle: #e8f0fb;
  --color-taskflow-danger: #991b1b;
  --color-taskflow-danger-border: #b91c1c;
  --color-taskflow-danger-surface: #fef2f2;
```

- [ ] **Step 3: Replace literal board-surface colors**

In the page, client, loading, and error route files, make these mechanical replacements:

```text
bg-[#F9F8F6] -> bg-taskflow-canvas
bg-white -> bg-taskflow-surface
text-[#004BB0] -> text-taskflow-brand
bg-[#004BB0] -> bg-taskflow-brand
hover:bg-[#033476] -> hover:bg-taskflow-brand-hover
hover:text-[#033476] -> hover:text-taskflow-brand-hover
text-[#0F172A] -> text-taskflow-ink
text-[#64748B] -> text-taskflow-muted
text-[#94A3B8] -> text-taskflow-muted-light
border-[#E2E8F0] -> border-taskflow-border
border-[#CBD5E1] -> border-taskflow-border-strong
bg-[#E8F0FB] -> bg-taskflow-blue-subtle
bg-[#F1F5F9] -> bg-taskflow-muted-surface
text-[#991B1B] -> text-taskflow-danger
bg-[#FEF2F2] -> bg-taskflow-danger-surface
border-[#B91C1C]/20 -> border-taskflow-danger-border/20
focus-visible:ring-[#004BB0]/30 -> focus-visible:ring-taskflow-brand/60
focus-visible:ring-[#004BB0]/20 -> focus-visible:ring-taskflow-brand/60
```

Keep warning amber and low-emphasis slate literals that have no approved TaskFlow semantic token; do not expand this into a global palette migration.

- [ ] **Step 4: Replace the loading route with final-layout geometry**

Use this component body:

```tsx
export default function BoardListLoading() {
  return (
    <main
      aria-busy="true"
      aria-label="Loading boards"
      className="min-h-svh bg-taskflow-canvas px-5 py-6 sm:px-8 sm:py-8"
    >
      <div className="mx-auto w-full max-w-[1200px] animate-pulse">
        <div className="flex items-center justify-between border-b border-taskflow-border pb-5">
          <div className="h-5 w-40 bg-taskflow-border" />
          <div className="h-11 w-24 bg-taskflow-border" />
        </div>
        <div className="py-12 sm:py-16">
          <div className="h-12 w-72 max-w-full bg-taskflow-border" />
          <div className="mt-4 h-5 w-full max-w-lg bg-taskflow-border" />
          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div>
              <div className="h-14 border-b border-taskflow-border" />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[0, 1].map((item) => (
                  <div
                    className="h-32 border border-taskflow-border bg-taskflow-surface"
                    key={item}
                  />
                ))}
              </div>
            </div>
            <div className="h-72 border border-taskflow-border bg-taskflow-surface" />
          </div>
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Raise the shared notification touch target**

Change the notification trigger class from `size-9` to `size-11`:

```tsx
className="relative size-11 text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#004BB0]"
```

Do not restyle the notification popover in this task.

- [ ] **Step 6: Verify formatting and compilation**

Run: `npx prettier --write app/globals.css "app/(dashboard)/[workspaceSlug]/boards/page.tsx" components/board/BoardListClient.tsx "app/(dashboard)/[workspaceSlug]/boards/loading.tsx" "app/(dashboard)/[workspaceSlug]/boards/error.tsx" components/notifications/NotificationBadge.tsx`

Expected: Prettier completes without errors.

Run: `npm run lint`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 7: User Git checkpoint**

Suggested commit message for the user: `style(board): polish responsive boards layout`

---

### Task 4: Run Bounded Quality Verification And Update Project Records

**Files:**
- Modify: `TASK.md:109-119`
- Modify: `CHANGELOG.md:3-18`

**Interfaces:**
- Consumes: all completed UI and data changes.
- Produces: verified build evidence and project progress records.

- [ ] **Step 1: Run the Impeccable detector once across changed UI targets**

Run:

```powershell
node ".agents/skills/impeccable/scripts/detect.mjs" --json "app/(dashboard)/[workspaceSlug]/boards/page.tsx"
node ".agents/skills/impeccable/scripts/detect.mjs" --json "components/board/BoardListClient.tsx"
node ".agents/skills/impeccable/scripts/detect.mjs" --json "app/(dashboard)/[workspaceSlug]/boards/loading.tsx"
```

Expected: exit code `0` with `[]`, or exit code `2` with actionable findings to fix in one batch.

- [ ] **Step 2: Perform one bounded visual inspection pass**

When browser tooling is available, inspect desktop and mobile together, checking:

```text
Desktop: 1440x900
Mobile: 390x844
States: admin with boards, admin without boards, member without boards, loading
Checks: card wrapping, activity labels, mobile creation order, mail action, 44px bell target, skeleton geometry
```

Apply all discovered fixes in one batch, then perform at most one confirmation pass. If browser tooling is unavailable, record that limitation and do not create a custom screenshot loop.

- [ ] **Step 3: Run final repository verification**

Run: `npm run lint`

Expected: PASS.

Run: `npm run typecheck`

Expected: PASS.

Run: `npm run build`

Expected: PASS with a successful Next.js production build.

- [ ] **Step 4: Update the task tracker**

Add under Phase 6 in `TASK.md`:

```md
- [x] Polish the boards launcher with activity context, actionable permission states,
      mobile-first creation, stable loading geometry, and semantic surface tokens
```

- [ ] **Step 5: Update the changelog**

Add under `## Unreleased` in `CHANGELOG.md`:

```md
- Polished the workspace boards launcher with task activity context, direct admin
  contact for blocked members, improved mobile creation flow and touch targets,
  layout-matched loading states, and scoped TaskFlow color tokens.
```

- [ ] **Step 6: Inspect the final diff without modifying Git state**

Run: `git status --short`

Expected: only intended source, documentation, and the pre-existing `.impeccable/` snapshot changes appear.

Run: `git diff --check`

Expected: no whitespace errors.

- [ ] **Step 7: User Git checkpoint**

Suggested commit message for the user: `feat(board): polish workspace boards launcher`
