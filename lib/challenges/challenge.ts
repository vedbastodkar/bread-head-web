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
