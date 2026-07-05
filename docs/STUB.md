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

## Assignments not consumed by the student app
- **Where:** assign flow writes `classes/{id}/assignments/*`; shown on the Course page.
- **What's missing:** the student app doesn't read assignments — they're teacher-side metadata only. Assigned lessons aren't surfaced to students, and the Progress view doesn't yet mark assigned-vs-done.
- **Needs:** (1) student app (iOS + web) reads assignments and shows/locks accordingly; (2) Progress view cross-references assignments with `completedLessons`.

## Roster: create student accounts + login cards
- **Where:** `app/dashboard/[classId]/roster/page.tsx` (note at bottom).
- **What's missing:** creating student accounts from the teacher UI, and printable login cards.
- **Blocked on:** identity-model decision — join-code + teacher-provisioned username vs. email login. Login cards can't print passwords we don't store, so this depends on the chosen model.

## Student experience — deferred
- **Gamification** — XP / level / streaks / badges / rewards on the dashboard and a celebration on lesson completion. The `gamificationProgress` map already exists in `users/{uid}` (written by iOS) — the web just needs to read + display it, and award on web completion.
- **Report-a-problem sending** — the lesson player's report modal is built, but "Send" is a stub; wire it to a Firestore collection (e.g. `problemReports`) or an email/Slack webhook.
- **Onboarding** — first-time student tour / welcome flow.
- **Mobile responsiveness** — the right-bubble sidebar and dashboard tiles are desktop-first; test and tune for phones.
- **App chrome** — the marketing nav still shows on `/dashboard` (both roles). Consider a dedicated app top-bar instead of the marketing `Nav`.
- **Loading / empty / error states** — thin in places; add skeletons + friendlier errors.
- **Offline support** — none.
- **Account extras** — notification preferences and theme are not on the account page yet (only name / email / password-reset / sign-out).

## Not yet built (parked)
- **Co-teachers** — invite/lookup flow for a second teacher on a class.
- **Lesson locking / pacing** — gate which units/lessons are open (Code.org-style locks).
- **Assessments (Track B)** — separate, non-gated cross-unit assessments where scores are meaningful (in-lesson quizzes are mastery-gated, so no signal).
