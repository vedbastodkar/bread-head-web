# Budget Challenge — MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the end-to-end graded **Budget Challenge** loop (teacher assigns a library challenge → student solves it by *allocation* in an isolated sandbox → server auto-scores → both see the per-criterion result in an in-app gradebook), while establishing a **clear, named separation** between the personal **My Budget** tool and assigned **Budget Challenges**.

**Architecture:** A challenge is a pure, code-defined template evaluated by shared firebase-free logic (client live-preview + server authoritative recompute — the client score is never trusted). Students solve on a **dedicated allocation screen** (`/challenge/[assignmentId]`) that is a *sandbox by construction* — it holds boxes/targets in React state and writes **nothing** to Firestore until Submit, and only to the assignment's submission doc. It reuses `lib/budget/budget.ts` math and the Bread Head visual system, but is **not** the `/mybudget` receipt workbench. Real-money privacy is preserved: personal budgets stay in `users/{uid}/…` and are never in a teacher-readable doc; challenge allocations are fake money and therefore fully teacher-visible.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Tailwind, Firebase (client SDK for reads, Admin SDK for the submit route), Playwright (unit + visual). Mirrors existing patterns: `lib/journal/journal.ts` (pure builder), `app/api/journal/submit/route.ts` (admin submit), `app/mybudget/page.tsx` (workbench UX).

## Global Constraints

- **Build gate (CLAUDE.md):** `npm run build` must pass with zero errors AND `npx playwright test` (21 visual snapshots) must pass before any commit/push. After intentional visual changes run `npm run test:update` and commit the new snapshots with the code.
- **Unit tests** live in `tests/unit/*.spec.ts`, import from `@playwright/test`, and are pure (no browser). Run one file with: `npx playwright test tests/unit/<file>.spec.ts --project=desktop`.
- **Privacy invariant #1 — real money is never teacher-visible.** Personal `budget`/`journal` submissions carry metadata only. This MVP touches **only** `challenge` (fake money) submissions, which are safe in full. Do not add any real-money field to a teacher-readable doc.
- **Privacy invariant #2 — sandbox isolation.** A challenge attempt MUST NOT read or write `users/{uid}/categories` or `users/{uid}/budget`. It seeds from the challenge and persists only on Submit to `classes/{cid}/assignments/{aid}/submissions/{uid}`.
- **Server recomputes.** `/api/challenge/submit` ignores any client-supplied score and recomputes via `evaluateChallenge`. The stored `score`/`allPassed` are always server-authoritative.
- **challengeId namespacing.** Every `challengeId` is `lib:<slug>` (code) or `custom:<docId>` (Firestore). **MVP supports `lib:` only**; `custom:` resolution/authoring is Phase 2.
- **Naming (locked decision).** Two named surfaces. Personal tool is always labelled **"My Budget"**; assigned scenarios are always labelled **"Budget Challenge"**. Never label a challenge "budget" or vice-versa in student-facing copy.
- **Bread Head design system:** bgSage `#E6EDD9`, brandGreen `#4A5D4A`, accentGold `#D1A945`, ink `#1A2E1A`; Playfair italic display on `h1/h2`, DM Sans body. `prefers-reduced-motion` disables non-essential animation.

---

## File structure

**New files**
- `lib/challenges/challenge.ts` — pure types + math: `Challenge`, `Allocation`, `AllocationBox`, `evaluateChallenge`, `validateChallenge`, `seedBoxes`, `referenceSolution`, `buildChallengeSubmission`. Firebase-free, unit-tested.
- `lib/challenges/library.ts` — `LIBRARY: Challenge[]` (~4 seeds) + `getLibraryChallenge(slug)`.
- `tests/unit/challenge.spec.ts` — evaluator/validator/builder/library-integrity tests.
- `app/api/challenge/submit/route.ts` — Node runtime admin submit (roster gate → resolve challenge → server `evaluateChallenge` → write submission).
- `app/challenge/[assignmentId]/page.tsx` — dedicated allocation solve screen (sandbox).
- `app/grades/page.tsx` — student gradebook.
- `app/dashboard/[classId]/challenges/page.tsx` — teacher challenge review (per-student score + allocation + per-criterion).

**Modified files**
- `app/student/StudentShell.tsx` — add **My Budget** and **Grades** menu items.
- `app/student/useStudent.ts` — extend `StudentAssignment.type` with `'challenge'` + add `challengeId?`.
- `app/dashboard/useDashboard.ts` — extend `Assignment.type` + submission shape for challenges.
- `app/dashboard/StudentHome.tsx` — render `challenge` to-dos with a distinct **Budget Challenge** CTA → `/challenge/[id]`.
- `app/dashboard/[classId]/course/page.tsx` — add a **Budget Challenge** assign option (library picker).
- `app/api/classes/[classId]/assign/route.ts` — accept `type:'challenge'` + validated `challengeId`.
- `app/dashboard/DashboardShell.tsx` — add **Challenges** entry to the class-nav CONTENT group.

**Note on infra reality (verified in code):**
- The teacher class-nav **already exists** (`DashboardShell.tsx:94-115`, CONTENT/PERFORMANCE/CLASSROOM). We *add* an entry, we do not build a nav.
- The submissions Firestore path is **already rules-gated** (`~/Developer/breadhead/firestore.rules:78-82`: student+teacher read, `write:false` → admin SDK only). No new rule needed for challenge submissions. (Custom-challenge storage rules are Phase 2.)

---

## Resolved logic decisions (baked into Task 2 — these close spec gaps G1/G2)

- **Box role tagging (closes G1).** `AllocationBox` carries `role: 'need'|'want'|'save'`. This is what `min_savings_rate` reads — `BudgetCategory` has no nws field, so the challenge model defines its own. Savings rate = Σ dollars of `role==='save'` boxes ÷ income.
- **Mandatory funding (closes G2).** Each `monthly.mandatory[]` bill is seeded as a **locked** box (`mandatoryId` set, `role:'need'`, `targetMode:'fixed'`, `targetValue = amount`). `fund_mandatory` passes when, for every bill, the sum of boxes with that `mandatoryId` ≥ the bill amount.
- **Criteria supported in MVP:** `zero_unallocated`, `fund_mandatory`, `min_savings_rate`. **`no_overspend` is dropped** from Type A — it is a *spending* check and a challenge has no transactions. (It belongs to Type B / a future spending variant.)
- **Completion vs score.** Completion (`status`) = `allPassed` (all criteria pass). `score` = `passedCount / total`, shown as an informational checklist, not a weighted grade.

