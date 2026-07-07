# Personal Mode + Assignment-as-Unlock — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the web app to login-method parity with iOS and add a teacher assignment-as-unlock mechanic (out-of-order, permanent, separate from self-directed progress), on the existing shared Firebase account.

**Architecture:** All changes are additive and backward-compatible with the iOS app (shared project `bread-head-4b6f9`). The unlock is *computed* client-side from data already fetched (`completedLessons ∪ assignedLessonIds`); pure logic lives in `lib/curriculum/controls.ts` (no firebase import) so it is unit-testable. Completion of an assigned lesson is tracked in its own server-written submission record, reusing the existing journal-submission pattern and rules.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Firebase Web SDK (client) + Admin SDK (API routes), Playwright (unit + visual tests).

## Global Constraints

- Never rename or repurpose a Firestore field the iOS app reads (`completedLessons`, `currentUnit`, `currentLesson`, `profile.*`). New data is optional/additive only.
- `npm run build` must pass with zero errors before every commit.
- `npx playwright test` (48 visual + all unit tests) must pass before every commit. After intentional visual changes run `npm run test:update` and commit snapshots.
- Resend/Firebase clients are initialized inside handlers, never at module top level.
- Unit tests: `tests/unit/<name>.spec.ts`, `import { test, expect } from '@playwright/test'`, import pure functions only. Run one file: `npx playwright test tests/unit/<name>.spec.ts`.
- Self-directed progression stays linear for everyone; assignments are the only override (D4). Assignment overrides pacing (D5). Prior completion does NOT satisfy an assignment (D6). Assigned completions never advance `currentUnit/currentLesson` (D3).

---

## File Structure (what changes)

**bread-head-web (this repo — the active build):**
- `lib/curriculum/controls.ts` — MODIFY: add pure `assignedLessonIdSet()`; move `lessonState`/`nextLesson` here (pure) and extend `lessonState` with an `assigned` set.
- `app/student/useStudent.ts` — MODIFY: re-export moved fns; compute + expose `assignedLessonIds`; store completed set for the completer.
- `app/lesson/page.tsx` — MODIFY: pass `assignedLessonIds` to `lessonState`; fix `handleComplete` frontier-advance bug; POST lesson submission on assigned completion.
- `app/dashboard/unit/[unit]/page.tsx` — MODIFY: pass `assignedLessonIds` to `lessonState`.
- `lib/curriculum/lessonSubmission.ts` — CREATE: pure `buildLessonSubmission()`.
- `app/api/lesson/submit/route.ts` — CREATE: server-writes lesson-assignment submission (mirror of journal/submit).
- `app/dashboard/[classId]/course/page.tsx` — VERIFY/MODIFY: ensure it creates `type:'lesson'` assignments (API already supports it).
- `app/dashboard/[classId]/[studentUid]/page.tsx` + `app/api/dashboard/overview/route.ts` — MODIFY: show lesson-assignment completion status.
- `app/login/page.tsx` — MODIFY: add Google + Apple sign-in; provision profile on first social sign-in.
- `lib/firebase/authProviders.ts` — CREATE: shared `signInWithGoogle()` / `signInWithApple()` helpers + profile provisioning.
- `tests/unit/curriculum-unlock.spec.ts` — CREATE.
- `tests/unit/lessonSubmission.spec.ts` — CREATE.

**breadhead (iOS — DEFERRED, see appendix + committed spec):** no work in this plan; exact change map in the appendix.

**Firebase console (not code):** enable Apple provider; set "one account per email"; verify `docs/firestore.rules.proposed` deployed (no new rules required — see Task 6 note).

---

## Task 1: Pure unlock logic in controls.ts (TDD)

**Files:**
- Modify: `lib/curriculum/controls.ts`
- Modify: `app/student/useStudent.ts` (remove local `lessonState`/`nextLesson`, re-export from controls)
- Test: `tests/unit/curriculum-unlock.spec.ts`

**Interfaces:**
- Consumes: `LESSON_ORDER`, `ClassLite`, `AssignmentLite` (existing in controls.ts).
- Produces:
  - `assignedLessonIdSet(classes: ClassLite[], uid: string): Set<string>` — union of `lessonIds` from applicable `type:'lesson'` assignments.
  - `lessonState(id: string, completed: Set<string>, pacingFrontier?: number, assigned?: Set<string>): LessonState`
  - `nextLesson(completed: Set<string>): { unit: number; lesson: number }`
  - `type LessonState = 'done' | 'open' | 'locked'`

