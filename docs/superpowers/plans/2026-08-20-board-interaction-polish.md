# Board Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the board detail screen faster to operate and reliable across pointer, touch, keyboard, and screen-reader input.

**Architecture:** Keep the App Router page as a Server Component and retain `BoardPageClient` as the interactive client boundary. Use shadcn-compatible Base UI primitives for dialogs and menus, while preserving the existing TanStack Query mutations and dnd-kit optimistic update flow.

**Tech Stack:** Next.js 16.3.1 App Router, React 19.2.8, TypeScript, Tailwind CSS 4, shadcn/ui 4.18.0, Base UI 1.7.0, TanStack Query 5, dnd-kit 6/10.

## Global Constraints

- Do not add a new major dependency, database field, route, or mutation contract.
- Do not overwrite the existing customized `components/ui/button.tsx` when adding shadcn primitives.
- Do not modify or revert unrelated dirty worktree changes.
- Do not run `git add`, `git commit`, or `git push`; the user owns all repository writes to Git history.
- Use the existing TaskFlow visual tokens and preserve the incumbent light dashboard identity.
- True deletion undo is out of scope because the current APIs hard-delete records.
- Run the Impeccable craft floor before UI edits and the detector after UI edits.

---

### Task 1: Add Accessible UI Primitives

**Files:**

- Create: `components/ui/dialog.tsx`
- Create: `components/ui/alert-dialog.tsx`
- Create: `components/ui/dropdown-menu.tsx`
- Preserve: `components/ui/button.tsx`

**Interfaces:**

- Produces: `Dialog`, `DialogContent`, `DialogClose`, `DialogTitle`, and `DialogDescription`.
- Produces: `AlertDialog`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogCancel`, and `AlertDialogAction`.
- Produces: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, and `DropdownMenuItem`.

- [ ] **Step 1: Preview the generated files and protect the existing button**

Run:

```powershell
npx shadcn@latest add dialog alert-dialog dropdown-menu --dry-run
```

Expected: three new UI files and one proposed `button.tsx` overwrite. Do not use `--overwrite`.

- [ ] **Step 2: Add the primitives without overwriting existing files**

Run:

```powershell
npx shadcn@latest add dialog alert-dialog dropdown-menu --yes
```

Expected: the three new files are created and the existing `button.tsx` remains behaviorally unchanged. If the CLI refuses to preserve `button.tsx`, stop and add only the three files from `npx shadcn@latest add <component> --view` using `apply_patch`.

- [ ] **Step 3: Apply TaskFlow styling to the generated shells**

Use the existing tokens rather than new colors:

```tsx
className = "fixed inset-0 z-50 bg-taskflow-ink/35";
```

```tsx
className =
  "rounded-xl border border-taskflow-border-strong bg-taskflow-surface text-taskflow-ink";
```

Keep Base UI's portal, backdrop, popup, title, description, and close composition intact so focus containment and restoration remain library-owned.

- [ ] **Step 4: Verify the primitive files**

Run:

```powershell
npx prettier components/ui/dialog.tsx components/ui/alert-dialog.tsx components/ui/dropdown-menu.tsx --write
npx eslint components/ui/dialog.tsx components/ui/alert-dialog.tsx components/ui/dropdown-menu.tsx
```

Expected: both commands exit 0.

---

### Task 2: Separate Task Opening From Dragging

**Files:**

- Modify: `components/board/TaskCard.tsx`
- Modify: `components/board/BoardColumn.tsx`

**Interfaces:**

- Consumes: the alert-dialog and dropdown-menu exports from Task 1.
- Preserves: `TaskCardProps` callbacks and dnd-kit sortable IDs/data.
- Produces: a card title button for opening and a dedicated grip button carrying `attributes` and `listeners`.

- [ ] **Step 1: Move task sortable controls to a dedicated handle**

Keep `setNodeRef`, transform, and transition on `<article>`, but remove `onClick`, `attributes`, and `listeners` from the article. Add:

```tsx
<Button
  aria-label={`Drag ${task.title}`}
  className="size-11 cursor-grab text-taskflow-muted hover:bg-taskflow-muted-surface hover:text-taskflow-brand active:cursor-grabbing sm:size-8"
  size="icon"
  type="button"
  variant="ghost"
  {...attributes}
  {...listeners}
>
  <GripVertical aria-hidden="true" />
</Button>
```

- [ ] **Step 2: Make task opening explicit and semantic**

Render the title as:

```tsx
<button
  className="min-w-0 text-left text-sm font-semibold leading-5 text-taskflow-ink hover:text-taskflow-brand focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-taskflow-brand/20"
  onClick={() => onOpen(task)}
  type="button"
>
  {task.title}