---

## PHASE 1 — MVP (detailed tasks below)

### Task 1: Name the two surfaces — add "My Budget" to the student menu

Fixes the `/mybudget` orphan and establishes the personal surface by name. (Grades menu item is added with its page in Task 9 to avoid a dead link.)

**Files:**
- Modify: `app/student/StudentShell.tsx:52-58`

**Interfaces:**
- Consumes: existing `navItem(href, label)` helper (`StudentShell.tsx:23-30`).
- Produces: nothing consumed by later tasks (pure nav change).

- [ ] **Step 1: Add the My Budget nav item.** In the menu list (currently Dashboard · Course · Journal · Account), insert a My Budget entry before Account:

```tsx
{navItem('/dashboard', 'Dashboard')}
{navItem('/dashboard/course', 'Course')}
{navItem('/dashboard/journal', 'Journal')}
{navItem('/mybudget', 'My Budget')}
{navItem('/account', 'Account')}
```

- [ ] **Step 2: Verify build.** Run: `npm run build` — Expected: compiles, zero errors.

- [ ] **Step 3: Regenerate + verify snapshots** (the student shell appears in visual tests). Run: `npm run test:update` then `npx playwright test`. Expected: all pass. Review the diff of changed snapshots to confirm only the added menu item changed.

- [ ] **Step 4: Commit.**

```bash
git add app/student/StudentShell.tsx tests/snapshots
git commit -m "feat(nav): add My Budget to student menu (fix orphaned route)"
```

---

### Task 2: Challenge pure logic + types (`lib/challenges/challenge.ts`)

Firebase-free, fully unit-tested. This is the shared engine for the client preview and the server score.

**Files:**
- Create: `lib/challenges/challenge.ts`
- Test: `tests/unit/challenge.spec.ts`

**Interfaces:**
- Consumes: nothing (pure).
- Produces (relied on by Tasks 3, 5, 6, 7, 9, 10):
  - Types `Challenge`, `Criterion`, `AllocationBox`, `Allocation`, `ChallengeResult`, `ChallengeSubmissionMeta`.
  - `resolveBoxDollars(box: AllocationBox, income: number): number`
  - `allocatedDollars(alloc: Allocation, income: number): number`
  - `evaluateChallenge(ch: Challenge, alloc: Allocation): ChallengeResult` → `{ perCriterion: {kind,passed,detail}[]; allPassed: boolean; score: number }`
  - `validateChallenge(ch: Challenge): { ok: boolean; error?: string }`
  - `seedBoxes(ch: Challenge): AllocationBox[]` (locked mandatory boxes)
  - `referenceSolution(ch: Challenge): Allocation` (a known-passing allocation)
  - `buildChallengeSubmission(input, ch): ChallengeSubmissionMeta` (defined in Task 4)

- [ ] **Step 1: Write the failing tests.** Create `tests/unit/challenge.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import {
  resolveBoxDollars, allocatedDollars, evaluateChallenge, validateChallenge,
  seedBoxes, referenceSolution,
  type Challenge, type Allocation, type AllocationBox,
} from '../../lib/challenges/challenge'

const CH: Challenge = {
  id: 'lib:starter',
  kind: 'monthly',
  title: 'First Paycheck',
  prompt: 'You earn $2000/mo. Cover rent and phone, save at least 15%.',
  tags: { focus: ['saving'], context: ['first-job'], difficulty: 1 },
  monthly: { income: 2000, mandatory: [
    { id: 'rent', name: 'Rent', amount: 1000 },
    { id: 'phone', name: 'Phone', amount: 50 },
  ] },
  criteria: [
    { kind: 'fund_mandatory' },
    { kind: 'min_savings_rate', value: 15 },
    { kind: 'zero_unallocated' },
  ],
  source: 'library',
}

test('resolveBoxDollars handles fixed and percent', () => {
  expect(resolveBoxDollars({ id:'a', name:'A', role:'need', targetMode:'fixed', targetValue:1000 }, 2000)).toBe(1000)
  expect(resolveBoxDollars({ id:'b', name:'B', role:'save', targetMode:'percent', targetValue:15 }, 2000)).toBe(300)
})

test('seedBoxes produces one locked box per mandatory bill', () => {
  const seeded = seedBoxes(CH)
  expect(seeded).toHaveLength(2)
  expect(seeded[0]).toMatchObject({ mandatoryId: 'rent', role: 'need', targetMode: 'fixed', targetValue: 1000 })
})

test('evaluateChallenge: a correct allocation passes every criterion', () => {
  const alloc: Allocation = { boxes: [
    { id:'1', name:'Rent', role:'need', mandatoryId:'rent', targetMode:'fixed', targetValue:1000 },
    { id:'2', name:'Phone', role:'need', mandatoryId:'phone', targetMode:'fixed', targetValue:50 },
    { id:'3', name:'Savings', role:'save', targetMode:'fixed', targetValue:300 },
    { id:'4', name:'Spending', role:'want', targetMode:'fixed', targetValue:650 },
  ] }
  const r = evaluateChallenge(CH, alloc)
  expect(r.allPassed).toBe(true)
  expect(r.score).toBe(1)
})

test('evaluateChallenge: under-saving fails only min_savings_rate', () => {
  const alloc: Allocation = { boxes: [
    { id:'1', name:'Rent', role:'need', mandatoryId:'rent', targetMode:'fixed', targetValue:1000 },
    { id:'2', name:'Phone', role:'need', mandatoryId:'phone', targetMode:'fixed', targetValue:50 },
    { id:'3', name:'Savings', role:'save', targetMode:'fixed', targetValue:100 },
    { id:'4', name:'Spending', role:'want', targetMode:'fixed', targetValue:850 },
  ] }
  const r = evaluateChallenge(CH, alloc)
  expect(r.allPassed).toBe(false)
  expect(r.perCriterion.find(c => c.kind === 'min_savings_rate')!.passed).toBe(false)
  expect(r.perCriterion.find(c => c.kind === 'zero_unallocated')!.passed).toBe(true)
})

test('evaluateChallenge: leftover money fails zero_unallocated', () => {
  const alloc: Allocation = { boxes: [
    { id:'1', name:'Rent', role:'need', mandatoryId:'rent', targetMode:'fixed', targetValue:1000 },
    { id:'2', name:'Phone', role:'need', mandatoryId:'phone', targetMode:'fixed', targetValue:50 },
    { id:'3', name:'Savings', role:'save', targetMode:'fixed', targetValue:300 },
  ] }
  const r = evaluateChallenge(CH, alloc)
  expect(r.perCriterion.find(c => c.kind === 'zero_unallocated')!.passed).toBe(false)
})

test('referenceSolution always passes its own challenge', () => {
  expect(evaluateChallenge(CH, referenceSolution(CH)).allPassed).toBe(true)
})

test('validateChallenge rejects unsolvable params', () => {
  expect(validateChallenge(CH).ok).toBe(true)
  const bad = { ...CH, monthly: { income: 1000, mandatory: [{ id:'rent', name:'Rent', amount: 1200 }] } }
  expect(validateChallenge(bad as Challenge).ok).toBe(false)
})
```