- [ ] **Step 1: Write the failing test** — `tests/unit/curriculum-unlock.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import {
  lessonState,
  nextLesson,
  assignedLessonIdSet,
  type ClassLite,
} from '../../lib/curriculum/controls'

test('lessonState: completed lesson is done', () => {
  expect(lessonState('unit1lesson1', new Set(['unit1lesson1']))).toBe('done')
})

test('lessonState: linear frontier is open, beyond is locked', () => {
  const done = new Set(['unit1lesson1'])
  expect(lessonState('unit1lesson2', done)).toBe('open')   // next in line
  expect(lessonState('unit1lesson3', done)).toBe('locked') // two ahead
})

test('lessonState: assigned lesson is open even when far out of order', () => {
  const done = new Set(['unit1lesson1'])
  const assigned = new Set(['unit6lesson2'])
  // Without assignment it would be locked; with it, open.
  expect(lessonState('unit6lesson2', done)).toBe('locked')
  expect(lessonState('unit6lesson2', done, Infinity, assigned)).toBe('open')
})

test('lessonState: assignment overrides pacing frontier (D5)', () => {
  const done = new Set<string>()
  const pacing = 1 // frontier index 1 → most lessons locked
  const assigned = new Set(['unit6lesson2'])
  expect(lessonState('unit6lesson2', done, pacing)).toBe('locked')
  expect(lessonState('unit6lesson2', done, pacing, assigned)).toBe('open')
})

test('lessonState: completed takes priority over assigned', () => {
  const done = new Set(['unit6lesson2'])
  const assigned = new Set(['unit6lesson2'])
  expect(lessonState('unit6lesson2', done, Infinity, assigned)).toBe('done')
})

test('nextLesson: returns first not-completed, ignores out-of-order completions', () => {
  // Completing an out-of-order assigned lesson must NOT advance the personal frontier.
  const done = new Set(['unit1lesson1', 'unit6lesson2'])
  expect(nextLesson(done)).toEqual({ unit: 1, lesson: 2 })
})

test('assignedLessonIdSet: unions applicable lesson assignments only', () => {
  const classes: ClassLite[] = [{
    pacing: null, lessonControls: null,
    assignments: [
      { type: 'lesson', lessonIds: ['unit2lesson3'], scope: 'class', studentUids: [] },
      { type: 'lesson', lessonIds: ['unit6lesson2'], scope: 'students', studentUids: ['me'] },
      { type: 'lesson', lessonIds: ['unit9lesson1'], scope: 'students', studentUids: ['other'] },
      { type: 'journal', lessonIds: [], scope: 'class', studentUids: [] },
    ],
  }]
  const set = assignedLessonIdSet(classes, 'me')
  expect([...set].sort()).toEqual(['unit2lesson3', 'unit6lesson2'])
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/unit/curriculum-unlock.spec.ts`
Expected: FAIL (`assignedLessonIdSet` / moved `lessonState` not exported from controls).

- [ ] **Step 3: Implement in `lib/curriculum/controls.ts`**

Add near the top (after `LESSON_ORDER`):

```typescript
export type LessonState = 'done' | 'open' | 'locked'

// Does an assignment apply to this student? (mirrors the existing filter in useStudent)
export function assignmentApplies(a: AssignmentLite, uid: string): boolean {
  return a.scope === 'class' || a.studentUids.includes(uid)
}

// Union of lessonIds from applicable lesson-type assignments across all classes.
// These lessons are unlocked out-of-order and permanently (design D2/D9).
export function assignedLessonIdSet(classes: ClassLite[], uid: string): Set<string> {
  const out = new Set<string>()
  for (const c of classes) {
    for (const a of c.assignments) {
      if ((a.type ?? 'lesson') !== 'lesson') continue
      if (!assignmentApplies(a, uid)) continue
      for (const id of a.lessonIds) out.add(id)
    }
  }
  return out
}

// A lesson is playable if: already completed, OR explicitly assigned (any order,
// overrides pacing), OR at/under the student's own linear+pacing frontier.
export function lessonState(
  id: string,
  completed: Set<string>,
  pacingFrontier: number = Infinity,
  assigned: Set<string> = new Set(),
): LessonState {
  if (completed.has(id)) return 'done'
  if (assigned.has(id)) return 'open'
  const idx = LESSON_ORDER.indexOf(id)
  if (idx > pacingFrontier) return 'locked'
  const frontier = LESSON_ORDER.findIndex((x) => !completed.has(x)) // first not-completed
  return idx <= frontier ? 'open' : 'locked'
}

export function nextLesson(completed: Set<string>): { unit: number; lesson: number } {
  const frontier =
    LESSON_ORDER.find((x) => !completed.has(x)) ?? LESSON_ORDER[LESSON_ORDER.length - 1]
  const m = frontier.match(/^unit(\d+)lesson(\d+)$/)
  return m ? { unit: Number(m[1]), lesson: Number(m[2]) } : { unit: 1, lesson: 1 }
}
```

