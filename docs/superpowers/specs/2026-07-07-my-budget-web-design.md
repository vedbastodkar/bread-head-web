# My Budget (Web) — Design Spec

**Date:** 2026-07-07
**Scope:** A student-facing web budgeting tool ("My Budget") that mirrors the iOS Budgeting Simulator's core monthly loop, syncs to the **shared** Firestore budget schema, and is **teacher-assignable under the journal privacy model** (teacher sees safe metadata only — never dollar amounts, category names, or notes).

## Goals

1. **Core monthly budgeting loop on the web** — an authenticated `/mybudget` app page (same shell as `/learn`, `/journal`). A student sets income, creates spending **boxes** (categories), and files **receipts** (transactions) into them, watching live stats update.
2. **Distinctive, physical UI** — the "receipt → box" workbench: print a paper receipt (amount + what-for + Need/Want/Save), then **drag it into an open 3D box**, or (mobile/a11y) **tap the receipt then tap a box**. Boxes fill visibly; overfilled boxes flag red. Scroll down for stats.
3. **Sync with iOS via the shared schema** — reads/writes the same Firestore docs the iOS app uses (`users/{uid}/categories/{id}`, `users/{uid}/budget/continuous_data`). Edit on phone, see on web, and vice versa.
4. **Teacher-assignable, privacy-preserving** — a new assignment `type: 'budget'`. Teachers see **only completion status + last-updated time** — never income, spending, allocations, or any dollar figure. The actual budget stays in the student's own doc, physically unreachable to teachers, identical to the journal model.
5. **Safe by construction** — every shared-doc write uses `merge` and touches only fields the web understands. The ~60 iOS-only settings, month snapshots, insights, and templates are read but **never overwritten**.

**Non-goals (v1):** the month-boundary/rollover engine; the settings hub (~60 `BudgetSettings` fields); saved templates; the insights/weekly-insights engine; receipt-photo upload (`receiptURI`); editing the marketing `/budgeting` page (kept as-is — the app tool is a distinct route). **All of the above remain iOS-app-only** and are preserved untouched by merge writes. Android sync is deferred (see cross-platform note).

## Key discoveries (drive the design)

1. **iOS already syncs budget to Firestore.** Live DB inspection (journaling spec, 50 users) shows per-user subcollections `categories`, `budget`, `devices`, `lessonProgress`. The web must therefore match the existing schema exactly — it is not defining a new one.
2. **Exact schema extracted from iOS source** (`~/Developer/breadhead`): `Category.toFirestoreData()`, `BudgetTransaction.toFirestoreData()`, `MonthSnapshot.toFirestoreData()`, `BudgetStore.saveToFirebase()`, `CategoryManager.saveToFirebase()`. See "Data model" below.
3. **Android budget is local-only** (`~/Developer/breadheadAndroid`): a *"Firebase-decoupled port (UserDefaults/Codable only)"* — no Firestore writes anywhere in its budget module. Its Codable model is the **identical shape**, so no schema conflict; but Android ↔ web won't sync until Android re-enables Firestore. Deferred task documented at `~/Developer/breadheadAndroid/BUDGET_FIRESTORE_SYNC.md`.

---

## Data model (shared with iOS — do not deviate)

All under the student's owner-readable user doc.

### `users/{uid}/categories/{categoryId}` — one doc per box
`categoryId` = client-generated **uppercase UUID** (matches iOS convention). Fields written (mirror `Category.toFirestoreData()`):
`id, name, iconKey (SF Symbol name), color` (+ duplicate `iconColor`), `targetMode ("fixed"|"percent"), targetValue (number), isSimulated (false), rolloverRule ("none"|"carry_unused"), sortOrder, isActive, isSystemCategory, createdAt, lastModified, spendingRules[] ([] for web), fixedPayments[]` (`{id,name,amount,isEnabled}`).

Write pattern: **diff-based upsert** — `set(merge:false)` per current category doc; delete only doc ids no longer present. Never delete-all-then-rewrite. (Mirrors iOS `CategoryManager`.)

### `users/{uid}/budget/continuous_data` — one doc
Web reads the whole doc, mutates only the arrays/fields it owns, and writes back with **`merge: true`**. Fields the web touches:
- `transactions[]` — each mirrors `BudgetTransaction.toFirestoreData()`: `id (uppercase UUID), type ("income"|"expense"), amount (number, positive), date (Timestamp), isPending (false)`, optional `name, categoryId, note, nwsLevel ("need"|"want"|"save"), paymentMethod, place`. (Web omits `receiptURI` — no photo upload in v1.)
- `snapshots[]` — the current-month `MonthSnapshot` (`id, year, month, ab, income, userPredictedIncome, allocated{catId:number}, plannedOverrides{}, savingsAdded, rolloverApplied, isClosed, createdAt`). Web reads current month by `currentSnapshotId` (or `year`/`month` match); if none exists, falls back to `settings.primaryIncomeAmount` for income and does **not** fabricate month-boundary logic.
- Fields web **reads but never writes back except via merge**: `settings` (entire blob), `entries[]`, `savingsAccount`, `weeklyInsights`, `hasCompletedOnboarding`, `currentSnapshotId`.

**Icon mapping:** iOS `iconKey` is an SF Symbol name. Web maps a curated subset of SF Symbol names → emoji/inline SVG for display (there is already `lib/sfIcon.ts` — extend it). New boxes created on web write a valid SF Symbol `iconKey` so iOS renders them correctly.

---

## Stats (computed client-side, exact iOS formulas)

