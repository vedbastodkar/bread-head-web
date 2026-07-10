# Budget Challenge Solver Redesign — Design

**Date:** 2026-07-10
**Status:** Approved for planning
**Surface:** `app/challenge/[assignmentId]/page.tsx` (student solve screen) + `lib/challenges/*`

## Problem

The student solve screen pre-seeds **locked bill boxes** (Rent/Insurance/Phone) via
`seedBoxes()` and grades on `zero_unallocated`, `fund_mandatory` (matches a box to a
bill by a hidden `mandatoryId`), and `min_savings_rate`. So the student only fills the
*leftover* — the essentials are pre-made and locked. It reads as "do the tasks," not a
budgeting challenge.

Feedback is also weak: the **Add-box form is a fill-then-click draft** (nothing moves
until "Add box"), a `%` amount never shows its dollar value while typing, and the
**"Submitted" result panel is a frozen snapshot** that goes stale the moment the student
keeps editing (looks broken).

## Goals

1. The student **builds every bucket themselves** — no pre-seeded/locked boxes.
2. Grade on **budgeting principles**, not exact bill names (the student can't "fail" for
   naming a bucket differently).
3. Everything is **live**: the running budget summary and the pass/fail checklist update
   on every keystroke; `%` amounts show their dollar value live.
4. Each bucket **names what it's for**.
5. The post-submit state is honest (no frozen-stale panel).

## Non-goals

- No change to the assignment/fan-out system, teacher composer, or Firestore model.
- Server scoring stays authoritative (`/api/challenge/submit`) — client checklist is a preview.
- No new challenge *kinds* (still `monthly`).

## Grading model (principle-based)

Three criteria, all computed from the student's own buckets:

- **`zero_unallocated`** (unchanged): every dollar has a job — `income - allocated ≈ 0`.
- **`min_savings_rate`** (unchanged): sum of `role==='save'` buckets / income ≥ target %.
- **`min_needs`** (NEW, replaces `fund_mandatory`): sum of `role==='need'` buckets ≥ the
  **essentials floor**. Detail string: `Essentials $X of $Y` (pass) / `Essentials underfunded — $X of $Y` (fail).

