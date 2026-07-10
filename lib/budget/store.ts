// Firestore adapter for the web budget — reads/writes the SAME docs the iOS app
// uses (users/{uid}/categories/{id} and users/{uid}/budget/continuous_data).
//
// Safety rules (see spec 2026-07-07-my-budget-web-design):
//  - Categories: per-doc upsert; never delete-all-then-rewrite.
//  - continuous_data: ALWAYS read-before-write + merge, touching only the arrays/
//    fields the web owns. Nested map writes (settings.*) use setDoc merge, which
//    deep-merges map fields — sibling iOS-only settings are preserved.
//
// This module is thin I/O glue over the tested pure math in ./budget. The pure
// serialization is kept obvious; correctness is verified by the round-trip check
// (web write → iOS read) rather than unit tests, as it needs the live SDK.
import {
  doc, getDoc, setDoc, deleteDoc, collection, getDocs, Timestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import type { BudgetCategory, BudgetTransaction, FixedPayment } from './budget'

export interface LoadedBudget {
  categories: BudgetCategory[]
  income: number
  transactions: BudgetTransaction[]
}

// ---- Timestamp normalisation (Firestore Timestamp | Date | ms | seconds) ----
function toMillis(v: unknown): number | undefined {
  if (v == null) return undefined
  if (typeof v === 'number') return v
  if (v instanceof Timestamp) return v.toMillis()
  if (v instanceof Date) return v.getTime()
  const o = v as { seconds?: number; toMillis?: () => number }
  if (typeof o.toMillis === 'function') return o.toMillis()
  if (typeof o.seconds === 'number') return o.seconds * 1000
  return undefined
}

// ---- category (de)serialisation, tolerant of iOS legacy keys ----
function parseFixedPayments(raw: unknown): FixedPayment[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r): FixedPayment | null => {
      if (!r || typeof r !== 'object') return null
      const o = r as Record<string, unknown>
      if (typeof o.id !== 'string' || typeof o.name !== 'string') return null
      return { id: o.id, name: o.name, amount: Number(o.amount) || 0, isEnabled: o.isEnabled !== false }
    })
    .filter((x): x is FixedPayment => x !== null)
}

function parseCategory(id: string, raw: Record<string, unknown>): BudgetCategory {
  const targetMode = raw.targetMode === 'percent' ? 'percent' : raw.targetMode === 'fixed' ? 'fixed' : 'fixed'
  return {
    id: (raw.id as string) || id,
    name: (raw.name as string) ?? 'Box',
    iconKey: (raw.iconKey as string) ?? 'circle.fill',
    color: (raw.color as string) ?? (raw.iconColor as string) ?? '#4A5D4A',
    targetMode,
    targetValue: Number(raw.targetValue) || 0,
    sortOrder: Number(raw.sortOrder) || 0,
    isActive: raw.isActive !== false,
    isSystemCategory: raw.isSystemCategory === true,
    fixedPayments: parseFixedPayments(raw.fixedPayments),
  }
}

// Serialise a category to the exact iOS wire shape (Category.toFirestoreData).
// Writes both "color" and "iconColor" for iOS back-compat.
function categoryToFirestore(c: BudgetCategory): Record<string, unknown> {
  const now = Timestamp.now()
  return {
    id: c.id,
    name: c.name,
    iconKey: c.iconKey,
    color: c.color,
    iconColor: c.color,
    targetMode: c.targetMode,
    targetValue: c.targetValue,
    isSimulated: false,
    rolloverRule: 'none',
    sortOrder: c.sortOrder,
    isActive: c.isActive,
    isSystemCategory: c.isSystemCategory,
    createdAt: now,
    lastModified: now,
    spendingRules: [],
    fixedPayments: c.fixedPayments.map((f) => ({ id: f.id, name: f.name, amount: f.amount, isEnabled: f.isEnabled })),
  }
}

// ---- transaction parsing ----
function parseTransactions(raw: unknown): BudgetTransaction[] {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r): BudgetTransaction | null => {
      if (!r || typeof r !== 'object') return null
      const o = r as Record<string, unknown>
      if (typeof o.id !== 'string') return null
      const type = o.type === 'income' ? 'income' : 'expense'
      const nws = o.nwsLevel === 'need' || o.nwsLevel === 'want' || o.nwsLevel === 'save' ? o.nwsLevel : undefined
      return {
        id: o.id,
        type,
        amount: Math.abs(Number(o.amount) || 0),
        categoryId: typeof o.categoryId === 'string' ? o.categoryId : undefined,
        nwsLevel: nws,
        name: typeof o.name === 'string' ? o.name : undefined,
        note: typeof o.note === 'string' ? o.note : undefined,
        date: toMillis(o.date),
      }
    })
    .filter((x): x is BudgetTransaction => x !== null)
}

