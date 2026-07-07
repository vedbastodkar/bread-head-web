# Personal Mode + Assignment-as-Unlock — Design Spec

**Date:** 2026-07-07
**Branch:** `feat/journaling` (continues from journaling work)
**Companion doc:** `2026-07-07-personal-mode-and-assignment-unlock-considerations.md` (decisions D1–D9)

---

## 1. Summary

Bring the web app to auth parity with the iOS app and add a teacher **assignment-as-unlock** mechanic, on top of the single shared account model that already exists (Firebase project `bread-head-4b6f9`, shared with iOS).

Two capabilities:

1. **Auth parity** — add Apple + Google sign-in to the web (email/password already exists). No guest on web. One human = one `uid` across all providers.
2. **Assignment-as-unlock** — a teacher can assign a lesson that grants a student *permanent, out-of-order* access to that lesson, tracked as its own layer that never disturbs the student's self-directed progression.

The whole design is **additive and backward-compatible** so the iOS app keeps working with zero changes and can adopt assignment UI later with no migration.

---

## 2. Goals / Non-goals

**Goals**
- Sign in on web with Apple / Google / email-password → same account and data as iOS.
- Teacher assigns lesson(s) out of order → those lessons open for the student, permanently.
- Assigned layer stays separate from the self-directed lesson layer (progression, "next lesson", and completion credit all follow the student's own path).
- Un-enrolled users get a clean self-directed experience with no teacher scaffolding.
- No iOS code changes required; no Firestore migration required.

**Non-goals**
- Guest/anonymous auth on web.
- Teacher authoring or roster tools on mobile.
- Awarding XP on web (formula lives in iOS; unchanged).
- Streak computation on web (derived from shared journal data by iOS; unchanged).
- Reworking the existing journaling feature (it already meets requirements).

---

## 3. Auth parity (D1)

### 3.1 Providers
Add to `app/login/page.tsx` (and wherever sign-up lives):
- **Google** — `GoogleAuthProvider` + `signInWithPopup` (config already present in `.env.local`; only UI is missing).
- **Apple** — `OAuthProvider('apple.com')` + `signInWithPopup`. Requires enabling Apple as a provider in the Firebase console and Apple Developer service config (Services ID, key). *This console/Apple setup is a prerequisite task, not code.*
- **Email/password** — unchanged.

### 3.2 One human = one uid (identity collision)
- Configure Firebase Auth to **"one account per email address"** so a user who signs up with email and later uses Google/Apple on the same email is **linked**, not duplicated. Duplicate identities would re-create the split-progress problem this whole effort avoids.
- Implement the **account-linking flow** for the `auth/account-exists-with-different-credential` error: prompt the user to sign in with the original provider, then `linkWithCredential`.
- **Never key app logic on email** — `uid` is the sole identity. (Apple private-relay can hide the real email.) Codebase already uses `uid` everywhere; audit to confirm no new email-keyed logic sneaks in.

### 3.3 New-user provisioning
- On first sign-in via any provider, ensure a `users/{uid}` doc exists with `profile: { role: 'student', ... }` (mirror the existing email/password sign-up path). A social sign-in for a brand-new user must create the same profile shape.
- Role stays teacher/student via custom claims + `profile.role`; social sign-in defaults to `student`.

---

## 4. Assignment-as-unlock (core mechanic, D2–D5)

### 4.1 The unlock rule
A lesson's state for a student is computed from three inputs instead of two:

```
open(lesson) if:
      lesson is the linear frontier (first not-completed under normal rules), OR
      lesson ∈ completedLessons, OR
      lesson ∈ assignedLessonIds(student)      ← NEW
locked otherwise
```

Where `assignedLessonIds(student)` = the union of `lessonIds` across all `type: 'lesson'` assignments applicable to the student (scope `class`, or `students` including their uid) across **every** class they're in (D-multiclass).

Properties:
- **Out of order (D2):** only the specific `lessonIds` on the assignment open — not the whole unit, not everything before it.
- **Permanent (D9):** an assigned lesson stays open even after the due date passes or the student leaves the class. Access already granted is not revoked. (Since the union is computed live from assignments, if we want true permanence past un-enroll we persist a per-user `unlockedLessons` set — see 5.2.)
- **Overrides pacing (D5):** an assigned lesson opens even if it is beyond the class pacing frontier. Pacing governs only the self-directed layer.

### 4.2 Where it's implemented
- `lessonState(id, completed, pacingFrontier)` in `app/student/useStudent.ts` gains an `assignedLessonIds` input and returns `open` when the id is in that set (bypassing linear + pacing checks).
- The unlock set is derived from data `useStudent` already fetches (it reads `classes/{classId}/assignments`). No new fetch needed for enrolled state.

### 4.3 Self-directed progression is untouched (D3, D4)
- **"Next lesson" / "Continue" always follows the student's own linear path** — `nextLesson(completed)` = first not-completed lesson in `LESSON_ORDER`. Completing a far-ahead assigned lesson does not change "first not-completed", so this is naturally correct.
- **Bug fix (required):** `handleComplete` in `app/lesson/page.tsx` currently sets `currentUnit/currentLesson` to the just-completed lesson on *every* completion. This must **not** happen for out-of-order/assigned completions, or a Unit-1 kid who does assigned Unit 6 would have their frontier yanked to Unit 6. Fix: only advance `currentUnit/currentLesson` when the completed lesson is at/adjacent to the student's own frontier; otherwise just `arrayUnion` it into `completedLessons`. (Simplest robust rule: derive current position from `nextLesson(completedLessons)` rather than storing/advancing it on assigned completions.)
- Self-directed unlock stays **linear** for everyone (D4); assignments are the only thing that jumps the line.

---

## 5. Lesson-assignment completion tracking (D6 — separate layers)

The assigned layer is tracked separately from lesson mastery, mirroring the journal-submission pattern that already exists.

### 5.1 Completion semantics
- Prior completion does **not** satisfy an assignment. The student must complete the assigned lesson while it is assigned.
- On completing an assigned lesson:
  1. `arrayUnion(lessonId)` into `users/{uid}.lessonProgress.completedLessons` (lesson layer — idempotent if already there; adds only that id).
  2. Write a **lesson-assignment submission** record (assigned layer).
- `currentUnit/currentLesson` is **not** advanced by this (see 4.3).

### 5.2 Data model (additive)
- **Submission:** `classes/{classId}/assignments/{assignmentId}/submissions/{studentUid}` — reuse the existing submissions subcollection (already used for journals). For lesson assignments store e.g. `{ lessonId, status: 'complete', completedAt }`. Server-verified via an endpoint analogous to `/api/journal/submit` (never trust client for status).
- **Optional persisted unlock set** (only if we want unlock to survive un-enroll per D9 even after assignments are unreadable): `users/{uid}.unlockedLessons: string[]`, appended when a lesson is assigned/first opened. New optional field, ignored by iOS. *If live-derivation from current class memberships is acceptable for permanence, this can be skipped — decide during planning.*

### 5.3 Teacher views
- The teacher per-student view (`app/dashboard/[classId]/[studentUid]/page.tsx`) and overview (`app/api/dashboard/overview`) gain a lesson-assignment completion indicator (done / not done), analogous to the journal status card.
- Lesson-assignment authoring UI (`app/dashboard/[classId]/course`) actually creates `type: 'lesson'` assignments with `lessonIds` (schema already supports it).

---

## 6. Journal behavior (D7 — unified journal)

No code rework of journaling beyond confirming behavior:
- One journal (`users/{uid}/journal`). No "attach" flow.
- Any entry counts for its day; streaks are derived from shared journal data by iOS. Web writes dated entries; it does not compute streaks.
- Assignments are answered as their own `assignmentId` entry within their window (existing behavior). Privacy unchanged (teacher sees metadata only).

---

## 7. Self-directed experience audit (D8)

- A user in **zero classes** must have a fully coherent personal experience: no empty "Assigned" sections, no due-date chrome, no teacher scaffolding.
- Confirm nothing requires a class to use lessons or journaling. Self-directed is a first-class user.
- Screens to audit: student home, `/dashboard/course`, `/dashboard/unit/[unit]`, `/dashboard/journal` (and `/student/*` equivalents).

---

## 8. Security rules

Update `docs/firestore.rules.proposed` (and deploy) so that:
- A student can read `type: 'lesson'` assignments for classes they're in (needed to compute unlock).
- Lesson-assignment submissions are server-written only (student cannot forge `complete`).
- Any new `users/{uid}.unlockedLessons` field is writable only by the owner/server, readable per existing `users/{uid}` rules.
- No rule change weakens the existing journal-content privacy guarantee.

---

## 9. Mobile-compatibility contract (explicit)

- All writes target the **shared** `users/{uid}` and `classes/*` in `bread-head-4b6f9`.
- New fields (`unlockedLessons`, lesson-submission docs) are **optional and additive**; iOS ignores what it doesn't read.
- iOS continues to compute its own (linear) unlock set and simply won't surface assignment-unlocked lessons until it's updated — a graceful degrade, not a break.
- No field the iOS app reads is renamed or repurposed.

---

## 10. Testing & gates

- `npm run build` — zero errors.
- `npx playwright test` — all existing visual regression tests pass; add/update snapshots for any new login UI (Apple/Google buttons) and any new teacher/student assignment UI via `npm run test:update`, committed with the change.
- Manual verification with demo accounts (`demo.teacher@`, `demo.student1–8@`):
  - Assign out-of-order lesson → student sees it open; personal "next lesson" unchanged.
  - Complete assigned lesson → assignment shows done for teacher; student frontier not jumped.
  - Prior-completed lesson assigned → still requires doing; marks only that lesson.
  - Un-enrolled account → clean self-directed experience.
  - Google sign-in on an email-password account → links, no duplicate uid.

---

## 11. Phasing (for the implementation plan)

1. **Auth parity** — Google + Apple UI, one-account-per-email + linking, social new-user provisioning. (Independent; ships value immediately.)
2. **Unlock mechanic** — extend `lessonState`/unlock to include assigned lessons; fix `currentUnit/currentLesson` advance bug. (Core.)
3. **Lesson-assignment completion** — submission records + server endpoint + teacher completion indicators + `type:'lesson'` authoring wiring.
4. **Self-directed audit + security rules + snapshots.**

Each phase is independently buildable and testable; phases 2–3 depend on the assignment schema that already exists.