The **essentials floor** = the sum of the challenge's existing `monthly.mandatory` amounts.
The `mandatory` list is retained purely as (a) prose in the prompt ("essentials run ~$1,280:
rent, insurance, phone") and (b) the floor value. It no longer produces boxes.

## Data-model changes (`lib/challenges/challenge.ts`)

- `Criterion.kind` union: replace `'fund_mandatory'` with `'min_needs'`. Keep
  `value?: number` (now also carries the needs floor for `min_needs`).
- `evalCriterion`: implement `min_needs` — `needsTotal = Σ resolveBoxDollars(need boxes)`,
  `passed = needsTotal + EPS ≥ value`, detail as above. Remove the `fund_mandatory` branch.
- `AllocationBox.mandatoryId` — no longer set anywhere; keep the optional field for
  backward-compat with already-stored submissions (harmless), but nothing writes it.
- `seedBoxes(ch)` — **removed** (student starts with zero boxes). Update its two callers.
- `referenceSolution(ch)` — rebuild without `seedBoxes`: one `need` bucket = essentials
  floor, one `save` bucket = required savings, one `want` bucket = remainder. Keeps the
  library integrity test (a machine-solvable reference) valid.
- `validateChallenge(ch)` — unchanged in spirit (floor + required savings ≤ income); read
  the floor from the `min_needs` criterion value (or Σ mandatory, kept equal).
- Add helper `essentialsFloor(ch): number` = Σ `monthly.mandatory` amounts (single source
  of truth; seeds set the `min_needs` criterion `value` to this).

## Seeds (`lib/challenges/library.ts`)

- Each seed keeps `monthly.mandatory` (the essentials) and sets criteria to
  `[{ kind: 'min_needs', value: <Σ mandatory> }, { kind: 'min_savings_rate', value: N }, { kind: 'zero_unallocated' }]`.
- Rewrite each `prompt` to state income + essentials total (naming the essentials) + "build
  your whole budget and save at least N%." Remove any wording implying bills are pre-filled.
- The integrity test (`referenceSolution` passes all criteria) must still hold for every seed.

## Solver page redesign (`app/challenge/[assignmentId]/page.tsx`)

Layout top→bottom (all values live, driven by `boxes` state → derived each render):

1. **Header** — title, prompt, `← Back to dashboard`, and the income chip.
2. **Live budget summary (sticky)** — Income · Allocated · **Unallocated** (green at 0,
   amber otherwise) · Savings `X%/target%` · Needs `$X/$floor`. Recomputes every render.
3. **Your buckets** — a list of **live editable rows**, starting **empty** with an
   empty-state line ("Add your first bucket — rent, groceries, savings…"). Each row:
   - **name** input ("What's this for?" placeholder),
   - **Need / Want / Save** toggle,
   - **$ fixed / % of income** toggle,
   - **amount** input, and — for `%` — a live **`= $NNN`** readout,
   - delete (🗑).
   Editing any field updates state → summary + checklist immediately.
4. **Add a bucket** — **inserts a new blank editable row directly into the list and focuses
   its name** (NOT a fill-then-click draft form). The new row is a real box in state, so the
   summary/checklist reflect it live as the student types. `clampAmount` still guards inputs.
5. **Live checklist** — the three criteria with ✓/✗ + encouraging detail; a progress bar =
   fraction passed. Labeled "Preview — your grade is set when you submit."
6. **Reflection** — unchanged (optional textarea).
7. **Submit + result** — on submit, the server-scored panel shows. **Post-submit honesty:**
   keep the last submitted allocation; if the student edits afterward, show a banner
   *"You've changed your budget since submitting — resubmit to update your grade,"* keep the
   Submit button enabled, and do **not** present the stale panel as current. Implement by
   comparing a serialized snapshot of the submitted `boxes` to the current `boxes`.

Remove: the locked-box rendering branch, the `seedBoxes` seeding `useEffect`, and the
separate `AddBoxForm` draft component (folded into the inline live row).

## Ripple

- **`/api/challenge/submit`** — already server-authoritative and sanitizes boxes; it must
  no longer assume any seeded/mandatory boxes. Confirm it scores purely from submitted
  boxes via `evaluateChallenge` (it does). No `mandatoryId` dependence.
- **Teacher review** (`app/dashboard/content/challenges/page.tsx` `ChallengeCard`/`StudentRow`)
  and **student grades** (`app/grades/page.tsx`) render `perCriterion` detail strings +
  allocation — still work; only the `min_needs` detail text is new.
- **Unit tests** (`tests/unit/challenge.spec.ts`) — update `fund_mandatory`→`min_needs`
  cases, `seedBoxes` removal, `referenceSolution` shape; add `min_needs` pass/fail +
  `%`-dollar-resolution cases. `budget.spec.ts` unaffected.

## Testing

- `npm run build` zero errors + `npx playwright test` all green before each commit (the
  student solver isn't in the 21 visual snapshots, so no snapshot churn expected).
- Unit tests cover the new `min_needs` criterion and updated `referenceSolution`.
- Manual (live): build a full budget; watch Unallocated + Savings% + Needs update live as
  you type and toggle `$`/`%`; submit; edit after submit → resubmit banner appears.

## Open items / risks

- **Back-compat:** already-stored submissions carry `mandatoryId` boxes + `fund_mandatory`
  perCriterion strings. Teacher/grades read stored detail strings, so old submissions still
  render fine; only newly-scored ones use `min_needs`. No migration needed.
- **Empty start:** with zero seeded boxes, all three criteria fail initially (0 needs, 0
  savings, full unallocated) — intended; the checklist guides the student from empty.
