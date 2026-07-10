import { test, expect } from '@playwright/test'
import {
  resolveBoxDollars, allocatedDollars, evaluateChallenge, validateChallenge,
  referenceSolution, buildChallengeSubmission,
  assignmentAppliesTo, clampAmount,
  type Challenge, type Allocation, type AllocationBox,
} from '../../lib/challenges/challenge'
import { LIBRARY, getLibraryChallenge } from '../../lib/challenges/library'

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
    { kind: 'min_needs', value: 1050 },
    { kind: 'min_savings_rate', value: 15 },
    { kind: 'zero_unallocated' },
  ],
  source: 'library',
}

test('resolveBoxDollars handles fixed and percent', () => {
  expect(resolveBoxDollars({ id:'a', name:'A', role:'need', targetMode:'fixed', targetValue:1000 }, 2000)).toBe(1000)
  expect(resolveBoxDollars({ id:'b', name:'B', role:'save', targetMode:'percent', targetValue:15 }, 2000)).toBe(300)
})

test('evaluateChallenge: a correct allocation passes every criterion', () => {
  const alloc: Allocation = { boxes: [
    { id:'1', name:'Rent', role:'need', targetMode:'fixed', targetValue:1000 },
    { id:'2', name:'Phone', role:'need', targetMode:'fixed', targetValue:50 },
    { id:'3', name:'Savings', role:'save', targetMode:'fixed', targetValue:300 },
    { id:'4', name:'Spending', role:'want', targetMode:'fixed', targetValue:650 },
  ] }
  const r = evaluateChallenge(CH, alloc)
  expect(r.allPassed).toBe(true)
  expect(r.score).toBe(1)
})

test('evaluateChallenge: under-saving fails only min_savings_rate', () => {
  const alloc: Allocation = { boxes: [
    { id:'1', name:'Rent', role:'need', targetMode:'fixed', targetValue:1000 },
    { id:'2', name:'Phone', role:'need', targetMode:'fixed', targetValue:50 },
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
    { id:'1', name:'Rent', role:'need', targetMode:'fixed', targetValue:1000 },
    { id:'2', name:'Phone', role:'need', targetMode:'fixed', targetValue:50 },
    { id:'3', name:'Savings', role:'save', targetMode:'fixed', targetValue:300 },
  ] }
  const r = evaluateChallenge(CH, alloc)
  expect(r.perCriterion.find(c => c.kind === 'zero_unallocated')!.passed).toBe(false)
})

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

test('referenceSolution always passes its own challenge', () => {
  expect(evaluateChallenge(CH, referenceSolution(CH)).allPassed).toBe(true)
})

test('validateChallenge rejects unsolvable params', () => {
  expect(validateChallenge(CH).ok).toBe(true)
  const bad = { ...CH, monthly: { income: 1000, mandatory: [{ id:'rent', name:'Rent', amount: 1200 }] } }
  expect(validateChallenge(bad as Challenge).ok).toBe(false)
})

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

test('assignmentAppliesTo: class scope applies to everyone; students scope only to listed uids', () => {
  // class-wide (explicit and legacy/undefined) applies to any user
  expect(assignmentAppliesTo({ scope: 'class', studentUids: [] }, 'ben')).toBe(true)
  expect(assignmentAppliesTo({ scope: undefined, studentUids: undefined }, 'ben')).toBe(true)
  // individual scope: only the listed target — the IDOR guard
  expect(assignmentAppliesTo({ scope: 'students', studentUids: ['chloe'] }, 'chloe')).toBe(true)
  expect(assignmentAppliesTo({ scope: 'students', studentUids: ['chloe'] }, 'ben')).toBe(false)
  expect(assignmentAppliesTo({ scope: 'students', studentUids: null }, 'ben')).toBe(false)
})

test('clampAmount: no negatives, percent capped at 100, fixed capped at income', () => {
  expect(clampAmount(-500, 'fixed', 2000)).toBe(0)
  expect(clampAmount(NaN, 'fixed', 2000)).toBe(0)
  expect(clampAmount(999999999, 'fixed', 2000)).toBe(2000)   // no single box beyond income
  expect(clampAmount(650, 'fixed', 2000)).toBe(650)          // legit value untouched
  expect(clampAmount(500, 'percent', 2000)).toBe(100)        // >100% capped
  expect(clampAmount(15, 'percent', 2000)).toBe(15)          // legit percent untouched
})