Note: if `assignmentApplies` already exists privately in controls.ts (used by `resolveControls`), reuse it and just `export` it instead of redefining.

- [ ] **Step 4: Remove the old definitions from `app/student/useStudent.ts` and re-export**

Delete the local `lessonState` (lines ~160-170) and `nextLesson` (lines ~173-177). Replace with a re-export so existing import sites keep working:

```typescript
// Pure curriculum logic now lives in controls.ts (firebase-free → unit-testable).
export { lessonState, nextLesson } from '@/lib/curriculum/controls'
export type { LessonState } from '@/lib/curriculum/controls'
```

Ensure `LessonState` type usages in useStudent still resolve (import it if referenced).

- [ ] **Step 5: Run test to verify it passes**

Run: `npx playwright test tests/unit/curriculum-unlock.spec.ts`
Expected: PASS (all 7 tests).

- [ ] **Step 6: Build gate**

Run: `npm run build`
Expected: zero errors (confirms all import sites of `lessonState`/`nextLesson` still resolve).

- [ ] **Step 7: Commit**

```bash
git add lib/curriculum/controls.ts app/student/useStudent.ts tests/unit/curriculum-unlock.spec.ts
git commit -m "feat(lessons): pure assignment-aware lessonState + assignedLessonIdSet"
```

---

## Task 2: Thread assignedLessonIds through the student hook and callers

**Files:**
- Modify: `app/student/useStudent.ts` (expose `assignedLessonIds` from the hook)
- Modify: `app/lesson/page.tsx` (compute + pass to `lessonState`)
- Modify: `app/dashboard/unit/[unit]/page.tsx` (pass to `lessonState`)

**Interfaces:**
- Consumes: `assignedLessonIdSet` (Task 1), `classes` state already in `useStudent`.
- Produces: `useStudent()` return gains `assignedLessonIds: Set<string>`.

- [ ] **Step 1: Expose `assignedLessonIds` from `useStudent`**

In `app/student/useStudent.ts`, after `const pacingFrontier = resolvePacingFrontier(classes)`:

```typescript
  const assignedLessonIds = user ? assignedLessonIdSet(classes, user.uid) : new Set<string>()
```

Add to the hook's return object:

```typescript
    pacingFrontier, controlsForLesson, assignedLessonIds,
```

Import `assignedLessonIdSet` from `@/lib/curriculum/controls`.

- [ ] **Step 2: Pass it at every `lessonState` call site**

In `app/dashboard/unit/[unit]/page.tsx`, find the `lessonState(id, completed, pacingFrontier)` call and add the set:

```typescript
lessonState(id, completed, pacingFrontier, assignedLessonIds)
```
(destructure `assignedLessonIds` from `useStudent()`).

- [ ] **Step 3: Pass it in the lesson player load effect** — `app/lesson/page.tsx`

The effect computes `classesLite` then `frontier`. Add the assigned set and use it in the lock check:

```typescript
      const frontier = resolvePacingFrontier(classesLite)
      const assigned = user ? assignedLessonIdSet(classesLite, user.uid) : new Set<string>()
      setCompletedSet(done) // for handleComplete (Task 3)
      ...
      if (!isTeacher && t) {
        const id = `unit${t.unit}lesson${t.lesson}`
        if (lessonState(id, done, frontier, assigned) === 'locked') t = nextLesson(done)
        const idx = LESSON_ORDER.indexOf(`unit${t!.unit}lesson${t!.lesson}`)
        if (idx > frontier && frontier >= 0 && frontier < LESSON_ORDER.length && !assigned.has(LESSON_ORDER[idx])) {
          const m = LESSON_ORDER[frontier].match(/^unit(\d+)lesson(\d+)$/)
          if (m) t = { unit: Number(m[1]), lesson: Number(m[2]) }
        }
      }
```

Import `assignedLessonIdSet` from `@/lib/curriculum/controls`. (The `!assigned.has(...)` guard stops the clamp from dragging an intentionally-opened assigned lesson back to the pacing frontier.)

- [ ] **Step 4: Build gate**

Run: `npm run build`
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
git add app/student/useStudent.ts app/lesson/page.tsx app/dashboard/unit/[unit]/page.tsx
git commit -m "feat(lessons): unlock assigned lessons out-of-order in student UI + player"
```

---

## Task 3: Fix the frontier-advance bug in handleComplete (D3)

**Files:**
- Modify: `app/lesson/page.tsx`

**Interfaces:**
- Consumes: `completedSet` state (set in Task 2 Step 3), `LESSON_ORDER`.
- Produces: assigned/out-of-order completions no longer write `currentUnit/currentLesson`.

- [ ] **Step 1: Add completed-set state**

Near the other `useState` calls in `app/lesson/page.tsx`:

```typescript
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set())
```
(The effect already calls `setCompletedSet(done)` from Task 2 Step 3.)

- [ ] **Step 2: Replace `handleComplete`**

```typescript
  const handleComplete = useCallback(async () => {
    if (!user || isTeacher || !target) return
    // Only advance the personal frontier when this lesson is on the student's own
    // linear track. An out-of-order assigned lesson must NOT move currentUnit/
    // currentLesson — that pointer drives cross-app (iOS) unlock (design D3).
    const idx = LESSON_ORDER.indexOf(lessonId)
    const linearFrontier = LESSON_ORDER.findIndex((x) => !completedSet.has(x))
    const onTrack = idx >= 0 && idx <= linearFrontier
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lessonProgress: onTrack
          ? { completedLessons: arrayUnion(lessonId), currentUnit: target.unit, currentLesson: target.lesson }
          : { completedLessons: arrayUnion(lessonId) },
        profile: { updatedAt: new Date() },
      }, { merge: true })
    } catch { /* noop */ }
  }, [user, isTeacher, target, lessonId, completedSet])
```

- [ ] **Step 3: Build gate**

Run: `npm run build`
Expected: zero errors.

- [ ] **Step 4: Manual verification (demo account)**

Run `npm run dev`. Sign in as `demo.student1@bread-head.org` / `DemoPass123!`. Note their `currentUnit/currentLesson`. Complete a lesson far ahead (via an assignment or by seeding one). Confirm in Firestore that `completedLessons` gained the id but `currentUnit/currentLesson` did NOT jump ahead.

- [ ] **Step 5: Commit**

```bash
git add app/lesson/page.tsx
git commit -m "fix(lessons): assigned out-of-order completion must not advance personal frontier"
```

---

## Task 4: Pure lesson-submission builder (TDD)

**Files:**
- Create: `lib/curriculum/lessonSubmission.ts`
- Test: `tests/unit/lessonSubmission.spec.ts`

**Interfaces:**
- Produces: `buildLessonSubmission(input: { lessonId: unknown }): { lessonId: string; status: 'complete' }` — a lesson assignment is binary; completion means done.

- [ ] **Step 1: Write the failing test** — `tests/unit/lessonSubmission.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { buildLessonSubmission } from '../../lib/curriculum/lessonSubmission'

test('buildLessonSubmission returns lessonId + complete status', () => {
  expect(buildLessonSubmission({ lessonId: 'unit2lesson3' })).toEqual({
    lessonId: 'unit2lesson3', status: 'complete',
  })
})