From `Category.swift` — reuse verbatim in a firebase-free `lib/budget/budget.ts` (unit-testable, mirroring `lib/journal/journal.ts`):
- `resolveAllocated(income)` = `targetMode==="fixed" ? targetValue : income * targetValue/100`
- `fixedTotal` = sum of enabled `fixedPayments.amount`
- `flexible(income)` = `resolveAllocated(income) - fixedTotal`
- **Available Bread** = income − committed (fixed) − spent (derived from transactions)
- **Spent vs budget per box** = sum of expense transactions with that `categoryId` vs `resolveAllocated`
- **Allocated vs unallocated** = Σ allocated vs income
- **Savings rate** = Σ into Save boxes / income (target from `settings` if present, else 20%)
- **Three-tier warnings** (reuse T1/T2/T3 tokens from marketing `/budgeting`): T1 box ≥80% used; T2 discretionary (Want) share > 60%; T3 box overspent / income exhausted.

---

## UX — the workbench (`/budget`)

Single scrollable page inside the student shell. Honors the Bread Head system (bgSage, brandGreen, accentGold, ink; Playfair italic display, DM Sans body).

1. **Header** — "My Budget" + an **Available Bread** card (live).
2. **Receipt printer** — amount, what-for, Need/Want/Save segmented control, "Print receipt". Prints a paper receipt (torn edge, monospace line items) into a tray.
3. **Tray** — printed-but-unfiled receipts. Embodies "every dollar needs a job" — an unfiled receipt nags.
4. **Boxes** — categories as open 3D boxes that fill with use; overfilled boxes flash red + shake.
5. **Stats (scroll-down)** — spent-vs-budget per box, allocated-vs-unallocated, savings-rate ring, three-tier warnings — all live.

**Interaction & accessibility (required):** drag-and-drop is an enhancement, **not** the only path. Every receipt is a focusable control supporting **tap-to-select → tap-a-box** and keyboard (Enter to pick up, arrow/Enter to file). Drag uses Pointer Events (works for mouse + touch). `prefers-reduced-motion` disables fly/shake animations. A working interactive concept exists at `scratchpad/budget-workbench.html`.

---

## Persistence & assignment

- **Private data**: the student writes their own budget directly to `users/{uid}/...` (owner-readable rules already deployed for `categories`/`budget`). Client-side Firestore, like `useStudent`.
- **Assignment type**: extend the assign route + `StudentAssignment` with `type: 'budget'`. A budget assignment carries a title/due date and an optional simple requirement (e.g. "create ≥N boxes" / "log ≥N receipts" / "set your income").
- **Teacher metadata (privacy invariant)**: a new `POST /api/budget/submit` (Node runtime, admin SDK, **roster join-gate**, recompute server-side) writes **only** to `classes/{cid}/assignments/{aid}/submissions/{uid}`:
  `{ status: "complete"|"in_progress", hasStarted: boolean, lastUpdatedAt, submittedAt }`.
  **This is deliberately minimal — the teacher sees only *that* a student did the budget and *when*, never *how much they make* or *how they spend*.** No income amount, no spending totals, no allocation percentages, no box/receipt counts, no category names, no notes, no transaction detail. `status` is a bare completion enum computed server-side from the assignment's requirement (e.g. "has an income set and ≥N boxes"); it encodes a yes/no, not any dollar figure. Mirrors `buildSubmission` in `lib/journal/journal.ts` — the pure builder returns only these safe fields; any richer input is ignored.
- **Join gate**: no class joined ⇒ no submission ever ⇒ a purely personal budgeter is invisible by construction.

---

## Merge & conflict safety

- `continuous_data`: **read-before-write + `merge:true`.** `transactions`/`snapshots` are whole-array fields → last-write-wins across platforms; read-before-write shrinks the clobber window. Web never writes iOS-only fields back as defaults. Acceptable for v1 (a teen is not editing phone + web simultaneously); documented risk.
- Categories: per-doc upsert + diff-based delete. Never delete-all.

## Decisions (recommended defaults — flag at review)

- **D1 — write safety:** read-before-write merge on `continuous_data`. *(Accepted risk: cross-device simultaneous edit is last-write-wins.)*
- **D2 — web edit surface:** v1 lets the student **set income and create/edit/archive/allocate boxes** (full workbench), not transactions-only. Rationale: the boxes + allocations are the point of the workbench; transactions-only would leave it half-inert.

## Cross-platform note

- **iOS:** syncs today; web matches its schema exactly.
- **Android:** local-only today; web is the de-facto cloud budget for Android users until Android re-enables Firestore sync. No schema change needed then (shapes match). Deferred task: `~/Developer/breadheadAndroid/BUDGET_FIRESTORE_SYNC.md`.

## Testing

- Pure `lib/budget/budget.ts` unit tests (allocation, available bread, savings rate, warning tiers, safe-metadata builder) — mirror the journal test suite.
- Playwright visual coverage for `/budget` at mobile/tablet/desktop; interaction test for tap-to-file (keyboard/tap path, not drag).
- Round-trip check against a test account: web write → iOS read preserves iOS-only fields.

## Acceptance criteria

- [ ] Student sets income, creates boxes, files receipts on web; stats compute with iOS formulas.
- [ ] Data written to shared paths is read correctly by iOS; iOS-only fields survive web writes.
- [ ] Tap/keyboard path fully files receipts without drag; reduced-motion respected.
- [ ] Teacher of an assigned budget sees only safe metadata; no amounts/names/notes reachable.
- [ ] A student who never joined a class produces no teacher-visible records.
