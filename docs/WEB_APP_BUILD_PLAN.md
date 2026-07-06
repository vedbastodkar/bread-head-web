# Bread Head Web — Architecture & Sequenced Build Plan

_Planning artifact. No feature code here. Based on a direct read of `breadhead` (SwiftUI) and `bread-head-web` (Next.js) on 2026-07-04._

---

## Recommended stack (locked) — optimized for least work + long-term maintainability

**One Next.js app, TypeScript at runtime, Firebase as the backend, Python only as offline tooling.**

- **Single Next.js 14 app** (the existing `bread-head-web`) holds marketing + `/login` + `/dashboard` + `/learn`. Frontend = React/TS; request-time server logic = `app/api/*` routes. **No separate backend service.**
- **Firebase (`bread-head-4b6f9`, existing)** is the whole backend — Auth + Firestore. Nothing new to host; the web client reads/writes the same `users/{uid}` documents iOS already uses (this is why progress sync is free).
- **TypeScript everywhere the app runs.** No second runtime to deploy/secure/debug at request time.
- **Python only for decoupled offline jobs:** the Swift→JSON content transcoder (Step 5a) and demo seeding/analytics scripts (`scripts/*.py` with the Firebase Admin SDK). These never ship with the web app → zero operational weight.
- **Content = one hardcoded, committed JSON file, single-sourced** across iOS/Android/web (no CMS, no Firestore content).

**Why this wins:** *least work* — one repo, one deploy, one auth system, Firebase owns the data tier. *Easiest to build on* — new screen = new folder under `app/`; new lesson = new JSON entry. *Easiest to fix long-term* — one language + one codebase at runtime, so no cross-service token-passing, CORS, or "which service broke."

**When to deviate:** only for real server-side compute (batch analytics, ML, heavy crunching) — add a single Python **Firebase Cloud Function** for that one job without touching the rest. Not needed for the dashboard or student app.

---

## 0. The findings that gate everything

Read these first. Two of them change the whole downstream scope.

### 0.1 The shared Firebase project is confirmed — progress sync is FREE

- SwiftUI app Firebase project: **`bread-head-4b6f9`** (`Teen Personal Financial App/Services/Firebase/GoogleService-Info.plist`, `PROJECT_ID = bread-head-4b6f9`, bundle `com.bastodkarved.BreadHead`).
- The web client points at the **same project**, uses the same Firestore + Auth, and reads/writes the **same `users/{uid}` document**. No reimplementation, no data copy, no second backend. This is the single most important enabler: the web app inherits every existing account and all existing progress automatically.

### 0.2 The progress model (this is the "free" part) — exact schema

Progress is written as **nested maps on one document**: `users/{uid}`. Canonical writer is `FirebaseDataManager.saveUserProfileData(...)`:

```
users/{uid}
  profile:              { uid, email, name, provider, createdAt, isOnboarded, ... }
  lessonProgress:       {
                          completedLessons: [ "unit1lesson1", "unit1lesson2", ... ],  // array of lesson IDs
                          currentUnit:   Int,   // 1-indexed
                          currentLesson: Int    // 1-indexed
                        }
  gamificationProgress: { xp, lifetimeXP, level, loggingStreak(b64), ... badges ... }
  settings:             { themeName, notificationsEnabled, ... }

  // subcollections
  users/{uid}/categories/{categoryId}
  users/{uid}/budget/continuous_data        // monthly snapshots + transactions
  users/{uid}/devices/{deviceId}            // push tokens
```

**Lesson ID format is the key detail** (`LessonLogic.getCurrentLessonId()`):

```
"unit\(unitIndex+1)lesson\(lessonIndex+1)"   →   e.g. "unit3lesson5"
```

So `completedLessons` is a set of `unitNlessonM` strings, and `(currentUnit, currentLesson)` is the resume pointer. **That is the entire learning-progress model.** The web dashboard and student app read/write exactly this.

> Note: there is also a **deprecated** `users/{uid}/lessonProgress/{lessonId}` subcollection in `FirebaseDataManager` (marked "New code should use `AppState.lessonProgress.markLessonComplete()`"). **Ignore it.** The `lessonProgress` map on the user doc is the source of truth. Do not build the dashboard against the subcollection.

### 0.3 Lesson/quiz CONTENT is 100% HARDCODED in Swift — this gates the student app