</button>
```

Keep edit and delete as sibling controls. Give icon controls `size-11 sm:size-8` classes so touch targets are 44px on mobile.

- [ ] **Step 3: Replace task deletion with an alert dialog**

Use local `isDeleteDialogOpen` state. The delete trigger opens a controlled `AlertDialog`; the destructive action closes the dialog and calls `onDelete(task.id)`. Copy must name the task and state that comments and attachments are also deleted.

```tsx
<AlertDialogTitle>Delete “{task.title}”?</AlertDialogTitle>
<AlertDialogDescription>
  This permanently deletes the task, its comments, and its attachments.
</AlertDialogDescription>
```

- [ ] **Step 4: Improve card metadata semantics**

Replace the due-date wrapper with:

```tsx
<time dateTime={task.dueDate}>{formattedDueDate}</time>
```

Use `text-taskflow-muted` for assignee, due-date, and unassigned metadata. Remove the non-interactive “Drag” label because the grip now communicates the action.

- [ ] **Step 5: Replace the column action popover**

Delete `isMenuOpen` and the custom absolute popover. Compose the existing action button with `DropdownMenuTrigger`, then render Rename and Delete as `DropdownMenuItem` entries. Opening Delete sets local `isDeleteDialogOpen`; an adjacent controlled alert dialog confirms that the column and all tasks are permanently deleted before calling `onDelete(column.id)`.

- [ ] **Step 6: Verify task and column interactions statically**

Run:

```powershell
npx prettier components/board/TaskCard.tsx components/board/BoardColumn.tsx --write
npx eslint components/board/TaskCard.tsx components/board/BoardColumn.tsx
```

Expected: both commands exit 0, with no nested interactive-element warnings or TypeScript-aware lint errors.

---

### Task 3: Harden Task Detail And Draft Closing

**Files:**

- Modify: `components/board/TaskDetailModal.tsx`

**Interfaces:**

- Consumes: dialog and alert-dialog exports from Task 1.
- Preserves: `TaskDetailModal` props and all existing query/mutation keys.
- Produces: `hasUnsavedWork = Boolean(body.trim()) || isEditing` and controlled close interception.

- [ ] **Step 1: Replace the custom modal shell**

Remove the document-level Escape effect and the custom backdrop `onMouseDown`. Render a controlled dialog:

```tsx
<Dialog
  open
  onOpenChange={(open, eventDetails) => {
    if (open) return;
    if (body.trim() || isEditing) {
      eventDetails.cancel();
      setIsDiscardDialogOpen(true);
      return;
    }
    onClose();
  }}
>
  <DialogContent showCloseButton={false} className="...">
    <DialogTitle>Task details for {detail?.title ?? task.title}</DialogTitle>
    <DialogDescription className="sr-only">
      Review task information, attachments, and comments.
    </DialogDescription>
  </DialogContent>
</Dialog>
```

Move the existing task-detail header, overview, attachments, comments, and toast markup inside `DialogContent` without changing their query or mutation paths. Keep the existing mobile bottom-sheet and desktop centered dimensions through `DialogContent` classes.

- [ ] **Step 2: Add discard confirmation**

Use a nested controlled alert dialog. Confirming sets `isDiscardDialogOpen(false)` and calls `onClose()`. Canceling returns focus to task detail.

```tsx
<AlertDialogTitle>Discard unfinished changes?</AlertDialogTitle>
<AlertDialogDescription>
  Your unsent comment or active task edits will be lost.
</AlertDialogDescription>
```

- [ ] **Step 3: Confirm attachment deletion accessibly**

Replace `window.confirm` with a controlled attachment target ID. The alert title names the file. Confirming closes the alert and calls `deleteAttachmentMutation.mutate(attachment.id)`.

- [ ] **Step 4: Clarify upload and task metadata**

Add visible helper text before the attachment list:

```tsx
<p className="mt-2 text-xs text-taskflow-muted">Maximum file size: 25 MB.</p>
```

Map `LOW`, `MEDIUM`, `HIGH`, and `URGENT` to title-case display labels. Keep the current raw enum values in API state.

- [ ] **Step 5: Improve modal touch targets and contrast**

Use `size-11 sm:size-8` for close and attachment-delete controls, and replace touched `#94A3B8` metadata with `text-taskflow-muted`.

- [ ] **Step 6: Verify task detail statically**

Run:

```powershell
npx prettier components/board/TaskDetailModal.tsx --write
npx eslint components/board/TaskDetailModal.tsx
```

Expected: both commands exit 0 and no manual document key listener remains.

---

### Task 4: Distill The Board-First Hierarchy

**Files:**

- Modify: `app/(dashboard)/[workspaceSlug]/boards/[boardId]/page.tsx`
- Modify: `components/board/BoardPageClient.tsx`

