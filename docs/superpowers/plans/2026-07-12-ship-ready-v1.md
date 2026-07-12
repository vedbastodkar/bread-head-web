# Ship-Ready v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close launch-blocking issues, fix the budget-onboarding completion bugs, land high-value polish, and restructure student routes into a `/my*` namespace so the Bread Head web app can ship.

**Architecture:** Next.js 14 App Router + Firebase (Auth custom claims + Firestore via Admin SDK on the server) + Resend. Server writes and auth gating go through Admin SDK routes; client reads are gated by Firestore rules (verified separately). Work is grouped into four largely-independent workstreams (A blockers, B budget bugs, C polish, D routes), ordered blockers-first, routes-last.

**Tech Stack:** Next.js 14.2.5, TypeScript (strict), Tailwind v3, Firebase Admin SDK, Firebase Web SDK, Resend, Playwright.

## Global Constraints

- **Verification harness = repo reality, not unit tests.** There is NO jest/vitest/pytest in this repo. Every task verifies via: `npm run build` (zero errors) + `npx playwright test` (21 snapshots) + driving the flow in a running dev server. Never invent unit tests.
- **Never run `npm run build` while `npm run dev` is live** — it clobbers `.next` and corrupts the dev server (gotcha G3/G7). Stop dev before building; restart after. To recover: kill `next dev`, `rm -rf .next`, restart.
- **Regenerate Playwright snapshots ONLY after intentional visual changes** (`npm run test:update`) and commit them with the code change.
- **Colors/typography:** obey `tailwind.config.js` tokens and CLAUDE.md palette/typography rules. Playfair (italic) only on h1/h2; DM Sans everything else.
- **Resend client is initialized INSIDE the POST handler**, never at module level.
- **Firestore rules live in the iOS repo** (`../breadhead/firestore.rules`) — do not edit rules here; blocker B1 is a user-verified checklist item only.
- **Commit frequently**, one logical change per commit. Do not push unless the user asks.

---

## Task 1: Remove demo autofill buttons (blocker A2)

**Files:**
- Modify: `app/login/page.tsx` (teacher button ~90-96, student button ~199-204)

- [ ] **Step 1:** In `app/login/page.tsx`, delete the teacher demo button block (the `<button type="button" onClick={() => { setEmail('demo.teacher@bread-head.org'); setPassword('DemoPass123!') }} ...>Fill demo teacher account</button>`).
- [ ] **Step 2:** Delete the student demo button block (the `{mode === 'signin' && ( <button ... >Fill demo student account</button> )}`).
- [ ] **Step 3:** Stop dev if running; `npm run build`; expect zero errors.
- [ ] **Step 4:** `npx playwright test` — the login page isn't in the 7 snapshot tests, but run to confirm no regression. Expect 21 pass.
- [ ] **Step 5:** Commit: `git commit -am "fix(security): remove demo-account autofill buttons from login"`.

**Manual (user, documented — not code):** rotate `DemoPass123!` or disable seeded `demo.*@bread-head.org` accounts in Firebase, since the password is in git history.

---

## Task 2: Privacy-notice truth-fix (blocker A3)

**Files:**
- Modify: `app/privacy-notice/page.tsx` (false claims ~80-82 and ~120-123; `lastUpdated`)

**Interfaces:** none consumed/produced.

- [ ] **Step 1:** Read `app/privacy-notice/page.tsx` fully to find the exact copy and how sections are structured (arrays vs JSX).
- [ ] **Step 2:** Replace the "stored locally on your device and is not shared with third parties" statement with accurate copy, e.g.: *"Your account, lesson progress, journal entries, and budget data are stored securely in Google Firebase (Firestore), our cloud data provider. We don't sell your data or share it with advertisers."*
- [ ] **Step 3:** Replace the "we do not track you" / "no third-party analytics" statement with accurate copy that notes Firebase is used, and add a line: *"If you're in a class, your teacher can see your lesson and challenge progress and whether you've completed journal entries — but never the contents of your journal."*
- [ ] **Step 4:** Update `lastUpdated` to `'July 12, 2026'`.
- [ ] **Step 5:** Keep it teen-plain; do NOT add FERPA/COPPA legal blocks (deferred). Stop dev; `npm run build` (zero errors).
- [ ] **Step 6:** `npx playwright test` (privacy page not snapshotted, but confirm 21 pass).
- [ ] **Step 7:** Commit: `git commit -am "fix(privacy): correct false data-handling claims in privacy notice"`.

