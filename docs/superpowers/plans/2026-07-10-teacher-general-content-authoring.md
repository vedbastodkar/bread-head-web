# Teacher General Content Authoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make teacher content (Lessons/Journal/Challenges) class-agnostic — authored once, each page leading with "what's currently assigned," then assigned to multiple classes with per-class due dates.

**Architecture:** New top-level `/dashboard/content/{lessons,journal,challenges}` pages replace the per-class content routes. A two-tier sidebar exposes global Content + a Classes drill-in. Assignments stay one-doc-per-class; the general composer fans out to the existing `POST /api/classes/[classId]/assign` once per selected class (client-side, approach A). Pure logic (content grouping, fan-out) is extracted into unit-tested `lib/dashboard/` helpers.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Tailwind v3, Firebase (client + admin), Playwright visual regression, Vitest-style unit tests under `tests/unit/`.

## Global Constraints

- `npm run build` must pass with zero errors before every commit (CLAUDE.md).
- `npx playwright test` — all 21 visual regression tests must pass before every commit; run `npm run test:update` after any intentional visual change and commit the snapshots (CLAUDE.md).
- No Firestore data-model change; assignments remain at `classes/{classId}/assignments/{id}`.
- Reuse the existing `POST/PATCH/DELETE /api/classes/[classId]/assign` route — do NOT add a batch endpoint.
- Follow existing page patterns (`useDashboard()`, `DashboardShell`, `apiCall`); match Tailwind token usage in `tailwind.config.js` (brandGreen, bgSage, textTitle, accentGold).
- Commit only when the plan step says to; never sweep unrelated pre-existing working-tree changes into a commit (`git add` exact paths only).
- Spec: `docs/superpowers/specs/2026-07-10-teacher-general-content-authoring-design.md`.

---

## File Structure

**Create:**
- `lib/dashboard/contentGrouping.ts` — pure: content identity + group assignments across classes.
- `lib/dashboard/completion.ts` — pure: lesson vs journal/challenge completion counts (extracted from the current course page).
- `lib/dashboard/assignFanout.ts` — client fan-out over selected classes (Phase 2).
- `app/dashboard/content/lessons/page.tsx` — general Lessons page.
- `app/dashboard/content/journal/page.tsx` — general Journal page.
- `app/dashboard/content/challenges/page.tsx` — general Challenges page (new composer + review).
- `app/dashboard/content/AssignedGroups.tsx` — shared "Currently assigned" grouped list (SwiftUI-Section style).
- `app/dashboard/content/ClassTargetPicker.tsx` — shared class multi-select + per-class due date + "choose specific students" toggle (Phase 2).
- `tests/unit/contentGrouping.spec.ts`, `tests/unit/assignFanout.spec.ts` — unit tests.

**Modify:**
- `app/dashboard/DashboardShell.tsx` — two-tier sidebar (global Content group + Classes drill-in).
- `app/dashboard/[classId]/course/page.tsx` → replace body with server redirect to `/dashboard/content/lessons`.
- `app/dashboard/[classId]/journal/page.tsx` → server redirect to `/dashboard/content/journal`.
- `app/dashboard/[classId]/challenges/page.tsx` → server redirect to `/dashboard/content/challenges`.
- `app/dashboard/[classId]/page.tsx` — add "Quick assign" card (Phase 3).

---

# PHASE 1 — Nav + page reshape (single-class assign)

Delivers the two-tier sidebar and three general pages (assigned-first, then an assign area that assigns to ONE class via a dropdown). Fixes buried-assigned, challenges-has-no-composer, and journal-assignable-twice.

## Task 1: Pure completion helpers

**Files:**
- Create: `lib/dashboard/completion.ts`
- Test: `tests/unit/completion.spec.ts`

**Interfaces:**
- Produces:
  - `lessonCompletion(a: Assignment, students: Student[]): { done: number; total: number }`
  - `statusCompletion(a: Assignment, students: Student[]): { done: number; total: number }` (journal + challenge — status === 'complete')
  - `completionFor(a: Assignment, students: Student[]): { done: number; total: number }` (dispatches by `a.type`)

- [ ] **Step 1: Write failing test** `tests/unit/completion.spec.ts` (Playwright test runner — same as all `tests/unit/*.spec.ts`; flat `test()`, relative imports, no `@/` alias, no `vi`)

