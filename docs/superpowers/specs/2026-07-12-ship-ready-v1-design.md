# Ship-Ready v1 — Design Spec

**Date:** 2026-07-12
**Branch:** `feat/web-budget` (71 commits ahead of `main`, not yet pushed — this whole app surface is unmerged)
**Goal:** Close the launch-blocking issues, fix the just-shipped budget onboarding bugs, land high-value polish, and restructure student routes into a clean `/my*` namespace — so the web app can be officially shipped.

Source of this spec: a four-agent flyover + security/UX audit (2026-07-12) cross-verified against the iOS repo (`../breadhead`) and the repo's own `TODO.md`.

---

## Scope decisions (locked with the user)

- **Teacher provisioning:** Open teacher **self-signup**. The Teacher/Admin pane gets a signup mode; signing up there makes you a teacher. Authorization stays on the server-verified Firebase custom claim, and the user doc also carries `isTeacher: true`.
- **Route restructure:** Student-personalized tools move to top-level `/my*` routes. **No redirects** from old paths (marketing already occupies `/journal`, `/lessons`; `/budget` is added). Old student route files are removed and all internal links repointed.
- **Compliance:** Fix **only** the urgent item — the false privacy-notice statements. FERPA language, age gate, in-app deletion, and data export are explicitly **deferred** to a later project.
- **Demo accounts:** Remove the autofill buttons entirely. Rotating/disabling the seeded prod accounts is a manual Firebase step flagged for the user (out of code scope).
- **Contact form recipient:** Stays `breadhead.org@gmail.com` (it forwards to the user). The inbox-rename idea is **dropped**.
- **Firestore rules (blocker B1):** The user will verify deployed rules at the end. This spec includes a verification checklist item but does not modify rules (they live in the iOS repo).

---

## Workstream A — Blockers

### A1 · Teacher self-signup with `isTeacher`
**Current state:** `app/login/page.tsx` is one page with a Student | Teacher/Admin pane chooser. The Teacher pane is **sign-in only** and checks `claims.role ∈ {teacher, admin}`. The Student pane does signup and writes `profile.role: 'student'`. There is **no** way to create a teacher account in-app; the claim is only set by `scripts/seed_demo.py` or the Firebase console. The `setRole`/`session` routes referenced in `lib/firebase/admin.ts:2` do not exist.

**Design:**
1. Add a `signin | signup` mode toggle to `TeacherPane` (mirroring `StudentPane`), with a Name field in signup.
2. New server route **`POST /api/auth/register-teacher`** (Admin SDK):
   - Verify the caller's ID token (must be a freshly created, authenticated user).
   - Guard: only allow if the user has no existing role claim (prevents re-flipping an existing account).
   - `admin.auth().setCustomUserClaims(uid, { role: 'teacher' })`.
   - Write `users/{uid}` doc: `profile.role: 'teacher'`, `profile.isTeacher: true`, name/email/provider/timestamps, `classIds: []`.
3. Client teacher-signup flow: `createUserWithEmailAndPassword` → `updateProfile(name)` → POST `/api/auth/register-teacher` with Bearer token → `getIdToken(true)` (force refresh so the new claim is live) → `router.push('/dashboard')`.
4. Sign-in path unchanged (still claim-gated).

**Security note:** teacher signup is intentionally open. A fraudulent "teacher" only ever sees their own (empty) classes; the join-code + roster gates mean they cannot reach other teachers' students. Abuse risk is spam-only; acceptable per product direction. `verifyTeacher` continues to read the claim, so a student cannot self-escalate by writing their own user doc.

### A2 · Remove demo autofill buttons
- Delete both buttons: `login/page.tsx:90-96` (teacher) and `:199-204` (student).
- **Manual step for user (documented, not code):** rotate `DemoPass123!` or disable the seeded `demo.teacher@` / `demo.student*@` accounts, since the password is in committed source and git history.

### A3 · Privacy-notice truth-fix
**Current false claims in `app/privacy-notice/page.tsx`:**
- `:80-82` — "Usage data … is stored **locally on your device and is not shared with third parties**."
- `:120-123` — "no third-party analytics … **we do not track you**."

**Design:** Rewrite these sections to state accurately that:
- Account, lesson-progress, journal, and budget data are stored in **Google Firebase / Firestore** (a third-party processor).
- **Teachers can view** a student's lesson/challenge progress and journal **completion metadata** (journal *content* stays private).
- Keep it plain-English and teen-readable; do not add FERPA/COPPA legal language in this pass (deferred). Update `lastUpdated` to the real date.

### A4 · Harden + verify public email routes
**Routes:** `app/api/contact/route.ts`, `app/api/subscribe/route.ts`, `app/api/support/route.ts`.

**Current gaps:** `await req.json()` sits outside try/catch (malformed body → unhandled 500); no field validation (empty/invalid email still sends; `subscribe` never validates at all); **no rate limiting anywhere** in the codebase.

**Design:**
1. Wrap body parsing in try/catch → `400` on malformed JSON.
2. Validate: required fields present, email matches a basic RFC-ish regex, enforce length caps (e.g. name ≤ 100, message ≤ 5000), reject empty email. Return `400` with a clean message.
3. **Rate limiting:** a small shared in-memory limiter (per-IP token bucket / fixed window, e.g. 5 req/min/IP) in a `lib/rateLimit.ts` helper, applied to all three routes. In-memory is acceptable for a single-region Vercel deploy; note the limitation in a comment.
4. **Contact form verification:** the styled "contact-me panel" email (name/email/org/type/reach + message + reply-to CTA) already exists and is good — no redesign. Ensure end-to-end delivery: confirm `noreply@bread-head.org` is a **verified sender domain in Resend** (flag to user if not), and that the `PartnerForm` client surfaces success/error states correctly.

