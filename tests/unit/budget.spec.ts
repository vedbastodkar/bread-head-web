import { test, expect } from '@playwright/test'
import {
  newBudgetId,
  resolveAllocated,
  fixedTotal,
  flexible,
  spentByCategory,
  totalSpent,
  availableBread,
  savingsRate,
  allocatedTotal,
  unallocated,
  budgetWarnings,
  sanitizeBudgetConfig,
  buildBudgetSubmission,
  type BudgetCategory,
  type BudgetTransaction,
} from '../../lib/budget/budget'

// ---- helpers ----
function cat(p: Partial<BudgetCategory> & { id: string }): BudgetCategory {
  return {
    id: p.id,
    name: p.name ?? 'Box',
    iconKey: p.iconKey ?? 'circle.fill',
    color: p.color ?? '#4A5D4A',
    targetMode: p.targetMode ?? 'percent',
    targetValue: p.targetValue ?? 0,
    sortOrder: p.sortOrder ?? 0,
    isActive: p.isActive ?? true,
    isSystemCategory: p.isSystemCategory ?? false,
    fixedPayments: p.fixedPayments ?? [],
  }
}
function expense(amount: number, categoryId?: string, nwsLevel?: 'need' | 'want' | 'save'): BudgetTransaction {
  return { id: newBudgetId(), type: 'expense', amount, categoryId, nwsLevel }
}
function income(amount: number): BudgetTransaction {
  return { id: newBudgetId(), type: 'income', amount }
}

// ---- newBudgetId ----
test('newBudgetId returns an uppercase UUID and is unique', () => {
  const a = newBudgetId()
  const b = newBudgetId()
  expect(a).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)
  expect(a).not.toBe(b)
})

// ---- resolveAllocated ----
test('resolveAllocated: percent scales with income, fixed ignores income', () => {
  expect(resolveAllocated(cat({ id: 'a', targetMode: 'percent', targetValue: 25 }), 600)).toBe(150)
  expect(resolveAllocated(cat({ id: 'b', targetMode: 'fixed', targetValue: 90 }), 600)).toBe(90)
  expect(resolveAllocated(cat({ id: 'c', targetMode: 'fixed', targetValue: 90 }), 0)).toBe(90)
})

// ---- fixedTotal ----
test('fixedTotal sums only enabled fixed payments', () => {
  const c = cat({
    id: 'a',
    fixedPayments: [
      { id: '1', name: 'Spotify', amount: 6, isEnabled: true },
      { id: '2', name: 'Old gym', amount: 30, isEnabled: false },
      { id: '3', name: 'Phone', amount: 15, isEnabled: true },
    ],
  })
  expect(fixedTotal(c)).toBe(21)
  expect(fixedTotal(cat({ id: 'b' }))).toBe(0)
})

// ---- flexible ----
test('flexible = allocated minus fixed payments', () => {
  const c = cat({
    id: 'a',
    targetMode: 'fixed',
    targetValue: 100,
    fixedPayments: [{ id: '1', name: 'Bill', amount: 40, isEnabled: true }],
  })
  expect(flexible(c, 600)).toBe(60)
})

// ---- spentByCategory / totalSpent ----
test('spentByCategory sums expenses per category and ignores income', () => {
  const txs = [expense(10, 'food'), expense(5, 'food'), expense(20, 'fun'), income(500)]
  const map = spentByCategory(txs)
  expect(map.get('food')).toBe(15)
  expect(map.get('fun')).toBe(20)
  expect(map.has('__income__')).toBe(false)
})

test('totalSpent counts expenses only', () => {
  expect(totalSpent([expense(10, 'food'), expense(20, 'fun'), income(999)])).toBe(30)
  expect(totalSpent([])).toBe(0)
})

// ---- availableBread ----
test('availableBread is income minus total expenses', () => {
  expect(availableBread(600, [expense(14, 'food'), expense(6, 'fun')])).toBe(580)
  expect(availableBread(600, [])).toBe(600)
})

// ---- savingsRate ----
test('savingsRate is share of income filed into Save, 0 when no income', () => {
  const txs = [expense(120, 'save', 'save'), expense(60, 'fun', 'want')]
  expect(savingsRate(600, txs)).toBe(20)
  expect(savingsRate(0, txs)).toBe(0)
})