```ts
import { test, expect } from '@playwright/test'
import { completionFor } from '../../lib/dashboard/completion'
import type { Assignment, Student } from '../../app/dashboard/useDashboard'

const student = (uid: string, completed: string[] = []): Student => ({
  uid, name: uid, completedLessons: completed, currentUnit: 1, currentLesson: 1, xp: 0, level: 1, lastActive: null,
})

test('completionFor: class-scope lesson completion when all lessonIds done', () => {
  const a = { id: 'a', type: 'lesson', lessonIds: ['u1l1', 'u1l2'], scope: 'class', studentUids: [], dueDate: null,
    submissions: { s1: { status: 'in_progress', submittedAt: null, completedLessonIds: ['u1l1', 'u1l2'] } } } as Assignment
  expect(completionFor(a, [student('s1'), student('s2')])).toEqual({ done: 1, total: 2 })
})

test('completionFor: journal completion by status complete over targeted students only', () => {
  const a = { id: 'a', type: 'journal', lessonIds: [], scope: 'students', studentUids: ['s1'], dueDate: null,
    journal: { questions: ['q'], minWords: 0, minSeconds: 0 },
    submissions: { s1: { status: 'complete', submittedAt: null } } } as Assignment
  expect(completionFor(a, [student('s1'), student('s2')])).toEqual({ done: 1, total: 1 })
})
```

- [ ] **Step 2: Run test, verify it fails** — `npx playwright test tests/unit/completion.spec.ts` → FAIL (module not found). (Runs under all 3 viewport projects; pure logic, no browser.)
- [ ] **Step 3: Implement** `lib/dashboard/completion.ts` by lifting the `completion` + `journalCompletion` logic from `app/dashboard/[classId]/course/page.tsx:247-265`, parameterized on a `students` array (target-student filtering by scope stays identical). `completionFor` dispatches: `type === 'journal' || type === 'challenge'` → `statusCompletion`, else `lessonCompletion`.
- [ ] **Step 4: Run test, verify pass** — `npx playwright test tests/unit/completion.spec.ts` → PASS.
- [ ] **Step 5: Commit** — `git add lib/dashboard/completion.ts tests/unit/completion.spec.ts && git commit -m "feat(dashboard): extract pure completion helpers"`

## Task 2: Content grouping helper

**Files:**
- Create: `lib/dashboard/contentGrouping.ts`
- Test: `tests/unit/contentGrouping.spec.ts`

**Interfaces:**
- Consumes: `completionFor` (Task 1), `ClassData`/`Assignment` from `@/app/dashboard/useDashboard`.
- Produces:
  - `contentIdentity(a: Assignment): string`
  - `type ContentType = 'lesson' | 'journal' | 'challenge'`
  - `interface AssignedTarget { classId: string; className: string; assignment: Assignment; done: number; total: number }`
  - `interface AssignedGroup { key: string; type: ContentType; label: string; targets: AssignedTarget[] }`
  - `groupAssignments(classes: ClassData[], type: ContentType, labelFor: (a: Assignment) => string): AssignedGroup[]`

- [ ] **Step 1: Write failing test** `tests/unit/contentGrouping.spec.ts`

```ts
import { test, expect } from '@playwright/test'
import { contentIdentity, groupAssignments } from '../../lib/dashboard/contentGrouping'
import type { Assignment, ClassData } from '../../app/dashboard/useDashboard'

const ch = (id: string, challengeId: string): Assignment =>
  ({ id, type: 'challenge', challengeId, lessonIds: [], scope: 'class', studentUids: [], dueDate: null, submissions: {} } as Assignment)
const cls = (id: string, name: string, assignments: Assignment[]): ClassData =>
  ({ id, name, joinCode: null, grade: [], archived: false, assignments, students: [] } as ClassData)

test('contentGrouping: same challenge in two classes shares one identity', () => {
  expect(contentIdentity(ch('a', 'lib:1'))).toBe(contentIdentity(ch('b', 'lib:1')))
})

test('contentGrouping: same challenge across classes collapses into one group with two targets', () => {
  const classes = [cls('c1', 'P3', [ch('a', 'lib:1')]), cls('c2', 'P5', [ch('b', 'lib:1')])]
  const groups = groupAssignments(classes, 'challenge', () => 'Budget #1')
  expect(groups).toHaveLength(1)
  expect(groups[0].targets.map((t) => t.className).sort()).toEqual(['P3', 'P5'])
})
```

- [ ] **Step 2: Run, verify fail** — `npx playwright test tests/unit/contentGrouping.spec.ts` → FAIL.
- [ ] **Step 3: Implement** `lib/dashboard/contentGrouping.ts`:

```ts
import type { Assignment, ClassData } from '@/app/dashboard/useDashboard'
import { completionFor } from './completion'

export type ContentType = 'lesson' | 'journal' | 'challenge'

export function contentIdentity(a: Assignment): string {
  const type = a.type ?? 'lesson'
  if (type === 'challenge') return `challenge:${a.challengeId ?? ''}`
  if (type === 'journal') {
    const qs = (a.journal?.questions ?? []).map((q) => q.trim()).join('␟')
    return `journal:${(a.title ?? '').trim()}:${qs}`
  }
  return `lesson:${[...a.lessonIds].sort().join(',')}`
}

export interface AssignedTarget { classId: string; className: string; assignment: Assignment; done: number; total: number }
export interface AssignedGroup { key: string; type: ContentType; label: string; targets: AssignedTarget[] }

export function groupAssignments(classes: ClassData[], type: ContentType, labelFor: (a: Assignment) => string): AssignedGroup[] {
  const map = new Map<string, AssignedGroup>()
  for (const cls of classes) {
    for (const a of cls.assignments) {
      const t = a.type ?? 'lesson'
      if (t !== type) continue
      const key = contentIdentity(a)
      const { done, total } = completionFor(a, cls.students)
      const group = map.get(key) ?? { key, type, label: labelFor(a), targets: [] }
      group.targets.push({ classId: cls.id, className: cls.name, assignment: a, done, total })
      map.set(key, group)
    }
  }
  return Array.from(map.values())
}
```

- [ ] **Step 4: Run, verify pass** — `npx playwright test tests/unit/contentGrouping.spec.ts` → PASS.
- [ ] **Step 5: Commit** — `git add lib/dashboard/contentGrouping.ts tests/unit/contentGrouping.spec.ts && git commit -m "feat(dashboard): content grouping across classes"`

## Task 3: Two-tier sidebar

**Files:**
- Modify: `app/dashboard/DashboardShell.tsx`

**Interfaces:**
- Consumes: existing `DashboardShell` props (`data`, `activeClassId?`, `user`, `signOut`, `reload`).
- Produces: sidebar with a global **Content** group (links `/dashboard/content/lessons|journal|challenges`, active by `pathname`) shown always; a **Classes** group listing active classes linking to `/dashboard/[classId]`; per-class Content/Performance/Classroom groups only render when `activeClassId` is set (unchanged links for roster/settings/parent-letter/progress).

- [ ] **Step 1:** In `DashboardShell.tsx`, add a `Content` group **above** `Class sections`, always visible, using the existing `navItem()` + `IconBook/IconPencil/IconTarget`, linking to the three `/dashboard/content/*` routes. Rename the `Class sections` group to `Classes`.
- [ ] **Step 2:** Remove the per-class **Content** group (the three `navItem` calls for `/dashboard/${current.id}/course|journal|challenges`) from the `{current && ...}` block. Keep Performance (Progress + needs-attention) and Classroom groups intact.
- [ ] **Step 3: Build** — `npm run build` → zero errors.
- [ ] **Step 4: Visual** — the sidebar appears in the 3 section snapshots? It does NOT (snapshots cover marketing sections, not the dashboard). Run `npx playwright test` → 21 pass (no snapshot change expected).
- [ ] **Step 5: Commit** — `git add app/dashboard/DashboardShell.tsx && git commit -m "feat(dashboard): two-tier sidebar with global Content group"`

## Task 4: Shared AssignedGroups component

**Files:**
- Create: `app/dashboard/content/AssignedGroups.tsx`

**Interfaces:**
- Consumes: `AssignedGroup` (Task 2).
- Produces: `AssignedGroups({ groups, emptyLabel, onEdit, onRemove, renderDetail })` — a card titled "Currently assigned"; each group renders `label` then one row per target (`className · due <date|—> · done/total`) with Edit/Remove buttons calling `onEdit(target)` / `onRemove(target)`; empty state shows `emptyLabel`. Props typed:
  - `groups: AssignedGroup[]`
  - `emptyLabel: string`
  - `onEdit(t: AssignedTarget): void`
  - `onRemove(t: AssignedTarget): void`

