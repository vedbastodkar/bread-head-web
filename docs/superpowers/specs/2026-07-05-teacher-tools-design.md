# Teacher Tools — Design Spec

**Date:** 2026-07-05
**Scope:** Round out the teacher dashboard: assign flow, printable class handout, lesson pacing + in-lesson controls, and co-teachers.

## Goals

Close the four teacher-tool gaps in `docs/STUB.md`:

1. **Assign flow** — currently create/delete only; make it usable (see lesson names, completion, edit) **and** carry per-assignment in-lesson control overrides.
2. **Roster / student accounts** — de-scoped to a **printable class handout** (self-signup + join code already works; teacher-provisioned accounts explicitly deferred).
3. **Lesson pacing + in-lesson controls** — a class-level release frontier plus enforced player controls (lock-until-correct, min time per slide, no-skip), with per-assignment overrides.
4. **Co-teachers** — a second teacher on a class.

Non-goals: teacher-provisioned student accounts, iOS enforcement of controls, assessments (Track B), lesson-content changes.

## Build order

Each phase is independently shippable. Co-teachers is last because it rewrites every security rule.

1. Assign flow polish + per-assignment control overrides
2. Printable class handout
3. Pacing (release frontier) + class-default in-lesson controls + player enforcement
4. Co-teachers

---

## Data model changes

### `classes/{id}`
- `teacherId: string` — **unchanged** (primary owner).
- `teacherIds: string[]` — **NEW.** All teachers incl. owner. On create: `[owner]`. Reads treat a missing field as `[teacherId]` (no migration needed).
- `pacing?: { enabled: boolean; throughUnit: number; throughLesson: number }` — **NEW.** Absent/`enabled:false` = fully unlocked (preserves current behavior).
- `lessonControls?: LessonControls` — **NEW.** Class default (see below).

### `classes/{id}/assignments/{id}`
Existing: `lessonIds[]`, `scope`, `studentUids[]`, `dueDate`, `createdAt`.
- `title?: string` — **NEW**, optional label.
- `updatedAt` — **NEW**, server timestamp on edit.
- `controls?: Partial<LessonControls>` — **NEW**, override subset applying to this assignment's lessons/targets.

### `LessonControls` type (`lib/curriculum/controls.ts` — new)
```ts
export interface LessonControls {
  lockUntilCorrect: boolean   // quiz slides only unlock Next on a correct answer (with retry)
  minSecondsPerSlide: number  // dwell time before Next enables (0 = off)
  noSkipAhead: boolean        // disable progress-dot jumping; strictly sequential
}
export const DEFAULT_CONTROLS: LessonControls = {
  lockUntilCorrect: false, minSecondsPerSlide: 0, noSkipAhead: false,
}
```

---

## Control & pacing resolution (`lib/curriculum/controls.ts`)

Pure functions, unit-testable, consumed by the student `/lesson` launcher and student course view.

- `classTeacherIds(cls)` → `cls.teacherIds ?? (cls.teacherId ? [cls.teacherId] : [])`.
- `resolvePacingFrontier(classes)` → the **most permissive** frontier across the student's classes. Any class with pacing absent/disabled ⇒ unlimited. Frontier expressed as a flat index into `LESSON_ORDER`.
- `mergeControls(a, b)` → **most restrictive** field-by-field: `lockUntilCorrect = a||b`, `minSecondsPerSlide = max`, `noSkipAhead = a||b`.
- `resolveControls(lessonId, studentUid, classes)` → for each class: base = `class.lessonControls ?? DEFAULT_CONTROLS`; then merge every assignment override in that class whose `lessonIds` includes `lessonId` and whose target applies (`scope==='class'` or `studentUids.includes(studentUid)`). Merge results across classes with `mergeControls`. Returns a full `LessonControls`.

Effective lesson access = `min(sequential frontier, pacing frontier)`. A lesson past the pacing frontier is `locked`.

---

## Phase 1 — Assign flow

**API**
- `overview` route: include `title`, `controls`, `updatedAt` in each assignment payload.
- `assign` POST: accept optional `title` and `controls`.
- `assign` route gains **PATCH** `?id=`: edit `lessonIds`/`scope`/`studentUids`/`dueDate`/`title`/`controls` of an existing assignment (owner/member check). Sets `updatedAt`.

**Types**: add `title?`, `controls?` to `Assignment` (`useDashboard.ts`) and `StudentAssignment` (`useStudent.ts`).

**Course page (`app/dashboard/[classId]/course/page.tsx`)**
- Composer: optional **title** input; collapsible **"Lesson controls for this assignment"** with the three toggles (shown inheriting class default; only sent if changed).
- Duplicate guard: before POST, warn if an assignment with identical `lessonIds` + `scope` + target set already exists.
- Assigned list per row:
  - **Expandable** to list lesson names (`lessonName(unit,lesson)`).
  - **Completion**: "X / N done" — N = target students (class size or `studentUids.length`); X = target students who have completed *all* `lessonIds` (from `cls.students[].completedLessons`, already loaded).
  - **Edit** (reopens composer prefilled) and **Remove**.