**Interfaces:**

- Preserves: the Server Component authentication/data-fetching path and `BoardPageClient initialBoard` prop.
- Produces: local `showFilters: boolean` state and `hasStructuredFilters: boolean` derived from assignee, column, and due-date filters through `lib/board-ui.mjs`.

- [ ] **Step 1: Compact the route-level board header**

Remove the generic descriptive paragraph. Reduce section spacing from `py-10 sm:py-14` to `py-7 sm:py-9`, reduce title size to `text-3xl sm:text-4xl`, and keep the board name, “Kanban board” label, and workspace-settings link.

- [ ] **Step 2: Remove the duplicate board-flow introduction**

Delete the “Board flow” label and drag instruction. Keep the create-column form as the first operational control and change its submit copy from “Column” to “Add column”.

- [ ] **Step 3: Add progressive filter disclosure**

Add:

```tsx
const [showFilters, setShowFilters] = useState(false);
const hasStructuredFilters =
  filters.assigneeId !== "ALL" ||
  filters.columnId !== "ALL" ||
  filters.dueDate !== "ALL";
const filtersVisible = showFilters || hasStructuredFilters;
```

Keep search, task count, filter toggle, and clear action in the always-visible row. Render the three selects and the reorder warning only when `filtersVisible` is true. The toggle uses `aria-expanded={filtersVisible}` and copy “Filters”/“Hide filters”.

- [ ] **Step 4: Preserve filtered DnD behavior**

Do not change `hasActiveTaskFilters`, `sensors={hasActiveFilters ? [] : sensors}`, or the clear-filter behavior. Confirm that hidden structured filters remain visible whenever active.

- [ ] **Step 5: Verify the board shell statically**

Run:

```powershell
npx prettier "app/(dashboard)/[workspaceSlug]/boards/[boardId]/page.tsx" components/board/BoardPageClient.tsx --write
npx eslint "app/(dashboard)/[workspaceSlug]/boards/[boardId]/page.tsx" components/board/BoardPageClient.tsx
```

Expected: both commands exit 0.

---

### Task 5: Verify And Record The Completed Polish Pass

**Files:**

- Modify: `TASK.md`
- Modify: `CHANGELOG.md`
- Inspect: all files changed by Tasks 1-4

**Interfaces:**

- Consumes: the completed board interaction changes.
- Produces: verified repository state and project progress documentation.

- [ ] **Step 1: Run full formatting verification**

Run:

```powershell
npm run format:check
```

Expected: exit 0. If unrelated dirty files fail formatting, format only files from this plan and report the unrelated failures without rewriting those files.

- [ ] **Step 2: Run lint and typecheck**

Run:

```powershell
npm run lint
npm run typecheck
```

Expected: both commands exit 0.

- [ ] **Step 3: Run the production build**

Run:

```powershell
npm run build
```

Expected: Next.js 16 production compilation and route generation complete successfully.

- [ ] **Step 4: Run the Impeccable detector on changed UI targets**

Run:

```powershell
node .claude/skills/impeccable/scripts/detect.mjs --json "app/(dashboard)/[workspaceSlug]/boards/[boardId]/page.tsx"
node .claude/skills/impeccable/scripts/detect.mjs --json components/board
node .claude/skills/impeccable/scripts/detect.mjs --json components/ui
```

Expected: exit 0 with no findings, or exit 2 only for reviewed false positives that are documented in the final response.

- [ ] **Step 5: Perform one bounded responsive review**

Inspect desktop and mobile once in the available browser tool. Verify board-first hierarchy, filter disclosure, dedicated drag handles, dialog focus/close behavior, discard confirmation, destructive confirmations, touch targets, and horizontal column scrolling. Fix all observed defects in one batch, then perform at most one confirmation pass.

If browser automation remains unavailable, record that limitation and inspect responsive classes and interaction ownership directly in the changed source.

- [ ] **Step 6: Update project documentation after verification**

Add this checked item under Phase 6 in `TASK.md`:

```markdown
- [x] Polish board detail interactions with dedicated drag handles, accessible
      dialogs/menus, safer destructive actions, progressive filters, and a
      board-first responsive hierarchy
```

Append this entry under `CHANGELOG.md` Unreleased without changing existing entries:

```markdown
- Polished the board detail experience with dedicated task drag handles,
  accessible dialogs and column menus, safer destructive and draft-discard
  actions, progressive filters, stronger mobile targets, and a board-first layout.
```

- [ ] **Step 7: Inspect the final diff**

Run:

```powershell
git status --short
```

Expected: only intended files from this plan plus pre-existing user changes are present. Do not stage or commit anything.
