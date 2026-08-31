# Bread Head — App TODO

Running backlog of cross-platform / web-app issues to fix. Newest at top.

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
