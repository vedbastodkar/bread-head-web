# Teacher Tools Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax. Verification in this repo = `npm run build` (TypeScript strict) + `npx playwright test` (21 marketing visual tests must still pass). No unit-test runner exists; pure resolvers get a scratch `node` check.

**Goal:** Round out the teacher dashboard — assign flow, printable handout, lesson pacing + in-lesson controls, and co-teachers.

**Architecture:** Additive Firestore fields on `classes` + `assignments`; pure resolver helpers in `lib/curriculum/controls.ts`; enforcement in `LessonPlayer`; new/extended Next.js API routes (Admin SDK); teacher UI on Course/Roster/Settings pages. Client class-doc reads are best-effort with graceful fallback so nothing breaks before the manual Firestore-rules deploy.

**Tech Stack:** Next.js 14 App Router, TypeScript strict, Tailwind, firebase-admin, Firebase client SDK.

## Global Constraints

- TypeScript strict — no `any` leaks in new exported signatures.
- Preserve current behavior when new fields are absent (pacing off = unlimited; no controls = `DEFAULT_CONTROLS`).
- No migration: reads treat missing `teacherIds` as `[teacherId]`.
- Client reads of the class doc must `try/catch` → fall back to unlimited pacing / default controls.
- Enforcement is client-side (documented, acceptable for classroom pacing).
- Run `npm run build` after each task; `npx playwright test` before the final commit.

---

## Phase 0 — Shared types & resolvers

### Task 0.1: `lib/curriculum/controls.ts`

**Files:** Create `lib/curriculum/controls.ts`

**Interfaces produced:**
- `interface LessonControls { lockUntilCorrect: boolean; minSecondsPerSlide: number; noSkipAhead: boolean }`
- `const DEFAULT_CONTROLS: LessonControls`
- `interface ClassPacing { enabled: boolean; throughUnit: number; throughLesson: number }`
- `interface ClassLite { teacherId?: string; teacherIds?: string[]; pacing?: ClassPacing; lessonControls?: LessonControls; assignments: { lessonIds: string[]; scope: 'class'|'students'; studentUids: string[]; controls?: Partial<LessonControls> }[] }`
- `classTeacherIds(c): string[]`
- `mergeControls(a: LessonControls, b: Partial<LessonControls>): LessonControls` — most restrictive (`||` for bools, `Math.max` for min time)
- `pacingFrontierIndex(pacing, lessonOrder): number` — index in `lessonOrder` of the last unlocked lesson; `Infinity` if disabled/absent
- `resolvePacingFrontier(classes, lessonOrder): number` — max frontier across classes (most permissive)
- `resolveControls(lessonId, studentUid, classes): LessonControls` — class default merged with applicable assignment overrides, most-restrictive across classes

- [ ] Step 1: Write the file with the types + pure functions (no React imports — safe for both server/client).
- [ ] Step 2: Scratch-verify resolvers: `npx tsx`-free — write `/private/tmp/.../scratch/controls.test.mjs` translating a couple cases, or run an inline `node -e` after `tsc` isn't available → instead assert via a temporary `.ts` compiled by build. Minimum: reason through 3 cases (no pacing → Infinity; two classes → max; override merge → most restrictive) and confirm with a `node` check on a JS mirror.
- [ ] Step 3: `npm run build` passes.
- [ ] Step 4: Commit `feat: add lesson-controls + pacing resolvers`.

---

## Phase 1 — Assign flow

### Task 1.1: Assignment type + overview payload
**Files:** Modify `app/dashboard/useDashboard.ts` (add `title?`, `controls?` to `Assignment`), `app/student/useStudent.ts` (`StudentAssignment` add `controls?`), `app/api/dashboard/overview/route.ts` (include `title`, `controls`, `updatedAt`).
- [ ] Add fields; `npm run build`; commit.

### Task 1.2: assign route — accept title/controls + PATCH
**Files:** Modify `app/api/classes/[classId]/assign/route.ts`.
- POST: read optional `title` (string), `controls` (validated `Partial<LessonControls>`), store when present.
- Add `PATCH` (`?id=`): membership check, update `lessonIds`/`scope`/`studentUids`/`dueDate`/`title`/`controls`, set `updatedAt`.
- [ ] Implement; `npm run build`; commit.

### Task 1.3: Course page — composer (title + controls override) + duplicate guard
**Files:** Modify `app/dashboard/[classId]/course/page.tsx`.
- Title input; collapsible "Lesson controls for this assignment" (three inputs, sent only if changed); duplicate warn before POST.
- [ ] Implement; `npm run build`; commit.

### Task 1.4: Course page — Assigned list (names, completion, edit, remove)
**Files:** Modify `app/dashboard/[classId]/course/page.tsx`.
- Expandable lesson names via `lessonName`; completion `X/N` from `cls.students[].completedLessons`; Edit (prefill composer) + Remove (existing).
- [ ] Implement; `npm run build`; commit.

---

## Phase 2 — Printable handout

### Task 2.1: Handout page + Roster button
**Files:** Create `app/dashboard/[classId]/handout/page.tsx`; modify `app/dashboard/[classId]/roster/page.tsx` (add "Print handout" link).
- Print-optimized page: class name, large join code, `bread-head.org/login`, 3-step instructions, roster list, Print button (`window.print()`), `@media print` to hide chrome.
- [ ] Implement; `npm run build`; commit.