- [ ] **Step 2: Run tests to verify they fail.** Run: `npx playwright test tests/unit/challenge.spec.ts --project=desktop` — Expected: FAIL (module not found).

- [ ] **Step 3: Implement `lib/challenges/challenge.ts`:**

```ts
// Pure challenge logic — NO firebase import (unit-testable, mirrors lib/budget/budget.ts).
// Shared by the client live-preview and the server's authoritative score.

export type BoxRole = 'need' | 'want' | 'save'
export type ChallengeKind = 'monthly' | 'longterm'

export interface MandatoryBill { id: string; name: string; amount: number }

export interface Criterion {
  kind: 'zero_unallocated' | 'fund_mandatory' | 'min_savings_rate'
  value?: number // percent, for min_savings_rate
}

export interface MonthlyParams { income: number; mandatory: MandatoryBill[] }

export interface Challenge {
  id: string // 'lib:<slug>' | 'custom:<docId>'
  kind: ChallengeKind
  title: string
  prompt: string
  tags: { focus: string[]; context: string[]; difficulty: 1 | 2 | 3 }
  monthly?: MonthlyParams
  criteria: Criterion[]
  reflection?: string
  source: 'library' | 'custom'
}

export interface AllocationBox {
  id: string
  name: string
  role: BoxRole
  mandatoryId?: string // set when this box funds a seeded mandatory bill
  targetMode: 'fixed' | 'percent'
  targetValue: number
}

export interface Allocation { boxes: AllocationBox[] }

export interface CriterionResult { kind: Criterion['kind']; passed: boolean; detail: string }
export interface ChallengeResult { perCriterion: CriterionResult[]; allPassed: boolean; score: number }

const EPS = 0.01

export function resolveBoxDollars(box: AllocationBox, income: number): number {
  return box.targetMode === 'fixed' ? box.targetValue : income * (box.targetValue / 100)
}

export function allocatedDollars(alloc: Allocation, income: number): number {
  return alloc.boxes.reduce((s, b) => s + resolveBoxDollars(b, income), 0)
}

function evalCriterion(c: Criterion, ch: Challenge, alloc: Allocation): CriterionResult {
  const income = ch.monthly?.income ?? 0
  if (c.kind === 'zero_unallocated') {
    const left = income - allocatedDollars(alloc, income)
    return { kind: c.kind, passed: Math.abs(left) <= EPS, detail: `$${left.toFixed(2)} unallocated` }
  }
  if (c.kind === 'fund_mandatory') {
    const bills = ch.monthly?.mandatory ?? []
    const unfunded = bills.filter((bill) => {
      const funded = alloc.boxes
        .filter((b) => b.mandatoryId === bill.id)
        .reduce((s, b) => s + resolveBoxDollars(b, income), 0)
      return funded + EPS < bill.amount
    })
    return {
      kind: c.kind,
      passed: unfunded.length === 0,
      detail: unfunded.length ? `Underfunded: ${unfunded.map((b) => b.name).join(', ')}` : 'All bills funded',
    }
  }
  // min_savings_rate
  const v = c.value ?? 0
  const saved = alloc.boxes.filter((b) => b.role === 'save').reduce((s, b) => s + resolveBoxDollars(b, income), 0)
  const rate = income > 0 ? (saved / income) * 100 : 0
  return { kind: c.kind, passed: rate + EPS >= v, detail: `Savings ${rate.toFixed(0)}% (need ${v}%)` }
}

export function evaluateChallenge(ch: Challenge, alloc: Allocation): ChallengeResult {
  const perCriterion = ch.criteria.map((c) => evalCriterion(c, ch, alloc))
  const allPassed = perCriterion.every((r) => r.passed)
  const score = perCriterion.length ? perCriterion.filter((r) => r.passed).length / perCriterion.length : 0
  return { perCriterion, allPassed, score }
}

// One locked box per mandatory bill (student cannot delete/reduce these in the UI).
export function seedBoxes(ch: Challenge): AllocationBox[] {
  return (ch.monthly?.mandatory ?? []).map((m, i) => ({
    id: `seed-${m.id}`,
    name: m.name,
    role: 'need' as BoxRole,
    mandatoryId: m.id,
    targetMode: 'fixed' as const,
    targetValue: m.amount,
  }))
}

// A known-passing allocation: mandatory boxes + exact savings + flex box absorbing the remainder.
export function referenceSolution(ch: Challenge): Allocation {
  const income = ch.monthly?.income ?? 0
  const boxes = seedBoxes(ch)
  const sr = ch.criteria.find((c) => c.kind === 'min_savings_rate')?.value ?? 0
  const savings = income * (sr / 100)
  if (savings > 0) boxes.push({ id: 'ref-save', name: 'Savings', role: 'save', targetMode: 'fixed', targetValue: savings })
  const remainder = income - boxes.reduce((s, b) => s + b.targetValue, 0)
  if (remainder > EPS) boxes.push({ id: 'ref-flex', name: 'Spending', role: 'want', targetMode: 'fixed', targetValue: remainder })
  return { boxes }
}

// Solvability: mandatory + required savings must fit inside income.
export function validateChallenge(ch: Challenge): { ok: boolean; error?: string } {
  if (ch.kind !== 'monthly') return { ok: false, error: 'Only monthly challenges are supported in v1.' }
  const m = ch.monthly
  if (!m || !(m.income > 0)) return { ok: false, error: 'Income must be greater than 0.' }
  const mandatory = (m.mandatory ?? []).reduce((s, b) => s + b.amount, 0)
  const sr = ch.criteria.find((c) => c.kind === 'min_savings_rate')?.value ?? 0
  const need = mandatory + m.income * (sr / 100)
  if (need > m.income + EPS) return { ok: false, error: 'Mandatory bills plus required savings exceed income.' }
  return { ok: true }
}
```

