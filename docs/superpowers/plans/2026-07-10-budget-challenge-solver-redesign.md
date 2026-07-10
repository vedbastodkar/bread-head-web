# Budget Challenge Solver Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Budget Challenge a real budgeting exercise — the student builds every bucket themselves (no pre-seeded locked bills), graded on principles (all allocated + savings ≥ target + needs ≥ essentials floor), with a fully live summary/checklist.

**Architecture:** Replace the `fund_mandatory` (bill-matching) criterion with `min_needs` (needs total ≥ Σ essentials). Drop `seedBoxes`; the solver starts empty and every bucket is a live-editable row driven by `boxes` state, so the running summary + preview checklist recompute each render. Server scoring stays authoritative via `evaluateChallenge`.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Tailwind v3, Firebase, Playwright (runner for unit specs under `tests/unit/` AND visual specs).

## Global Constraints

- `npm run build` zero errors + `npx playwright test` all green before every commit (CLAUDE.md). The student solver is NOT in the 21 visual snapshots — expect no snapshot churn.
- UNIT TESTS ARE PLAYWRIGHT: `import { test, expect } from '@playwright/test'`, flat `test()`, relative imports, no `vi`. Run one file: `npx playwright test tests/unit/<f>.spec.ts`.
- Never run `next build` while a `next dev` server runs (corrupts `.next`) — check `pgrep -f "next dev"` first (gotcha G7).
- Server scoring authoritative: `/api/challenge/submit` recomputes via `evaluateChallenge`; the client checklist is a labeled preview.
- No Firestore data-model change. Already-stored submissions keep their `mandatoryId`/`fund_mandatory` detail strings — do NOT migrate; teacher/grades render stored strings fine.
- Commit exact paths only (never `git add -A`); end commit messages with `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- Spec: `docs/superpowers/specs/2026-07-10-budget-challenge-solver-redesign-design.md`.

---

## File Structure

- Modify `lib/challenges/challenge.ts` — criterion `min_needs`, `essentialsFloor()`, remove `seedBoxes`, rewrite `referenceSolution`.
- Modify `tests/unit/challenge.spec.ts` — retarget `fund_mandatory`/`seedBoxes` cases to `min_needs`.
- Modify `lib/challenges/library.ts` — 4 seeds: `min_needs` criterion + rewritten prompts.
- Rewrite `app/challenge/[assignmentId]/page.tsx` — live summary, live bucket rows, inline-live add, `%→$`, post-submit banner.
- Verify only (likely no change): `app/api/challenge/submit/route.ts`, `app/dashboard/content/challenges/page.tsx`, `app/grades/page.tsx`.

---

## Task 1: `min_needs` grading model in the pure lib

**Files:**
- Modify: `lib/challenges/challenge.ts`
- Test: `tests/unit/challenge.spec.ts`

**Interfaces:**
- Produces: `Criterion.kind` includes `'min_needs'` (drops `'fund_mandatory'`); `essentialsFloor(ch: Challenge): number`; `evalCriterion` handles `min_needs`; `referenceSolution(ch)` builds student-style boxes; `seedBoxes` REMOVED.
- Consumes: existing `resolveBoxDollars`, `allocatedDollars`, `EPS`.

- [ ] **Step 1: Update the `CH` test fixture + add failing `min_needs` tests.** In `tests/unit/challenge.spec.ts`: (a) change the `CH` fixture's `criteria` entry `{ kind: 'fund_mandatory' }` → `{ kind: 'min_needs', value: 1050 }` (CH's mandatory = Rent 1000 + Phone 50 = 1050). (b) DELETE the `seedBoxes produces one locked box per mandatory bill` test and remove `seedBoxes` from the import. (c) Convert the three `fund_mandatory`/`mandatoryId` allocation tests into `min_needs` tests keyed on role, and add the new cases:

```ts
test('min_needs passes when need-role boxes cover the essentials floor', () => {
  const alloc = { boxes: [
    { id: '1', name: 'Rent', role: 'need', targetMode: 'fixed', targetValue: 1050 },
    { id: '2', name: 'Save', role: 'save', targetMode: 'fixed', targetValue: 500 },
    { id: '3', name: 'Fun', role: 'want', targetMode: 'fixed', targetValue: 450 },
  ] } as Allocation
  const r = evaluateChallenge(CH, alloc).perCriterion.find((c) => c.kind === 'min_needs')!
  expect(r.passed).toBe(true)
})