## Phase 2 — Printable class handout

- New page `app/dashboard/[classId]/handout/page.tsx`: print-optimized (`@media print` + a "Print" button calling `window.print()`). Shows class name, **large join code**, `bread-head.org/login`, 3-step self-signup instructions, and the current roster list. Loads via `useDashboard`, guarded like other dashboard pages.
- Roster page: **"Print handout"** button → links to the handout page.

## Phase 3 — Pacing + in-lesson controls

**Teacher UI (Course page "Pacing & controls" panel)**
- Enable pacing + `throughUnit`/`throughLesson` selects.
- Class-default control toggles (`lockUntilCorrect`, `minSecondsPerSlide` number, `noSkipAhead`).
- Saved via class **PATCH** (extend `app/api/classes/[classId]/route.ts` to accept `pacing` and `lessonControls`, validated).

**Student launcher (`app/lesson/page.tsx`)**
- Load the student's classes (their assignments + `pacing` + `lessonControls`) — reuse `resolve*` helpers.
- Apply pacing frontier in the lock check (line ~48): a target past the frontier is treated as locked.
- Resolve `LessonControls` for the target lesson and pass to `LessonPlayer`.

**`lessonState(id, completed, pacingFrontier?)`** gains an optional pacing frontier; student course view (`app/dashboard/StudentHome.tsx` and `app/student/*`) passes it so locked-by-pacing lessons render locked.

**Player enforcement (`components/lesson/LessonPlayer.tsx`)**
- New prop `controls?: LessonControls` (default `DEFAULT_CONTROLS`).
- **lockUntilCorrect** — for correctness-bearing slides (`trueFalse`, `multipleChoice`, `realLifeScenario`): when set, only mark the slide complete (unlock Next) on a **correct** answer; allow retry on wrong with feedback. When unset: current behavior (any answer unlocks). Non-correctness slides (poll/tapToReveal/mythBusting/thisOrThat/matchConcept) unchanged. Implemented by passing `requireCorrect` into `SlideView` and having those renderers gate their `onAnswered` call on correctness + allow re-pick.
- **minSecondsPerSlide** — track per-slide dwell (reset on index change); Next disabled until elapsed ≥ min, with a small countdown on the button. Interacts with `gated` (both must clear).
- **noSkipAhead** — progress dots become non-interactive indicators (no `jump`); Back still allowed.
- Enforcement is client-side only (acceptable for classroom pacing; documented).

## Phase 4 — Co-teachers

**Ownership model**: membership = `uid === teacherId || classTeacherIds(cls).includes(uid)`.
- Class create: set `teacherIds: [uid]`.
- `ownsClass`/checks in every class API (`assign`, `[classId]`, `move-student`, `overview`) → membership check. `overview` queries **both** `where('teacherId','==',uid)` and `where('teacherIds','array-contains',uid)` and dedupes (back-compatible, no migration).
- **New route** `app/api/classes/[classId]/co-teachers/route.ts`: `POST { email }` (owner-only) → `adminAuth.getUserByEmail` → verify `role` is teacher/admin → `arrayUnion` into `teacherIds`; `DELETE ?uid=` removes (owner-only; cannot remove the owner). Ensure `teacherIds` includes owner on first write.
- Student join (`app/api/student/join/route.ts`): `arrayUnion` **all** class teacherIds into `profile.teacherIds`.
- Settings page: co-teacher list + add-by-email + remove (owner-only controls).

---

## Firestore rules (`docs/firestore.rules.proposed`)

Manual deploy (documented in the file header). Changes:
- Helper `isClassTeacher(c)` = `request.auth.uid == c.teacherId || (c.teacherIds != null && request.auth.uid in c.teacherIds)`.
- `classes/{classId}` read: allow class teachers **or** a rostered student (`exists(.../roster/$(uid))`) — students need to read `pacing`/`lessonControls`/`name`.
- `create`: `request.resource.data.teacherId == uid`. `update`: class teacher. `delete`: **owner only** (`teacherId == uid`).
- `roster` + `assignments` writes: class teacher (via `get()` on the class doc).
- Existing `users/{uid}` teacher-read rule (via `profile.teacherIds`) already covers co-teachers once join adds them.

## Testing / verification

- `npm run build` must pass (TypeScript strict) after every phase.
- `npx playwright test` — all 21 marketing visual tests must still pass (dashboard is auth-gated and not covered by them; the risk is only regressions in shared components like `Nav`).
- `resolveControls` / `resolvePacingFrontier` / `mergeControls` are pure — verify with a scratch Node check during implementation.
- Manual reasoning for auth-gated flows (no test harness for authenticated dashboard e2e in this repo).

## Risks

- **Rules correctness (Phase 4)** — a wrong rule can lock teachers out or over-expose data. The class-read loosening for rostered students is the sensitive one; keep it to the parent doc only (subcollections already scoped).
- **Multi-class students** — pacing takes the most permissive frontier; controls take the most restrictive. Documented and intentional.
- **Client-side enforcement** — controls are bypassable via devtools; acceptable and noted.
