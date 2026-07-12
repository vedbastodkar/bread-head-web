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

2. **Web doesn't show real lesson progress.** The web shows **Lesson 1 as the
   first lesson** regardless of where you actually are. It should reflect your
   **actual progress / current lesson**, synced from the account — not default
   to lesson 1.

3. **Broken onboarding page UI (seen during the above).** "Half-assed" page:
   - keyboard opened and **wouldn't dismiss** (no dismiss / didn't go down)
   - a **bad floaty button** (mis-positioned / floating)
   - generally **bad UI** / unfinished layout
   - (Which surface this page is on — web budget onboarding vs. mobile budget
     onboarding — needs confirming; likely the budget onboarding reached via a
     web-first account.)

**Expected behavior:**
- Signing into mobile with an existing (web-created) account should still run
  the **budget-specific onboarding** if the budget isn't set up yet.
- Web should load and display the account's **actual lesson progress**, not a
  hardcoded Lesson 1.
- The budget onboarding page should have polished UI: dismissable keyboard,
  correctly-placed primary button, finished layout.