test('min_needs fails when need-role total is below the floor', () => {
  const alloc = { boxes: [
    { id: '1', name: 'Rent', role: 'need', targetMode: 'fixed', targetValue: 900 },
  ] } as Allocation
  const r = evaluateChallenge(CH, alloc).perCriterion.find((c) => c.kind === 'min_needs')!
  expect(r.passed).toBe(false)
})

test('min_needs counts a percent-mode need box by its dollar value', () => {
  // CH income 2000; 55% = $1100 ≥ 1050 floor
  const alloc = { boxes: [
    { id: '1', name: 'Rent', role: 'need', targetMode: 'percent', targetValue: 55 },
  ] } as Allocation
  const r = evaluateChallenge(CH, alloc).perCriterion.find((c) => c.kind === 'min_needs')!
  expect(r.passed).toBe(true)
})
```

(Verify CH's income is 2000 when writing the percent case — adjust the % if the fixture differs. Keep the existing `referenceSolution always passes its own challenge` and library integrity tests unchanged.)

- [ ] **Step 2: Run, verify fail** — `npx playwright test tests/unit/challenge.spec.ts` → FAILs (unknown `min_needs`, `essentialsFloor` missing, or `seedBoxes` import error).
- [ ] **Step 3: Implement in `lib/challenges/challenge.ts`:**

```ts
// Criterion union — replace 'fund_mandatory' with 'min_needs'
export interface Criterion {
  kind: 'zero_unallocated' | 'min_needs' | 'min_savings_rate'
  value?: number // percent for min_savings_rate; dollar floor for min_needs
}

