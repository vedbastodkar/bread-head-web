# Teacher General Content Authoring — Design

**Date:** 2026-07-10
**Status:** Approved for planning
**Related:** Gotcha G8 (`.claude/gotchas.md`)

## Problem

Teacher content authoring is **class-scoped**. Every content page lives under
`/dashboard/[classId]/…`, so a lesson set / journal prompt / Budget Challenge is
authored in the context of one class. To assign the same content to a second
class, the teacher must switch the active class in the sidebar and re-author it
from scratch.

The three content pages are also **inconsistent**:

- **Course** (`/course`) has a unified Lesson/Journal/**Challenge** composer and
  is the *only* place a challenge can be assigned.
- **Journal** (`/journal`) has its own composer — so journals are assignable in
  **two** places.
- **Challenges** (`/challenges`) has **no composer** (review-only) and is the one
  page that already leads with "what's assigned."

And the "what's currently assigned" list is buried beside/below the composer
instead of leading the page.

## Goals

1. Content pages are **class-agnostic**: author once, assign to many classes.
2. Every content page follows one skeleton: **currently-assigned first, assign
   area second.**
3. Assign to **multiple classes at once, each with its own due date.**
4. Optional **student-by-student** targeting, collapsed by default (low noise).
5. Consistency: challenges get a real composer; journal stops being assignable
   in two places.
6. The per-class page stays the **analytics** view (heatmap etc.) and gains a
   single-class **Quick assign** shortcut.

## Non-goals

- No Firestore data-model change (assignments stay one-doc-per-class).
- No "edit content everywhere at once" — editing remains per-class.
- No new batch API endpoint (client fans out to the existing per-class route).
- No changes to the student-facing experience or the challenge/journal solvers.

## Navigation model (two-tier)

The teacher sidebar is reorganized so content is global and classes are a
drill-in:

```
─ Content ───────────      (class-agnostic, always visible)
  📖 Lessons
  ✏️ Journal
  🎯 Challenges
─ Classes ───────────      (click a class → its analytics page)
  Period 3
  Period 5
─ Account ───────────
  All classes / Settings / Sign out
```

The `Content` group no longer depends on a selected class. The `Classes` group
lists active classes; clicking one opens `/dashboard/[classId]` (analytics +
Quick assign). Per-class content routes are retired.

## Routing

**New general routes:**

- `/dashboard/content/lessons` — curriculum browser + lesson assign
- `/dashboard/content/journal` — journal composer
- `/dashboard/content/challenges` — challenge composer + review

**Retired (redirect to the general equivalent):**

- `/dashboard/[classId]/course` → `/dashboard/content/lessons`
- `/dashboard/[classId]/journal` → `/dashboard/content/journal`
- `/dashboard/[classId]/challenges` → `/dashboard/content/challenges`

Keep `/dashboard/[classId]` (analytics), `/roster`, `/settings`,
`/parent-letter`, `/[studentUid]`, `/handout` as-is.

## Page skeleton (all three content pages)

1. **Currently assigned (top).** All assignments of that type across *all* the
   teacher's classes. Assignments that share the same content identity collapse
   into **one grouped row** (SwiftUI-`Section`-style "same chunk") listing each
   target class with its per-class due date and a summed completion count, e.g.:

   ```
   Budget Challenge #1
   ├ Period 3 · due Sep 10 · 8/28 complete   [Edit] [Remove]
   └ Period 5 · due Sep 12 · 4/26 complete   [Edit] [Remove]
   ```

   Content assigned to a single class renders as a single-class row. Empty state:
   "Nothing assigned yet."
2. **Assign area (beneath).** The composer for that content type.

**Content identity for grouping:**

- Challenge → `challengeId`
- Journal → normalized `title` + question-set (join of trimmed questions)
- Lesson → sorted `lessonIds` join

## Targeting model (assign area)

- **Class multi-select.** Each checked class reveals its own **due-date** picker.
- **Default = whole class** for every selected class; no student lists shown.
- **"Choose specific students" toggle** at the top of the target area, **off by
  default.** When on, each selected class **expands to reveal its student
  checkboxes**, so targeting can be narrowed per class. Off = whole class.
- Validation mirrors today's rules: at least one class selected; in
  specific-students mode, each targeted class needs ≥1 student.

## Assign API — client fan-out (approach A)

No new endpoint. On submit, the composer iterates the selected classes and calls
the existing `POST /api/classes/[classId]/assign` once per class with:

- the shared content payload (type + lessonIds/journal/challengeId + title),
- that class's `dueDate`,
- `scope: 'students'` + that class's `studentUids` when the specific-students
  toggle is on for that class, otherwise `scope: 'class'`.

A small client helper runs the calls and reports **per-class success/failure**,
e.g. "Assigned to 2 of 3 classes — Period 5 failed: <reason>." Partial success
is allowed (the succeeded classes keep their assignment).

**Editing/removing** is per-class from the grouped list: each class row uses the
existing `PATCH`/`DELETE /api/classes/[classId]/assign?id=…` by assignment id.

## Class page — Quick assign

`/dashboard/[classId]` keeps its analytics (needs-attention, roster table,
unit-completion heatmap) and gains a compact **Quick assign** card: choose a
content type → pick existing content or author inline → set a due date → assign
**to this class only.** It is the single-class shortcut; the general pages own
multi-class fan-out.

## Phasing

Each phase must pass `npm run build` and the 21 Playwright visual tests (and
`npm run test:update` after any intentional visual change) before the next.

- **Phase 1 — Nav + page reshape (single-class assign).** Two-tier sidebar; three
  general pages, each *assigned-first then assign-area*, assigning to one class
  via a class dropdown; retire per-class content routes (redirects). Fixes
  "assigned buried," "challenges has no composer," and the inconsistency.
- **Phase 2 — Multi-class fan-out.** Class multi-select + per-class due dates +
  "choose specific students" toggle + the client fan-out helper with per-class
  result reporting.
- **Phase 3 — Class-page Quick assign card.**

## Testing

- `npm run build` (zero errors) + `npx playwright test` (21 pass) before every
  commit, per CLAUDE.md.
- Regenerate snapshots with `npm run test:update` after intentional visual
  changes and commit them with the code.
- Manual verification with the demo teacher account across ≥2 classes: fan-out
  creates one assignment per class with correct per-class due dates; grouped row
  reflects both; partial-failure message renders; retired routes redirect.

## Open items / risks

- **Partial fan-out failure** UX must be explicit (which classes succeeded).
- **Grouping false-merges:** two genuinely different journals with identical
  title+questions would group together — acceptable; identity is content, not
  doc id.
- Any external links / bookmarks to the old per-class content routes rely on the
  redirects.