- [ ] **Step 1:** Create the component mirroring the existing "Assigned" card markup in `app/dashboard/[classId]/course/page.tsx:539-599` (same Tailwind classes), but grouped: outer `label`, inner per-class target rows. No expand/detail needed for Phase 1 beyond class + due + completion.
- [ ] **Step 2: Build** — `npm run build` → zero errors (component compiles even if unused yet).
- [ ] **Step 3: Commit** — `git add app/dashboard/content/AssignedGroups.tsx && git commit -m "feat(dashboard): shared AssignedGroups list"`

## Task 5: General Lessons page

**Files:**
- Create: `app/dashboard/content/lessons/page.tsx`

**Interfaces:**
- Consumes: `useDashboard`, `groupAssignments`+`labelFor` (Task 2), `AssignedGroups` (Task 4), `apiCall`, curriculum libs, `LessonControls`.
- Produces: page at `/dashboard/content/lessons`.

- [ ] **Step 1:** Build the page from the lesson-only parts of `app/dashboard/[classId]/course/page.tsx`. Layout top-to-bottom: (1) `<AssignedGroups groups={groupAssignments(data, 'lesson', a => \`${a.lessonIds.length} lesson…\`)} …/>`; (2) the curriculum browser + lesson assign composer. In Phase 1 the composer targets ONE class via a `<select>` of active classes (state `classId`); on submit call `POST /api/classes/${classId}/assign` with `type: 'lesson'`. Keep the pacing/controls card. Edit/Remove use the target's `assignment.id` + its `classId`.
- [ ] **Step 2: Build** — `npm run build` → zero errors.
- [ ] **Step 3: Manual** — note for reviewer: log in as demo teacher, visit `/dashboard/content/lessons`, assign a lesson set to a class, confirm it appears grouped at top.
- [ ] **Step 4: Playwright** — `npx playwright test` → 21 pass.
- [ ] **Step 5: Commit** — `git add app/dashboard/content/lessons/page.tsx && git commit -m "feat(dashboard): general Lessons content page"`

## Task 6: General Journal page

**Files:**
- Create: `app/dashboard/content/journal/page.tsx`

**Interfaces:**
- Consumes: same as Task 5 + `PROMPT_CATEGORIES`/`PROMPT_TEMPLATES`.
- Produces: page at `/dashboard/content/journal`.

- [ ] **Step 1:** Port `app/dashboard/[classId]/journal/page.tsx` to the general shape: `AssignedGroups groups={groupAssignments(data, 'journal', a => a.title || \`Journal · ${a.journal?.questions.length} questions\`)}` on top; the journal composer (with template/library browser) beneath, targeting ONE class via a `<select>`; submit `POST …/assign` with `type: 'journal'`.
- [ ] **Step 2: Build** → zero errors.
- [ ] **Step 3: Playwright** → 21 pass.
- [ ] **Step 4: Commit** — `git add app/dashboard/content/journal/page.tsx && git commit -m "feat(dashboard): general Journal content page"`

## Task 7: General Challenges page (new composer)

**Files:**
- Create: `app/dashboard/content/challenges/page.tsx`

**Interfaces:**
- Consumes: `LIBRARY`/`getLibraryChallenge`, the existing review UI from `app/dashboard/[classId]/challenges/page.tsx` (ChallengeCard/StudentRow), `AssignedGroups`.
- Produces: page at `/dashboard/content/challenges`.

- [ ] **Step 1:** Build top-to-bottom: (1) `AssignedGroups groups={groupAssignments(data, 'challenge', a => getLibraryChallenge(a.challengeId ?? '')?.title || a.title || 'Budget Challenge')}`; (2) **new** challenge composer (challenge `<select>` from `LIBRARY`, prompt preview, title, one-class `<select>`, due date) — POST `type: 'challenge'`; (3) keep the per-student review cards (`ChallengeCard`) below, iterating challenge assignments across the selected/target classes. Move `ChallengeCard`/`StudentRow` here (or import) — do not duplicate.
- [ ] **Step 2: Build** → zero errors.
- [ ] **Step 3: Playwright** → 21 pass.
- [ ] **Step 4: Commit** — `git add app/dashboard/content/challenges/page.tsx && git commit -m "feat(dashboard): general Challenges page with composer"`

## Task 8: Retire per-class content routes (redirects)

**Files:**
- Modify: `app/dashboard/[classId]/course/page.tsx`, `.../journal/page.tsx`, `.../challenges/page.tsx`

- [ ] **Step 1:** Replace each file's contents with a server redirect:

```tsx
import { redirect } from 'next/navigation'
export default function Page() {
  redirect('/dashboard/content/lessons') // journal → /content/journal; challenges → /content/challenges
}
```

