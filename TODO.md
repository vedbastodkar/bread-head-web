# Bread Head — App TODO

Running backlog of cross-platform / web-app issues to fix. Newest at top.

---

## Web data-collection TODO (from `breadhead/docs/CROSS-REPO.md` §3)  (2026-09-10)

Date: 2026-09-10. Firebase project `bread-head-4b6f9`. Contract: `breadhead/docs/analytics/data-contract.md`.
Each numbered item = one commit. After each: `npm run build` + `npx playwright test` (compare against the
baseline: Nav ×3, Team ×2, About ×3 are known pre-existing snapshot failures — do not regenerate them).
No commits until Ved has tested; ask first.

### 1. `lib/analytics/events.ts` — browser EventLogger  ✅ built + gate green (uncommitted)
- Buffer in memory, flush as one `writeBatch` to top-level `events` at 25 events, on
  `visibilitychange === 'hidden'` / `pagehide`, and on a short idle timer (web has no offline
  persistence, so a tab close would otherwise drop the tail).
- Doc shape (contract §3): `{ uid, name, platform: 'web', sessionId, clientTs: Timestamp,
  serverTs: serverTimestamp(), appVersion, screen?, params? }`.
- `sessionId` UUID in `sessionStorage` (per tab); emit `session_start` once when a session is created.
- No-op when signed out or anonymous. Each buffered event captures the uid at log time; at flush only
  the current uid's events are written (rules reject a batch with any foreign uid).
- Hard buffer cap 500 (oldest dropped). Failed commit is logged and dropped.
- `appVersion` = `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` (short) or package version.
- Unit test for the pure parts (`tests/unit/events.spec.ts`): document builder + uid filtering.

### 2. Lesson player events  ✅ built + gate green (uncommitted)
- `app/mylessons/[unit]/[lesson]/page.tsx`: `lesson_started` (lessonId, slideCount, isOnboarding=false)
  when the target lesson mounts; `lesson_slide_viewed` (lessonId, slideIndex, isInteractive) inside
  `saveSlide`; `lesson_completed` (lessonId, score|null, timeSpent s, gradedSlides) in `handleComplete`.
- `components/lesson/LessonPlayer.tsx`: new optional `onAnswer({ slideIndex, kind, isCorrect })` prop,
  threaded to the graded slides: `trueFalse → trueOrFalse`, `multipleChoice → multipleChoice`,
  `matchConcept → matchConcept` (one attempt per pair). Every attempt fires. `realLifeScenario` is NOT
  recorded — iOS does not grade it either and the contract's `kind` list has no value for it (flagged).
- `lib/analytics/lessonAnswers.ts` (pure, tested): answer-record accumulator mirroring iOS
  `SlideAnswerRecord` (`attempts`, `wrongAttempts`, `isCorrect` latches true) + `scoreOf(records)`
  (% clean first-try, `null` when no graded slides).
- Page emits `lesson_answer` (lessonId, slideIndex, kind, isCorrect, attempt) per attempt.

### 3. `users/{uid}/lessonProgress/{lessonId}` evidence record  ✅ built + gate green (uncommitted)
- In `handleComplete`, same `writeBatch` as the existing top-level merge: `setDoc(..., { lessonId,
  completedAt: serverTimestamp(), score, timeSpent, answers[], platform: 'web' }, { merge: true })`.
- `answers[]` = `{ slideIndex, kind, isCorrect, attempts, wrongAttempts, answeredAt: Timestamp }`.
- Keep the top-level `completedLessons` arrayUnion (cross-app unlock). Never a non-merge set on `users/{uid}`.

### 4. Budget transactions: `createdAt` + `platform`  ✅ built + gate green (uncommitted)
- `lib/budget/budget.ts`: `BudgetTransaction.createdAt?: number`, `platform?: 'ios' | 'web'`.
- `lib/budget/store.ts` `transactionToFirestore`: write `createdAt` (set once; now if absent) and
  `platform: 'web'`. `parseTransactions`: read `createdAt` (fallback `date`) and `platform`.
- `addTransaction` emits `transaction_created` (transactionId, type, nwsLevel, hasCategory,
  backdatedByDays) after the commit — listed in the CROSS-REPO status matrix as web ⬜.
- `app/mybudget/page.tsx` sets `createdAt: Date.now()` on the new tx.

### 5. Join route → verified attribution  ✅ built + gate green (uncommitted)
- `app/api/student/join/route.ts`: after the roster write, `userRef.update({
  'profile.attribution.verified': true, 'profile.attribution.classId': cid,
  ...(sponsorId && !alreadySet ? { 'profile.attribution.sponsorId': sponsorId } : {}) })`.
  `sponsorId = cls.get('sponsorId')`. First verified sponsor wins (spec §5 multi-class rule).
- Response gains `sponsorId` so the caller can see it. No client-side event (server truth).

