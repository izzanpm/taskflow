# Boards Page Polish Design

## Goal

Resolve all five findings from the boards-page critique while preserving TaskFlow's
existing authenticated visual language and keeping the page optimized for workspaces
with fewer than ten boards.

## Scope

The polish covers:

1. More recognizable board cards.
2. An actionable member empty state.
3. A clearer mobile first-use flow and accessible touch targets.
4. A loading skeleton that matches the final layout.
5. Semantic TaskFlow color tokens for the boards surface.

Search, sorting, favorites, board grouping, schema changes, and a global dashboard
restyle are explicitly out of scope.

## Board Summary Data

`getWorkspaceBoards()` will continue to be the single server-side source for board
summaries. Its Prisma selection will include:

- The existing board identity and timestamps.
- Column count.
- Task count across all columns.
- The most recently updated task in each column.

One small pure mapper will derive `taskCount` and `lastActivityAt` from the selected
columns. `lastActivityAt` is the newest selected task `updatedAt` value and remains
`null` when a board has no tasks. `BoardSummary` and the create-board response will
add both fields; a newly created board returns `0` and `null`.

This calculation uses existing relations and timestamps. It does not change
`PRD.md`, Prisma models, or migrations.

## Board Cards

The board grid remains a simple two-column launcher on larger screens and a single
column on mobile. Each card contains:

- A board name that wraps safely without colliding with the arrow.
- A compact task count.
- A date-based activity label: `Last task update <date>` when activity exists, or
  `No task activity yet` when it does not.
- The existing directional arrow and restrained hover/focus treatment.

Dates use `Intl.DateTimeFormat` rather than a custom relative-time implementation.
This keeps output deterministic and avoids timer-driven client updates. Search and
sorting are intentionally omitted because the agreed target is fewer than ten
boards.

## Empty And Permission States

The page query will load workspace members once, identify the signed-in membership,
and select the first admin using the same earliest-membership convention already used
by the workspace hub.

For a member with no boards, the empty state will name that admin and expose a direct
`mailto:` action when an admin email is available. The existing access panel remains
as supporting context.

For an admin with no boards, the creation panel moves before the empty list on mobile
through responsive ordering. The empty state copy points to the creation form without
duplicating a second form. Input autofocus is removed so mobile users receive page
context before the keyboard opens.

## Responsive And Accessibility Behavior

- The board creation panel is first on mobile only when the admin has no boards; the
  established list-first desktop composition remains unchanged.
- Notification icon buttons use a minimum 44 by 44 pixel target across authenticated
  pages.
- Existing semantic sections, labels, links, focus rings, and live error messaging
  remain intact.
- Long board names wrap with bounded line height and preserve arrow placement.
- Error messages continue to preserve the entered board name.

## Loading State

The boards loading route will mirror the resolved page:

- Full-width header divider and representative navigation placeholders.
- Heading and supporting-copy placeholders.
- Main content grid using the same `minmax(0, 1fr) 19rem` desktop columns.
- Two board-card placeholders in the list region.
- One creation-panel placeholder in the sidebar region.

Because the route-level fallback does not know the user's role or whether boards
exist, mobile loading uses the common list-first order. Its dimensions and desktop
geometry still match the resolved page, avoiding the current three-column reflow.

## Visual Tokens

`app/globals.css` will expose narrowly named Tailwind theme colors for the existing
Baseteam values: canvas, surface, brand, brand-hover, ink, muted text, light border,
subtle blue, danger, and danger surface.

The boards page, board-list client, loading state, and error state will replace
repeated literal colors with those names. Where the incumbent muted text and focus
ring values miss the Impeccable contrast floor, the scoped tokens may be minimally
adjusted to meet 4.5:1 text and 3:1 focus-indicator contrast. The existing shadcn
semantic palette and unrelated screens remain untouched, avoiding a global visual
migration during a focused polish task.

## Error Handling

Existing API and form error behavior remains authoritative. The added summary fields
are always returned for successful board creation and board listing. A missing admin
contact degrades to the current plain instruction rather than hiding the empty state
or inventing contact information.

## Verification

- Keep the activity derivation inline and small; no test dependency is added because
  the project does not currently install a test runner and the user declined a new
  dependency for this polish.
- Run ESLint, TypeScript typecheck, and the production build.
- Run the Impeccable detector against the changed UI targets.
- Inspect desktop and mobile together in one bounded visual pass when browser tooling
  is available, apply one batch of fixes, and perform at most one confirmation pass.
- If browser tooling remains unavailable, report that limitation and use source,
  detector, lint, typecheck, tests, and build as the fallback evidence.

## Documentation

Add one completed Phase 6 boards-page polish item to `TASK.md` and one matching entry
under `CHANGELOG.md` Unreleased. No dependency, API-route, or schema documentation
change is required.