// Essentials floor = sum of the scenario's mandatory costs (prompt prose + needs floor).
export function essentialsFloor(ch: Challenge): number {
  return (ch.monthly?.mandatory ?? []).reduce((s, b) => s + b.amount, 0)
}
```

Replace the `fund_mandatory` branch in `evalCriterion` with:

```ts
if (c.kind === 'min_needs') {
  const floor = c.value ?? essentialsFloor(ch)
  const needs = alloc.boxes
    .filter((b) => b.role === 'need')
    .reduce((s, b) => s + resolveBoxDollars(b, income), 0)
  const passed = needs + EPS >= floor
  return {
    kind: c.kind,
    passed,
    detail: passed
      ? `Essentials $${needs.toFixed(0)} of $${floor.toFixed(0)}`
      : `Essentials underfunded — $${needs.toFixed(0)} of $${floor.toFixed(0)}`,
  }
}
```

DELETE `seedBoxes` entirely, and rewrite `referenceSolution` to not use it:

```ts
export function referenceSolution(ch: Challenge): Allocation {
  const income = ch.monthly?.income ?? 0
  const floor = essentialsFloor(ch)
  const sr = ch.criteria.find((c) => c.kind === 'min_savings_rate')?.value ?? 0
  const savings = income * (sr / 100)
  const remainder = income - floor - savings
  const boxes: AllocationBox[] = []
  if (floor > 0) boxes.push({ id: 'ref-needs', name: 'Essentials', role: 'need', targetMode: 'fixed', targetValue: floor })
  if (savings > 0) boxes.push({ id: 'ref-save', name: 'Savings', role: 'save', targetMode: 'fixed', targetValue: savings })
  if (remainder > EPS) boxes.push({ id: 'ref-flex', name: 'Spending', role: 'want', targetMode: 'fixed', targetValue: remainder })
  return { boxes }
}
```

Leave `AllocationBox.mandatoryId` field in place (optional, back-compat; nothing writes it now). Leave `validateChallenge` as-is (it sums `monthly.mandatory` which equals the floor).

- [ ] **Step 4: Run, verify pass** — `npx playwright test tests/unit/challenge.spec.ts` → PASS.
- [ ] **Step 5: `npm run build`** → zero errors (catches the removed `seedBoxes` import in the solver — if the build flags `app/challenge/[assignmentId]/page.tsx`, that import is fixed in Task 3; for THIS task's build, temporarily it may error. If so, note it and proceed — Task 3 resolves it. Prefer: verify `tsc` on the lib only via the unit test pass, and run full build at end of Task 3.) 
- [ ] **Step 6: Commit** — `git add lib/challenges/challenge.ts tests/unit/challenge.spec.ts && git commit -m "feat(challenges): principle-based min_needs grading, drop seeded bill boxes"`

> NOTE: because the solver (Task 3) still imports `seedBoxes` until rewritten, do the full `npm run build` gate at the END of Task 3. Task 1's gate is the unit-test pass; Task 2 is unit-test pass; Task 3 does the build + full Playwright.

## Task 2: Update the 4 library seeds

**Files:**
- Modify: `lib/challenges/library.ts`

**Interfaces:**
- Consumes: `Criterion` (`min_needs`), `essentialsFloor` from Task 1.

- [ ] **Step 1:** For EACH of the 4 seeds, replace the `{ kind: 'fund_mandatory' }` criterion with `{ kind: 'min_needs', value: <Σ that seed's monthly.mandatory amounts> }`. Read each seed's `mandatory` array and sum the amounts to get the value (e.g. the Saving-for-a-Car seed: Rent 1100 + Insurance 120 + Phone 60 = `value: 1280`). Keep the `min_savings_rate` and `zero_unallocated` entries and their order.
- [ ] **Step 2:** Rewrite each seed's `prompt` to (a) state the monthly income, (b) name the essentials and their total (matching the mandatory list), and (c) instruct "Build your whole budget — create a bucket for every dollar — and save at least N%." Remove any wording implying bills are pre-filled/locked. Keep each `reflection` question.
- [ ] **Step 3: Run the library integrity test** — `npx playwright test tests/unit/challenge.spec.ts` → the existing "every library challenge's referenceSolution passes" test must still be GREEN for all 4 seeds (this proves each is still machine-solvable under `min_needs`). Zero errors.
- [ ] **Step 4: Commit** — `git add lib/challenges/library.ts && git commit -m "feat(challenges): seeds use min_needs + rebuilt prompts (build-it-yourself framing)"`

## Task 3: Live solver page rewrite

**Files:**
- Rewrite: `app/challenge/[assignmentId]/page.tsx`

**Interfaces:**
- Consumes: `evaluateChallenge`, `allocatedDollars`, `resolveBoxDollars`, `clampAmount`, `essentialsFloor`, types `AllocationBox`/`BoxRole`/`Allocation` from `@/lib/challenges/challenge`. Do NOT import `seedBoxes` (removed).

- [ ] **Step 1: Remove seeding + locked boxes.** Delete the `seedBoxes` import and the `useEffect` that calls `setBoxes(seedBoxes(ch))`; initialize `const [boxes, setBoxes] = useState<AllocationBox[]>([])` (empty start). Delete the locked-box render branch (`box.mandatoryId` → "Required bill · locked") and the separate `AddBoxForm` draft component.

- [ ] **Step 2: Derive everything live** (computed each render from `boxes`):

```ts
const income = ch.monthly?.income ?? 0
const floor = essentialsFloor(ch)
const savingsTarget = ch.criteria.find((c) => c.kind === 'min_savings_rate')?.value ?? 0
const result = evaluateChallenge(ch, { boxes })
const allocated = allocatedDollars({ boxes }, income)
const unallocated = income - allocated
const needsTotal = boxes.filter((b) => b.role === 'need').reduce((s, b) => s + resolveBoxDollars(b, income), 0)
const savedTotal = boxes.filter((b) => b.role === 'save').reduce((s, b) => s + resolveBoxDollars(b, income), 0)
const savingsPct = income > 0 ? (savedTotal / income) * 100 : 0
```

- [ ] **Step 3: Sticky live budget summary** — a bar under the header showing: `Income {money(income)}` · `Allocated {money(allocated)}` · `Unallocated {money(unallocated)}` (class `text-brandGreen` when `Math.abs(unallocated) <= 0.01`, else amber `text-[#9c7d1f]`) · `Save {savingsPct.toFixed(0)}% / {savingsTarget}%` · `Needs {money(needsTotal)} / {money(floor)}`. Use `tabular-nums`. Every value is derived (Step 2), so it updates on every keystroke.

- [ ] **Step 4: Live editable bucket rows + inline-live add.** Render `boxes.map` as editable rows (reuse/adapt the existing `BoxRow`): name input (placeholder "What's this for? e.g. Rent, Groceries, Savings"), Need/Want/Save toggle, `$ fixed / % of income` toggle, amount input, and — when `box.targetMode === 'percent'` — a live `= {money(resolveBoxDollars(box, income))}` readout beside the amount. Delete (🗑) per row. Empty state when `boxes.length === 0`: a muted line "Add your first bucket — give every dollar a job." Add button:

```ts
const addBox = () =>
  setBoxes((b) => [...b, { id: newId(), name: '', role: 'need' as BoxRole, targetMode: 'fixed', targetValue: 0 }])
const updateBox = (id: string, patch: Partial<AllocationBox>) =>
  setBoxes((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
const deleteBox = (id: string) => setBoxes((b) => b.filter((x) => x.id !== id))
```

`+ Add a bucket` calls `addBox()` — it inserts a REAL box into state (immediately live), then the row's name input autofocuses. All amount edits go through `clampAmount(parseFloat(v) || 0, mode, income)` (as today). No fill-then-click draft.

- [ ] **Step 5: Live checklist** — keep the `result.perCriterion.map` list (✓/✗ + `c.detail`) and the progress bar `width: ${result.score * 100}%`, labeled "Preview — your grade is set when you submit." It already reflects the new `min_needs` detail.

- [ ] **Step 6: Post-submit honesty.** Add `const [submittedSnapshot, setSubmittedSnapshot] = useState<string | null>(null)`. On a successful submit, `setSubmittedSnapshot(JSON.stringify(boxes))`. Compute `const dirtySinceSubmit = submittedSnapshot !== null && JSON.stringify(boxes) !== submittedSnapshot`. When `dirtySinceSubmit`, render a banner above the submitted result: *"You've changed your budget since submitting — resubmit to update your grade."* and keep the Submit button enabled (label it "Resubmit" when `submittedSnapshot !== null`). The submitted result panel still shows the last server score but is clearly subordinate to the banner when dirty.

- [ ] **Step 7: Build + full test.** Check `pgrep -f "next dev"` (kill if present), then `npm run build` → zero errors (this also clears Task 1's deferred build gate), then `npx playwright test` → all green (solver not snapshotted; 21 visual + unit specs pass). If a `sections.spec` desktop test flakes under contention, re-run that single test to confirm.
- [ ] **Step 8: Commit** — `git add "app/challenge/[assignmentId]/page.tsx" && git commit -m "feat(challenges): live build-your-own-budget solver (no seeded boxes, %→$, resubmit banner)"`

## Task 4: Ripple verification (submit / teacher / grades)

**Files:**
- Verify (patch only if broken): `app/api/challenge/submit/route.ts`, `app/dashboard/content/challenges/page.tsx`, `app/grades/page.tsx`

- [ ] **Step 1:** Read `app/api/challenge/submit/route.ts` and confirm it scores purely from submitted boxes via `evaluateChallenge(ch, allocation)` with `ch` loaded from the library (so it now uses `min_needs`). It sanitizes `mandatoryId` off client boxes harmlessly — no dependence on seeded boxes. No change expected; if it references `seedBoxes`/`fund_mandatory`, fix it.
- [ ] **Step 2:** Grep for any remaining references to the removed/renamed symbols: `grep -rn "seedBoxes\|fund_mandatory" app lib` → expect ONLY the retained optional `mandatoryId` field mentions (none of `seedBoxes`/`fund_mandatory`). Fix any stragglers.
- [ ] **Step 3:** Confirm teacher review (`app/dashboard/content/challenges/page.tsx` `StudentRow`) and grades (`app/grades/page.tsx`) render `perCriterion[].detail` + allocation generically (they do — string display), so `min_needs` details show correctly and old stored `fund_mandatory` strings still render.
- [ ] **Step 4:** `npm run build` → zero errors; `npx playwright test` → all green.
- [ ] **Step 5: Commit** (only if Steps 1–3 required a code change; otherwise skip) — `git add <changed> && git commit -m "fix(challenges): ripple cleanup for min_needs grading"`

---

## Self-Review (author checklist — done)

- **Spec coverage:** grading model → Task 1; seeds/prompts → Task 2; live summary + live rows + inline-live add + %→$ + post-submit banner → Task 3; submit/teacher/grades ripple → Task 4; no-migration/back-compat honored (mandatoryId field kept, stored strings render).
- **Placeholder scan:** pure-lib code + tests given in full; UI task gives derived formulas + state actions + interaction rules in code; per-seed `min_needs` value is "Σ that seed's mandatory" (implementer computes from the seed it's editing — exact per-seed amounts live in the file).
- **Type consistency:** `min_needs`, `essentialsFloor`, `referenceSolution`, `addBox/updateBox/deleteBox`, `submittedSnapshot`/`dirtySinceSubmit` used consistently across tasks; `seedBoxes` removed everywhere it was referenced (challenge.ts, solver, tests).