Definitive: **none of the lesson, slide, or quiz content lives in Firestore.** It is compiled Swift.

- Models: `Lessons/Core/LessonModel.swift` — `LessonSlide { view: AnyView, isInteractive }`, `LessonDefinition { name, description, objectives, slides }`, `UnitDefinition { name, lessons }`.
- Content: `Lessons/Data/Unit{1-10}/Unit{N}Lesson{M}Data.swift` — ~10 units, ~100+ lessons, each slide is an `AnyView(SomeSlideTemplate(...))` with literal strings, options, and answers baked in.
- Slide types: ~30 SwiftUI structs in `Lessons/SlideTemplates/` (TitleSlide, ObjectivesSlide, MultipleChoiceSlide, TrueOrFalseSlide, PollSlide, MatchConceptSlide, InteractiveFlashcardSlide, ...).
- Loader: `Lessons/Core/LessonLogic.swift` reads a compiled `[UnitDefinition]` array — zero content fetches.

**Consequence:** progress sync is free, but **content is not.** The student web app cannot "reuse" Swift views. Content must be ported into a platform-neutral form (Step 5a) before the student app can render lesson 1:1. The Teacher dashboard does **not** need content ported (it only needs lesson *names* for labels), which is why it comes first.

### 0.4 There is NO teacher / class / role / roster concept anywhere yet

Grep across the whole SwiftUI app: no `role`, `teacher`, `classroom`, or `roster` data — only lesson copy that mentions "teachers." Auth is Firebase Auth (email/password, Google, Apple, plus anonymous "guest"), and `uid` is the user-doc id. **Roles and class rosters are net-new** and must be added as a backend step (Step 2) before the dashboard can scope data to "my students."

### 0.5 Web stack (where the client lives)

`bread-head-web` = **Next.js 14.2.5, App Router, TypeScript (strict), Tailwind 3.4, Framer Motion**. Marketing-only today; **no Firebase, no auth, no middleware**. Routes are `app/<route>/page.tsx`; API is `app/api/<name>/route.ts`; nav is `app/components/Nav.tsx`; root layout `app/layout.tsx`. Path alias `@/*` → repo root. Env holds only `RESEND_API_KEY`. The authenticated app slots in cleanly alongside marketing routes — no collisions.

---

## Executable sequence (this is the order to build)

Your five buckets map onto seven executable steps. The only reorderings from your list are dependency-driven: **roles/class model (2)** must exist before the dashboard can scope data, and **content migration (5a)** must precede the student app. Everything else follows your priority.

| Step | Your bucket | Why here |
|---|---|---|
| 1. Firebase + two-pane login/sign-out | (1) Login | Nothing works without a session |
| 2. Auth roles + class-roster model | (4) Backend | Dashboard can't scope "my students" without it |
| 3. Teacher/Admin dashboard | (2) Dashboard | Highest-value pitch artifact; reads existing progress |
| 4. Website integration (nav/routes/coexistence) | (5) Website | Lock routing + nav once, before the student app grows it |
| 5a. Content migration (Swift → portable) | (3, gated) | **Gate** for the student app |
| 5b. Student web app | (3) Student | Renders migrated content, writes same progress map |
| 6. Backend hardening (rules, writes, cross-platform) | (4) Backend | Finalize once all three clients touch Firestore |

---

## Step 1 — Firebase wiring + two-pane login / sign-out

**This is step one. Spec is concrete.**

**Depends on:** nothing (start here).