- [ ] **Step 4: Run tests to verify they pass.** Run: `npx playwright test tests/unit/challenge.spec.ts --project=desktop` — Expected: all PASS.

- [ ] **Step 5: Commit.**

```bash
git add lib/challenges/challenge.ts tests/unit/challenge.spec.ts
git commit -m "feat(challenges): pure allocation-scoring engine (TDD)"
```

---

### Task 3: Seed library + integrity test (`lib/challenges/library.ts`)

**Files:**
- Create: `lib/challenges/library.ts`
- Modify: `tests/unit/challenge.spec.ts` (append library-integrity test)

**Interfaces:**
- Consumes: `Challenge`, `validateChallenge`, `evaluateChallenge`, `referenceSolution` from Task 2.
- Produces: `LIBRARY: Challenge[]`, `getLibraryChallenge(slug: string): Challenge | null`.

- [ ] **Step 1: Write the failing integrity test.** Append to `tests/unit/challenge.spec.ts`:

```ts
import { LIBRARY, getLibraryChallenge } from '../../lib/challenges/library'

test('every library challenge is valid, id-namespaced, and solvable', () => {
  expect(LIBRARY.length).toBeGreaterThanOrEqual(4)
  for (const ch of LIBRARY) {
    expect(ch.id.startsWith('lib:')).toBe(true)
    expect(ch.source).toBe('library')
    expect(validateChallenge(ch).ok).toBe(true)
    expect(evaluateChallenge(ch, referenceSolution(ch)).allPassed).toBe(true)
  }
})

test('getLibraryChallenge resolves by slug and returns null otherwise', () => {
  expect(getLibraryChallenge('lib:first-paycheck')?.title).toBeTruthy()
  expect(getLibraryChallenge('lib:nope')).toBeNull()
})
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx playwright test tests/unit/challenge.spec.ts --project=desktop` — Expected: FAIL (library not found).

- [ ] **Step 3: Implement `lib/challenges/library.ts`** with 4 tagged, solvable seeds:

```ts
import type { Challenge } from './challenge'

export const LIBRARY: Challenge[] = [
  {
    id: 'lib:first-paycheck',
    kind: 'monthly',
    title: 'Your First Paycheck',
    prompt: 'You just landed a part-time job earning $2,000 a month. Cover your rent and phone, and put away at least 15% for savings. Every dollar needs a job.',
    tags: { focus: ['saving'], context: ['first-job'], difficulty: 1 },
    monthly: { income: 2000, mandatory: [
      { id: 'rent', name: 'Rent', amount: 1000 },
      { id: 'phone', name: 'Phone', amount: 50 },
    ] },
    criteria: [{ kind: 'fund_mandatory' }, { kind: 'min_savings_rate', value: 15 }, { kind: 'zero_unallocated' }],
    reflection: 'What did you cut to hit your savings goal?',
    source: 'library',
  },
  {
    id: 'lib:tight-month',
    kind: 'monthly',
    title: 'A Tight Month',
    prompt: 'You make $1,500 this month but rent, utilities, and a bus pass are all due. Fund them all and still save 10%.',
    tags: { focus: ['needs-vs-wants'], context: ['low-income'], difficulty: 2 },
    monthly: { income: 1500, mandatory: [
      { id: 'rent', name: 'Rent', amount: 800 },
      { id: 'utilities', name: 'Utilities', amount: 150 },
      { id: 'transit', name: 'Bus Pass', amount: 70 },
    ] },
    criteria: [{ kind: 'fund_mandatory' }, { kind: 'min_savings_rate', value: 10 }, { kind: 'zero_unallocated' }],
    reflection: 'Which want was hardest to give up?',
    source: 'library',
  },
  {
    id: 'lib:car-goal',
    kind: 'monthly',
    title: 'Saving for a Car',
    prompt: 'You earn $2,800 a month and want a car soon. Cover your bills and save aggressively — at least 25%.',
    tags: { focus: ['saving', 'goals'], context: ['goal'], difficulty: 2 },
    monthly: { income: 2800, mandatory: [
      { id: 'rent', name: 'Rent', amount: 1100 },
      { id: 'insurance', name: 'Insurance', amount: 120 },
      { id: 'phone', name: 'Phone', amount: 60 },
    ] },
    criteria: [{ kind: 'fund_mandatory' }, { kind: 'min_savings_rate', value: 25 }, { kind: 'zero_unallocated' }],
    reflection: 'How long until you can buy the car at this rate?',
    source: 'library',
  },
  {
    id: 'lib:big-earner',
    kind: 'monthly',
    title: 'More Money, More Choices',
    prompt: 'A better job pays $4,000 a month. With more room, keep your needs in check and save at least 20%.',
    tags: { focus: ['lifestyle-creep'], context: ['raise'], difficulty: 3 },
    monthly: { income: 4000, mandatory: [
      { id: 'rent', name: 'Rent', amount: 1500 },
      { id: 'car', name: 'Car Payment', amount: 350 },
      { id: 'phone', name: 'Phone', amount: 70 },
    ] },
    criteria: [{ kind: 'fund_mandatory' }, { kind: 'min_savings_rate', value: 20 }, { kind: 'zero_unallocated' }],
    reflection: 'Did lifestyle creep tempt you to save less?',
    source: 'library',
  },
]

export function getLibraryChallenge(id: string): Challenge | null {
  return LIBRARY.find((c) => c.id === id) ?? null
}
```

