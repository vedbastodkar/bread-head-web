// Pure budget helpers — NO firebase import so this is trivially unit-testable.
// Mirrors the iOS Budgeting Simulator's math (Category.swift: resolveAllocated,
// fixedTotal, flexible) so web and iOS compute identical numbers from the same
// shared Firestore docs.
//
// The privacy-critical function here is buildBudgetSubmission: it returns ONLY
// {status, hasStarted, lastUpdatedAt} — never income, spending, allocations, or
// any dollar figure. A teacher who assigned the budget sees THAT a student did it
// and WHEN, never how much they make or how they spend.

export type TargetMode = 'fixed' | 'percent'
export type NwsLevel = 'need' | 'want' | 'save'
export type TransactionType = 'income' | 'expense'

export interface FixedPayment {
  id: string
  name: string
  amount: number
  isEnabled: boolean
}

export interface BudgetCategory {
  id: string
  name: string
  iconKey: string // SF Symbol name (shared with iOS)
  color: string
  targetMode: TargetMode
  targetValue: number // fixed dollars, or percent 0–100
  sortOrder: number
  isActive: boolean
  isSystemCategory: boolean
  fixedPayments: FixedPayment[]
}

export interface BudgetTransaction {
  id: string
  type: TransactionType
  amount: number // always positive; type carries the sign
  categoryId?: string
  nwsLevel?: NwsLevel
  name?: string
  note?: string
  date?: number // ms epoch
}

export interface BudgetConfig {
  requireIncome: boolean
  minBoxes: number
}

export interface BudgetSubmissionMeta {
  status: 'complete' | 'in_progress'
  hasStarted: boolean
  lastUpdatedAt: number
}

// Uppercase UUID to match the iOS doc-id convention (categories/budget use
// uppercase UUIDs). Same generator shape as lib/journal newEntryId.
export function newBudgetId(): string {
  const uuid =
    globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Date.now() + Math.floor(Math.random() * 1e9)) % 16
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        })
  return uuid.toUpperCase()
}

// ---- allocation math (mirrors Category.swift) ----

export function resolveAllocated(cat: BudgetCategory, income: number): number {
  return cat.targetMode === 'fixed' ? cat.targetValue : income * (cat.targetValue / 100)
}

export function fixedTotal(cat: BudgetCategory): number {
  return cat.fixedPayments.filter((f) => f.isEnabled).reduce((s, f) => s + f.amount, 0)
}

export function flexible(cat: BudgetCategory, income: number): number {
  return resolveAllocated(cat, income) - fixedTotal(cat)
}

// ---- spending ----

export function spentByCategory(transactions: BudgetTransaction[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== 'expense' || !t.categoryId) continue
    map.set(t.categoryId, (map.get(t.categoryId) ?? 0) + t.amount)
  }
  return map
}

export function totalSpent(transactions: BudgetTransaction[]): number {
  return transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
}

function spentForLevel(transactions: BudgetTransaction[], level: NwsLevel): number {
  return transactions
    .filter((t) => t.type === 'expense' && t.nwsLevel === level)
    .reduce((s, t) => s + t.amount, 0)
}

// ---- headline numbers ----

export function availableBread(income: number, transactions: BudgetTransaction[]): number {
  return income - totalSpent(transactions)
}

export function savingsRate(income: number, transactions: BudgetTransaction[]): number {
  if (income <= 0) return 0
  return (spentForLevel(transactions, 'save') / income) * 100
}

export function allocatedTotal(categories: BudgetCategory[], income: number): number {
  return categories.filter((c) => c.isActive).reduce((s, c) => s + resolveAllocated(c, income), 0)
}

export function unallocated(income: number, categories: BudgetCategory[]): number {
  return income - allocatedTotal(categories, income)
}

// ---- warnings (mirror the three-tier system on /budget) ----

export interface BudgetWarnings {
  t1: boolean // advisory: a box is 80–100% used
  t2: boolean // significant: Wants dominate spending
  t3: boolean // critical: a box is overspent, or income is exhausted
}

export function budgetWarnings(input: {
  income: number
  categories: BudgetCategory[]
  transactions: BudgetTransaction[]
}): BudgetWarnings {
  const { income, categories, transactions } = input
  const spent = spentByCategory(transactions)
  const active = categories.filter((c) => c.isActive)

  const t1 = active.some((c) => {
    const alloc = resolveAllocated(c, income)
    const s = spent.get(c.id) ?? 0
    return alloc > 0 && s >= 0.8 * alloc && s <= alloc
  })

  const spentTotal = totalSpent(transactions)
  const t2 = spentTotal > 0 && spentForLevel(transactions, 'want') / spentTotal > 0.6

  const t3 =
    active.some((c) => {
      const alloc = resolveAllocated(c, income)
      return alloc > 0 && (spent.get(c.id) ?? 0) > alloc
    }) || spentTotal > income

  return { t1, t2, t3 }
}

// ---- assignment config ----

// Validate a teacher's budget-assignment requirement. Always returns a usable
// config (a budget assignment is meaningful even with no requirement), unlike
// sanitizeJournalConfig which needs ≥1 question.
export function sanitizeBudgetConfig(raw: unknown): BudgetConfig {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
  const requireIncome = r.requireIncome === true
  const minBoxes =
    typeof r.minBoxes === 'number' && r.minBoxes > 0 ? Math.min(50, Math.round(r.minBoxes)) : 0
  return { requireIncome, minBoxes }
}

// ---- teacher-visible submission (PRIVACY-CRITICAL) ----

// Build the teacher-readable submission record. CRITICAL: returns ONLY
// {status, hasStarted, lastUpdatedAt}. Any extra fields on `input` (income,
// totalSpent, categories, …) are ignored — money and spending never enter a
// teacher-readable doc. `status` is a bare completion enum computed from the
// requirement, not any dollar figure.
export function buildBudgetSubmission(
  input: { boxesCount: unknown; hasIncome: unknown; hasStarted: unknown; lastUpdatedAt: unknown },
  config: BudgetConfig,
): BudgetSubmissionMeta {
  const boxesCount = Number.isFinite(Number(input.boxesCount)) ? Math.max(0, Math.round(Number(input.boxesCount))) : 0
  const hasIncome = input.hasIncome === true
  const hasStarted = input.hasStarted === true
  const lastUpdatedAt = Number.isFinite(Number(input.lastUpdatedAt)) ? Math.max(0, Math.round(Number(input.lastUpdatedAt))) : 0

  const meetsBoxes = boxesCount >= config.minBoxes
  const meetsIncome = !config.requireIncome || hasIncome
  const status: 'complete' | 'in_progress' = hasStarted && meetsBoxes && meetsIncome ? 'complete' : 'in_progress'

  return { status, hasStarted, lastUpdatedAt }
}