> **Superseded 2026-11-15 — organization codes.** The partner is no longer a field on the class (`classes.sponsorId` was dropped: teachers can write class docs from the browser). It belongs to the **teacher**: server-only `teacherOrgs/{teacherUid} = { sponsorId, via: 'code' | 'admin', updatedAt }`, set when the teacher enters an admin-issued organization code (`sponsorCodes/{CODE} = { sponsorId, createdAt }`, one live code per partner, generated in `/admin`) at sign-up or in the dashboard, or directly by the admin in `/admin` → Teachers. `POST /api/student/join` sets `attribution.sponsorId` from the class owner's `teacherOrgs` entry. Both collections fall under the deny-by-default rule — no rules change. Code: `bread-head-web/lib/sponsors/{orgCode,server}.ts`, `app/api/teacher/organization`, `app/api/admin/{org-codes,teachers}`. Items 5–6 below describe the earlier per-class design and are kept for history; `SponsorSelect`, `lib/sponsors/client.ts` and `resolveClassSponsorId` were removed.

### 6. `classes.sponsorId` (optional) + teacher UI  ✅ built + gate green (uncommitted)
- `lib/sponsors/server.ts`: `loadSponsorItems()` via Admin SDK; `isValidSponsorId(id, items)`.
- `lib/sponsors/shared.ts` (pure, tested): id regex, reserved ids (`classroom`, `self`), sort.
- `app/api/classes/route.ts` POST + `app/api/classes/[classId]/route.ts` PATCH: accept `sponsorId`
  (string → must be a key of `public/sponsors.items`; `null` → delete field). 400 otherwise.
- `app/api/dashboard/overview/route.ts` returns `sponsorId`; `ClassData.sponsorId?: string | null`.
- `lib/sponsors/client.ts`: `fetchSponsors()` reads `public/sponsors` with the client SDK (world-readable).
- Teacher UI: sponsor `<select>` in `CreateClassModal` and `[classId]/settings` (only when at least one
  sponsor exists). Dashboard is currently behind the ComingSoon curtain — code builds, not visible.

### 7. Admin portal (`/admin`) + BigQuery + sponsor report + sponsor admin  ✅ built + gate green (uncommitted)
- `npm i @google-cloud/bigquery`. `lib/bigquery.ts`: client from `BIGQUERY_CREDENTIALS_JSON` if set,
  else the same service account as the Admin SDK (`FIREBASE_ADMIN_CLIENT_EMAIL/PRIVATE_KEY` — that SA
  holds BigQuery Data Editor + Job User). Dataset `breadhead_analytics`, views `v_users`, `v_events`,
  `v_lesson_progress`. Never Firestore for reporting.
- `lib/firebase/verifyAdmin.ts`: token → `email === 'ved@bread-head.org'` (or `role === 'admin'` claim).
- API: `GET /api/admin/overview` (users, events by platform 30d, lessons completed by platform),
  `GET /api/admin/sponsor-report?sponsorId&from&to`, `GET|PUT /api/admin/sponsors` (edit
  `public/sponsors.items` via Admin SDK; add / edit / deactivate only, no delete; reserved ids rejected).
- `lib/admin/sponsorReport.ts`: one function `sponsorReport(sponsorId, { from, to })` → runs the
  BigQuery queries and hands rows to a pure, tested `shapeSponsorReport()` enforcing spec §6:
  self-reported and verified counts separate (never blended), denominator stated (total students,
  students with no source), every breakdown cell < 10 suppressed (`null` + `suppressed: true`).
- UI `app/admin/page.tsx` (client): gate on `useAuth().user.email`; overview tiles; sponsor report
  form (sponsor picker, date range, CSV download); sponsor admin table.

### 8. Privacy page  ✅ built + gate green (uncommitted)
- `app/privacy-notice/page.tsx` §2: add the sponsoring-partner line mirroring iOS
  (`Sponsoring partners — aggregate participation data only, never individual records`), bump
  "Last updated" to September 10, 2026.

### Verification per item
- `npm run build` zero errors; `npx playwright test` — unit specs green, visual specs unchanged vs baseline.
- Items 1–4: manual — sign in on localhost, play a lesson, add a receipt, then check Firestore
  `events`, `users/{uid}/lessonProgress/{lessonId}`, and BigQuery `v_events WHERE platform='web'`.
- Item 7: `GET /api/admin/overview` with Ved's token; BigQuery query verified with the SA key locally.

### Edge-case pass (2026-09-11) — fixed
- Admin email gate now requires `email_verified` (anyone could otherwise sign up with the admin address + own password).
  → create the admin account with Google sign-in, or ask Claude to set the `admin` claim on it.
- EventLogger: a flush skipped while another was in flight is rescheduled; session rotates after 30 min idle (iOS parity).
- Join route: once a sponsorId is locked in, `attribution.classId` is locked with it (no A/B mismatch on a second join).

