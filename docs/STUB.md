# Stubs — to fix later

Placeholder features that are wired into the UI but not fully implemented. Each notes what it needs.

## Lesson player — COMPLETE (incl. polish)
- **Done:** all **95 lessons / 944 slides** transcoded from SwiftUI via `scripts/transcode_lessons.py` → `lib/curriculum/lessons/generated.json`. Player at `components/lesson/LessonPlayer.tsx`, route `app/learn/[unit]/[lesson]/page.tsx`, teacher preview wired from the Course page, real lesson names on Course rows.
- **26 slide renderers** — every SwiftUI template incl. the two complex visual types (visualAnalogy, interactiveGrowthVisual with a live SVG chart). **0 content fallbacks.**
- **Focus view:** on `/learn` the marketing nav is hidden; the player shows the Bread Head logo (top-left), progress, and **Exit lesson** (top-right).
- **Images:** 101 `LessonContent` assets copied to `public/lessonContent/`; 58 slides render their real image.
- **Constant refs resolved:** slide args that referenced Swift `let X = "..."` / array constants (e.g. `Unit2Lesson10Description`, `...Objectives`) are now resolved to real values by the transcoder.
- **Progress writes wired:** completing a lesson while signed in `arrayUnion`s the lesson id into `users/{uid}.lessonProgress.completedLessons` — same map iOS writes.
- **Re-run** `python3 scripts/transcode_lessons.py <Data dir> lib/curriculum/lessons/generated.json` whenever the SwiftUI content changes — single-source pipeline.

### Tiny remaining nits (non-blocking)
- **MatchConcept** renders as reveal-to-continue rather than drag-to-match (1 use in the whole course).
- **interactiveGrowthVisual** chart uses a linear model + the passed slider range; the Swift original had a legacy 0–500 cap. Cosmetic.

## Assignments — web consumes them (iOS still doesn't)
- **Web done:** the assign flow now supports titles, per-assignment in-lesson control overrides, editing, lesson-name display, and per-assignment completion counts. Students see a "Currently assigned to me" section (`StudentHome.tsx`).
- **Still missing:** the iOS app doesn't read assignments; a Progress view that marks assigned-vs-done across the roster.

## Roster: create student accounts — DEFERRED (handout shipped)
- **Done:** printable class handout at `app/dashboard/[classId]/handout/page.tsx` (big join code + self-signup steps), linked from the Roster page.
- **Decision:** students self-register + join by code (already worked); teacher-provisioned accounts were intentionally deferred — no synthetic-email/login-card system.

## Student experience — deferred
- **Gamification** — XP / level / streaks / badges / rewards on the dashboard and a celebration on lesson completion. The `gamificationProgress` map already exists in `users/{uid}` (written by iOS) — the web just needs to read + display it, and award on web completion.
- ~~**Report-a-problem sending**~~ — DONE. Send posts to `/api/report` (auth-required) → emails `breadhead.org@gmail.com` via Resend with lesson/slide/reporter. All email routes now send from `noreply@bread-head.org` (verified domain) instead of the `onboarding@resend.dev` sandbox.
- **Onboarding** — first-time student tour / welcome flow.
- **Mobile responsiveness** — the right-bubble sidebar and dashboard tiles are desktop-first; test and tune for phones.
- **App chrome** — the marketing nav still shows on `/dashboard` (both roles). Consider a dedicated app top-bar instead of the marketing `Nav`.
- **Loading / empty / error states** — thin in places; add skeletons + friendlier errors.
- **Offline support** — none.
- **Account extras** — notification preferences and theme are not on the account page yet (only name / email / password-reset / sign-out).

## Shipped (was parked)
- **Co-teachers** — add by email on the class Settings page; `classes.teacherIds[]` + membership checks across the class APIs; owner-only for delete/co-teacher management. **Needs the updated Firestore rules deployed** (`docs/firestore.rules.proposed`).
- **Lesson pacing** — per-class release frontier ("unlock through Unit X / Lesson Y") on the Course page; enforced in `useStudent`/`/lesson`.
- **In-lesson controls** — class default + per-assignment override: lock-until-correct, min seconds/slide, no-skip. Enforced client-side in `LessonPlayer` (web only; iOS separate). Also needs the rules deploy for students to read class-level pacing/controls (degrades gracefully until then).

## Not yet built (parked)
- **Assessments (Track B)** — separate, non-gated cross-unit assessments where scores are meaningful (in-lesson quizzes are mastery-gated, so no signal).