- [ ] **Step 4: Run to verify pass.** Run: `npx playwright test tests/unit/challenge.spec.ts --project=desktop` — Expected: all PASS.

- [ ] **Step 5: Commit.**

```bash
git add lib/challenges/library.ts tests/unit/challenge.spec.ts
git commit -m "feat(challenges): seed 4 solvable library challenges + integrity test"
```

---

### Task 4: Submission builder `buildChallengeSubmission` (pure, TDD)

The safe record written to the teacher-readable submission doc. Fake money → the allocation IS included (unlike the budget/journal builders). Score is recomputed here, never taken from the client.

**Files:**
- Modify: `lib/challenges/challenge.ts` (append)
- Modify: `tests/unit/challenge.spec.ts` (append)

**Interfaces:**
- Consumes: `Challenge`, `Allocation`, `evaluateChallenge` from Task 2.
- Produces: `ChallengeSubmissionMeta` and `buildChallengeSubmission(input: { allocation: Allocation; reflection?: unknown }, ch: Challenge): ChallengeSubmissionMeta` — used by Task 6 (API).

- [ ] **Step 1: Write the failing test.** Append to `tests/unit/challenge.spec.ts`:

```ts
import { buildChallengeSubmission } from '../../lib/challenges/challenge'

test('buildChallengeSubmission recomputes score server-side and ignores client score', () => {
  const alloc = referenceSolution(CH)
  // Attacker sends a bogus score; builder must ignore it and recompute.
  const meta = buildChallengeSubmission({ allocation: alloc, reflection: 'ok', score: 0.1 } as any, CH)
  expect(meta.allPassed).toBe(true)
  expect(meta.score).toBe(1)
  expect(meta.status).toBe('complete')
  expect(meta.allocation.boxes.length).toBe(alloc.boxes.length)
  expect(meta.reflection).toBe('ok')
})

test('buildChallengeSubmission marks incomplete when criteria fail', () => {
  const meta = buildChallengeSubmission({ allocation: { boxes: [] } }, CH)
  expect(meta.status).toBe('in_progress')
  expect(meta.allPassed).toBe(false)
})
```

- [ ] **Step 2: Run to verify it fails.** Run: `npx playwright test tests/unit/challenge.spec.ts --project=desktop` — Expected: FAIL.

- [ ] **Step 3: Implement — append to `lib/challenges/challenge.ts`:**

```ts
export interface ChallengeSubmissionMeta {
  allocation: Allocation
  score: number
  allPassed: boolean
  perCriterion: CriterionResult[]
  status: 'complete' | 'in_progress'
  reflection?: string
}

// Build the teacher-readable challenge submission. Score/allPassed are ALWAYS
// recomputed here from the allocation — any client-provided score is ignored.
export function buildChallengeSubmission(
  input: { allocation: Allocation; reflection?: unknown },
  ch: Challenge,
): ChallengeSubmissionMeta {
  const boxes = Array.isArray(input.allocation?.boxes) ? input.allocation.boxes : []
  const allocation: Allocation = { boxes }
  const result = evaluateChallenge(ch, allocation)
  const reflection = typeof input.reflection === 'string' ? input.reflection.slice(0, 2000) : undefined
  return {
    allocation,
    score: result.score,
    allPassed: result.allPassed,
    perCriterion: result.perCriterion,
    status: result.allPassed ? 'complete' : 'in_progress',
    reflection,
  }
}
```

- [ ] **Step 4: Run to verify pass.** Run: `npx playwright test tests/unit/challenge.spec.ts --project=desktop` — Expected: all PASS.

- [ ] **Step 5: Commit.**

```bash
git add lib/challenges/challenge.ts tests/unit/challenge.spec.ts
git commit -m "feat(challenges): server-authoritative submission builder (TDD)"
```

---

### Task 5: Extend assignment types + assign route for `challenge`

**Files:**
- Modify: `app/student/useStudent.ts:19-30` (`StudentAssignment`)
- Modify: `app/dashboard/useDashboard.ts:18-39` (`Assignment` + submission shape)
- Modify: `app/api/classes/[classId]/assign/route.ts:59` (accept `type:'challenge'`)
- Modify: `app/dashboard/[classId]/course/page.tsx` (add a Budget Challenge assign option)

**Interfaces:**
- Consumes: `LIBRARY` from Task 3 (teacher picker), `validateChallenge` (guard).
- Produces: assignment docs with `{ type:'challenge', challengeId:'lib:<slug>', title, dueDate, scope, studentUids }` consumed by Tasks 6–10.

- [ ] **Step 1: Extend the student assignment type.** In `app/student/useStudent.ts`, update the discriminator and add the field:

```ts
  type?: 'lesson' | 'journal' | 'challenge'
  challengeId?: string
```

- [ ] **Step 2: Extend the teacher assignment type.** In `app/dashboard/useDashboard.ts`, update `type` identically and extend the submission record to carry challenge fields:

```ts
  type?: 'lesson' | 'journal' | 'challenge'
  challengeId?: string
  submissions?: Record<string, {
    status: 'complete' | 'in_progress'
    submittedAt: string | null
    wordCount?: number
    secondsSpent?: number
    completedLessonIds?: string[]
    score?: number           // challenge
    allPassed?: boolean      // challenge
  }>
```

- [ ] **Step 3: Accept `challenge` in the assign route.** In `app/api/classes/[classId]/assign/route.ts`, extend the type parse (currently `body.type === 'journal' ? 'journal' : 'lesson'`) and validate the challengeId against the library:

```ts
import { getLibraryChallenge } from '@/lib/challenges/library'
import { validateChallenge } from '@/lib/challenges/challenge'
// ...
const type = body.type === 'journal' ? 'journal' : body.type === 'challenge' ? 'challenge' : 'lesson'
// ...
if (type === 'challenge') {
  const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
  const ch = challengeId.startsWith('lib:') ? getLibraryChallenge(challengeId) : null
  if (!ch) return NextResponse.json({ error: 'Unknown or unsupported challengeId' }, { status: 400 })
  const v = validateChallenge(ch)
  if (!v.ok) return NextResponse.json({ error: `Challenge is not solvable: ${v.error}` }, { status: 400 })
  const doc = {
    type, challengeId, title: title ?? ch.title, scope, studentUids,
    dueDate, lessonIds: [], createdAt: FieldValue.serverTimestamp(),
  }
  // ...write to classes/{classId}/assignments (mirror the journal branch's write)
}
```

(Match the file's existing `scope`/`studentUids`/`dueDate`/write helpers exactly — copy the journal branch and swap the payload.)

- [ ] **Step 4: Add the teacher assign UI option.** In `app/dashboard/[classId]/course/page.tsx`, add a third `assignType` button `'challenge'` alongside lesson/journal (line ~373-378). When selected, render a `<select>` of `LIBRARY` (label = `title`, value = `id`) bound to a `challengeId` state, and POST `{ type:'challenge', challengeId, scope, studentUids, dueDate, title }` to the existing assign endpoint. Show each challenge's `prompt` under the picker so the teacher sees what students get.

- [ ] **Step 5: Verify build.** Run: `npm run build` — Expected: zero errors.

- [ ] **Step 6: Manual smoke.** Run `npm run dev`, open a class's Course page, assign a Budget Challenge to the class, confirm a doc appears under `classes/{cid}/assignments` with `type:'challenge'` and the right `challengeId` (check Firestore console or a temporary log).

- [ ] **Step 7: Commit.**

```bash
git add app/student/useStudent.ts app/dashboard/useDashboard.ts app/api/classes/[classId]/assign/route.ts app/dashboard/[classId]/course/page.tsx
git commit -m "feat(challenges): assignable Budget Challenge type + library picker"
```

---

### Task 6: `/api/challenge/submit` — server auto-score route

**Files:**
- Create: `app/api/challenge/submit/route.ts`

**Interfaces:**
- Consumes: `getLibraryChallenge` (Task 3), `buildChallengeSubmission` (Task 4); mirrors `app/api/journal/submit/route.ts` (verifyUser, roster gate, admin write).
- Produces: submission doc at `classes/{cid}/assignments/{aid}/submissions/{uid}` = `{ ...ChallengeSubmissionMeta, submittedAt }`.

- [ ] **Step 1: Implement the route** (mirror `journal/submit` structure — same `verifyUser`, roster read, admin `db`):

```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyUser } from '@/lib/firebase/admin' // use whatever journal/submit imports
import { adminDb } from '@/lib/firebase/admin'      // match journal/submit's exact imports
import { FieldValue } from 'firebase-admin/firestore'
import { getLibraryChallenge } from '@/lib/challenges/library'
import { buildChallengeSubmission, type Allocation } from '@/lib/challenges/challenge'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const auth = await verifyUser(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { uid } = auth

  const body = await req.json().catch(() => ({}))
  const classId = String(body.classId ?? '')
  const assignmentId = String(body.assignmentId ?? '')
  const allocation: Allocation = { boxes: Array.isArray(body?.allocation?.boxes) ? body.allocation.boxes : [] }
  const reflection = body.reflection

  if (!classId || !assignmentId) return NextResponse.json({ error: 'Missing ids' }, { status: 400 })

  // roster join-gate (mirror journal/submit)
  const roster = await adminDb.doc(`classes/${classId}/roster/${uid}`).get()
  if (!roster.exists) return NextResponse.json({ error: 'Not enrolled' }, { status: 403 })

  const aSnap = await adminDb.doc(`classes/${classId}/assignments/${assignmentId}`).get()
  const a = aSnap.data()
  if (!aSnap.exists || a?.type !== 'challenge') return NextResponse.json({ error: 'Not a challenge' }, { status: 400 })

  const challengeId: string = a.challengeId ?? ''
  const ch = challengeId.startsWith('lib:') ? getLibraryChallenge(challengeId) : null // custom: is Phase 2
  if (!ch) return NextResponse.json({ error: 'Unknown challenge' }, { status: 400 })

  const meta = buildChallengeSubmission({ allocation, reflection }, ch) // server recomputes score

  await adminDb.doc(`classes/${classId}/assignments/${assignmentId}/submissions/${uid}`).set(
    { ...meta, submittedAt: FieldValue.serverTimestamp() },
    { merge: true },
  )

  // Return the authoritative result to the client for display.
  return NextResponse.json({ score: meta.score, allPassed: meta.allPassed, perCriterion: meta.perCriterion, status: meta.status })
}
```

**Before writing, open `app/api/journal/submit/route.ts` and copy its exact import paths for `verifyUser`/admin db** — do not guess the module names; match them.

- [ ] **Step 2: Verify build.** Run: `npm run build` — Expected: zero errors.

- [ ] **Step 3: Commit.**

```bash
git add app/api/challenge/submit/route.ts
git commit -m "feat(challenges): server-authoritative /api/challenge/submit route"
```

---

### Task 7: `/challenge/[assignmentId]` — dedicated allocation solve screen (sandbox)

The student surface. Sandbox-isolated by construction: all state in React; the only network write is the Submit POST from Task 6. **No import of `lib/budget/store.ts` here** (that would touch the real budget).

**Files:**
- Create: `app/challenge/[assignmentId]/page.tsx`

**Interfaces:**
- Consumes: `getLibraryChallenge`, `seedBoxes`, `evaluateChallenge`, types (Tasks 2–3); `useAuth` and a way to read the assignment's `classId`/`challengeId` (via `useStudent` assignments or a query param `?class=<cid>`).
- Produces: the challenge submission (via `/api/challenge/submit`).

- [ ] **Step 1: Build the screen.** Client component. Structure (honor the Bread Head system; reuse `sfIcon`/emoji helpers as `/mybudget` does):
  1. **Resolve the assignment.** Read `assignmentId` from the route and `classId` from a `?class=` query param (StudentHome's CTA supplies it — Task 8). Find the matching `StudentAssignment` (from `useStudent`) to get `challengeId`; `const ch = getLibraryChallenge(challengeId)`.
  2. **Header** — challenge `title` (Playfair italic) + `prompt`, and a fixed **Income** chip (`ch.monthly.income`, read-only — students don't set income in a challenge).
  3. **Seed state** — `const [boxes, setBoxes] = useState<AllocationBox[]>(seedBoxes(ch))`. Mandatory (seeded) boxes render **locked** (name + amount fixed, no delete). Student adds boxes with `{ name, role: need|want|save, targetMode, targetValue }`.
  4. **Live checklist** — `const result = evaluateChallenge(ch, { boxes })` recomputed on every state change; render `result.perCriterion` as a ✅/❌ list using each `detail` string, plus an "Unallocated: $X" readout. This is the *preview* only.
  5. **Submit** — POST to `/api/challenge/submit` with `{ classId, assignmentId, allocation: { boxes }, reflection }`. On success show the **server-returned** score/checklist (source of truth) and a "View in Grades" link. Disable Submit while pending; show a friendly error on failure (mirror `/mybudget` `saveErr` pattern).
  6. **Accessibility** — every control keyboard-reachable; `prefers-reduced-motion` disables box-fill animations. (No drag required — allocation is form inputs.)

- [ ] **Step 2: Verify build.** Run: `npm run build` — Expected: zero errors.

- [ ] **Step 3: Manual smoke.** `npm run dev`; as a rostered student open `/challenge/<id>?class=<cid>` for an assigned challenge; add boxes until every criterion is ✅; Submit; confirm the response shows `allPassed:true` and a submission doc is written. Then reload and confirm **no** writes landed in `users/{uid}/categories` or `users/{uid}/budget` (sandbox isolation — check Firestore console).

- [ ] **Step 4: Commit.**

```bash
git add app/challenge/[assignmentId]/page.tsx
git commit -m "feat(challenges): dedicated allocation solve screen (sandbox-isolated)"
```

---

### Task 8: StudentHome — render Budget Challenge to-dos with a distinct CTA

**Files:**
- Modify: `app/dashboard/StudentHome.tsx:51-71`

**Interfaces:**
- Consumes: `StudentAssignment` (now with `type:'challenge'`, `challengeId`), `getLibraryChallenge` for the title.
- Produces: a to-do card linking to `/challenge/[id]?class=[classId]`.

- [ ] **Step 1: Handle the `challenge` branch.** Today StudentHome only deep-links lessons. Add rendering for `assignment.type === 'challenge'`: a card badged **"Budget Challenge"** (visually distinct from lessons/journal and from "My Budget"), showing the challenge title (`getLibraryChallenge(a.challengeId)?.title`), due date/overdue styling (reuse existing), and a CTA:

```tsx
<Link href={`/challenge/${a.id}?class=${a.classId}`}>Solve challenge →</Link>
```

Also make sure `budget`/`journal` non-lesson assignments don't crash the existing lesson-only regex path — guard the lesson parsing to `type === 'lesson'` (or undefined).

- [ ] **Step 2: Verify build + snapshots.** Run `npm run build`, then `npm run test:update` and `npx playwright test`. Expected: pass; review snapshot diffs (a new challenge card may appear only when seeded — the default StudentHome with no challenge is unchanged).

- [ ] **Step 3: Commit.**

```bash
git add app/dashboard/StudentHome.tsx tests/snapshots
git commit -m "feat(challenges): student to-do card + deep-link for Budget Challenges"
```

---

### Task 9: Student `/grades` gradebook + "Grades" menu item

**Files:**
- Create: `app/grades/page.tsx`
- Modify: `app/student/StudentShell.tsx` (add Grades menu item)

**Interfaces:**
- Consumes: `useStudent` assignments + the student's own submissions (read via client SDK — the submissions doc is student-readable per rules). `getLibraryChallenge` for titles; challenge submission fields `score`/`allPassed`/`perCriterion`.
- Produces: nothing (leaf surface).

- [ ] **Step 1: Build `/grades`.** Client page inside the student shell. List every assignment addressed to the student with its status; for `challenge` rows also show `score` (e.g. "3/3 criteria"), the per-criterion ✅/❌ checklist, `teacherFeedback` if present, and the challenge title. `budget`/`journal` rows show status + submittedAt only (no score — nothing to grade). Read each submission from `classes/{cid}/assignments/{aid}/submissions/{uid}`. Empty state: "No graded work yet."

- [ ] **Step 2: Add the Grades menu item.** In `StudentShell.tsx`, insert after My Budget:

```tsx
{navItem('/mybudget', 'My Budget')}
{navItem('/grades', 'Grades')}
```

Final student menu: **Dashboard · Course · Journal · My Budget · Grades · Account**.

- [ ] **Step 3: Verify build + snapshots.** Run `npm run build`, `npm run test:update`, `npx playwright test`. Expected: pass; review diffs (menu gains "Grades").

- [ ] **Step 4: Commit.**

```bash
git add app/grades/page.tsx app/student/StudentShell.tsx tests/snapshots
git commit -m "feat(grades): student gradebook + Grades menu item"
```

---

### Task 10: Teacher challenge review + class-nav entry

Closes the "both see the score" acceptance criterion on the teacher side.

**Files:**
- Create: `app/dashboard/[classId]/challenges/page.tsx`
- Modify: `app/dashboard/DashboardShell.tsx:94-115` (add Challenges to the CONTENT group)

**Interfaces:**
- Consumes: `useDashboard` assignments + their `submissions` (challenge fields), `getLibraryChallenge`.
- Produces: nothing (leaf surface).

- [ ] **Step 1: Build the review page.** For each `type:'challenge'` assignment in the class, list students with `status`, `score`, `allPassed`; expandable row shows the submitted `allocation` (box name / role / dollars) and the per-criterion checklist. (Fake money — full visibility is allowed and intended.) Optional teacher feedback textarea is Phase 2; MVP is read-only display.

- [ ] **Step 2: Add the class-nav entry.** In `DashboardShell.tsx` CONTENT group (next to Lessons/Journal):

```tsx
{navItem(`/dashboard/${classId}/challenges`, 'Challenges')}
```

- [ ] **Step 3: Verify build + snapshots.** Run `npm run build`, `npm run test:update`, `npx playwright test`. Expected: pass; review diffs (teacher nav gains "Challenges").

- [ ] **Step 4: Commit.**

```bash
git add app/dashboard/[classId]/challenges/page.tsx app/dashboard/DashboardShell.tsx tests/snapshots
git commit -m "feat(challenges): teacher challenge review + class-nav entry"
```

---

### Task 11: MVP verification pass

- [ ] **Step 1: Full build.** Run: `npm run build` — Expected: zero errors.
- [ ] **Step 2: Full test suite.** Run: `npx playwright test` — Expected: all 21 visual snapshots + all unit tests pass.
- [ ] **Step 3: End-to-end acceptance** (manual, `npm run dev`), tick each:
  - [ ] Teacher assigns `lib:first-paycheck` to a class; a student sees a **Budget Challenge** to-do (distinct from lessons/journal/My Budget).
  - [ ] Student solves it on `/challenge/[id]`; the live checklist matches the server result on Submit; it auto-scores; **zero** writes hit `users/{uid}/categories|budget`.
  - [ ] `zero_unallocated`, `fund_mandatory`, `min_savings_rate` each flip correctly as the student changes the allocation.
  - [ ] A forged client score is ignored (POST with `score:0` still stores the recomputed score).
  - [ ] Student `/grades` shows the challenge status + score + per-criterion; My Budget is reachable from the menu.
  - [ ] Teacher `/dashboard/[classId]/challenges` shows the same score + allocation.
  - [ ] `/mybudget` and `/grades` and teacher `/challenges` are all reachable from a menu — no URL typing.
- [ ] **Step 4: Commit any snapshot updates**, then this phase is done.

---

## PHASE 2 — Logic nuances (outline; plan in detail after MVP ships)

These add depth once the MVP loop is proven. Each becomes its own bite-sized task set.

1. **Custom challenges (`custom:` namespace).** Duplicate-a-library-challenge editor at `/dashboard/[classId]/challenges` writing to `classes/{cid}/challenges/{docId}`; assign-route + submit-route resolve `custom:` from Firestore; **block assigning if `validateChallenge` fails** (acceptance criterion). **Requires new Firestore rules** in the iOS repo (`~/Developer/breadhead/firestore.rules`): teacher write / rostered-student read on `classes/{cid}/challenges/{docId}` — deploy per the `firestore-rules-location` memory (rules live in the iOS repo, not here).
2. **`budget` (personal habit) assignment — closes spec gap G5.** Wire `type:'budget'` into the assign route + a teacher config form; add `/api/budget/submit` using the already-built `buildBudgetSubmission`/`sanitizeBudgetConfig`; StudentHome to-do deep-links to `/mybudget`; teacher `budget` review page (completion + last-updated only). Add a **Budget review** class-nav entry.
3. **Reflect-on-purchases journal variant.** New journal config `source:'purchases'` + window (`last7days|thisMonth|box:{id}`); the journal screen reads the student's own transactions client-side and renders them above the prompt; teacher submission stays metadata-only. Handle the empty-purchases state ("no recent purchases yet").
4. **Curveball support** (`monthly.curveball`) + richer criteria if needed.
5. **Teacher feedback / override** (`teacherFeedback`, `overrideScore`) on challenge review, surfaced in `/grades`.

## PHASE 3 — Cosmetic / polish (outline)

1. **Visual distinction pass** for My Budget vs Budget Challenge (badges, color accents, iconography) so the two are unmistakable at a glance; audit copy against the naming constraint.
2. **Allocation screen polish** — box-fill animation, savings-ring, reduced-motion parity with `/mybudget`.
3. **Playwright visual coverage** for `/challenge`, `/grades`, and the teacher challenge page at mobile/tablet/desktop (add to `tests/sections.spec.ts` or a new spec; regenerate snapshots).
4. **Menu ergonomics** — if 6 student items feels heavy, group Journal/My Budget/Grades under a "My Work" submenu (deferred decision from the spec).

## Deferred (unchanged from spec)

- **Type B long-term simulation** (compound-growth decision challenges) — Phase 2 of the original spec; separate plan.
- **AI draft/match authoring** — schema stays LLM-fillable; near-zero later cost.
- **LMS grade passback / LTI** — BH stays an in-app gradebook of *display*, not of record; teachers export manually.

---

## Self-review

- **Spec coverage:** MVP covers spec build-order steps 1 (nav/IA), 2 (schema+logic+library), 4 (challenge type + submit + solve), 5 (student grades), and the teacher-review slice of 6. Steps 3 (BudgetDataSource) is intentionally **replaced** by the dedicated-allocation-screen decision (sandbox isolation achieved via React state, no store import — simpler and satisfies the same privacy invariant). Steps 6-remainder (custom authoring/filters), 7 (budget habit), 8 (reflect-purchases), 9 (Type B), 10 (AI) are mapped to Phases 2/3/Deferred. Every acceptance criterion in the spec maps to a Task 11 check or a Phase-2 item (custom-authoring solvability guard, budget-privacy, reflect-purchases → Phase 2).
- **Gap closures:** G1 (savings tagging) → `AllocationBox.role`, Task 2. G2 (fund_mandatory mapping + drop no_overspend) → Task 2 resolved-decisions. G3 (workbench reuse) → dedicated screen, Task 7. G4 (class-nav exists) → Task 10 adds an entry, builds nothing. G5 (budget type unbuilt) → Phase 2 item 2. G6 (custom-challenge rules) → Phase 2 item 1.
- **Type consistency:** `Challenge`, `Allocation`, `AllocationBox`, `ChallengeResult`, `ChallengeSubmissionMeta`, and function names (`evaluateChallenge`, `validateChallenge`, `seedBoxes`, `referenceSolution`, `buildChallengeSubmission`, `getLibraryChallenge`) are used identically across Tasks 2–10.
- **Privacy:** the only teacher-readable doc written is the fake-money challenge submission (safe in full); no task imports `lib/budget/store.ts` into the challenge path.
