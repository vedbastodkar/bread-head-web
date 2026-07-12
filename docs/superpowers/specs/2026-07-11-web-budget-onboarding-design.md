# Web Budget Onboarding — Design Spec

**Date:** 2026-07-11
**Status:** approved (design) → planning
**Branch:** feat/web-budget

## Goal

When a user opens `/mybudget` and has **not yet set up a budget**, run a
first-time **budgeting onboarding** flow instead of dropping them onto an empty
`$0/$0` board. The flow mirrors the iOS `BudgetOnboardingFlow.swift` (the
source of truth) — same 11 steps, same concept teaching, same setup — adapted to
the web app's existing "receipt printer + boxes" interaction model. Everything it
collects is written to the **same shared Firestore docs** the iOS app reads
(`users/{uid}/budget/continuous_data` + `users/{uid}/categories/*`), in the exact
iOS wire format, so web and iOS stay in sync.

This also fixes the web half of the cross-platform TODO bug: a web-first account
should get the budget onboarding, not a broken/empty board.

## Trigger

`/mybudget` loads the budget on mount (existing `loadBudget`). Gate:

- Surface `settings.hasCompletedOnboarding` from `continuous_data` through
  `loadBudget` (new field on `LoadedBudget`).
- If `hasCompletedOnboarding !== true` → render the onboarding flow (full-screen
  takeover within the route).
- Else → render the normal board (current behavior).
- On flow completion → write `hasCompletedOnboarding = true`, then show the board.

**Consequences (intended):**
- Existing iOS users (already completed) skip onboarding — board shows immediately.
- Web-first users and anyone who never set up a budget get the flow.
- The account we tested (`vedbastodkar@gmail.com`) has `hasCompletedOnboarding:true`
  from the earlier seed, so it will show the board; wiping the seed re-triggers
  onboarding — useful for QA.

## Presentation & navigation

- A client component `BudgetOnboarding` rendered by `/mybudget/page.tsx` when the
  gate fires. **No new route/URL.**
- Top **progress bar** (mirrors iOS; fills across the setup steps).
- **Back / Next** buttons at the bottom; **"Skip intro"** link on the concept
  slides that jumps straight to the Income step.
- Concept slides (0–6) are skippable. **Income (7)** and **Template (8)** are
  required to finish. Settings (9) has sensible defaults and can be advanced
  without changes.
- Styling uses the existing web budget palette / fonts (bgSage, brandGreen,
  Playfair display headings, DM Sans body) — not a raw port of iOS SwiftUI.

## The 11 steps (iOS reference → web behavior)

Copy is mirrored from `BudgetOnboardingFlow.swift`, with interaction-specific
copy adapted to the web's actual mechanic (receipt printer + drag-into-box, not
iOS's "+ button / drag bread chips"). Web uses "boxes" (existing web term), iOS
says "bins" — we keep "boxes".

| # | Step | Title (mirrors iOS) | Web behavior | Writes on finish |
|---|------|--------------------|--------------|------------------|
| 0 | welcome | "Welcome to Budgeting!" | Intro + 3 feature badges (continuous tracking, weekly check-ins, smart savings) | — |
| 1 | howItWorks1 | "Step 1: Available Bread" | Concept: your monthly money pool; income examples | — |
| 2 | howItWorks2 | "Step 2: Category Boxes" | Concept: envelope-style boxes with planned caps | — |
| 3 | howItWorks3 | "Step 3: Track Spending" | Concept, **adapted**: print a receipt, drag it into a box; progress bars update live | — |
| 4 | howItWorks4 | "Step 4: Monthly Reset" | Concept: budget refreshes each month automatically (happens on mobile; web reads the synced result) | — |
| 5 | howItWorks5 | "Step 5: Weekly Guidance" | Concept: optional insights/check-ins; nothing is mandatory | — |
| 6 | overview | "Set Up Your Budget" | "Takes less than a minute — here's what we'll do" preview | — |
| 7 | income | "What's your income this month?" | `$` input for monthly income; allocations scale automatically | `settings.primaryIncomeAmount` |
| 8 | template | "Choose Your Budget Style" | Pick 1 of 4 presets → **creates those boxes** | one `categories/{id}` doc per template category |
| 9 | settings | "Configure Your Preferences" | Auto-sweep toggle, weekly check-in weekday, skim rate | `settings.autoSweepUnallocatedToSavings`, `.weeklyCheckInWeekday`, `.skimRate` (+ template nws pcts) |
| 10 | ready | "You're All Set!" | Confirmation → enter board | `settings.hasCompletedOnboarding = true` |

