# Personal Mode + Assignment-as-Unlock — Logistics & Considerations

**Date:** 2026-07-07
**Status:** Pre-spec (enumerating decisions). Turns into a design spec once open decisions are resolved.

---

## 1. What we're actually building

Two threads, one account model:

1. **Auth parity** — bring the web app's login methods in line with the iOS app, so signing in on a laptop lands you in the *same account* with the *same data* as the phone.
2. **Assignment-as-unlock** — let a teacher assign lessons (and journals) that grant a student *permanent, out-of-order* access to those lessons, layered on top of the student's own self-directed progression.

The guiding principle (settled in discussion): **one identity per human; "being in a class" is an additive relationship, never a separate account or separate data store.** Self-directed work and assigned work are the same data viewed through two lenses.

---

## 2. Scope boundary (settled)

**In scope (web, now):**
- Login-method parity with the iOS app.
- Assignment-as-unlock mechanic for lessons.
- Prior-completion credit for lesson assignments.
- A clean self-directed experience for un-enrolled users.

**Out of scope (deliberately deferred):**
- Any iOS code. The contract stays additive/backward-compatible so the app keeps working untouched and can light up assignment UI later with zero migration.
- Teacher authoring/roster tools on mobile — those stay web/desktop, likely forever.
- XP awarding on web — the XP formula lives in iOS by design; web writes lesson *completion* but not XP. (Existing constraint, unchanged.)

**Design rule that keeps mobile untouched:** new concepts go in *new* collections or *new optional fields*. Never rename or repurpose a field the iOS app already reads. A field the app doesn't know about is a field it safely ignores.

---

## 3. What already exists (build on, don't rebuild)

| Capability | Where | State |
|---|---|---|
| Shared account (same Firebase project as iOS: `bread-head-4b6f9`) | `lib/firebase/*` | ✅ Done — cross-device sync is automatic |
| Email/password login | `app/login/page.tsx` | ✅ Done |
| Role via custom claims + `profile.role` | `verifyTeacher.ts`, login | ✅ Done |
| Interactive lessons (95 lessons / 10 units) | `components/lesson/LessonPlayer.tsx` | ✅ Done |
| Lesson completion (`lessonProgress.completedLessons: string[]`, ids `unit{N}lesson{M}`) | `app/lesson/page.tsx` | ✅ Done |
| Linear sequential unlock + teacher pacing frontier | `lib/curriculum/controls.ts`, `useStudent.ts` (`lessonState`) | ✅ Done |
| Join-by-code enrollment (classes, roster, `profile.classIds`) | `api/student/join`, `api/classes` | ✅ Done |
| Assignment schema with `type: 'lesson'`, `lessonIds[]`, `controls` | `classes/{classId}/assignments/{id}` | ⚠️ Schema exists; lesson unlock **not wired** |
| Journal assignments (assign, submit metadata, teacher status view) | `app/dashboard/journal/*` | ✅ Done |
| Journal privacy (teacher sees only wordCount/seconds/status, never content) | `api/journal/submit`, per-student view | ✅ Done |

---

## 4. Auth / login parity