test('buildLessonSubmission coerces non-string lessonId to empty', () => {
  expect(buildLessonSubmission({ lessonId: 42 })).toEqual({ lessonId: '', status: 'complete' })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/unit/lessonSubmission.spec.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/curriculum/lessonSubmission.ts`**

```typescript
// Pure helper — no firebase import → unit-testable. A lesson assignment is binary:
// completing the lesson fulfills it. Content/answers are never involved.
export interface LessonSubmissionMeta {
  lessonId: string
  status: 'complete'
}

export function buildLessonSubmission(input: { lessonId: unknown }): LessonSubmissionMeta {
  const lessonId = typeof input.lessonId === 'string' ? input.lessonId : ''
  return { lessonId, status: 'complete' }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/unit/lessonSubmission.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/curriculum/lessonSubmission.ts tests/unit/lessonSubmission.spec.ts
git commit -m "feat(lessons): pure buildLessonSubmission helper"
```

---

## Task 5: Lesson-assignment submission endpoint + wire completion

**Files:**
- Create: `app/api/lesson/submit/route.ts`
- Modify: `app/lesson/page.tsx` (POST on assigned-lesson completion)

**Interfaces:**
- Consumes: `buildLessonSubmission` (Task 4), `assignedLessonIdSet` (Task 1), `verifyUser`, `adminDb`.
- Produces: writes `classes/{classId}/assignments/{assignmentId}/submissions/{uid}` with `{ lessonId, status:'complete', submittedAt }`.

- [ ] **Step 1: Create the route** — `app/api/lesson/submit/route.ts` (mirror of `app/api/journal/submit/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { buildLessonSubmission } from '@/lib/curriculum/lessonSubmission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/lesson/submit  { classId, assignmentId, lessonId }
// Records that the caller completed an assigned lesson. Metadata only.
// Join-gated; assignment must be a lesson assignment that includes lessonId.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const classId = String(body.classId ?? '')
  const assignmentId = String(body.assignmentId ?? '')
  const lessonId = String(body.lessonId ?? '')
  if (!classId || !assignmentId || !lessonId)
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const rosterDoc = await adminDb.collection('classes').doc(classId).collection('roster').doc(u.uid).get()
  if (!rosterDoc.exists) return NextResponse.json({ ok: false, error: 'Not in class' }, { status: 403 })

  const aDoc = await adminDb.collection('classes').doc(classId).collection('assignments').doc(assignmentId).get()
  if (!aDoc.exists || aDoc.get('type') !== 'lesson')
    return NextResponse.json({ ok: false, error: 'Assignment not found' }, { status: 404 })
  const lessonIds: string[] = aDoc.get('lessonIds') ?? []
  if (!lessonIds.includes(lessonId))
    return NextResponse.json({ ok: false, error: 'Lesson not in assignment' }, { status: 400 })

  const meta = buildLessonSubmission({ lessonId })
  await adminDb
    .collection('classes').doc(classId)
    .collection('assignments').doc(assignmentId)
    .collection('submissions').doc(u.uid)
    .set({ ...meta, submittedAt: FieldValue.serverTimestamp() }, { merge: true })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Call it from the lesson player on assigned completion** — `app/lesson/page.tsx`

Store the applicable lesson assignments (from the load effect) so the completer knows which assignment(s) a lesson belongs to. In the effect (Task 2 Step 3 area) add:

```typescript
      setStudentClasses(classesLite) // ClassLite[] with assignments; used to find the assignment for lessonId
```
with `const [studentClasses, setStudentClasses] = useState<ClassLite[]>([])`.

Then extend `handleComplete` (after the `setDoc` succeeds) to notify each lesson assignment that contains this lesson:

```typescript
    // Notify any lesson assignment this lesson belongs to (assigned layer, D6).
    if (user) {
      for (const c of studentClasses as any[]) {
        for (const a of c.assignments ?? []) {
          if ((a.type ?? 'lesson') !== 'lesson') continue
          if (!a.lessonIds?.includes(lessonId)) continue
          if (!(a.scope === 'class' || a.studentUids?.includes(user.uid))) continue
          try {
            await fetch('/api/lesson/submit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
              body: JSON.stringify({ classId: c.__classId ?? a.classId, assignmentId: a.id, lessonId }),
            })
          } catch { /* noop */ }
        }
      }
    }
```
Note: `ClassLite` does not currently carry its `classId`; add `__classId` when building `classesLite` in `fetchStudentClasses` (set `out.push({ __classId: cid, pacing, ... })` and add `__classId?: string` to `ClassLite`), OR thread `classId` onto each `AssignmentLite` at read time. Pick one and keep it consistent.

- [ ] **Step 3: Build gate**

Run: `npm run build`
Expected: zero errors.

- [ ] **Step 4: Manual verification**

As a teacher (`demo.teacher@`), assign a lesson to `demo.student1@`. As the student, complete it. Confirm `classes/{classId}/assignments/{id}/submissions/{studentUid}` now has `{ lessonId, status:'complete' }`.

- [ ] **Step 5: Commit**

```bash
git add app/api/lesson/submit/route.ts app/lesson/page.tsx app/student/useStudent.ts
git commit -m "feat(lessons): record lesson-assignment completion via server endpoint"
```

---

## Task 6: Teacher lesson-assignment authoring UI

**Files:**
- Verify/Modify: `app/dashboard/[classId]/course/page.tsx`

**Note on rules:** No Firestore rule change is required. `docs/firestore.rules.proposed` already lets rostered students read `assignments` and reuses the `submissions/{studentUid}` rule (client-read for student+teacher, `write:false` → admin-only). Confirm those proposed rules are actually deployed to `breadhead/firestore.rules`.

- [ ] **Step 1: Inspect the current course page**

Read `app/dashboard/[classId]/course/page.tsx`. Determine whether it already POSTs to `/api/classes/[classId]/assign` with `type:'lesson'` + `lessonIds` (the API fully supports it). If it does, this task is verification-only — skip to Step 3.

- [ ] **Step 2: If lesson authoring is missing, add it**

Add a lesson picker (use `CATALOG` from `lib/curriculum/catalog.ts` and `LESSON_ORDER`) with scope (`class` | `students` + student checkboxes) and optional due date, POSTing:

```typescript
await fetch(`/api/classes/${classId}/assign`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
  body: JSON.stringify({ type: 'lesson', lessonIds, scope, studentUids, dueDate, title }),
})
```
Follow the existing patterns in `app/dashboard/[classId]/journal/page.tsx` for scope pickers and student lists.

- [ ] **Step 3: Build + visual gate**

Run: `npm run build`
If the UI changed visibly, run `npm run test:update` and commit the new snapshots with this task.
Run: `npx playwright test`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/[classId]/course/page.tsx tests/snapshots -A
git commit -m "feat(lessons): teacher can assign lessons (type:lesson authoring UI)"
```

---

## Task 7: Teacher lesson-assignment completion indicator

**Files:**
- Modify: `app/api/dashboard/overview/route.ts` (include lesson-submission status per student)
- Modify: `app/dashboard/[classId]/[studentUid]/page.tsx` (render lesson-assignment done/not-done)

- [ ] **Step 1: Include lesson submissions in the overview**

In `app/api/dashboard/overview/route.ts`, where journal submissions are read for each assignment, also surface lesson-assignment submissions. For a `type:'lesson'` assignment, a student is "complete" if `assignments/{id}/submissions/{studentUid}` exists with `status==='complete'`. Return that alongside the existing journal status.

- [ ] **Step 2: Render the indicator**

In `app/dashboard/[classId]/[studentUid]/page.tsx`, add a card for each `type:'lesson'` assignment mirroring the journal status card: title, due date, and "Complete / Not started" from the submission. Keep copy/style consistent with the journal card.

- [ ] **Step 3: Build + visual gate**

Run: `npm run build`; if UI changed, `npm run test:update`; then `npx playwright test`.
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add app/api/dashboard/overview/route.ts "app/dashboard/[classId]/[studentUid]/page.tsx" tests/snapshots -A
git commit -m "feat(lessons): teacher sees lesson-assignment completion status"
```

---

## Task 8: Auth parity — Google + Apple sign-in (D1)

**Files:**
- Create: `lib/firebase/authProviders.ts`
- Modify: `app/login/page.tsx`

**Interfaces:**
- Produces: `signInWithGoogle(): Promise<User>`, `signInWithApple(): Promise<User>`, `ensureProfile(user, role): Promise<void>` (creates `users/{uid}.profile` if absent, same shape as email signup).

- [ ] **Step 1: Create `lib/firebase/authProviders.ts`**

```typescript
import {
  GoogleAuthProvider, OAuthProvider, signInWithPopup, type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './client'

// Create the same profile shape email signup writes, only if the user is new.
export async function ensureProfile(user: User, role: 'student' | 'teacher' = 'student') {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists() && (snap.data() as any)?.profile) return
  await setDoc(ref, {
    profile: {
      uid: user.uid, email: user.email ?? '', name: user.displayName || user.email || 'Student',
      role, provider: user.providerData[0]?.providerId ?? 'oauth',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), classIds: [], teacherIds: [],
    },
  }, { merge: true })
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider())
  await ensureProfile(cred.user)
  return cred.user
}

export async function signInWithApple(): Promise<User> {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email'); provider.addScope('name')
  const cred = await signInWithPopup(auth, provider)
  await ensureProfile(cred.user)
  return cred.user
}
```

- [ ] **Step 2: Add buttons to the student pane of `app/login/page.tsx`**

Below the email/password form in `StudentPane`, add "Continue with Google" and "Continue with Apple" buttons wired to the helpers, then `router.push('/dashboard')`. Handle the linking error explicitly:

```typescript
import { signInWithGoogle, signInWithApple } from '@/lib/firebase/authProviders'

async function google() {
  setError(''); setBusy(true)
  try { await signInWithGoogle(); router.push('/dashboard') }
  catch (e: any) {
    setError(e?.code === 'auth/account-exists-with-different-credential'
      ? 'You already have an account with this email — sign in with your original method, then link Google in settings.'
      : 'Google sign-in failed.')
    setBusy(false)
  }
}
// apple() mirrors google() with signInWithApple()
```

Follow existing button styling (brandGreen primary; do not use accentGold — reserved for gamification/CTA per CLAUDE.md). No guest button on web (D1).

- [ ] **Step 3: Build + visual gate**

Run: `npm run build`. New login buttons are a visible change → `npm run test:update`, then `npx playwright test`.
Expected: all pass; commit updated login snapshots.

- [ ] **Step 4: Console prerequisites (manual, document in commit body)**

In Firebase console: enable Apple provider (needs Apple Developer Services ID + key); set Auth → Settings → "one account per email address". These are config, not code, but the code above assumes them.

- [ ] **Step 5: Commit**

```bash
git add lib/firebase/authProviders.ts app/login/page.tsx tests/snapshots -A
git commit -m "feat(auth): Google + Apple sign-in on web with one-account-per-email provisioning"
```

---

## Task 9: Self-directed experience audit + final gates (D8)

**Files:**
- Audit (modify as needed): `app/dashboard/StudentHome.tsx`, `app/dashboard/course/page.tsx`, `app/dashboard/unit/[unit]/page.tsx`, `app/dashboard/journal/page.tsx`, and `/student/*` equivalents.

- [ ] **Step 1: Zero-class walkthrough**

Sign in as a brand-new self-signup account (no class). Verify: no empty "Assigned" sections, no due-date chrome, no teacher scaffolding; lessons and journal both work standalone. Fix any screen that renders an empty assigned block by guarding on `assignments.length > 0`.

- [ ] **Step 2: Multi-class + permanence spot check**

Confirm a student in two classes sees the union of both classes' assigned lessons; confirm an assigned lesson stays `open` after its due date passes.

- [ ] **Step 3: Full gate**

Run: `npm run build` → zero errors.
Run: `npx playwright test` → all unit + 48 visual pass. If any intentional visual change, `npm run test:update` and commit snapshots.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore(lessons): self-directed zero-class audit + snapshots"
```

---

## Task 10: Show "Unit X · Lesson Y" under the "Next lesson" button (completion screen)

**Files:**
- Modify: `components/lesson/LessonPlayer.tsx` (add `nextLabel` prop; render under the Next-lesson button)
- Modify: `app/lesson/page.tsx` (pass the label from the already-computed `next`)

**Interfaces:**
- Consumes: `next = nextAfter(target.unit, target.lesson)` (already computed in `app/lesson/page.tsx:126`).
- Produces: `LessonPlayer` gains optional `nextLabel?: string` prop.

- [ ] **Step 1: Add the prop to `LessonPlayer`**

In `components/lesson/LessonPlayer.tsx`, add to the props destructure and type:

```typescript
  onNext,
  nextLabel,
```
```typescript
  onNext?: () => void          // provided → "Next lesson" button on completion
  nextLabel?: string           // e.g. "Unit 2 · Lesson 3" — shown under the button
```

- [ ] **Step 2: Render it beneath the button row**

In the `done` completion block, immediately AFTER the buttons `</motion.div>` (currently line ~113) and before the container closes, add:

```tsx
        {onNext && nextLabel && (
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
            className="text-textTitle/45 text-sm mt-4 relative z-10"
          >
            {nextLabel}
          </motion.p>
        )}
```

- [ ] **Step 3: Pass the label from the lesson page**

In `app/lesson/page.tsx`, in the `<LessonPlayer .../>` JSX (after `onNext={goNext}`), add:

```tsx
      onNext={goNext}
      nextLabel={next ? `Unit ${next.unit} · Lesson ${next.lesson}` : undefined}
```

(The label reflects the lesson `goNext` navigates to — the student's own sequential next lesson, consistent with D3: assigned lessons never change what "next" means.)

- [ ] **Step 4: Build + verify**

Run: `npm run build` → zero errors.
Run `npm run dev`, complete a lesson, confirm "Unit X · Lesson Y" appears beneath "Next lesson →". Run `npx playwright test` (completion screen isn't in the visual snapshots, so no snapshot change expected — confirm all still pass).

- [ ] **Step 5: Commit**

```bash
git add components/lesson/LessonPlayer.tsx app/lesson/page.tsx
git commit -m "feat(lessons): show next lesson's Unit/Lesson under the completion Next button"
```

---

## Appendix: iOS change map (DEFERRED — do not implement in this plan)

Canonical spec: `breadhead/docs/superpowers/specs/2026-07-07-ios-teacher-assignments-consumption.md` (committed). Exact seams discovered:

- **`LessonProgress.swift`** (root) — model unchanged; keep `markLessonComplete` but, like the web fix (D3), do **not** call `updateCurrentPosition` on out-of-order/assigned completions.
- **`Teen Personal Financial App/Features/Learn/CurriculumOverviewView.swift:480-485`** — `lessonStatus(unitNumber:lessonNumber:id:)` is the exact gate. Add an assigned-set check so an assigned lesson returns `.current` regardless of `currentUnit/currentLesson`, and overrides pacing. Enum at `:39-41` (`completed/current/locked`) — consider adding `.assigned` for distinct styling, or reuse `.current`.
- **New (no existing code):** join-by-code, read `classes/{classId}/assignments`, compute assigned set, POST to `/api/lesson/submit`, student assignment UI. Grep confirmed **zero** class/assignment/roster/joinCode anywhere in Swift.
- **Auth:** no change — `FirebaseAuthManager.swift` already has `signInWithGoogle` (:434), `signInWithApple` (:538), `signInWithEmail` (:210), `enableGuestMode` (:345).
- **Journaling:** iOS already has a full journal (`Features/Journal/JournalView.swift`, ~1788 lines) with its own prompts/streak/XP — but **no teacher-assigned journals**. Journal-assignment consumption is a separate later item; lesson assignments ship first.
- **Rules:** reconcile any web rule changes into `breadhead/firestore.rules` (the deployed file) — though this plan needs none.

---

## Self-Review

- **Spec coverage:** D1 auth → Task 8. D2 out-of-order → Task 1 (`assignedLessonIdSet`) + Task 2. D3 no frontier advance → Task 3 + `nextLesson` test. D4 linear default → unchanged `lessonState` fallback. D5 pacing override → Task 1 test. D6 separate-layer completion → Tasks 4–5 + Task 7. D7 unified journal → no code change (existing behavior; noted in spec). D8 self-directed → Task 9. D9 permanence → live-derived union (Task 1) + Task 9 Step 2 check. Mobile-compat → additive fields only; iOS appendix.
- **Placeholder scan:** none — every code step has complete code.
- **Type consistency:** `lessonState`/`nextLesson`/`assignedLessonIdSet`/`LessonState` defined in Task 1 and consumed with matching signatures in Tasks 2–3; `buildLessonSubmission` defined in Task 4, consumed in Task 5.
- **Open item to confirm during Task 5:** how `classId` reaches the completer (add `__classId` to `ClassLite` or thread onto `AssignmentLite`). Flagged inline; pick one consistently.
