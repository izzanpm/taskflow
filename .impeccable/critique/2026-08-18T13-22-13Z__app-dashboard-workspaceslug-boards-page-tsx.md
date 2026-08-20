---
target: halaman boards
total_score: 23
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-08-18T13-22-13Z
slug: app-dashboard-workspaceslug-boards-page-tsx
---
# Boards Page Critique

## Design Health Score

| # | Heuristic | Score | Key issue |
|---|---|---:|---|
| 1 | Visibility of System Status | 3 | Submission and errors are visible, but the loading skeleton does not match the final composition. |
| 2 | Match System / Real World | 3 | Copy is natural, but board cards lack meaningful project context. |
| 3 | User Control and Freedom | 2 | Navigation exits exist; creation has no undo or recovery path. |
| 4 | Consistency and Standards | 2 | The page is internally coherent but bypasses semantic design tokens. |
| 5 | Error Prevention | 3 | Trimming, minimum/maximum length, and disabled submission provide useful guardrails. |
| 6 | Recognition Rather Than Recall | 3 | Actions are labeled, but similarly named boards are difficult to distinguish. |
| 7 | Flexibility and Efficiency | 1 | No search, sorting, recency, favorites, or expert accelerator exists. |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and focused, but generic and under-informative. |
| 9 | Error Recovery | 2 | Errors preserve input and use plain language, but recovery guidance is generic. |
| 10 | Help and Documentation | 1 | Permission-dependent states provide no contextual route to assistance. |
| **Total** | | **23/40** | **Acceptable: significant improvement needed** |

## Design Specificity Verdict

The surface has a coherent TaskFlow shell through its warm canvas, serif heading, restrained royal blue, and role-aware copy. The actual board chooser is category-interchangeable: identical white cards expose only a name and column count, so TaskFlow's promise of collaborative work in motion disappears at the moment users choose where to work.

The deterministic scan returned zero findings for both `app/(dashboard)/[workspaceSlug]/boards/page.tsx` and `components/board/BoardListClient.tsx`. This confirms that no bundled anti-pattern rule fired; it does not invalidate the structural UX issues found in the design assessment. Browser automation was unavailable, so no reliable live overlay or screenshot evidence exists for this run.

## Overall Impression

The page is calm, readable, and technically disciplined, but it behaves like a small static launcher rather than an operational command point. Its biggest opportunity is to make each board recognizable and actionable without adding dashboard clutter.

## What's Working

- Semantic structure is strong: labeled sections, real links, labels, visible focus treatment, and announced errors support keyboard and assistive-technology use.
- Role-aware presentation avoids misleading members with controls they cannot use and explains who controls board creation.
- The layout follows the authenticated light-surface guidance in `DESIGN.md`; hierarchy from workspace title to list and creation panel is easy to scan.

## Cognitive Load

Moderate: 3 of 8 checks fail. Chunking breaks down as the unbounded grid grows; minimal choices fails once more than four equally weighted boards are visible; working memory is required because cards provide too little information to distinguish similar boards. Grouping, hierarchy, single focus, one-at-a-time creation, and progressive disclosure are otherwise sound.

## Emotional Journey

Arrival is calm and well oriented. Board selection becomes an emotional flat spot because every board looks equally important. Admin creation ends positively through immediate navigation, but the member empty state is the deepest valley: it tells the user to ask an admin without identifying one or providing a next step. Generic failure copy communicates the problem but does little to restore confidence.

## Priority Issues

### [P1] Board selection requires memory instead of recognition

**Why it matters:** Cards at `components/board/BoardListClient.tsx:93-116` show only name and column count. Users with similarly named or numerous boards must guess which contains active work.

**Fix:** Replace low-value column count with one operational signal such as last activity, and add a compact collaborator or task cue only if existing data supports it. Add search when real board volume warrants it.

**Suggested command:** `$impeccable clarify`

### [P1] The member empty state is a dead end

**Why it matters:** `components/board/BoardListClient.tsx:118-131` tells members to ask an admin but offers no admin identity, contact action, or route. A blocked user must leave the product and know whom to contact.

**Fix:** Identify workspace admins and provide one direct escalation action, or link to the member list if contact details are available there.

**Suggested command:** `$impeccable onboard`

### [P2] Mobile first-use flow fights the primary action

**Why it matters:** The empty state precedes the creation panel in DOM order, while the empty input autofocuses. On mobile the keyboard can open before users understand the screen, and the creation action remains below the explanatory state.

**Fix:** Put a creation affordance directly in the admin empty state, disable autofocus on narrow/touch contexts, and verify all header targets meet the 44px touch baseline.

**Suggested command:** `$impeccable adapt`

### [P2] Loading composition does not resemble the loaded page

**Why it matters:** The loading route uses equal columns while the resolved page uses a board grid plus a fixed-width sidebar. The transition recomposes rather than filling stable placeholders.

**Fix:** Mirror the final list/sidebar geometry and approximate the header and first cards in the skeleton.

**Suggested command:** `$impeccable polish`

### [P3] The implementation bypasses semantic design tokens

**Why it matters:** Repeated literal colors in the page and client component are coherent today but make drift likely as authenticated surfaces multiply. The documented Inter UI face is also not loaded.

**Fix:** Map the existing Baseteam palette to semantic variables and decide whether controls truly need Inter or whether `DESIGN.md` should standardize on the loaded body face.

**Suggested command:** `$impeccable document`

## Persona Red Flags

**Alex, power user:** No recency, sorting, favorites, or keyboard accelerator; every board has equal weight, making larger workspaces a slow linear scan.

**Sam, accessibility-dependent user:** The core page has good semantics, but intended error focus is never applied, and compact header controls need live verification for focus behavior and motor-accessible hit areas.

**Casey, distracted mobile user:** Creation sits below the board list, autofocus may raise the keyboard immediately, and there is no interruption-resistant recent-board cue.

## Minor Observations

- The workspace breadcrumb links to settings rather than a workspace home or boards index, which is not apparent from its label.
- The decorative grid icon beside the section heading adds little information.
- Long board names have no explicit truncation or wrapping strategy.
- The terminal period in the workspace heading adds editorial character but may feel mannered in repeated product UI.

## Questions to Consider

- If column count disappeared, what single signal would best answer, "Where does my attention belong now?"
- Should a blocked member merely understand the restriction, or should TaskFlow actively connect them to the admin who can unblock them?
- Is this page intentionally optimized for workspaces with fewer than ten boards, or must it scale beyond that now?