---

## Phase 3 — Pacing + in-lesson controls

### Task 3.1: class PATCH accepts pacing + lessonControls
**Files:** Modify `app/api/classes/[classId]/route.ts`.
- Validate & store `pacing` (`{enabled,throughUnit,throughLesson}`) and `lessonControls` (`LessonControls`).
- [ ] Implement; `npm run build`; commit.

### Task 3.2: ClassData carries pacing/lessonControls; overview returns them
**Files:** Modify `app/dashboard/useDashboard.ts` (`ClassData` add `pacing?`, `lessonControls?`), `app/api/dashboard/overview/route.ts` (return them).
- [ ] Implement; `npm run build`; commit.

### Task 3.3: Course page — "Pacing & controls" panel
**Files:** Modify `app/dashboard/[classId]/course/page.tsx`.
- Panel: enable pacing + unit/lesson selects; class-default control inputs; Save → class PATCH; reload.
- [ ] Implement; `npm run build`; commit.

### Task 3.4: `lessonState` pacing arg + student views
**Files:** Modify `app/student/useStudent.ts` (`lessonState(id, completed, frontier=Infinity)`), and consumers `app/dashboard/StudentHome.tsx`, `app/student/course/page.tsx`, `app/student/unit/[unit]/page.tsx` to pass frontier from loaded classes (best-effort).
- Extend `useStudent` to also load each class's `pacing`+`lessonControls` (try/catch) and expose `pacingFrontier` + `controlsForLesson(id)`.
- [ ] Implement; `npm run build`; commit.

### Task 3.5: `/lesson` launcher — gate by pacing + pass controls
**Files:** Modify `app/lesson/page.tsx`.
- Load student's classes (best-effort), compute pacing frontier (gate locked-by-pacing targets) and `resolveControls` for target; pass `controls` to `LessonPlayer`.
- [ ] Implement; `npm run build`; commit.

### Task 3.6: `LessonPlayer` enforcement
**Files:** Modify `components/lesson/LessonPlayer.tsx`.
- Prop `controls?: LessonControls` (default `DEFAULT_CONTROLS`).
- `minSecondsPerSlide`: per-slide dwell timer; Next disabled + countdown until elapsed.
- `noSkipAhead`: progress dots non-interactive.
- `lockUntilCorrect`: pass `requireCorrect` into `SlideView`; `trueFalse`/`multipleChoice`/`realLifeScenario` only call `onAnswered` on correct, allow retry on wrong.
- [ ] Implement; `npm run build`; commit.

---

## Phase 4 — Co-teachers

### Task 4.1: membership helper in class APIs + create sets teacherIds
**Files:** Modify `app/api/classes/route.ts` (create sets `teacherIds:[uid]`), `app/api/classes/[classId]/route.ts` + `app/api/classes/[classId]/assign/route.ts` + `app/api/classes/move-student/route.ts` (`ownsClass` → membership: `teacherId===uid || (teacherIds||[]).includes(uid)`; keep delete-class owner-only).
- [ ] Implement; `npm run build`; commit.

### Task 4.2: overview dual-query
**Files:** Modify `app/api/dashboard/overview/route.ts`.
- Query `where('teacherId','==',uid)` **and** `where('teacherIds','array-contains',uid)`; dedupe by id. Include `teacherIds` in payload.
- [ ] Implement; `npm run build`; commit.

### Task 4.3: co-teacher route
**Files:** Create `app/api/classes/[classId]/co-teachers/route.ts`.
- `POST {email}` owner-only → `getUserByEmail` → verify teacher/admin role → ensure owner in `teacherIds` → `arrayUnion` uid. `DELETE ?uid=` owner-only, cannot remove owner.
- [ ] Implement; `npm run build`; commit.

### Task 4.4: student join adds all teacherIds
**Files:** Modify `app/api/student/join/route.ts` — `arrayUnion` all class `teacherIds` into `profile.teacherIds`.
- [ ] Implement; `npm run build`; commit.

### Task 4.5: Settings page co-teacher UI + ClassData.teacherIds
**Files:** Modify `app/dashboard/[classId]/settings/page.tsx`, `app/dashboard/useDashboard.ts` (`ClassData.teacherIds?`, `ownerId?`).
- List co-teachers, add by email, remove; owner-only controls; show who's owner.
- [ ] Implement; `npm run build`; commit.

### Task 4.6: Firestore rules
**Files:** Modify `docs/firestore.rules.proposed`.
- `isClassTeacher(c)` helper; class read allows teachers or rostered student; write=teacher; delete=owner; roster/assignments write=teacher via `get()`.
- [ ] Update file; note manual deploy in commit body; commit.

---

## Final verification
- [ ] `npm run build` clean.
- [ ] `npx playwright test` → 21 passed (kill stale `:3000` first).
- [ ] Squash-free commits already made per task; summarize on completion.

## Self-review notes
- Spec coverage: every spec section maps to a task (assign 1.x, handout 2.1, pacing/controls 3.x, co-teachers 4.x, rules 4.6, resolvers 0.1). ✓
- Types: `LessonControls`/`ClassPacing` defined once in 0.1, consumed everywhere. ✓
- Fallback: client class reads best-effort (0.1 consumers, 3.4, 3.5). ✓