- Web today: **email/password only.** Google is configured in the Firebase console but has **no UI**. Apple is not present.
- iOS almost certainly supports more (Apple Sign In is effectively mandatory for App Store apps that offer any social login; Google is common).
- **[OPEN — D1]** Which providers does the iOS app support? That set is exactly what web must offer. Likely: Apple + Google + email/password.
- **Identity-collision logistics:** if a kid signs up with email/password and later taps "Sign in with Google" using the *same email*, Firebase can either create a **second account** (reintroducing the exact split-identity / lost-progress problem we're trying to avoid) or **link** them. We must configure Firebase Auth to **"one account per email address"** and handle the account-linking flow, so one human = one `uid` regardless of provider.
- Sign-in with Apple can hide the user's real email (private relay). Consideration: don't key any logic on email; keep `uid` as the sole identity. (Already true in the codebase — good.)

---

## 5. The assignment-as-unlock mechanic (core new work)

Today, whether a lesson is `open` is computed from linear order + pacing frontier. We add a third input: **the set of lessons assigned to this student.**

**New unlock rule (conceptual):**
```
open lessons = linear frontier (next-not-completed)
             ∪ completed lessons
             ∪ assigned lessons (from any class the student is in)
```
Assigned lessons are `open` **regardless of order** and **stay open forever** (even after the assignment's due date passes, even if the student later leaves the class — the access already granted is not revoked).

**Worked example (the one you gave):** kid has completed through unit 1 on their own. Teacher assigns unit 6, then unit 2. Result: unit 1 lessons `done`; the assigned unit-6 lesson and unit-2 lesson are both `open` and selectable; everything else stays `locked` under normal linear rules.

### Open decisions for this mechanic

- **[OPEN — D2] Unlock granularity.** When a teacher assigns "unit 6", does that unlock (a) only the specific lesson(s) in `lessonIds`, (b) the whole unit, or (c) everything up through that point? *Recommendation: (a) — only the specifically assigned lessons.* Keeps it precise and matches "assigned = accessible."
- **[OPEN — D3] Does an assigned lesson advance the linear frontier?** If the unit-1 kid completes assigned `unit6lesson2`, does their self-directed "next lesson" jump to unit 6? *Recommendation: No.* Assigned completions are a parallel set; the self-directed frontier keeps advancing from where the kid actually is (`currentUnit/currentLesson` should not leap). Otherwise assigning one advanced lesson would skip them past everything in between.
- **[OPEN — D4] Does self-directed progression stay linear?** For an un-enrolled kid (or the non-assigned lessons of an enrolled kid), do we keep the existing sequential gate, or let personal users roam all 95 lessons freely? *Recommendation: keep linear* — it matches the iOS app ("same functions under the hood") and preserves the pedagogical order. Assignments are the *only* override.
- **[OPEN — D5] Pacing frontier vs. assignment.** The teacher pacing frontier currently *locks* lessons beyond a point. If a teacher assigns a lesson beyond their own pacing frontier, assignment should win (explicit assignment overrides the general gate). *Recommendation: assignment overrides pacing.* Confirm.

---

## 6. Lesson-assignment completion (RESOLVED — D6: separate layers)

**Decision (user):** the teacher-assigned layer is **fully separate** from the lesson-completion layer.

- **Two separate axes:** mastery (permanent, on `uid`) vs. assignment fulfillment (a distinct record on a dated request). Assigning a lesson **never** un-completes, resets, or locks a student backward — it's purely additive.
- **No prior-completion credit.** A teacher assigns it → the student **does it**, whether or not they finished it before. Being in `completedLessons` already does **not** mark the assignment done. (Teacher authority is intentional here; replaying an already-known lesson is accepted.)
- **Completing an assigned lesson marks only that one lesson done** — never everything before it (`arrayUnion(lessonId)` on `completedLessons`, and — per D3 — **without** advancing `currentUnit/currentLesson`).
- **Assignment fulfillment is tracked in its own record**, mirroring how journal submissions already work: a `submissions/{studentUid}` doc under the lesson assignment, written when the student completes the assigned lesson while it is assigned. The assignment is "complete" when that record exists.
- Teacher's roster/overview view needs a lesson-assignment completion indicator (done / not done), analogous to the journal one.

---

## 7. Journal-assignment behavior (RESOLVED — D7: unified journal, no attach)

**Decision (user):** one unified journal, no manual "attach." Each entry counts for its day.

- **No "attach" mechanic** (rejected as clunky). There is **one journal** (`users/{uid}/journal`).
- **Any entry counts for its day** toward streaks/gamification. Because streaks/XP are computed from the shared journal data (and awarded on iOS), simply having an entry for that date is what counts — journaling once a day maintains the streak, whether the entry was personal or an assignment answer. The web app does not compute streaks; it just writes dated entries to the shared collection and iOS picks them up.
- **Assignments are still answered as their own entry** (a distinct entry carrying `assignmentId` — the separate "assigned layer"). Time-bound: an assignment is fulfilled by answering it within its window; a pre-existing personal entry does not silently satisfy it.
- Journal privacy stays: teacher sees status/word-count only, never content. Self-directed journaling is fully private.

---

## 8. Self-directed / "you don't see the assigned pieces" experience

- A user in **zero classes** simply has no assignments → the journal and lesson screens render the personal-only experience. This largely falls out for free from existing filters.
- Audit needed: make sure every screen degrades cleanly when `classIds` is empty (no empty "Assigned" headers, no teacher scaffolding, no dangling "due date" chrome).
- **[OPEN — D8] Signup path for personal users.** Today signup creates `profile.role: 'student'`. A self-directed kid who signs up on the web with no class is a valid, first-class user. Confirm there's nothing that *requires* a class to use the app (there shouldn't be).

---

## 9. Cross-device / mobile-compatibility contract

- Everything writes to the **shared** `users/{uid}` + `classes/*` in project `bread-head-4b6f9`. A lesson completed on web appears on the phone because it's the same doc.
- New data introduced by this feature (e.g., how "assigned lesson unlock" is represented) must be **derivable from existing data** where possible. Assignments already live at `classes/{classId}/assignments`; the unlock is *computed* client-side from `completedLessons ∪ assignedLessonIds`, so ideally **no new stored field** is needed for the unlock itself — the web client just computes a richer `open` set than the app currently does. The app keeps computing its linear set and simply doesn't show the extra unlocked lessons until iOS is updated. Graceful degrade, no migration.
- Any genuinely new field is optional and additive.

---

## 10. Logistics checklist (things easy to forget)

- [ ] Firebase "one account per email" + provider account-linking configured (prevents duplicate identities).
- [ ] Apple private-relay email handled (never key logic on email).
- [ ] Firestore security rules updated so a student may read assignments for their classes and the unlock computation is server-verifiable (see `docs/firestore.rules.proposed`).
- [ ] Teacher lesson-assignment authoring UI (the `/dashboard/[classId]/course` page) actually creates `type: 'lesson'` assignments with `lessonIds`.
- [ ] Lesson-assignment completion indicator in the teacher per-student and overview views.
- [ ] `lessonState()` / unlock logic extended to include assigned lessons; verify it doesn't disturb pacing, linear order, or the iOS app's separate computation.
- [ ] Un-enrolled experience audited across journal + lessons screens.
- [ ] Leaving/removing from a class: already-granted access is not revoked (or decide otherwise — see D9 below).
- [ ] Multiple classes: a student in 2 classes sees the union of both classes' assignments.
- [ ] Assignment referencing an invalid/removed lesson id fails gracefully.
- [ ] Visual regression + build gates (`npm run build`, `npx playwright test`) pass with any new UI.

- **[OPEN — D9] Revocation on un-enroll.** If a student leaves a class (or teacher removes them), do previously-unlocked assigned lessons stay unlocked? *Recommendation: stay unlocked* (access already granted; simpler; kid-friendly). Confirm.

---

## 11. Open decisions summary (need your call before spec)

| # | Decision | RESOLVED |
|---|---|---|
| D1 | Login providers | **Apple + Google + email/password on web. No guest on web (account required); guest stays iOS-only.** |
| D2 | Unlock granularity per assignment | Only the specifically assigned lesson(s) |
| D3 | Does an assigned completion advance the linear frontier? | **No.** Continue/next-lesson follows the student's own progress only; assigned lessons never touch `currentUnit/currentLesson`. (Fix existing code that bumps it on any completion.) |
| D4 | Keep self-directed progression linear? | Yes — assignments are the only override |
| D5 | Assignment vs. teacher pacing frontier | **Assignment overrides pacing** (assigned layer is not bound by the class ceiling) |
| D6 | Prior completion & assignments | **Separate layers.** Assignment must be actively completed regardless of prior completion; completing it marks only that lesson done; fulfillment tracked in its own submission record |
| D7 | Journal / streaks | **Unified journal, no attach.** Any entry counts for its day (streaks via shared data → iOS). Assignments answered as their own `assignmentId` entry |
| D8 | Class required to use the app? | No — self-directed is first-class |
| D9 | Keep assigned unlocks after un-enroll? | Yes — don't revoke |

All decisions resolved. Proceeding to design spec.