### Flags for Ved
- iOS `FirebaseDataManager.completeLesson` writes `"score": progress.score ?? 0` — ungraded lessons land as 0 in
  `lessonProgress` despite the change log saying nil. Web writes `null`. Fix in breadhead or the sponsor report's
  average score is dragged down by iOS zeros.
- Teachers can attach ANY active sponsor to their class (CROSS-REPO item 6 asked for teacher UI); data-contract §7.5
  says admin-set. With many partners, consider moving sponsor assignment to /admin only.
- `ved@bread-head.org` has NO Firebase Auth account yet (checked 2026-09-10) — create it (Google sign-in or
  email/password) before /admin can be used. Only the 401 paths were smoke-tested end-to-end.
- BigQuery dataset is in `us-central1`; `lib/bigquery.ts` defaults to that (override `BIGQUERY_LOCATION`).
- `realLifeScenario` has a correct answer on both platforms but neither records it (parity kept).
- `class_joined` / `assignment_submitted` events not emitted (not in the §3 list).
- Vercel needs no new env var if the Admin SDK SA is reused for BigQuery; set
  `BIGQUERY_CREDENTIALS_JSON` only if you want a separate, narrower SA.

---

## Cross-platform onboarding + progress sync (web-first, then mobile)

**Status:** open · reported 2026-07-11 · spans web + iOS

**Repro:** Create an account on the **web** first, then sign into the **mobile**
app with that same account afterward.

**Problems observed:**

1. **Mobile skips the budget-specific onboarding.** After a web-first account
   signs into mobile, you get the *initial* onboarding but **not** the
   budget-specific onboarding — so the budget never gets set up on mobile.

2. ~~**Web doesn't show real lesson progress.**~~ **RESOLVED 2026-07-12** —
   verified against code, not reproducible. Details:
   - `app/student/useStudent.ts:132-134` reads `currentUnit`/`currentLesson`
     from the Firestore `users/{uid}.lessonProgress` doc (`lp.currentUnit ?? 1`,
     `lp.currentLesson ?? 1`). The `?? 1` is a fallback that only fires when
     `lessonProgress` is absent entirely — i.e. an account with no progress
     yet — not a hardcode that overrides real progress.
   - The dashboard "Current lesson" resume card
     (`app/dashboard/StudentHome.tsx:39,169`) doesn't even read those fields —
     it derives the resume point via `nextLesson(completed)`
     (`lib/curriculum/controls.ts:97-102`), which walks `LESSON_ORDER` and
     returns the **first not-completed lesson**, computed live from
     `completedLessons`. Same completedLessons-driven pattern in the unit
     browser (`app/dashboard/unit/[unit]/page.tsx:24,28`, via `lessonState`)
     and the course page (`app/dashboard/course/page.tsx:14`).
   - `app/lesson/page.tsx:112-125` (`handleComplete`) persists
     `completedLessons` (via `arrayUnion`) to Firestore on every lesson
     completion, and advances `currentUnit`/`currentLesson` when the
     completed lesson is on the student's own linear frontier
     (`advancesFrontier`, `lib/curriculum/controls.ts:109-113`) — that field
     pair is the iOS-facing cross-app pointer (design D3), separate from the
     completedLessons-driven resume UI above.
   - The only literal `{ unit: 1, lesson: 1 }` on this path
     (`StudentHome.tsx:80`, in `parseId`) is a regex-parse fallback for a
     malformed assignment lesson id string, not a progress default — it
     never fires on the resume/dashboard path.

3. **Broken onboarding page UI (seen during the above).** "Half-assed" page:
   - keyboard opened and **wouldn't dismiss** (no dismiss / didn't go down)
   - a **bad floaty button** (mis-positioned / floating)
   - generally **bad UI** / unfinished layout
   - (Which surface this page is on — web budget onboarding vs. mobile budget
     onboarding — needs confirming; likely the budget onboarding reached via a
     web-first account.)
   - **Note 2026-07-12:** `app/mybudget/onboarding/BudgetOnboarding.tsx`
     (added in commit `94c482b`, after this item was filed) is a new
     first-run web budget-onboarding flow. A quick scan shows no
     absolutely-positioned/fixed CTA button and numeric inputs use
     `inputMode="decimal"` (native numeric keyboard), which is plausibly
     consistent with this being fixed already — but that wasn't confirmed by
     driving the flow live, so item #3 stays **open** pending an actual
     repro/verification pass.

**Expected behavior:**
- Signing into mobile with an existing (web-created) account should still run
  the **budget-specific onboarding** if the budget isn't set up yet.
- Web should load and display the account's **actual lesson progress**, not a
  hardcoded Lesson 1.
- The budget onboarding page should have polished UI: dismissable keyboard,
  correctly-placed primary button, finished layout.
