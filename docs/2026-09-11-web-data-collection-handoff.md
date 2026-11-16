# Web data-collection — handoff (2026-09-11)

**State:** all 9 CROSS-REPO §3 items built in `bread-head-web`, **uncommitted**. Last gate: `npm run build` clean,
`npx playwright test` 366/366 green (baseline was 306/306). Plan + flags also live in `TODO.md` (top section).
Nothing in `breadhead` was touched.

## What to test (in this order)

1. **Create the admin account** — sign in at `/login` with **Google** as `ved@bread-head.org` (the gate now
   requires a verified email; a password sign-up alone won't pass). Or create it any way and have Claude set the
   `admin` custom claim.
2. `/admin` → Overview should query BigQuery (81 users, 102 lesson rows, 0 events today).
3. Sign in as a student, play a lesson with graded slides, finish it. Check:
   - Firestore `events` — docs with `platform: "web"`, names `session_start`, `lesson_started`,
     `lesson_slide_viewed`, `lesson_answer`, `lesson_completed`.
   - `users/{uid}/lessonProgress/{lessonId}` — `{ score, timeSpent, answers[], platform: "web" }`.
   - BigQuery: `SELECT * FROM breadhead_analytics.v_events WHERE platform='web' ORDER BY server_ts DESC LIMIT 20`.
4. Add a receipt on `/mybudget` → `users/{uid}/budget/continuous_data.transactions[-1]` has `createdAt` + `platform`.
5. Teacher: create a class with a sponsor (needs a sponsor with `active: true` in `public/sponsors` — add one in
   `/admin` → Sponsoring partners). Student joins with the code → `profile.attribution` gets
   `{ verified: true, classId, sponsorId }`. (Dashboard is behind the ComingSoon curtain — flip
   `DASHBOARD_ENABLED` in `app/dashboard/layout.tsx` to see the picker.)
6. `/admin` → Sponsor report for that sponsor; download CSV.
7. `/privacy-notice` §2 shows the sponsoring-partner line.

## Commit plan (8 commits, in this order — ask Claude to run them after testing)

| # | Scope | Files |
|---|---|---|
| 1 | EventLogger | `lib/analytics/events.ts`, `lib/analytics/eventsCore.ts`, `tests/unit/events.spec.ts` |
| 2 | Lesson events | `app/mylessons/[unit]/[lesson]/page.tsx`, `components/lesson/LessonPlayer.tsx`, `lib/analytics/lessonAnswers.ts`, `tests/unit/lessonAnswers.spec.ts` |
| 3 | lessonProgress record | same page (the `writeBatch` in `handleComplete`) |
| 4 | Transactions createdAt/platform + `transaction_created` | `lib/budget/budget.ts`, `lib/budget/store.ts`, `app/mybudget/page.tsx`, `tests/unit/budget.spec.ts` |
| 5 | Join → verified attribution | `app/api/student/join/route.ts` |
| 6 | classes.sponsorId + teacher UI | `app/api/classes/route.ts`, `app/api/classes/[classId]/route.ts`, `app/api/dashboard/overview/route.ts`, `app/dashboard/{useDashboard.ts,CreateClassModal.tsx,SponsorSelect.tsx,[classId]/settings/page.tsx}`, `lib/sponsors/*`, `tests/unit/sponsors.spec.ts` |
| 7 | Admin portal + BigQuery + sponsor report + sponsor admin | `app/admin/page.tsx`, `app/api/admin/*`, `lib/bigquery.ts`, `lib/adminIdentity.ts`, `lib/firebase/verifyAdmin.ts`, `lib/admin/*`, `tests/unit/sponsorReport.spec.ts`, `package.json` (+`@google-cloud/bigquery`) |
| 8 | Privacy line | `app/privacy-notice/page.tsx`; `TODO.md` + this doc |

## Key design facts

- Events: batch of ≤25 to top-level `events`, flush on hidden/pagehide/8 s idle; per-tab session in
  `sessionStorage`, rotates after 30 min idle; no-op signed-out/anonymous; only the current uid's events are written.
- Score = % of graded slides correct with zero wrong attempts, `null` if none graded (mirrors iOS exactly).
  Graded kinds on web: `trueOrFalse`, `multipleChoice`, `matchConcept`. `realLifeScenario` is NOT graded (parity).
- Completion = ONE `writeBatch`: top-level `completedLessons` arrayUnion (unlock) + subcollection record (evidence).
- Join: `verified: true` always; `sponsorId` first-wins; `classId` locked with it.
- Admin gate: `email_verified && email == ved@bread-head.org` OR `role == 'admin'` claim. Server routes enforce.
- BigQuery: dataset in **us-central1**; reuses the Admin SDK service account (has Data Editor + Job User) — no new
  Vercel env var. Optional overrides: `BIGQUERY_CREDENTIALS_JSON`, `BIGQUERY_LOCATION`.
- Sponsor report (`lib/admin/sponsorReport.ts` → pure `sponsorReportShape.ts`): self-reported vs verified never
  blended, denominator stated, every breakdown cell < 10 withheld. Sponsors are deactivated, never deleted.

## Decisions needed from Ved

1. **iOS bug:** `FirebaseDataManager.completeLesson` writes `score ?? 0` → ungraded lessons stored as 0 (web writes
   `null`). Fix in `breadhead` or the report's average score is skewed.
2. **Who sets `classes.sponsorId`?** Built as teacher-editable (per CROSS-REPO). Data contract says admin-set.
   > **Superseded 2026-11-15 — organization codes.** The partner is no longer a field on the class (`classes.sponsorId` was dropped: teachers can write class docs from the browser). It belongs to the **teacher**: server-only `teacherOrgs/{teacherUid} = { sponsorId, via: 'code' | 'admin', updatedAt }`, set when the teacher enters an admin-issued organization code (`sponsorCodes/{CODE} = { sponsorId, createdAt }`, one live code per partner, generated in `/admin`) at sign-up or in the dashboard, or directly by the admin in `/admin` → Teachers. `POST /api/student/join` sets `attribution.sponsorId` from the class owner's `teacherOrgs` entry. Both collections fall under the deny-by-default rule — no rules change. Code: `bread-head-web/lib/sponsors/{orgCode,server}.ts`, `app/api/teacher/organization`, `app/api/admin/{org-codes,teachers}`.
   Recommend admin-only at scale (a teacher could inflate a partner's verified count).
3. **Vercel:** enable "Automatically expose System Environment Variables" so `appVersion` = git SHA.
4. **Scale later:** rollup tables / partition pruning once events pass a few million rows; move report cohort
   filtering into SQL past ~50k users.
5. **Known, accepted:** tab close can lose ≤8 s of buffered events; resume mid-lesson scores only this session's
   slides (same as iOS).

## Picker design for ~100 partners (iOS `AttributionPickerView` — spec only, not built)

- **Data (additive, iOS ignores unknown keys):** per sponsor add `region` (state), `city`, `type`, `aliases[]`,
  `featured`. Still one `public/sponsors` doc.
- **Screen 1 (1 tap):** search box → ≤6 featured cards for the student's region (locale/timezone, no geolocation
  prompt) → "My school or teacher" → "I found it myself".
- **Search (2 taps + typing):** fuzzy on name/aliases/city, max 8 results, no scroll.
- **Browse (3 taps):** "Browse by state" chips → state → ≤10 partners.
- **Spec additions:** reserved `unlisted` source (signal, not free text); **partner codes** (generalise the class
  join code) so non-classroom students can be *verified*, not just self-reported.
- **Admin at scale:** searchable combobox for sponsor pickers; scheduled quarterly job writing one CSV per partner.