## Templates (mirror iOS `presetTemplates`)

Mirror the 4 iOS presets into `lib/budget/templates.ts`, each a name +
description + bestFor + category list (name, iconKey, percent target) + nws pcts
where applicable:

1. **50/30/20 Split** — Needs 50 / Wants 30 / Savings 20 (nws 50/30/20)
2. **Student Budget** — Essentials 60 / Food 20 / Entertainment 10 / Savings 10
3. **Summer Job Budget** — Essentials 20 / Food & Drink 20 / Health & Fitness 10 / Shopping & Clothes 15 / Fun & Entertainment 20 / Savings & Goals 15
4. **Savings Challenge Mode** — Essentials Only 40 / Minimal Fun 10 / Savings Goal 50 (nws 40/10/50)

iconKeys reuse the shared SF-symbol keys already mapped by `lib/sfIcon`
(`house.fill`, `fork.knife`, `heart.fill`, `gamecontroller.fill`, `bag.fill`,
`target`). Each template category is created with `targetMode:'percent'`,
`targetValue:<pct>`, a color from the existing web `BOX_PRESETS` palette,
`isSystemCategory:false`, sequential `sortOrder`.

## Data writes (all via `lib/budget/store.ts`, `merge:true`)

On completion, in order:

1. **Income** — reuse existing `setIncome(uid, income)` → writes
   `settings.primaryIncomeAmount` (and mirrors to a current snapshot if one
   exists, per current logic).
2. **Categories** — one `saveCategory(uid, cat)` per template category (existing
   fn, writes full iOS category wire shape).
3. **Settings + onboarding flag** — new `saveBudgetSettings(uid, patch)` that
   `setDoc(budgetDoc, { settings: patch }, {merge:true})`. Patch includes:
   `autoSweepUnallocatedToSavings`, `weeklyCheckInWeekday`, `skimRate`,
   `nwsNeedPct/nwsWantPct/nwsSavePct` (from template when it defines them),
   `hasCompletedOnboarding: true`. `merge:true` on the nested `settings` map so
   iOS-only sibling settings are preserved (matches existing store safety rules).

Field names/types match iOS exactly: `skimRate` is a 0.0–1.0 decimal,
`weeklyCheckInWeekday` is 0–6 (Sun–Sat), `autoSweepUnallocatedToSavings` is bool.

## Files

**New**
- `app/mybudget/onboarding/BudgetOnboarding.tsx` — flow container: step state,
  progress bar, nav, and the 11 step views (small sub-components / a step map).
- `lib/budget/templates.ts` — the 4 presets + a `templateToCategories(template,
  colors)` helper returning `BudgetCategory[]`.

**Changed**
- `lib/budget/store.ts` — `LoadedBudget` gains `hasCompletedOnboarding: boolean`;
  `loadBudget` reads it from `settings`; add `saveBudgetSettings(uid, patch)`.
- `app/mybudget/page.tsx` — after load, gate on `hasCompletedOnboarding`; render
  `<BudgetOnboarding onDone={...} />` or the board. `onDone` re-loads (or
  optimistically sets state) so the board shows the new income + boxes.

## Testing

- **Playwright** (`tests/`): with onboarding not completed, `/mybudget` shows the
  flow (welcome visible, board hidden). Completing income + template + settings
  lands on a board whose boxes match the chosen template and whose income matches
  the entered value. (May require a seeded/mocked auth+Firestore state; if that's
  impractical in the visual-regression harness, cover the gate + step rendering
  with a component-level test and verify the Firestore round-trip manually via the
  Admin SDK seed/wipe script, consistent with how `store.ts` is validated today.)
- **Required gates:** `npm run build` (zero errors) and `npx playwright test`
  (all visual regression pass). Regenerate snapshots with `npm run test:update`
  only if the board itself changes visually.

## Out of scope

- Implementing auto-sweep / weekly check-in / skim on the **web** (collected for
  iOS only; web does not execute them).
- The iOS-only NWS "allocation mode" board behavior — web stays category/box based.
- Re-running onboarding from a settings menu (future; the gate is completion-flag
  based, so a manual reset just needs `hasCompletedOnboarding=false`).
- The mobile-side "skips budget onboarding" fix (tracked separately in `TODO.md`).