- [ ] **Step 2:** Verify the shared review pieces (`ChallengeCard`, journal `useJournal` is student-only — unaffected) still resolve after Task 7 moved them. Grep for imports of the old challenge page: `grep -rn "\[classId\]/challenges/page" app || true` → none.
- [ ] **Step 3: Build** → zero errors.
- [ ] **Step 4: Playwright** → 21 pass.
- [ ] **Step 5: Commit** — `git add app/dashboard/[classId]/course/page.tsx app/dashboard/[classId]/journal/page.tsx app/dashboard/[classId]/challenges/page.tsx && git commit -m "feat(dashboard): redirect retired per-class content routes"`

---

# PHASE 2 — Multi-class fan-out + per-class due dates + specific students

## Task 9: Fan-out helper

**Files:**
- Create: `lib/dashboard/assignFanout.ts`
- Test: `tests/unit/assignFanout.spec.ts`

**Interfaces:**
- Produces:
  - `interface ClassTarget { classId: string; className: string; dueDate: string | null; studentUids?: string[] | null }`
  - `interface FanoutResult { classId: string; className: string; ok: boolean; error?: string }`
  - `fanoutAssign(post: (classId: string, body: object) => Promise<unknown>, basePayload: object, targets: ClassTarget[]): Promise<FanoutResult[]>`

- [ ] **Step 1: Write failing test** — targets = 2 classes, `post` mock rejects for the 2nd; assert results `[{ok:true},{ok:false,error:…}]` and that each call merged `dueDate` + `scope`:

```ts
import { test, expect } from '@playwright/test'
import { fanoutAssign } from '../../lib/dashboard/assignFanout'

test('fanoutAssign: assigns per class and reports partial failure', async () => {
  const calls: Array<{ classId: string; body: any }> = []
  const post = async (classId: string, body: object) => {
    calls.push({ classId, body })
    if (classId === 'c2') throw new Error('roster')
    return { id: 'x' }
  }
  const res = await fanoutAssign(post, { type: 'challenge', challengeId: 'lib:1' }, [
    { classId: 'c1', className: 'P3', dueDate: '2026-09-10' },
    { classId: 'c2', className: 'P5', dueDate: '2026-09-12', studentUids: ['s1'] },
  ])
  expect(res).toEqual([
    { classId: 'c1', className: 'P3', ok: true },
    { classId: 'c2', className: 'P5', ok: false, error: 'roster' },
  ])
  expect(calls[0]).toEqual({ classId: 'c1', body: { type: 'challenge', challengeId: 'lib:1', scope: 'class', studentUids: [], dueDate: '2026-09-10' } })
  expect(calls[1]).toEqual({ classId: 'c2', body: { type: 'challenge', challengeId: 'lib:1', scope: 'students', studentUids: ['s1'], dueDate: '2026-09-12' } })
})
```

- [ ] **Step 2: Run, verify fail** — `npx playwright test tests/unit/assignFanout.spec.ts` → FAIL.
- [ ] **Step 3: Implement:**

```ts
export interface ClassTarget { classId: string; className: string; dueDate: string | null; studentUids?: string[] | null }
export interface FanoutResult { classId: string; className: string; ok: boolean; error?: string }

export async function fanoutAssign(
  post: (classId: string, body: object) => Promise<unknown>,
  basePayload: object,
  targets: ClassTarget[],
): Promise<FanoutResult[]> {
  const out: FanoutResult[] = []
  for (const t of targets) {
    const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
    const body = { ...basePayload, scope: useStudents ? 'students' : 'class', studentUids: useStudents ? t.studentUids : [], dueDate: t.dueDate }
    try { await post(t.classId, body); out.push({ classId: t.classId, className: t.className, ok: true }) }
    catch (e: any) { out.push({ classId: t.classId, className: t.className, ok: false, error: e?.message ?? 'failed' }) }
  }
  return out
}
```

- [ ] **Step 4: Run, verify pass** — `npx playwright test tests/unit/assignFanout.spec.ts` → PASS.
- [ ] **Step 5: Commit** — `git add lib/dashboard/assignFanout.ts tests/unit/assignFanout.spec.ts && git commit -m "feat(dashboard): client fan-out assign helper"`

## Task 10: ClassTargetPicker component

**Files:**
- Create: `app/dashboard/content/ClassTargetPicker.tsx`