**What changes**
- Add Firebase Web SDK to `bread-head-web`. Client SDK for auth/session; Admin SDK (server) for the middleware/token verification.
- New env vars (all `NEXT_PUBLIC_*` are the same public config values from the iOS `GoogleService-Info.plist`, project `bread-head-4b6f9`):
  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=bread-head-4b6f9.firebaseapp.com
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=bread-head-4b6f9
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=bread-head-4b6f9.firebasestorage.app
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
  NEXT_PUBLIC_FIREBASE_APP_ID=...
  FIREBASE_ADMIN_CLIENT_EMAIL=...   # server only
  FIREBASE_ADMIN_PRIVATE_KEY=...    # server only
  ```

**Auth flow (two-pane landing)**
1. `/login` renders a two-pane chooser: **Student** | **Teacher/Admin**. The choice selects a role *context*, not a separate auth system — both panes use the same Firebase Auth.
2. Student pane: email/password + Google (mirror iOS providers so accounts are shared). Sign-in → resolve role → route to `/learn`.
3. Teacher/Admin pane: email/password + Google → resolve role → route to `/dashboard`. Teacher accounts are provisioned via role claim (Step 2); a self-serve teacher signup can come later.
4. On successful sign-in, the client exchanges the Firebase ID token for a **session cookie** (`/api/auth/session`, Admin SDK `createSessionCookie`) so protected routes can be guarded server-side in middleware. Sign-out clears the cookie and calls client `signOut()`.

**Route structure**
```
app/login/page.tsx                 # two-pane chooser (client component)
app/login/StudentPane.tsx
app/login/TeacherPane.tsx
app/api/auth/session/route.ts      # POST: idToken -> session cookie; DELETE: sign out
middleware.ts                      # guards /dashboard/* and /learn/*, reads session cookie
lib/firebase/client.ts             # initializeApp + getAuth (browser)
lib/firebase/admin.ts              # admin app + verifySessionCookie (server)
app/context/AuthContext.tsx        # {user, role, loading, signOut} provider
app/hooks/useAuth.ts
```

**Session / sign-out handling**
- Session cookie (httpOnly) is the server source of truth for route guards; `AuthContext` mirrors client auth state for UI (show "Sign out", user name).
- `middleware.ts`: unauthenticated hitting `/dashboard/*` or `/learn/*` → redirect `/login`. Wrong-role (student hitting `/dashboard`) → redirect to their home.
- Sign-out: `DELETE /api/auth/session` clears cookie → client `signOut()` → redirect `/login`.

**Files/collections touched:** new files above; reads Firebase Auth; no Firestore writes yet (role read added in Step 2).

**Done when:** a real existing Bread Head account can log in on the web, land on a role-appropriate placeholder, and sign out cleanly.

---

## Step 2 — Auth roles + teacher↔student class-roster model (backend)

**Depends on:** Step 1 (need a session + a place to read role).

**What changes (net-new Firestore + one custom claim)**
- **Role** via Firebase **custom claims** (`role: "student" | "teacher" | "admin"`), set by an Admin-SDK callable/route. Claim is the authority; middleware and rules read it. Mirror it as `users/{uid}.profile.role` for easy display/queries. Default (all existing app users) = `student`.
- **New collections** (additive — the iOS app never touches these, so nothing breaks):
  ```
  classes/{classId}
    name, teacherId (uid), joinCode, createdAt, schoolName

  classes/{classId}/roster/{studentUid}
    studentUid, displayName, joinedAt, status

  // reverse lookup so a student query is one hop
  users/{uid}.profile.classIds: [classId, ...]   # additive field on existing doc
  ```
- **Enrollment:** teacher creates a class → gets a `joinCode`; student enters code (web or a future iOS build) → writes roster entry + appends `classId` to their user doc. For the pitch you can also seed a class + roster via an admin script.

**Why a roster and not just "query all users":** the dashboard must scope to *this teacher's* students, and Firestore security rules must let a teacher read student progress **only for students in their class**. The roster is what rules and queries key on.

**Files/collections:** `classes/*` (new), `users/{uid}.profile.role` + `.classIds` (new fields on existing doc); `app/api/admin/setRole/route.ts`, `app/api/classes/route.ts`.

**Done when:** a teacher account has `role=teacher`, owns a class, and that class has a roster of ≥1 real student uid.

---

## Step 3 — Teacher / Admin dashboard (highest-value pitch artifact)

**Depends on:** Steps 1–2. **Reads mostly; writes almost nothing.**

**Data model it reads (locked):** for each `studentUid` in `classes/{classId}/roster`, read `users/{studentUid}`:
- `lessonProgress.completedLessons[]` → completion count + which lessons (decode `unitNlessonM`).
- `lessonProgress.currentUnit/currentLesson` → "where they are now."
- `gamificationProgress.xp / level / streaks` → engagement.
- `profile.name`, `profile.updatedAt`/last-active.

**The one thing the dashboard needs about content:** a **lesson map** to turn `unit3lesson5` into "Unit 3 · Lesson 5 — <name>." Extract just the catalog spine (unit names + lesson names + counts) from `CourseCatalog` / `Unit{N}Data.swift` into a small static file `lib/curriculum/catalog.ts` (`[{ unit, name, lessons: [{ id: "unit3lesson5", name }] }]`). This is a lightweight subset — **not** the full content migration (Step 5a). ~100 lesson titles, no slide bodies.

**Core views (lock these):**
1. **Class overview table** — rows = students; columns = lessons completed (x/total), % complete, current unit·lesson, XP/level, last active. Sortable.
2. **Class progress chart** — completion distribution across units (bar), and a class completion-over-time line if you later stamp completion timestamps (see Step 6).
3. **Module/unit status heatmap** — units × students grid, cell = done/in-progress/not-started, derived from `completedLessons` + current pointer. This is the "screenshot for the school."
4. **Student detail** — per-student lesson list with completion states.

**Route structure**
```
app/dashboard/page.tsx                 # class picker + overview table
app/dashboard/[classId]/page.tsx       # class detail (table + charts + heatmap)
app/dashboard/[classId]/[studentUid]/page.tsx
app/api/dashboard/class/[classId]/route.ts   # server: verify teacher owns class, fan-out reads
lib/curriculum/catalog.ts              # unit/lesson name spine
components/dashboard/*                  # tables, charts (reuse existing chart deps or add lightweight)
```

**Files/collections:** reads `classes/{classId}`, `classes/{classId}/roster/*`, `users/{studentUid}` (progress maps). No content migration required.

**Done when:** a teacher logs in and sees a real, populated class progress table + heatmap sourced from live Firestore.

---

## Step 4 — Website integration (nav, routes, coexistence)

**Depends on:** Step 1 (auth state exists); do it before the student app so routing/nav is settled once.

**Concrete edits to `bread-head-web`:**
- `app/layout.tsx` — wrap children in `<AuthProvider>` (from Step 1) so nav + app routes can read auth state.
- `app/components/Nav.tsx` — conditional right-side control: logged out → "Log in" (`/login`); logged in → user menu with "Dashboard" or "My lessons" (role-based) + "Sign out." Keep existing marketing links and "Get Early Access."
- **Coexistence model:** marketing pages (`/`, `/about`, `/features`, `/lessons`, `/partners`, ...) stay fully public and server-rendered. The app lives under `/login`, `/dashboard/*`, `/learn/*`, guarded by `middleware.ts`. Same Next app, same deploy — no separate project. Consider a route group `app/(marketing)/` vs `app/(app)/` later if you want distinct layouts, but not required for the demo.
- `middleware.ts` matcher scoped to `['/dashboard/:path*', '/learn/:path*']` so marketing/SEO is untouched.

**Files:** `app/layout.tsx`, `app/components/Nav.tsx`, `middleware.ts`.

**Done when:** one deploy serves the marketing site and the authed app; nav reflects login state everywhere.

---

## Step 5a — Content stays hardcoded; single-source it (the gate for the student app)

**Design intent (confirmed):** content is **hardcoded typed data**, not a CMS and not Firestore. This mirrors the iOS app exactly: content = literal calls to typed slide templates (`Lessons/Data/UnitN/*.swift`), rendering = the ~30 slide components (`Lessons/SlideTemplates/*.swift`). We keep that model on web.

**What is and isn't reusable from the Swift/Skip codebase:**
- **Slide renderers → reimplemented in React (unavoidable).** SwiftUI views don't run on the web. Skip (used for `breadheadAndroid`) transpiles SwiftUI → Jetpack Compose and has **no web target**, so it can't produce the web client. SwiftWasm + Tokamak (SwiftUI-*like* on WASM) is not real SwiftUI, won't consume your `ThemeManager`/`@EnvironmentObject` views, and doesn't fit a Next.js/Tailwind site — rejected. So the ~30 slide *types* get reimplemented once as React components. Bounded, one-time.
- **Lesson content → single-sourced, NOT rewritten.** iOS + Android already share content for free (Skip transpiles the same Swift). Web is the only client that can't read Swift. Fix: promote lesson content to one **language-neutral data file (JSON)** that is the single source of truth, consumed by all three. Content is authored once and stays "hardcoded" (a committed, versioned file — no backend).

**Neutral slide schema (TS side), mirroring the Swift templates 1:1:**
```ts
type Slide =
  | { type: "title";        title; subtitle?; detailText?; imageName?; isIcon? }
  | { type: "objectives";   headerTitle; subheader?; objectives: string[] }
  | { type: "multipleChoice"; question; options: string[]; correctAnswerIndices: number[]; explanations: string[]; questionImage? }
  | { type: "trueFalse";    statement; answer: boolean; explanation? }
  | { type: "poll";         title; options: string[]; afterVoting? }
  | { type: "matchConcept"; pairs: [left: string, right: string][] }
  | ... // one variant per SlideTemplate (30 total)
type Lesson = { id: "unitNlessonM"; name; description; objectives: string[]; slides: Slide[] }
```
(Note `multipleChoice` uses `correctAnswerIndices: number[]` + `explanations: string[]` to match the real Swift signature — it supports multi-select.)

**Two ways to get there — pick based on whether you want to touch the working Swift app now:**

- **A. Shared JSON as source of truth (best long-term, no drift).** Move the content out of `UnitN/*.swift` into `curriculum/unitN.json`. iOS: `LessonLogic` decodes the JSON into `LessonDefinition`s — SwiftUI renderers unchanged; Android inherits via Skip. Web: import the same JSON as typed `Lesson[]`. Author once, render three times. This is the version that never rots.
- **B. One-time transcode (fastest for the demo, accepts drift).** Leave the Swift content untouched; run a throwaway parser over `Lessons/Data/Unit{N}/*.swift` (args are regular/machine-parseable) → emit `lib/curriculum/units/*.ts`. Hardcoded TS curriculum immediately; the cost is two copies that drift until you later adopt (A). Fine for a school demo.

**Render:** one React component per slide `type` (built in Step 5b), matching each SwiftUI template's look.

**Scope call:** you do **not** need all 10 units to demo. Do **Unit 1** fully (~10–15 lessons) plus one instance of every interactive slide type you want on screen. The rest is mechanical repetition.

**Files:** new `lib/curriculum/*` (TS schema + data); for (A) new `curriculum/unitN.json` shared with the Swift repo + a small `LessonLogic` decode change there; for (B) a throwaway `scripts/transcode-swift-lessons.ts`. **No Firestore content collection** — content is a committed file.

**Flag for you:** this is the single biggest net-new effort and the honest reason the student web app is not "free" the way the dashboard is. Recommendation: **(B) transcode for the first demo**, then migrate the Swift app to **(A) shared JSON** so all three clients single-source the same hardcoded content.

---

## Step 5b — Student web app (Code.org-style linear path)

**Depends on:** Steps 1, 5a (needs migrated content + session). Writes the **same progress map** as iOS.

**1:1 mapping — SwiftUI → web:**

| SwiftUI | Web |
|---|---|
| `UnitDefinition` / `CourseCatalog` | `curriculum` catalog (Step 5a) → lesson path UI |
| `LessonDefinition.slides: [LessonSlide]` | `Lesson.slides: Slide[]` → step array in a `<LessonPlayer>` |
| `LessonLogic` (index, next/prev, isInteractive gate) | `useLessonPlayer()` hook: `slideIndex`, `next()`, `canAdvance` |
| `LessonView` / `LessonHost` | `app/learn/[unit]/[lesson]/page.tsx` + `<LessonPlayer>` |
| ~30 `SlideTemplate` structs | ~30 React slide components keyed by `Slide.type` |
| `markLessonComplete(id)` → save map | write `lessonProgress.completedLessons` arrayUnion + update pointer |
| `currentUnit/currentLesson` | resume: deep-link to `/learn/{unit}/{lesson}` on load |

**Route structure**
```
app/learn/page.tsx                       # lesson path (Code.org-style linear map, completion states)
app/learn/[unit]/[lesson]/page.tsx       # lesson player (slide stepper)
components/learn/LessonPlayer.tsx
components/learn/slides/*.tsx             # one per slide type
app/hooks/useLessonPlayer.ts
app/api/progress/route.ts                # POST completion / pointer (or write direct via client SDK + rules)
```

**Progress writes (identical semantics to iOS):** on lesson completion, `arrayUnion` the `unitNlessonM` id into `users/{uid}.lessonProgress.completedLessons` and set `currentUnit/currentLesson`. Because it's the same doc iOS reads, a lesson finished on web shows as done on the phone, and vice-versa. Gamification XP writes can mirror `awardXP` rules, or be deferred for the demo (dashboard already shows lesson completion without it).

**Feel target:** linear path with clear locked/available/done states (derive from `completedLessons` + pointer), slide-by-slide stepper, "pick up where you left off" from the resume pointer. This is exactly the iOS model, so no learning-flow redesign.

**Done when:** a student logs in on web, completes Unit 1 Lesson 1, and the completion appears in the teacher dashboard and on iOS.

---

## Step 6 — Backend hardening (only what multi-client + dashboard require)

**Depends on:** Steps 2–5. Keep existing progress semantics; add only what's new.

- **Security rules** (`firestore.rules`): (a) a user reads/writes own `users/{uid}`; (b) a teacher reads `users/{studentUid}` **iff** that uid is in a class the teacher owns (`classes` roster check); (c) `classes/*` writable by owning teacher. (No `curriculum` rules — content is a committed file, not Firestore.) Today rules likely assume single-user access only — this is the main backend change.
- **Cross-platform completion writes:** standardize on `arrayUnion` into the `lessonProgress` map (don't resurrect the deprecated subcollection). Optional but recommended for the dashboard's time-series chart: add a parallel `users/{uid}/lessonEvents/{autoId}` `{ lessonId, completedAt, platform }` append-only log so you can chart completion over time and by platform. Additive; iOS keeps working unchanged (and can adopt it later).
- **Roles at write time:** ensure new web signups get `role` claim; existing users default `student`.
- **No change** to gamification/budget/journal semantics — web simply reuses or ignores them.

**Files/collections:** `firestore.rules`, optional `users/{uid}/lessonEvents/*`, role-claim route from Step 2.

---

## Shortest path to a demoable slice you can pitch to a school

The pitch is the **teacher dashboard over real cross-platform progress** — and it needs **no content migration**. Minimum viable demo:

1. **Step 1** — Firebase + login/sign-out on the web (both panes; student pane can be minimal). _Session works._
2. **Step 2 (thin)** — set `role=teacher` on one account via an admin script; create one `class` + seed its roster with 3–5 real student uids (existing app users, or accounts you make and tap through a few lessons on the iOS app / a seed script). _Real data to show._
3. **Step 3** — build the **class overview table + unit heatmap** only, backed by the `users/{uid}.lessonProgress` maps and the `catalog.ts` name spine. Skip charts if time-boxed.
4. **Step 4 (thin)** — add "Log in / Sign out" to nav and the `/dashboard` route guard so it feels like one product.

That is a working, sign-in-able teacher dashboard showing live student completion pulled from the same Firestore the iOS app already writes — the exact artifact a school wants to see — **without touching the hardcoded Swift content at all.**

Then, and only then, tackle **5a → 5b** to bring the student experience onto the web. Content migration is the real cost; sequence it after the dashboard has already proven value.

---

# BUILD SPEC — Accounts + Dashboard slice (super-specific)

This is the scoped, build-ready spec for the demo: **student/admin web accounts + the teacher dashboard only.** No student learning app, no content migration. Everything below is on the locked stack (one Next.js app, TS, Firebase, Python for offline seeding).

## What's already been scaffolded in this repo

| File | Purpose | Status |
|---|---|---|
| `.env.local.example` | Firebase config transferred from iOS plist (shared values filled; web `apiKey`/`appId` + admin key = TODO from console) | ✅ created |
| `docs/firestore.rules.proposed` | Live rules + teacher-read + classes/roster, non-destructive | ✅ created |
| `lib/firebase/client.ts` | Browser Firebase (auth + firestore), env-driven | ✅ created |
| `lib/firebase/admin.ts` | Server Admin SDK (session cookies, role claims, privileged reads) | ✅ created |
| `scripts/seed_demo.py` | Python: creates teacher(role claim)+students+class+roster+real `lessonProgress` maps | ✅ created |

Assets: brand images already live in `public/assets/` (`logo_w_text.png`, `icon_green.png`) — nothing to transfer for this slice.

## One-time console setup (you, ~5 min — can't be scripted)
1. Firebase console → Project settings → **Add app → Web** → copy `apiKey` + `appId` into `.env.local`.
2. Authentication → Sign-in method → enable **Email/Password** and **Google**.
3. Authentication → Settings → Authorized domains → add `localhost` and `bread-head.org`.
4. Project settings → Service accounts → **Generate key** → fill `FIREBASE_ADMIN_*` in `.env.local` and point `GOOGLE_APPLICATION_CREDENTIALS` at it for the seed script.
5. Copy `docs/firestore.rules.proposed` over `breadhead/firestore.rules` (review diff) → `firebase deploy --only firestore:rules`.

## Data model this slice locks (additive — iOS untouched)
```
users/{uid}                         # EXISTING doc; slice ADDS two profile fields:
  profile.role: "student"|"teacher"|"admin"    # mirror of the custom claim (for display/query)
  profile.teacherIds: [teacherUid]             # on STUDENT docs; what the read rule checks
  profile.classIds:  [classId]
  lessonProgress: { completedLessons:[ "unit1lesson1", ... ], currentUnit, currentLesson }   # UNCHANGED, read by dashboard
  gamificationProgress: { xp, lifetimeXP, level, ... }                                        # UNCHANGED

classes/{classId}                   # NEW
  name, teacherId, schoolName, joinCode, createdAt
classes/{classId}/roster/{studentUid}   # NEW
  studentUid, displayName, joinedAt, status
```
Authority for role = **Firebase custom claim** `role`, set via Admin SDK (seed script or `/api/admin/setRole`). `profile.role` is a convenience mirror.

## Remaining files to build (frontend + API — not yet written)

**Auth (Step 1):**
```
middleware.ts                       # guard /dashboard/*  → verify session cookie, check role=teacher/admin
app/login/page.tsx                  # two-pane: Student | Teacher/Admin (client)
app/login/StudentPane.tsx           # email/pw + Google → /learn (stub for this slice)
app/login/TeacherPane.tsx           # email/pw + Google → /dashboard
app/api/auth/session/route.ts       # POST idToken→session cookie (adminAuth.createSessionCookie); DELETE=sign out
app/context/AuthContext.tsx         # {user, role, loading, signOut}
app/hooks/useAuth.ts
```
Flow: pane calls client `signInWithEmailAndPassword`/`signInWithPopup(google)` → get ID token → `POST /api/auth/session` sets httpOnly cookie → redirect by role. `middleware.ts` reads the cookie for `/dashboard/*`. Sign-out: `DELETE /api/auth/session` + client `signOut()`.

**Dashboard (Steps 2–3):**
```
app/dashboard/page.tsx                       # teacher's class list (from classes where teacherId==uid)
app/dashboard/[classId]/page.tsx             # overview TABLE + unit HEATMAP + charts
app/dashboard/[classId]/[studentUid]/page.tsx# per-student lesson detail
app/api/dashboard/class/[classId]/route.ts   # server: verify teacher owns class → fan-out read roster + users/{uid}
lib/curriculum/catalog.ts                    # unit/lesson NAME spine only (decode unitNlessonM → label)
components/dashboard/ClassTable.tsx          # rows=students, cols= x/total, %, current unit·lesson, xp, last active
components/dashboard/UnitHeatmap.tsx         # units×students grid: done/in-progress/not-started
components/dashboard/CompletionChart.tsx     # completion distribution (optional for demo)
```
Dashboard reads only: `lessonProgress.completedLessons` (count + decode), `lessonProgress.currentUnit/currentLesson` (position), `gamificationProgress.xp/level`, `profile.name/updatedAt`. `catalog.ts` maps `unit3lesson5` → "Unit 3 · Lesson 5 — <name>".

**Deps to add:** `firebase`, `firebase-admin`. (Charts: reuse a lightweight lib or hand-rolled SVG; optional for v1.)

## Build order for THIS slice
1. `npm i firebase firebase-admin` → fill `.env.local` (console setup above).
2. Deploy `firestore.rules.proposed`.
3. `python scripts/seed_demo.py` → real teacher + class + 5 students with progress.
4. Build auth files → verify: log in as `demo.teacher@bread-head.org`, session persists, sign-out works.
5. Build `catalog.ts` + `app/api/dashboard/class/[classId]` + `ClassTable` + `UnitHeatmap`.
6. Verify: teacher sees the 5 seeded students' real completion; a non-owner teacher gets nothing (rule check).

**Definition of done (demoable):** log in on the web as the demo teacher → land on `/dashboard` → see a live table + heatmap of 5 students' lesson completion pulled from the same Firestore the iOS app writes → sign out. Zero content migration.