function transactionToFirestore(t: BudgetTransaction): Record<string, unknown> {
  const data: Record<string, unknown> = {
    id: t.id,
    type: t.type,
    amount: Math.abs(t.amount),
    date: t.date ? Timestamp.fromMillis(t.date) : Timestamp.now(),
    isPending: false,
  }
  if (t.categoryId) data.categoryId = t.categoryId
  if (t.nwsLevel) data.nwsLevel = t.nwsLevel
  if (t.name) data.name = t.name
  if (t.note) data.note = t.note
  return data
}

// ---- income resolution ----
function resolveIncome(budgetData: Record<string, unknown>): number {
  const snaps = Array.isArray(budgetData.snapshots) ? (budgetData.snapshots as Record<string, unknown>[]) : []
  const currentId = budgetData.currentSnapshotId as string | undefined
  const current = currentId ? snaps.find((s) => s.id === currentId) : undefined
  if (current && Number.isFinite(Number(current.income))) return Number(current.income)
  const settings = (budgetData.settings ?? {}) as Record<string, unknown>
  const primary = Number(settings.primaryIncomeAmount)
  return Number.isFinite(primary) ? primary : 0
}

// ---- public API ----

const budgetDoc = (uid: string) => doc(db, 'users', uid, 'budget', 'continuous_data')
const categoriesCol = (uid: string) => collection(db, 'users', uid, 'categories')

export async function loadBudget(uid: string): Promise<LoadedBudget> {
  const [catSnap, bDoc] = await Promise.all([getDocs(categoriesCol(uid)), getDoc(budgetDoc(uid))])
  const categories = catSnap.docs
    .map((d) => parseCategory(d.id, (d.data() ?? {}) as Record<string, unknown>))
    .sort((a, b) => a.sortOrder - b.sortOrder)
  const bData = (bDoc.data() ?? {}) as Record<string, unknown>
  return { categories, income: resolveIncome(bData), transactions: parseTransactions(bData.transactions) }
}

export async function saveCategory(uid: string, cat: BudgetCategory): Promise<void> {
  // Per-doc upsert (merge:false — the web owns the whole category doc it writes).
  await setDoc(doc(categoriesCol(uid), cat.id), categoryToFirestore(cat), { merge: false })
}

export async function removeCategory(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(categoriesCol(uid), id))
}

// Append one transaction. Read-before-write so we never drop existing entries;
// merge so we never disturb settings/snapshots/other iOS-only fields.
export async function addTransaction(uid: string, tx: BudgetTransaction): Promise<void> {
  const snap = await getDoc(budgetDoc(uid))
  const existing = Array.isArray(snap.data()?.transactions) ? (snap.data()!.transactions as unknown[]) : []
  await setDoc(budgetDoc(uid), { transactions: [...existing, transactionToFirestore(tx)] }, { merge: true })
}

export async function deleteTransaction(uid: string, txId: string): Promise<void> {
  const snap = await getDoc(budgetDoc(uid))
  const existing = Array.isArray(snap.data()?.transactions) ? (snap.data()!.transactions as Record<string, unknown>[]) : []
  await setDoc(budgetDoc(uid), { transactions: existing.filter((t) => t.id !== txId) }, { merge: true })
}

// Set the student's monthly income. If a current month snapshot exists, mirror
// income into it (so iOS, which prefers snapshot.income, stays consistent);
// otherwise write settings.primaryIncomeAmount. Both go through merge and never
// clobber sibling fields.
export async function setIncome(uid: string, amount: number): Promise<void> {
  const value = Math.max(0, Number(amount) || 0)
  const snap = await getDoc(budgetDoc(uid))
  const data = (snap.data() ?? {}) as Record<string, unknown>
  const snaps = Array.isArray(data.snapshots) ? (data.snapshots as Record<string, unknown>[]) : []
  const currentId = data.currentSnapshotId as string | undefined
  const idx = currentId ? snaps.findIndex((s) => s.id === currentId) : -1

  if (idx >= 0) {
    const updated = snaps.map((s, i) => (i === idx ? { ...s, income: value, userPredictedIncome: value } : s))
    await setDoc(budgetDoc(uid), { snapshots: updated }, { merge: true })
  } else {
    await setDoc(budgetDoc(uid), { settings: { primaryIncomeAmount: value, hasCompletedOnboarding: true } }, { merge: true })
  }
}