**Interfaces:**
- Consumes: `ClassData`, `ClassTarget` (Task 9).
- Produces: `ClassTargetPicker({ classes, value, onChange })` where `value: ClassTarget[]`. Renders a checkbox per active class; a checked class reveals a per-class due-date input. A top toggle "Choose specific students" (default off): when on, each checked class expands to student checkboxes (from `cls.students`), writing `studentUids` into that target; when off, `studentUids` stays null (whole class). `onChange(next: ClassTarget[])`.

- [ ] **Step 1:** Implement the controlled component with the toggle + per-class due date + collapsible student lists (reuse the roster checkbox markup from the current composers).
- [ ] **Step 2: Build** → zero errors.
- [ ] **Step 3: Commit** — `git add app/dashboard/content/ClassTargetPicker.tsx && git commit -m "feat(dashboard): class target picker (multi-class, per-class due, students toggle)"`

## Task 11: Wire fan-out into the three content pages

**Files:**
- Modify: `app/dashboard/content/lessons/page.tsx`, `.../journal/page.tsx`, `.../challenges/page.tsx`

- [ ] **Step 1:** Replace each page's single-class `<select>` + `due` with `<ClassTargetPicker>`. On submit, build `basePayload` (type + content fields + title/controls; no scope/due/students) and call `fanoutAssign((cid, body) => apiCall(user, \`/api/classes/${cid}/assign\`, 'POST', body), basePayload, targets)`. Show a result summary: all-ok → reset composer + reload; any failure → alert "Assigned to N of M — <class>: <error>" and still reload.
- [ ] **Step 2:** Keep Edit/Remove per-class (single-class PATCH/DELETE) as-is.
- [ ] **Step 3: Build** → zero errors.
- [ ] **Step 4: Playwright** → 21 pass.
- [ ] **Step 5: Manual (reviewer):** assign one challenge to 2 classes with different due dates; confirm 2 docs + one grouped row with both due dates; force a failure (deselect a roster student mid-flow) to see the partial message.
- [ ] **Step 6: Commit** — `git add app/dashboard/content/lessons/page.tsx app/dashboard/content/journal/page.tsx app/dashboard/content/challenges/page.tsx && git commit -m "feat(dashboard): multi-class fan-out in content composers"`

---

# PHASE 3 — Class-page Quick assign

## Task 12: Quick assign card on the class page

**Files:**
- Modify: `app/dashboard/[classId]/page.tsx`

- [ ] **Step 1:** Add a compact "Quick assign" card near the top: content-type `<select>` (Lesson/Journal/Challenge) → for challenge/journal pick existing library/template or a link to the general page to author; due date; "Assign to this class" button → `POST /api/classes/${classId}/assign` for THIS class only. Keep the existing analytics (needs-attention, roster table, heatmap) untouched below.
- [ ] **Step 2: Build** → zero errors.
- [ ] **Step 3: Playwright** → 21 pass.
- [ ] **Step 4: Commit** — `git add app/dashboard/[classId]/page.tsx && git commit -m "feat(dashboard): per-class Quick assign card"`

---

## Self-Review (author checklist — done)

- **Spec coverage:** nav model → Task 3; general routes/skeleton → Tasks 4–8; targeting model → Tasks 10–11; fan-out (approach A) → Tasks 9,11; grouping "same chunk" → Tasks 2,4; retired routes → Task 8; class-page Quick assign → Task 12; no-schema-change honored throughout.
- **Placeholder scan:** pure-logic tasks carry full code; UI tasks give exact structure + source line refs + build/Playwright gates (React page bodies follow existing pages verbatim — not re-typed to avoid drift).
- **Type consistency:** `AssignedGroup`/`AssignedTarget`/`ClassTarget`/`FanoutResult`/`completionFor`/`groupAssignments`/`fanoutAssign` names used identically across Tasks 1–11.

## Notes for the executor

- **Unit-test runner is Playwright**, not vitest/jest. All `tests/unit/*.spec.ts` files do `import { test, expect } from '@playwright/test'`, use flat `test('…', () => {})` (no `describe/it`), relative imports (no `@/` alias), and have no `vi` mock — hand-roll mocks (see Task 9). Run a single file with `npx playwright test tests/unit/<file>.spec.ts`; it executes under all 3 viewport projects but the logic is pure (no `page`). There is no `npm test` script — use `npx playwright test`.
- After ANY intentional visual change to a *marketing* section (none expected here — this is all dashboard, which isn't snapshotted), run `npm run test:update` and commit snapshots. Dashboard pages are not in the 21 snapshots, so Playwright should stay green without updates.
