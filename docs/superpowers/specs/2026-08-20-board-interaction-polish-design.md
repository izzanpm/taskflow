# Board Interaction Polish Design

## Goal

Make the board detail screen faster to operate, safer during destructive or draft-losing actions, and reliable across pointer, touch, keyboard, and screen-reader input.

## Scope

This pass addresses all five issues from the board critique:

1. Accessible task-detail and confirmation dialogs.
2. A dedicated task drag handle separated from task opening.
3. Larger touch targets and stronger metadata contrast.
4. A compact, board-first page hierarchy with progressively disclosed filters.
5. Clear confirmation before destructive actions and before discarding task-detail drafts.

The pass does not change the database schema, route handlers, mutation contracts, or hard-delete behavior. True deletion undo is out of scope because the current APIs do not support restoration.

## Components

### Shared UI Primitives

Add the missing shadcn-compatible dialog, alert-dialog, and dropdown-menu primitives on top of the already-installed `@base-ui/react` package. Do not add another component library. If the shadcn CLI requires a new dependency, stop and request approval before installing it.

The primitives own focus containment, Escape handling, focus restoration, modal scroll behavior, menu keyboard navigation, and accessible labeling.

### Board Page Hierarchy

`app/(dashboard)/[workspaceSlug]/boards/[boardId]/page.tsx` becomes a compact operational header:

- Keep the breadcrumb, board name, and workspace-settings link.
- Remove the generic board-description paragraph.
- Reduce vertical spacing and display size so the board appears earlier.

`BoardPageClient` removes the duplicate “Board flow” introduction. Search remains visible. Assignee, column, and due-date filters are hidden behind a labeled filter toggle and remain expanded while any structured filter is active. The task count and clear-filter action stay visible.

### Task Cards

The sortable node remains the card, but sortable attributes and listeners move to a dedicated grip button with a minimum 44px touch target. The card container no longer handles click or drag events.

The task title is a semantic button that opens task detail. Edit and delete remain separate labeled controls with mobile-safe touch targets. This removes click-versus-drag ambiguity while preserving pointer, touch, and keyboard sorting.

Task dates use `<time>`, priority labels remain human-readable, and operational metadata uses the existing TaskFlow muted color rather than the lower-contrast light-muted value.

### Column Actions

Replace the custom absolute action popover with the shared dropdown-menu primitive. Rename and delete keep their existing behavior, but gain standard focus, Escape, outside-click, and keyboard handling.

Column deletion opens a shared alert dialog that names the column and states that its tasks will also be deleted.

### Task Detail

Replace the custom modal shell with the shared dialog primitive. Keep the existing responsive bottom-sheet treatment on mobile and centered dialog on larger screens.

Closing is allowed immediately when there is no unfinished work. If the comment body is non-empty or task editing is active, closing opens a discard confirmation. Confirming discards local state and closes; canceling returns focus to the task detail.

Attachment deletion uses an alert dialog naming the file. The 25 MB file limit is visible before upload. Priority values display through the existing human-readable labels.

### Task Deletion

Task deletion uses an alert dialog that names the task and explains that comments and attachments are also removed. Confirming invokes the existing mutation; canceling leaves board state unchanged.

## Data Flow

Existing TanStack Query mutations remain the single mutation path. Dialogs collect intent only and call the current handlers after confirmation. DnD optimistic updates and rollback behavior remain unchanged.

No new global state is introduced. Filter disclosure, pending confirmation targets, and draft-close confirmation use local component state.

## Error Handling

Existing mutation alerts and toasts remain. Confirmation dialogs disable their destructive action while the associated mutation is pending where that pending state is available.

Failed mutations keep the relevant surface open and display the existing server-derived error. Closing task detail never clears a non-empty comment draft without explicit confirmation.

## Responsive And Accessibility Requirements

- Interactive icon targets are at least 44px on touch layouts and remain compact visually through icon sizing.
- Dialogs have accessible titles and descriptions.
- Menus and dialogs are keyboard navigable and restore focus to their trigger.
- Focus indicators use the existing TaskFlow/shadcn ring treatment.
- The board remains horizontally scrollable on narrow screens.
- Filter disclosure is operable and announced through `aria-expanded` semantics supplied by the primitive or trigger.

## Verification

Run Prettier on changed files, ESLint, Next route type generation plus TypeScript, and the production build. Run the Impeccable detector against every changed UI target. Inspect desktop and mobile responsive states in one bounded pass when browser tooling is available; otherwise record the unavailable runtime inspection and perform a source-level responsive review.

No new test framework will be installed for this pass. Existing automated test infrastructure does not currently include Vitest or Playwright commands.

## Documentation

Add a completed Phase 6 board interaction-polish item to `TASK.md` only after verification passes. Append the corresponding summary under `CHANGELOG.md` Unreleased without overwriting concurrent changes.