// ---- allocatedTotal / unallocated ----
test('allocatedTotal and unallocated across mixed target modes', () => {
  const cats = [
    cat({ id: 'a', targetMode: 'percent', targetValue: 25 }), // 150
    cat({ id: 'b', targetMode: 'fixed', targetValue: 90 }), //    90
  ]
  expect(allocatedTotal(cats, 600)).toBe(240)
  expect(unallocated(600, cats)).toBe(360)
})

test('inactive categories are excluded from allocation totals', () => {
  const cats = [
    cat({ id: 'a', targetMode: 'fixed', targetValue: 100, isActive: true }),
    cat({ id: 'b', targetMode: 'fixed', targetValue: 100, isActive: false }),
  ]
  expect(allocatedTotal(cats, 600)).toBe(100)
})

// ---- budgetWarnings ----
test('budgetWarnings T1 fires when a box is 80-100% used', () => {
  const cats = [cat({ id: 'food', targetMode: 'fixed', targetValue: 100 })]
  const w = budgetWarnings({ income: 600, categories: cats, transactions: [expense(85, 'food', 'need')] })
  expect(w.t1).toBe(true)
  expect(w.t3).toBe(false)
})

test('budgetWarnings T3 fires when a box is overspent', () => {
  const cats = [cat({ id: 'food', targetMode: 'fixed', targetValue: 100 })]
  const w = budgetWarnings({ income: 600, categories: cats, transactions: [expense(140, 'food', 'need')] })
  expect(w.t3).toBe(true)
})

test('budgetWarnings T2 fires when Wants exceed 60% of spending', () => {
  const cats = [cat({ id: 'fun', targetMode: 'fixed', targetValue: 1000 })]
  const w = budgetWarnings({
    income: 600,
    categories: cats,
    transactions: [expense(70, 'fun', 'want'), expense(30, 'fun', 'need')],
  })
  expect(w.t2).toBe(true)
})

// ---- sanitizeBudgetConfig ----
test('sanitizeBudgetConfig coerces to a safe requirement with defaults', () => {
  expect(sanitizeBudgetConfig(null)).toEqual({ requireIncome: false, minBoxes: 0 })
  expect(sanitizeBudgetConfig({ requireIncome: true, minBoxes: 3 })).toEqual({ requireIncome: true, minBoxes: 3 })
  // garbage/negative coerces
  expect(sanitizeBudgetConfig({ requireIncome: 'yes', minBoxes: -4 })).toEqual({ requireIncome: false, minBoxes: 0 })
  // absurd counts are clamped
  expect(sanitizeBudgetConfig({ minBoxes: 9999 })).toEqual({ requireIncome: false, minBoxes: 50 })
})

// ---- buildBudgetSubmission (PRIVACY-CRITICAL) ----
test('buildBudgetSubmission returns ONLY safe metadata — never money or spending', () => {
  const meta = buildBudgetSubmission(
    // deliberately pass rich, sensitive fields that MUST NOT leak
    { boxesCount: 5, hasIncome: true, hasStarted: true, lastUpdatedAt: 1234, income: 5000, totalSpent: 3210, categories: ['Weed money'] } as any,
    { requireIncome: true, minBoxes: 3 },
  )
  expect(Object.keys(meta).sort()).toEqual(['hasStarted', 'lastUpdatedAt', 'status'])
  expect(meta).toEqual({ status: 'complete', hasStarted: true, lastUpdatedAt: 1234 })
})

test('buildBudgetSubmission status is in_progress until the requirement is met', () => {
  const cfg = { requireIncome: true, minBoxes: 3 }
  expect(buildBudgetSubmission({ boxesCount: 2, hasIncome: true, hasStarted: true, lastUpdatedAt: 1 }, cfg).status).toBe('in_progress')
  expect(buildBudgetSubmission({ boxesCount: 3, hasIncome: false, hasStarted: true, lastUpdatedAt: 1 }, cfg).status).toBe('in_progress')
  expect(buildBudgetSubmission({ boxesCount: 3, hasIncome: true, hasStarted: false, lastUpdatedAt: 1 }, cfg).status).toBe('in_progress')
  expect(buildBudgetSubmission({ boxesCount: 3, hasIncome: true, hasStarted: true, lastUpdatedAt: 1 }, cfg).status).toBe('complete')
})

test('buildBudgetSubmission coerces a garbage lastUpdatedAt to 0', () => {
  const meta = buildBudgetSubmission({ boxesCount: 0, hasIncome: false, hasStarted: true, lastUpdatedAt: 'nope' as any }, { requireIncome: false, minBoxes: 0 })
  expect(meta.lastUpdatedAt).toBe(0)
})