---

## Task 3: Rate-limit helper (blocker A4, part 1)

**Files:**
- Create: `lib/rateLimit.ts`

**Interfaces:**
- Produces: `rateLimit(key: string, opts?: { limit?: number; windowMs?: number }): { ok: boolean; retryAfterSec: number }` and `clientIp(req: Request): string`.

- [ ] **Step 1:** Create `lib/rateLimit.ts`:

```ts
// In-memory fixed-window rate limiter. Adequate for single-region Vercel;
// for multi-region durability swap in Upstash/Redis. State resets on cold start.
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): { ok: boolean; retryAfterSec: number } {
  const limit = opts.limit ?? 5
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  b.count += 1
  return { ok: true, retryAfterSec: 0 }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
```

- [ ] **Step 2:** Stop dev; `npm run build` (zero errors — unused export is fine, tasks 4–6 consume it).
- [ ] **Step 3:** Commit: `git commit -am "feat(api): add in-memory rate-limit helper"`.

---

## Task 4: Harden `/api/contact` + verify Resend (blocker A4, part 2)

**Files:**
- Modify: `app/api/contact/route.ts`

**Interfaces:**
- Consumes: `rateLimit`, `clientIp` from `lib/rateLimit.ts`.

- [ ] **Step 1:** At the top of `POST`, before parsing, add rate limiting:

```ts
const rl = rateLimit(`contact:${clientIp(req)}`)
if (!rl.ok) return NextResponse.json({ ok: false, error: 'Too many requests. Try again shortly.' }, { status: 429 })
```

- [ ] **Step 2:** Move `await req.json()` into a try/catch that returns `400` on parse failure:

```ts
let data: any
try { data = await req.json() } catch { return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 }) }
const { firstName, lastName, email, org, partnerType, reach, message } = data ?? {}
```

- [ ] **Step 3:** Add validation before sending:

```ts
const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
if (!firstName || !lastName || !emailOk) {
  return NextResponse.json({ ok: false, error: 'Please provide your name and a valid email.' }, { status: 400 })
}
const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : '')
```

Then pass clipped fields into `contactHtml` / subject: `firstName`→clip 100, `lastName`→100, `org`→150, `message`→5000, `reach`→100.

- [ ] **Step 4:** Add the imports: `import { rateLimit, clientIp } from '@/lib/rateLimit'`.
- [ ] **Step 5:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 6:** Start dev; POST a valid body via the `/partners` form (or `curl`), confirm 200 and the styled email arrives at `breadhead.org@gmail.com`. If Resend returns a domain error, **flag to user**: `noreply@bread-head.org` sender domain must be verified in Resend. POST malformed JSON → 400. POST 6× fast → 429.
- [ ] **Step 7:** Commit: `git commit -am "fix(api): validate + rate-limit contact route; guard JSON parse"`.

---

## Task 5: Harden `/api/subscribe` (blocker A4, part 3)

**Files:**
- Modify: `app/api/subscribe/route.ts`

**Interfaces:** Consumes `rateLimit`, `clientIp`.

- [ ] **Step 1:** Read `app/api/subscribe/route.ts` to see its body shape (`email` at minimum).
- [ ] **Step 2:** Add the same rate-limit guard with key `subscribe:${clientIp(req)}`.
- [ ] **Step 3:** Wrap `req.json()` in try/catch → 400.
- [ ] **Step 4:** Validate `email` with the same regex → 400 if invalid; clip any string fields.
- [ ] **Step 5:** Add imports. Stop dev; `npm run build` (zero errors).
- [ ] **Step 6:** Start dev; valid email → 200 + email arrives; invalid → 400; flood → 429.
- [ ] **Step 7:** Commit: `git commit -am "fix(api): validate + rate-limit subscribe route"`.

---

## Task 6: Harden `/api/support` (blocker A4, part 4)

**Files:**
- Modify: `app/api/support/route.ts`

**Interfaces:** Consumes `rateLimit`, `clientIp`.