---

## Workstream B — Budget onboarding bugs (feature shipped in `94c482b`)

Verified against iOS source: the three feared schema divergences (`weeklyCheckInWeekday` 0–6 Sun–Sat, `skimRate` 0–1 decimal, `nwsPct` whole numbers) **all match iOS** — no shared-doc corruption risk. The remaining bugs are internal to the web completion path (`app/mybudget/page.tsx`, `lib/budget/store.ts`, `lib/budget/templates.ts`).

- **B1 · Flag written too early.** `finishOnboarding` calls `persistIncome` first; for a snapshot-less web-first account, `setIncome` (`store.ts:218-219`) writes `settings.hasCompletedOnboarding: true` as a side effect. If the category loop then fails, the user is locked out of onboarding with a half-built budget — the opposite of the intended "written last" safety. **Fix:** decouple — `setIncome` must not set the onboarding flag; write `hasCompletedOnboarding: true` exactly once, **last**, in `saveBudgetSettings` after income + all categories have persisted.
- **B2 · Retry duplicates categories.** `templateToCategories` (`templates.ts:86-88`) mints fresh `newBudgetId()` on every call, so a retry after partial failure duplicates every already-saved box. **Fix:** make completion idempotent — derive stable per-category IDs (deterministic from template id + category key) so re-running upserts instead of duplicating.
- **B3 · Read error → empty board.** On `loadBudget` throw, the catch leaves `hasOnboarded` at its `true` default and marks `ready`, dropping the user onto a `$0/$0` board. **Fix:** on read failure show the onboarding flow (or an explicit retry state), never a silent empty board.

---

## Workstream C — High-value polish

- **C1 · Route error boundaries.** Add `app/error.tsx` and `app/global-error.tsx` (and a couple of segment-level `error.tsx` where useful). Replace Next's default error screen with an on-brand fallback + reset.
- **C2 · Security headers.** Populate `next.config.js` with `headers()`: CSP (scoped to Firebase/Resend/self), HSTS, `X-Frame-Options: DENY`, `Referrer-Policy`, `X-Content-Type-Options`. Verify the app still loads (Firebase popups, Google fonts, images).
- **C3 · Fix the two visible stubs.**
  - Lesson **Preview** (`app/dashboard/content/lessons/page.tsx:424`, currently an explicit stub) → render a real preview by reusing `components/lesson/LessonPlayer` in a read-only/modal mode.
  - Challenge **teacher feedback** (`app/dashboard/content/challenges/page.tsx:17`) currently displays feedback with no authoring UI. Either add a minimal feedback editor (textarea → server write) or hide the read-only feedback block until the editor exists. **Decision: hide it** for this ship (smaller, avoids a half-built grading surface); note as a follow-up.
- **C4 · Teacher interaction cleanup.**
  - **Move student**: replace the numeric `window.prompt` (`[classId]/page.tsx:43`, `roster/page.tsx:21`) with a picker modal (dropdown of destination classes).
  - **Create class**: replace the bare `window.prompt` (`DashboardShell.tsx:32`) with a modal that captures name + grade.
  - **Remove student**: add a Remove action (with confirm) — currently impossible.
  - **Errors**: replace `alert(e.message)` mutation errors with inline error UI in these flows.
- **C5 · Reconcile `TODO.md`.** Verify the "web shows hardcoded Lesson 1" item — the player (`app/lesson/page.tsx`) appears to persist and resume real progress now. Confirm by driving the flow; update or close the item accordingly.

---

## Workstream D — Route restructure (student `/my*`)

Marketing pages stay; student tools move to top-level `/my*` to match the existing `/mybudget`. **No redirects.** All internal links (`app/student/StudentShell.tsx` nav, `StudentHome` cards, `app/learn/**` forwarder, grades links) get repointed to the new paths. Old student route files are removed.

| New (student, personalized) | Moves from | Notes |
|---|---|---|
| `/myjournal` | `/dashboard/journal` | Full journal tool (editor, prompts, past entries) |
| `/mylessons` | `/dashboard/course` + `/dashboard/unit/[unit]` | **Lesson suite**: curriculum info, unit/lesson browser, progress — with the **player embedded** (player at `/mylessons/[unit]/[lesson]`, migrated from `/lesson`) |
| `/mybudget` | *(already top-level)* | No move |
| `/budgetchallenge/[assignmentId]` | `/challenge/[assignmentId]` | Budget Challenge solver |

**Marketing:**
- `/journal`, `/lessons` — already marketing, unchanged.
- `/budget` — **add** (rename/relocate current `/budgeting` marketing page to `/budget`).

**Teacher dashboard** stays under `/dashboard/**` (unchanged namespace); only student-facing tools move.

---

## Explicitly out of scope (this ship)

- Firestore rules edits (user verifies deployment separately — blocker B1).
- FERPA/DPA language, age gate at signup, in-app account deletion, data export.
- Rebuilding the contact email design (already good).
- Renaming the contact recipient inbox.
- N+1 read optimization in `/api/dashboard/overview`.
- Budget Challenge in-progress draft persistence.
- Lesson imagery for Units 6–10.
- iOS-side fix for web-first accounts skipping mobile budget onboarding (`TODO.md` #1).

---

## Verification gates (per CLAUDE.md, before any commit/push)

- `npm run build` — zero errors.
- `npx playwright test` — all 21 visual regression snapshots pass (regenerate + commit snapshots only after *intentional* visual changes, e.g. login teacher-signup, route moves).
- Drive the changed flows in a dev server (do **not** run the production build while dev is live — see gotcha G3/G7).
- Manual: teacher signup → dashboard; onboarding completion + a forced-failure retry (no dup boxes); a submitted contact form arrives via Resend; `/my*` routes load and old paths 404 as intended.