- [ ] **Step 1:** Read `app/api/support/route.ts` for its body shape and whether it's auth-gated.
- [ ] **Step 2:** Add rate-limit guard keyed `support:${clientIp(req)}` (or by uid if it's authed — prefer uid when available).
- [ ] **Step 3:** Wrap `req.json()` in try/catch → 400; validate required fields + email (if present) + clip lengths.
- [ ] **Step 4:** Add imports. Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; valid → 200; malformed → 400; flood → 429.
- [ ] **Step 6:** Commit: `git commit -am "fix(api): validate + rate-limit support route"`.

---

## Task 7: `register-teacher` server route (blocker A1, part 1)

**Files:**
- Create: `app/api/auth/register-teacher/route.ts`
- Reference: `lib/firebase/admin.ts` (Admin SDK init), `app/api/dashboard/overview/route.ts` (token-verify pattern)

**Interfaces:**
- Produces: `POST /api/auth/register-teacher` — expects `Authorization: Bearer <idToken>` and JSON `{ name?: string }`; sets custom claim `role: 'teacher'` + writes user doc; returns `{ ok: true }` or error.

- [ ] **Step 1:** Read `lib/firebase/admin.ts` and one existing authed route (`app/api/dashboard/overview/route.ts`) to copy the exact token-verification + admin handle pattern (`getAuth`, `getFirestore`, how the Bearer token is read and verified).
- [ ] **Step 2:** Create the route:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin' // match actual exports from admin.ts
import { FieldValue } from 'firebase-admin/firestore'      // match admin.ts import style

export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })

  let decoded
  try { decoded = await adminAuth.verifyIdToken(token) }
  catch { return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 }) }

  // Guard: only a brand-new account with no existing role may self-register as teacher.
  if (decoded.role === 'teacher' || decoded.role === 'admin' || decoded.role === 'student') {
    return NextResponse.json({ ok: false, error: 'Account already has a role.' }, { status: 409 })
  }

  const uid = decoded.uid
  let body: any = {}
  try { body = await req.json() } catch { /* name optional */ }
  const name = typeof body?.name === 'string' ? body.name.slice(0, 100).trim() : ''

  await adminAuth.setCustomUserClaims(uid, { role: 'teacher' })
  await adminDb.doc(`users/${uid}`).set({
    profile: {
      uid, email: decoded.email ?? '', name: name || decoded.email || 'Teacher',
      role: 'teacher', isTeacher: true, provider: 'email',
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
      classIds: [],
    },
  }, { merge: true })

  return NextResponse.json({ ok: true })
}
```

> NOTE: adjust `adminAuth`/`adminDb`/`FieldValue` to the EXACT names `lib/firebase/admin.ts` exports (Step 1). If admin.ts exports a single `admin` app, use `admin.auth()` / `admin.firestore()` and `admin.firestore.FieldValue.serverTimestamp()`.

- [ ] **Step 3:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 4:** Commit: `git commit -am "feat(auth): add register-teacher route (sets teacher claim + isTeacher)"`.

---

## Task 8: Teacher signup UI (blocker A1, part 2)

**Files:**
- Modify: `app/login/page.tsx` (`TeacherPane`)
- Reference: `StudentPane` in the same file for the signup-mode pattern; `app/context/AuthContext.tsx` for token access

**Interfaces:** Consumes `POST /api/auth/register-teacher`.

- [ ] **Step 1:** In `TeacherPane`, add `const [mode, setMode] = useState<'signin' | 'signup'>('signin')` and a `name` state (mirror `StudentPane`).
- [ ] **Step 2:** Add a Name `<Field>` shown only when `mode === 'signup'`.
- [ ] **Step 3:** In `submit`, branch on mode. Signup path:

```ts
if (mode === 'signup') {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  try { await updateProfile(cred.user, { displayName: name.trim() }) } catch {}
  const idToken = await cred.user.getIdToken()
  const res = await fetch('/api/auth/register-teacher', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ name: name.trim() }),
  })
  if (!res.ok) { setError('Could not create teacher account.'); setBusy(false); return }
  await cred.user.getIdToken(true) // force-refresh so the teacher claim is live
  router.push('/dashboard')
  return
}
// signin path: existing signInWithEmailAndPassword + claim check
```

Add `createUserWithEmailAndPassword`, `updateProfile` to the `firebase/auth` import (already imported at top of file — confirm).

- [ ] **Step 4:** Add a mode-toggle link at the bottom of `TeacherPane`: *"New teacher? Create an account" / "Have an account? Sign in"* (mirror StudentPane's toggle). Update the subtitle copy per mode.
- [ ] **Step 5:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 6:** Start dev; create a NEW teacher account via the Teacher pane → lands on `/dashboard` as a teacher (empty class list, "New class" available). Sign out, sign back in → still teacher. Confirm a student account still can't reach the teacher dashboard.
- [ ] **Step 7:** Login page visuals changed (new toggle/field). Run `npx playwright test`; if the login page is snapshotted and diffs are intentional, `npm run test:update` and commit snapshots.
- [ ] **Step 8:** Commit: `git commit -am "feat(auth): teacher self-signup with isTeacher on login page"`.

---

## Task 9: Budget onboarding — decouple completion flag (bug B1)

**Files:**
- Modify: `lib/budget/store.ts` (`setIncome` ~207-221; `saveBudgetSettings` ~176-178)
- Modify: `app/mybudget/page.tsx` (`finishOnboarding` ~133-148)

**Interfaces:**
- Produces: `saveBudgetSettings` now accepts an optional `hasCompletedOnboarding?: boolean` and is the ONLY writer of that flag during onboarding. `setIncome` no longer writes `hasCompletedOnboarding`.

- [ ] **Step 1:** In `lib/budget/store.ts` `setIncome`, remove `hasCompletedOnboarding: true` from the no-snapshot `settings` write (line ~219). It should write only `primaryIncomeAmount` (and whatever else it legitimately owns).
- [ ] **Step 2:** In `saveBudgetSettings`, add `hasCompletedOnboarding?: boolean` to its settings param type (~29-34) and include it in the Firestore merge write only when defined.
- [ ] **Step 3:** In `app/mybudget/page.tsx` `finishOnboarding`, ensure ORDER is: (1) `persistIncome`, (2) category loop, (3) `saveBudgetSettings({ ...settings, hasCompletedOnboarding: true })` LAST. The flag is set once, only after income + all categories succeed.
- [ ] **Step 4:** Confirm no other code path relies on `setIncome` setting the flag (grep `hasCompletedOnboarding` across `app/` + `lib/`).
- [ ] **Step 5:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 6:** Commit: `git commit -am "fix(budget): write onboarding-complete flag last, not as setIncome side effect"`.

---

## Task 10: Budget onboarding — idempotent categories (bug B2)

**Files:**
- Modify: `lib/budget/templates.ts` (`templateToCategories` ~86-88)

**Interfaces:**
- Produces: `templateToCategories(template)` returns categories with **stable, deterministic IDs** (same input → same IDs), so re-running upserts instead of duplicating.

- [ ] **Step 1:** In `templateToCategories`, replace `newBudgetId()` per category with a deterministic id derived from template + category, e.g. `` `tpl_${template.id}_${slugify(category.key ?? category.name)}` ``. Add a tiny local `slugify` (lowercase, non-alphanumeric → `_`) if none exists.
- [ ] **Step 2:** Verify `saveCategory` (`store.ts:180-183`) uses `set`/merge by id (upsert), not `add` — so same id overwrites. If it uses `add`, change the onboarding write to `set(doc(id))`.
- [ ] **Step 3:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 4:** Start dev; reset the test user's `hasCompletedOnboarding` (per prior onboarding-toggle script), run onboarding to completion, then re-trigger completion (simulate retry) → confirm categories are NOT duplicated in Firestore/board.
- [ ] **Step 5:** Commit: `git commit -am "fix(budget): deterministic category IDs so onboarding retry doesn't duplicate boxes"`.

---

## Task 11: Budget onboarding — read-error fallback (bug B3)

**Files:**
- Modify: `app/mybudget/page.tsx` (load effect ~62-77; gate ~219)

**Interfaces:** none new.

- [ ] **Step 1:** In the `loadBudget` catch, set a state that forces the onboarding view (or an explicit retry card) instead of leaving `hasOnboarded` at its `true` default with an empty board. Simplest: on read error set `hasOnboarded = false` so onboarding shows, OR render a dedicated "Couldn't load your budget — retry" card. Choose the retry card (avoids re-running onboarding for a real existing user hitting a transient error).
- [ ] **Step 2:** Add a `loadError` boolean state; on catch set it true and keep `ready` true. In render, if `loadError` show a retry button that re-runs the load effect; only show the `$0/$0` board when there's genuinely no data AND no error.
- [ ] **Step 3:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 4:** Start dev; simulate a load failure (temporarily throw in the load path) → confirm retry card shows, not an empty board. Revert the simulated throw.
- [ ] **Step 5:** Commit: `git commit -am "fix(budget): show retry on load error instead of empty $0 board"`.

---

## Task 12: Route error boundaries (polish C1)

**Files:**
- Create: `app/error.tsx`, `app/global-error.tsx`

**Interfaces:** none.

- [ ] **Step 1:** Create `app/error.tsx` (client component, `'use client'`) with an on-brand fallback (bgSage, Playfair h2, DM Sans body, a "Try again" button calling `reset()`), matching the palette in `tailwind.config.js`.
- [ ] **Step 2:** Create `app/global-error.tsx` (must render its own `<html><body>`), minimal on-brand fallback with a reload action.
- [ ] **Step 3:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 4:** Start dev; force an error in a page component to confirm the boundary renders; revert.
- [ ] **Step 5:** Commit: `git commit -am "feat(app): add error + global-error route boundaries"`.

---

## Task 13: Security headers (polish C2)

**Files:**
- Modify: `next.config.js`

**Interfaces:** none.

- [ ] **Step 1:** Add an async `headers()` to the Next config returning security headers for all routes: `Strict-Transport-Security` (max-age=63072000; includeSubDomains; preload), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy`. Start CSP in report-friendly/permissive form that still allows: `'self'`, Firebase (`*.googleapis.com`, `*.firebaseio.com`, `*.firebaseapp.com`, `apis.google.com`), Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), Resend/img `data:`. Include `frame-src` for Firebase auth popups (`*.firebaseapp.com`, `accounts.google.com`, `appleid.apple.com`).
- [ ] **Step 2:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 3:** Start dev; load `/`, `/login`, `/dashboard`, `/mybudget`; open DevTools console — confirm NO CSP violations break fonts, images, or Google/Apple sign-in popups. Loosen specific CSP directives if something is blocked (do not remove CSP wholesale).
- [ ] **Step 4:** `npx playwright test` — confirm 21 pass (headers shouldn't change visuals).
- [ ] **Step 5:** Commit: `git commit -am "feat(security): add CSP + security headers in next.config"`.

---

## Task 14: Real lesson Preview (polish C3, part 1)

**Files:**
- Modify: `app/dashboard/content/lessons/page.tsx` (preview modal stub ~424)
- Reference: `components/lesson/LessonPlayer.tsx`, `lib/curriculum/lessons/index.ts` (`getLessonById`)

**Interfaces:** Consumes `LessonPlayer`, `getLessonById`.

- [ ] **Step 1:** Read `components/lesson/LessonPlayer.tsx` props to see whether it can run in a self-contained/read-only mode (no Firestore writes, no assignment submission). Note the props it needs (lesson data, and any callbacks).
- [ ] **Step 2:** Replace the preview stub body with a real render: load the lesson via `getLessonById`, mount `LessonPlayer` in a preview mode (pass a flag or no-op callbacks so it does NOT write progress or submit). Keep it inside the existing modal shell.
- [ ] **Step 3:** If `LessonPlayer` has no preview/read-only affordance, add a minimal `preview?: boolean` prop that disables its Firestore/submit side effects and next-lesson navigation. Keep the change surgical.
- [ ] **Step 4:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; open a lesson Preview in the teacher content page → real slides render and are navigable; confirm NO progress write happens (check console/network).
- [ ] **Step 6:** Commit: `git commit -am "feat(dashboard): real lesson preview using LessonPlayer (read-only)"`.

---

## Task 15: Hide read-only teacher feedback (polish C3, part 2)

**Files:**
- Modify: `app/dashboard/content/challenges/page.tsx` (feedback display ~17-18 and the render block that shows `teacherFeedback`)

**Interfaces:** none.

- [ ] **Step 1:** Locate where `teacherFeedback` is rendered in the challenge review section.
- [ ] **Step 2:** Conditionally hide the feedback block entirely (there is no editor this ship). Leave a code comment: `// Feedback editor deferred (see 2026-07-12 ship spec C3); hiding read-only feedback until authoring UI exists.`
- [ ] **Step 3:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 4:** Start dev; confirm the challenge review shows allocation + criteria + reflection but no orphaned feedback UI.
- [ ] **Step 5:** Commit: `git commit -am "fix(dashboard): hide read-only teacher-feedback block until editor exists"`.

---

## Task 16: Move-student picker modal (polish C4, part 1)

**Files:**
- Modify: `app/dashboard/[classId]/page.tsx` (move via prompt ~43-47), `app/dashboard/[classId]/roster/page.tsx` (~21)
- Possibly Create: a small shared `MoveStudentModal` component under `app/dashboard/` if both pages can share it.

**Interfaces:** Consumes existing `/api/classes/move-student`.

- [ ] **Step 1:** Read both move handlers and the move-student API to see required params (source classId, student uid, destination classId).
- [ ] **Step 2:** Build a modal: a `<select>` of destination classes (from the teacher's class list already in scope), Confirm/Cancel. Replace the numeric `window.prompt` calls with opening this modal.
- [ ] **Step 3:** On confirm, call the same move API; on error show inline text (not `alert`).
- [ ] **Step 4:** DRY: if both pages need it, extract one component; else keep local. Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; move a student between two classes via the modal → roster updates; error path shows inline.
- [ ] **Step 6:** `npx playwright test` (dashboard pages likely not snapshotted; confirm 21 pass). Commit: `git commit -am "feat(dashboard): replace move-student prompt with picker modal + inline errors"`.

---

## Task 17: Create-class modal with grade (polish C4, part 2)

**Files:**
- Modify: `app/dashboard/DashboardShell.tsx` (`window.prompt` create ~32)
- Reference: `app/dashboard/[classId]/settings/page.tsx` for the grade multi-select pattern and `POST /api/classes` body shape.

**Interfaces:** Consumes `POST /api/classes`.

- [ ] **Step 1:** Read the settings page grade field + `POST /api/classes` to learn accepted fields (name, grade(s)).
- [ ] **Step 2:** Replace the `window.prompt` create flow with a modal: class name input + grade select (reuse the settings pattern), Create/Cancel.
- [ ] **Step 3:** On create, POST and redirect to the new class; inline error on failure (no `alert`).
- [ ] **Step 4:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; create a class with a grade in one step → lands on the new class; grade is set.
- [ ] **Step 6:** Commit: `git commit -am "feat(dashboard): create-class modal with grade (replaces window.prompt)"`.

---

## Task 18: Remove-student action (polish C4, part 3)

**Files:**
- Possibly Create: `app/api/classes/[classId]/remove-student/route.ts` (if no remove endpoint exists)
- Modify: `app/dashboard/[classId]/page.tsx` and/or `roster/page.tsx` (add Remove button)
- Reference: `app/api/classes/move-student/route.ts` for the ownership-check + roster-mutation pattern.

**Interfaces:**
- Produces: `POST /api/classes/[classId]/remove-student` `{ studentUid }` → verifies caller is a member of the class + student is in it, removes student from `classIds`/roster server-side, returns `{ ok: true }`.

- [ ] **Step 1:** Confirm no existing remove endpoint. Read `move-student/route.ts` for the exact guard pattern (verifyTeacher, membership, student-in-source-class check) and how roster/`classIds` are stored.
- [ ] **Step 2:** Create the remove route mirroring those guards; remove the class from the student's `profile.classIds`/`teacherIds` as appropriate and detach from the class roster — matching how move does it (do NOT delete the student account).
- [ ] **Step 3:** Add a Remove button (with `window.confirm` guard) in the roster/class table row; call the route; inline error on failure.
- [ ] **Step 4:** Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; remove a student → they disappear from the class; verify (via another account or Firestore) the student account still exists, just unlinked.
- [ ] **Step 6:** Commit: `git commit -am "feat(dashboard): remove-student action with server-side ownership guard"`.

---

## Task 19: Reconcile TODO.md lesson-progress item (polish C5)

**Files:**
- Modify: `TODO.md`
- Reference: `app/lesson/page.tsx` (progress persistence/resume)

**Interfaces:** none.

- [ ] **Step 1:** Drive the lesson player in dev with a test student who has progress beyond lesson 1; confirm whether the app surfaces real current-lesson/progress or a hardcoded "Lesson 1" anywhere (dashboard resume card, unit list).
- [ ] **Step 2:** If progress is correctly synced, update `TODO.md` item #2 to resolved (note the date + that the player persists `completedLessons` and resumes). If a hardcoded Lesson 1 still shows somewhere, note the exact location and leave the item open with that detail.
- [ ] **Step 3:** Commit: `git commit -am "docs(todo): reconcile lesson-progress-sync item after verification"`.

---

## Task 20: Add `/budget` marketing route (workstream D, part 1)

**Files:**
- Move: `app/budgeting/page.tsx` → `app/budget/page.tsx` (+ any co-located files)
- Grep + update: internal links to `/budgeting`

**Interfaces:** none.

- [ ] **Step 1:** `grep -rn "/budgeting" app components lib` to find all references (nav, footer, CTAs).
- [ ] **Step 2:** Move the `app/budgeting/` marketing page to `app/budget/`. Update all `/budgeting` links to `/budget`. Delete the old route dir.
- [ ] **Step 3:** Stop dev; `npm run build` (zero errors — no dangling `/budgeting` imports).
- [ ] **Step 4:** Start dev; `/budget` loads the marketing page; `/budgeting` 404s.
- [ ] **Step 5:** `npx playwright test`; if `/budgeting` was snapshotted, update the test path + snapshots. Commit: `git commit -am "feat(marketing): move /budgeting to /budget"`.

---

## Task 21: `/myjournal` student route (workstream D, part 2)

**Files:**
- Move: `app/dashboard/journal/**` → `app/myjournal/**` (page + `useJournal.ts` + co-located files)
- Modify: `app/student/StudentShell.tsx` (nav link), any `StudentHome`/dashboard links to `/dashboard/journal`

**Interfaces:** none new; same journal tool, new path.

- [ ] **Step 1:** `grep -rn "/dashboard/journal" app components lib` to list all references.
- [ ] **Step 2:** Move `app/dashboard/journal/` to `app/myjournal/`. Keep the StudentShell/StudentShell wrapper working (the journal tool uses the student shell — verify imports still resolve from the new location; fix relative import paths).
- [ ] **Step 3:** Repoint `StudentShell` nav "Journal" → `/myjournal` and every other `/dashboard/journal` link.
- [ ] **Step 4:** Delete the old `app/dashboard/journal/` route. Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; sign in as student → Journal nav goes to `/myjournal`, tool works (write, save, past entries); `/dashboard/journal` 404s.
- [ ] **Step 6:** Commit: `git commit -am "feat(routes): move student journal to /myjournal"`.

---

## Task 22: `/budgetchallenge/[assignmentId]` student route (workstream D, part 3)

**Files:**
- Move: `app/challenge/[assignmentId]/**` → `app/budgetchallenge/[assignmentId]/**`
- Modify: all links to `/challenge/` (StudentHome challenge cards, grades "view" links, dashboard)

**Interfaces:** same solver, new path; API routes under `/api/challenge/**` stay put (only the page route moves).

- [ ] **Step 1:** `grep -rn "/challenge/" app components lib` — separate PAGE links (`/challenge/<id>`) from API paths (`/api/challenge/...`). Only page links change.
- [ ] **Step 2:** Move `app/challenge/[assignmentId]/` to `app/budgetchallenge/[assignmentId]/`; fix relative imports.
- [ ] **Step 3:** Update every page link from `/challenge/${id}` to `/budgetchallenge/${id}` (StudentHome cards, grades, dashboard quick-assign preview if any). Leave `/api/challenge/**` untouched.
- [ ] **Step 4:** Delete old `app/challenge/`. Stop dev; `npm run build` (zero errors).
- [ ] **Step 5:** Start dev; open a budget challenge from the student dashboard → loads at `/budgetchallenge/<id>`, allocate + submit works, "View in Grades" works; `/challenge/<id>` 404s.
- [ ] **Step 6:** Commit: `git commit -am "feat(routes): move budget challenge solver to /budgetchallenge"`.

---

## Task 23: `/mylessons` lesson suite + embedded player (workstream D, part 4)

**Files:**
- Move/Create: `app/mylessons/page.tsx` (from `app/dashboard/course/page.tsx` — the curriculum suite/landing)
- Move/Create: `app/mylessons/[unit]/page.tsx` (from `app/dashboard/unit/[unit]/page.tsx` — unit browser)
- Move/Create: `app/mylessons/[unit]/[lesson]/page.tsx` (the embedded PLAYER, migrated from `app/lesson/page.tsx`)
- Modify: `app/student/StudentShell.tsx` nav ("Course"→"Lessons" → `/mylessons`), `app/learn/**` forwarder, `StudentHome` current-lesson/resume cards, unit "Start/Continue" CTAs
- Remove: `app/lesson/`, `app/dashboard/course/`, `app/dashboard/unit/`, and the `app/learn/[unit]/[lesson]` forwarder (repoint or delete)

**Interfaces:** the player consumes `getLesson`/`getLessonById` and the same submit/progress logic it uses today; only its route location changes.

- [ ] **Step 1:** `grep -rn "'/lesson'\|\"/lesson\"\|/dashboard/course\|/dashboard/unit\|/learn/" app components lib` to enumerate every link and the sessionStorage/target mechanism `/lesson` uses.
- [ ] **Step 2:** Create `app/mylessons/page.tsx` as the lesson suite (curriculum info + unit list + progress) from the current `/dashboard/course` content.
- [ ] **Step 3:** Create `app/mylessons/[unit]/page.tsx` from the current `/dashboard/unit/[unit]` content; repoint its lesson links to `/mylessons/[unit]/[lesson]`.
- [ ] **Step 4:** Create `app/mylessons/[unit]/[lesson]/page.tsx` hosting the player. Migrate `app/lesson/page.tsx` logic so the lesson is chosen from the route params (`unit`, `lesson`) instead of sessionStorage/target. Preserve ALL behavior: progress persistence, resume position, pacing/unlock gating, assignment submission, next-lesson navigation (now navigating to `/mylessons/[unit]/[nextLesson]`).
- [ ] **Step 5:** Repoint StudentShell nav, StudentHome resume/current-lesson cards, unit CTAs, and the `/learn/[unit]/[lesson]` forwarder → `/mylessons/[unit]/[lesson]` (or delete the forwarder if now redundant).
- [ ] **Step 6:** Delete `app/lesson/`, `app/dashboard/course/`, `app/dashboard/unit/`. Stop dev; `npm run build` (zero errors — no dangling imports/links).
- [ ] **Step 7:** Start dev; full student lesson flow: open `/mylessons` → pick a unit → open a lesson at `/mylessons/[unit]/[lesson]` → complete it (progress saves) → auto-advance to next → resume mid-lesson after reload. Confirm gating still blocks locked lessons. Old paths (`/lesson`, `/dashboard/course`, `/dashboard/unit/*`) 404.
- [ ] **Step 8:** These are big visual/route changes — `npx playwright test`; update any affected snapshots/test paths with `npm run test:update` and commit them.
- [ ] **Step 9:** Commit: `git commit -am "feat(routes): /mylessons lesson suite with embedded player (migrates /lesson, /dashboard/course, /dashboard/unit)"`.

---

## Task 24: Final full-suite gate

**Files:** none (verification only).

- [ ] **Step 1:** Ensure dev server is stopped. Run `npm run build` — zero errors.
- [ ] **Step 2:** Run `npx playwright test` — all 21 pass (snapshots regenerated + committed for any intentional visual change).
- [ ] **Step 3:** Manual smoke across the whole ship: teacher signup → dashboard; create class (modal) → move student (modal) → remove student; student signup → `/mylessons` lesson complete → `/myjournal` entry → `/mybudget` onboarding (fresh account) → `/budgetchallenge` submit → `/grades`; submit `/partners` contact form and confirm the email arrives.
- [ ] **Step 4:** Update `.claude/gotchas.md` with anything that bit during execution (per feedback-log memory).
- [ ] **Step 5:** Report to user. **User action items (not code):** (B1) verify deployed Firestore rules match `docs/firestore.rules.proposed`; (A2) rotate/disable seeded demo accounts; (A4) confirm `noreply@bread-head.org` is a verified Resend sender domain; then merge `feat/web-budget` → `main` and push.

---

## Self-review notes (coverage vs spec)

- Spec A1→Tasks 7,8 · A2→Task 1 · A3→Task 2 · A4→Tasks 3,4,5,6. B1→9 · B2→10 · B3→11. C1→12 · C2→13 · C3→14,15 · C4→16,17,18 · C5→19. D(/budget)→20 · D(/myjournal)→21 · D(/budgetchallenge)→22 · D(/mylessons)→23. Final gate→24.
- Deferred/user-action items (Firestore rules B1, demo-account rotation, Resend domain verify, merge/push) are captured in Task 24 Step 5.
- No unit-test steps: this repo has no unit harness; verification is build + Playwright + manual flow drive, per Global Constraints.
