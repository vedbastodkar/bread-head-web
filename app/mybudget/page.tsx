'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { sfEmoji } from '@/lib/sfIcon'
import {
  newBudgetId,
  resolveAllocated,
  spentByCategory,
  totalSpent,
  availableBread,
  savingsRate,
  allocatedTotal,
  unallocated,
  budgetWarnings,
  type BudgetCategory,
  type BudgetTransaction,
  type NwsLevel,
} from '@/lib/budget/budget'
import { loadBudget, saveCategory, addTransaction, setIncome as persistIncome } from '@/lib/budget/store'

const money = (n: number) =>
  '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })

// Box presets for the "new box" picker — SF Symbol key (shared with iOS) + a colour.
const BOX_PRESETS: { key: string; color: string }[] = [
  { key: 'fork.knife', color: '#C56B4A' },
  { key: 'banknote.fill', color: '#3A785A' },
  { key: 'gamecontroller.fill', color: '#6A5AA8' },
  { key: 'bus.fill', color: '#4A5D4A' },
  { key: 'bag.fill', color: '#C79A2E' },
  { key: 'house.fill', color: '#4A6C8A' },
  { key: 'gift.fill', color: '#B0567A' },
  { key: 'book.fill', color: '#7A6A4A' },
]

interface Receipt { id: string; amount: number; name: string; nws: NwsLevel }

export default function MyBudgetPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [income, setIncomeState] = useState(0)
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [transactions, setTransactions] = useState<BudgetTransaction[]>([])

  // receipt printer state
  const [amt, setAmt] = useState('14')
  const [what, setWhat] = useState('')
  const [nws, setNws] = useState<NwsLevel>('want')
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [selected, setSelected] = useState<string | null>(null)

  const [hot, setHot] = useState<string | null>(null) // box being hovered during drag/select
  const [saveErr, setSaveErr] = useState('')
  const boxRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    ;(async () => {
      try {
        const b = await loadBudget(user.uid)
        setIncomeState(b.income)
        setCategories(b.categories.filter((c) => c.isActive))
        setTransactions(b.transactions)
      } catch (e) {
        setSaveErr('Could not load your budget. Refresh to try again.')
      }
      setReady(true)
    })()
  }, [loading, user, router])

  const spent = spentByCategory(transactions)

  // ---- actions ----
  const printReceipt = () => {
    const a = parseFloat(amt)
    if (!a || a <= 0) return
    setReceipts((r) => [...r, { id: newBudgetId(), amount: a, name: what.trim() || 'Receipt', nws }])
    setWhat('')
  }

  const fileInto = useCallback(async (catId: string, receipt: Receipt) => {
    if (!user) return
    const tx: BudgetTransaction = {
      id: newBudgetId(),
      type: 'expense',
      amount: receipt.amount,
      categoryId: catId,
      nwsLevel: receipt.nws,
      name: receipt.name,
      date: Date.now(),
    }
    setTransactions((t) => [...t, tx])
    setReceipts((r) => r.filter((x) => x.id !== receipt.id))
    setSelected(null)
    setHot(null)
    try { await addTransaction(user.uid, tx) }
    catch { setSaveErr('That receipt didn’t save. Check your connection.') }
  }, [user])

  const tapBox = (catId: string) => {
    if (!selected) return
    const r = receipts.find((x) => x.id === selected)
    if (r) fileInto(catId, r)
  }

  const addBox = async (name: string, key: string, color: string, mode: 'percent' | 'fixed', value: number) => {
    if (!user || !name.trim()) return
    const cat: BudgetCategory = {
      id: newBudgetId(), name: name.trim(), iconKey: key, color,
      targetMode: mode, targetValue: value, sortOrder: categories.length,
      isActive: true, isSystemCategory: false, fixedPayments: [],
    }
    setCategories((c) => [...c, cat])
    try { await saveCategory(user.uid, cat) }
    catch { setSaveErr('That box didn’t save. Check your connection.') }
  }

  const saveIncome = async (v: number) => {
    setIncomeState(v)
    if (user) { try { await persistIncome(user.uid, v) } catch { setSaveErr('Income didn’t save.') } }
  }

  // ---- pointer drag ----
  // Uses pointer capture so events keep flowing to the receipt even if the
  // browser tries to start its own native drag; a pointercancel handler
  // guarantees the ghost/original are always restored (never "stuck").
  const dragRef = useRef<{ receipt: Receipt; ghost: HTMLElement } | null>(null)
  const onReceiptPointerDown = (e: React.PointerEvent, receipt: Receipt) => {
    if (e.button && e.button !== 0) return
    e.preventDefault()
    const el = e.currentTarget as HTMLElement
    const pointerId = e.pointerId
    const rect = el.getBoundingClientRect()
    const start = { x: e.clientX, y: e.clientY }
    let started = false
    let ghost: HTMLElement | null = null
    try { el.setPointerCapture(pointerId) } catch { /* older browsers */ }

    const restore = () => {
      if (ghost) { ghost.remove(); ghost = null }
      el.style.visibility = ''
      dragRef.current = null
      setHot(null)
    }
    const cleanup = () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointercancel', cancel)
      try { el.releasePointerCapture(pointerId) } catch { /* no-op */ }
    }
    const move = (ev: PointerEvent) => {
      if (!started && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
        started = true
        ghost = el.cloneNode(true) as HTMLElement
        ghost.style.cssText += `position:fixed;left:0;top:0;width:${rect.width}px;pointer-events:none;z-index:999;opacity:.95`
        document.body.appendChild(ghost)
        el.style.visibility = 'hidden'
        dragRef.current = { receipt, ghost }
      }
      if (started && ghost) {
        ghost.style.transform = `translate(${ev.clientX - rect.width / 2}px, ${ev.clientY - 24}px) rotate(-3deg)`
        setHot(boxUnder(ev.clientX, ev.clientY))
      }
    }
    const up = (ev: PointerEvent) => {
      cleanup()
      if (started) {
        const target = boxUnder(ev.clientX, ev.clientY)
        restore()
        if (target) fileInto(target, receipt) // no box under release → just snaps back
      } else {
        setSelected((s) => (s === receipt.id ? null : receipt.id)) // tap = select
      }
    }
    const cancel = () => { cleanup(); restore() }

    el.addEventListener('pointermove', move)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointercancel', cancel)
  }
  const boxUnder = (x: number, y: number): string | null => {
    for (const [id, el] of Object.entries(boxRefs.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return id
    }
    return null
  }

  if (loading || !ready) return <main className="min-h-screen bg-bgSage pt-28" />

  const spentTotal = totalSpent(transactions)
  const warns = budgetWarnings({ income, categories, transactions })
  const sRate = Math.round(savingsRate(income, transactions))
  const alloc = allocatedTotal(categories, income)
  const unalloc = unallocated(income, categories)
  const allocPct = income > 0 ? Math.min(100, (alloc / income) * 100) : 0

  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-2">
          <div>
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Bread Head · Budget</p>
            <h1 className="font-display italic text-textTitle text-4xl md:text-5xl leading-none mt-1">My Budget</h1>
          </div>
          <div className="bg-textTitle text-bgSage rounded-2xl px-6 py-4 min-w-[220px]">
            <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-accentGold m-0">Available Bread</p>
            <p className="font-display italic text-4xl leading-none mt-1 tabular-nums">{money(availableBread(income, transactions))}</p>
            <p className="text-xs text-bgSage/60 mt-1">{money(spentTotal)} spent of {money(income)}</p>
          </div>
        </div>

        <Link href="/dashboard" className="text-sm text-textTitle/50 hover:text-textTitle">← Back to dashboard</Link>

        {saveErr && (
          <div className="mt-4 rounded-xl bg-[#D94F4F]/10 border border-[#D94F4F]/30 text-[#B23838] text-sm px-4 py-3">{saveErr}</div>
        )}

        {/* income setup */}
        <IncomeCard income={income} onSave={saveIncome} />

        {/* WORKBENCH */}
        <section className="mt-6 rounded-3xl border border-textTitle/10 p-5" style={{ background: 'linear-gradient(180deg,#EEF2E4,#E1E9D0)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">The workbench</p>
            <p className="text-[12.5px] text-textTitle/60">Make a receipt, then <b className="text-textTitle">drag it into a box</b> — or tap the receipt, then tap a box.</p>
          </div>

          {/* printer */}
          <div className="bg-white border border-textTitle/10 rounded-2xl p-4 flex items-end gap-4 flex-wrap">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Amount</span>
              <span className="font-display italic text-textTitle text-2xl">$<input value={amt} onChange={(e) => setAmt(e.target.value)} inputMode="decimal" className="w-24 border-b-2 border-textTitle/15 focus:border-brandGreen outline-none font-display italic text-3xl bg-transparent" /></span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">What for</span>
              <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="Chipotle" className="w-44 border border-textTitle/15 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
            </label>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Need / Want / Save</span>
              <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5">
                {(['need', 'want', 'save'] as NwsLevel[]).map((l) => (
                  <button key={l} onClick={() => setNws(l)} aria-pressed={nws === l}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-md capitalize ${nws === l ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/60'}`}>{l}</button>
                ))}
              </div>
            </div>
            <button onClick={printReceipt} className="ml-auto bg-brandGreen text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#3d4e3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">Print receipt →</button>
          </div>

          {/* tray */}
          <div className="min-h-[140px] flex gap-3.5 flex-wrap pt-4">
            {receipts.length === 0 && (
              <p className="font-display italic text-sm text-textTitle/40 py-6">Your printed receipts land here. Drag one down into a box to file it.</p>
            )}
            {receipts.map((r) => (
              <ReceiptCard key={r.id} r={r} selected={selected === r.id}
                onPointerDown={(e) => onReceiptPointerDown(e, r)} />
            ))}
          </div>

          {/* boxes */}
          <div className="flex items-baseline justify-between mt-6 mb-1">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Your boxes</p>
            <p className="text-[12.5px] text-textTitle/60">Each box is a category.</p>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-textTitle/50 py-4">No boxes yet — add one below to start filing receipts.</p>
          ) : (
            <div className="grid gap-4 pt-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', perspective: '1400px' }}>
              {categories.map((c) => {
                const a = resolveAllocated(c, income)
                const s = spent.get(c.id) ?? 0
                const pct = a > 0 ? Math.min(100, (s / a) * 100) : 0
                const over = a > 0 && s > a
                return (
                  <BoxView key={c.id} c={c} allocated={a} spent={s} pct={pct} over={over}
                    hot={hot === c.id} refCb={(el) => { boxRefs.current[c.id] = el }}
                    onClick={() => tapBox(c.id)} />
                )
              })}
            </div>
          )}

          <AddBoxForm onAdd={addBox} disabledColors={categories.map((c) => c.color)} />
        </section>

        {/* STATS */}
        <section className="mt-8 bg-white rounded-3xl border border-textTitle/10 p-6 md:p-8">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Your stats</p>
          <h2 className="font-display italic text-3xl text-textTitle mt-1 mb-1">Every dollar, accounted for.</h2>
          <p className="text-textTitle/60 text-sm mb-7 max-w-[60ch]">The same numbers the iOS app tracks — recomputed live as you file receipts.</p>

          <div className="grid md:grid-cols-2 gap-5">
            <div className="border border-textTitle/10 rounded-2xl p-5">
              <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-textTitle/40 mb-4">Spent vs. budget by box</h3>
              {categories.length === 0 && <p className="text-sm text-textTitle/40">Add a box to see stats.</p>}
              {categories.map((c) => {
                const a = resolveAllocated(c, income)
                const s = spent.get(c.id) ?? 0
                const pct = a > 0 ? Math.min(100, (s / a) * 100) : 0
                const over = a > 0 && s > a
                return (
                  <div key={c.id} className="grid grid-cols-[24px_1fr_auto] gap-3 items-center mb-4 last:mb-0">
                    <span className="text-lg">{sfEmoji(c.iconKey)}</span>
                    <div>
                      <p className="text-[13px] font-semibold mb-1">{c.name}</p>
                      <div className="h-2 rounded-full bg-[#DCE5C9] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? '#D94F4F' : c.color }} />
                      </div>
                    </div>
                    <span className="font-mono text-xs text-textTitle/60 tabular-nums whitespace-nowrap">{money(s)} / {money(a)}</span>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col gap-5">
              <div className="border border-textTitle/10 rounded-2xl p-5">
                <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-textTitle/40 mb-3">Allocated vs. unallocated</h3>
                <div className="h-8 rounded-lg overflow-hidden flex bg-[#DCE5C9]">
                  <span className="flex items-center justify-center font-mono text-[11px] text-white font-semibold" style={{ background: '#4A5D4A', width: `${allocPct}%` }}>{allocPct > 12 ? money(alloc) : ''}</span>
                  <span className="flex items-center justify-center font-mono text-[11px] font-semibold text-[#5c4a12]" style={{ background: '#D1A945', width: `${100 - allocPct}%` }}>{unalloc > 0 && 100 - allocPct > 8 ? money(unalloc) : ''}</span>
                </div>
                <div className="flex gap-4 text-xs text-textTitle/60 mt-2.5">
                  <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: '#4A5D4A' }} />Given a job</span>
                  <span><i className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle" style={{ background: '#D1A945' }} />Unallocated</span>
                </div>
              </div>

              <div className="border border-textTitle/10 rounded-2xl p-5 flex items-center gap-4">
                <div className="relative grid place-items-center w-24 h-24 shrink-0">
                  <div className="w-24 h-24 rounded-full" style={{ background: `conic-gradient(#4A5D4A ${sRate}%, #DCE5C9 0)` }} />
                  <div className="absolute w-[70px] h-[70px] rounded-full bg-white" />
                  <b className="absolute font-display italic text-xl tabular-nums">{sRate}%</b>
                </div>
                <p className="text-sm text-textTitle/60 m-0">Savings rate — money you filed into <b>Save</b>, as a share of income. Target <b>20%</b>.</p>
              </div>
            </div>
          </div>

          <div className="border border-textTitle/10 rounded-2xl p-5 mt-5">
            <h3 className="text-xs font-bold tracking-[0.1em] uppercase text-textTitle/40 mb-3">Financial pulse</h3>
            <div className="flex flex-col gap-2.5">
              <WarnRow live={warns.t1} tier="T1 · ADVISORY" cls="t1" text="You've used more than 80% of a box's budget." />
              <WarnRow live={warns.t2} tier="T2 · SIGNIFICANT" cls="t2" text="Over 60% of your spending is going to Wants." />
              <WarnRow live={warns.t3} tier="T3 · CRITICAL" cls="t3" text="A box is overspent, or you've spent more than your income." />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}

// ---- receipt card ----
function ReceiptCard({ r, selected, onPointerDown }: { r: Receipt; selected: boolean; onPointerDown: (e: React.PointerEvent) => void }) {
  const nwsColor: Record<NwsLevel, string> = {
    need: 'bg-brandGreen/15 text-brandGreen',
    want: 'bg-accentGold/20 text-[#9c7d1f]',
    save: 'bg-[#3A785A]/15 text-[#2f6b4a]',
  }
  return (
    <div role="button" tabIndex={0} onPointerDown={onPointerDown} draggable={false} onDragStart={(e) => e.preventDefault()}
      aria-label={`Receipt: ${r.name}, ${money(r.amount)}, ${r.nws}. Tap to pick up, then tap a box.`}
      className={`w-[172px] p-3.5 pb-5 font-mono cursor-grab select-none rounded-t bg-[#FBF8EF] shadow-[0_6px_16px_rgba(26,46,26,0.14)] ${selected ? 'outline outline-2 outline-dashed outline-brandGreen outline-offset-2' : ''}`}
      style={{ touchAction: 'none' }}>
      <div className="font-sans font-bold text-[13px] text-textTitle border-b border-dashed border-textTitle/25 pb-1.5 mb-2 truncate">{r.name}</div>
      <div className="flex justify-between text-[11px] text-textTitle/60"><span>ITEM</span><span>{money(r.amount)}</span></div>
      <div className="flex justify-between text-[11px] text-textTitle/60"><span>TAX</span><span>$0.00</span></div>
      <div className="flex justify-between text-[15px] font-bold text-textTitle mt-2 pt-2 border-t border-dashed border-textTitle/25"><span>TOTAL</span><span>{money(r.amount)}</span></div>
      <span className={`inline-block text-[9.5px] font-sans font-bold tracking-wide uppercase px-2 py-0.5 rounded-full mt-2 ${nwsColor[r.nws]}`}>{r.nws}</span>
    </div>
  )
}

// ---- 3D box ----
function BoxView({ c, allocated, spent, pct, over, hot, refCb, onClick }: {
  c: BudgetCategory; allocated: number; spent: number; pct: number; over: boolean; hot: boolean
  refCb: (el: HTMLButtonElement | null) => void; onClick: () => void
}) {
  const shade = (hex: string, amt: number) => {
    const n = parseInt(hex.slice(1), 16)
    const r = Math.max(0, Math.min(255, (n >> 16) + amt))
    const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt))
    const b = Math.max(0, Math.min(255, (n & 255) + amt))
    return `rgb(${r},${g},${b})`
  }
  return (
    <button ref={refCb} onClick={onClick} type="button"
      aria-label={`${c.name} box, ${money(spent)} of ${money(allocated)} spent`}
      className="relative text-left p-0 border-0 bg-transparent cursor-pointer transition-transform"
      style={{ transform: hot ? 'rotateX(9deg) translateY(-6px) scale(1.03)' : 'rotateX(9deg)' }}>
      <div className="h-4 mx-1.5 -mb-2 rounded-[50%/100%_100%_0_0]" style={{ background: `linear-gradient(180deg,${shade(c.color, -40)},${shade(c.color, -15)})`, boxShadow: 'inset 0 2px 4px rgba(0,0,0,.12)' }} />
      <div className="relative h-[150px] rounded-b-[10px] rounded-t-md overflow-hidden border border-black/5" style={{ background: `linear-gradient(180deg,${shade(c.color, 18)},${c.color})`, boxShadow: '0 14px 22px rgba(26,46,26,.18)' }}>
        <div className="absolute left-0 right-0 bottom-0 transition-[height] duration-500" style={{ height: `${pct}%`, background: over ? 'linear-gradient(180deg,rgba(217,79,79,.55),transparent)' : 'linear-gradient(180deg,rgba(255,255,255,.28),transparent)' }} />
        {hot && <div className="absolute inset-0 grid place-items-center z-[3] font-sans font-bold text-xs text-white" style={{ background: 'rgba(26,46,26,.34)' }}>Drop here</div>}
        <div className="absolute inset-0 flex flex-col justify-between p-3 z-[2]">
          <div className="text-2xl" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,.15))' }}>{sfEmoji(c.iconKey)}</div>
          <div>
            <p className="font-sans font-bold text-sm text-white m-0" style={{ textShadow: '0 1px 2px rgba(0,0,0,.25)' }}>{c.name}</p>
            <p className="font-mono text-[11.5px] text-white/90 tabular-nums mt-0.5">{money(spent)} / {money(allocated)}</p>
          </div>
        </div>
      </div>
    </button>
  )
}

// ---- income card ----
function IncomeCard({ income, onSave }: { income: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(income <= 0)
  const [val, setVal] = useState(String(income || ''))
  useEffect(() => { setVal(String(income || '')); if (income > 0) setEditing(false) }, [income])
  if (!editing) {
    return (
      <div className="mt-5 flex items-center gap-3 text-sm text-textTitle/70">
        <span>Monthly income: <b className="text-textTitle">{money(income)}</b></span>
        <button onClick={() => setEditing(true)} className="text-brandGreen font-semibold hover:underline">Edit</button>
      </div>
    )
  }
  return (
    <div className="mt-5 bg-white border border-textTitle/10 rounded-2xl p-4 flex items-end gap-3 flex-wrap">
      <label className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Your monthly income</span>
        <span className="font-display italic text-2xl">$<input value={val} onChange={(e) => setVal(e.target.value)} inputMode="decimal" placeholder="600" className="w-28 border-b-2 border-textTitle/15 focus:border-brandGreen outline-none font-display italic text-2xl bg-transparent" /></span>
      </label>
      <button onClick={() => { const v = parseFloat(val); if (v >= 0) onSave(v) }} className="bg-brandGreen text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#3d4e3d]">Save</button>
    </div>
  )
}

// ---- add box form ----
function AddBoxForm({ onAdd, disabledColors }: { onAdd: (name: string, key: string, color: string, mode: 'percent' | 'fixed', value: number) => void; disabledColors: string[] }) {
  const [open, setOpen] = useState(false)
  const firstFree = BOX_PRESETS.find((p) => !disabledColors.includes(p.color)) ?? BOX_PRESETS[0]
  const [name, setName] = useState('')
  const [preset, setPreset] = useState(firstFree)
  const [mode, setMode] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('20')
  if (!open) {
    return <button onClick={() => setOpen(true)} className="mt-5 text-sm font-semibold text-brandGreen hover:underline">+ Add a box</button>
  }
  return (
    <div className="mt-5 bg-white border border-textTitle/10 rounded-2xl p-4 flex items-end gap-4 flex-wrap">
      <label className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Box name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Food" className="w-40 border border-textTitle/15 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
      </label>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Icon</span>
        <div className="flex gap-1.5 flex-wrap max-w-[220px]">
          {BOX_PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p)} aria-pressed={preset.key === p.key}
              className={`w-9 h-9 rounded-lg grid place-items-center text-lg ${preset.key === p.key ? 'ring-2 ring-brandGreen' : 'ring-1 ring-textTitle/10'}`}
              style={{ background: `${p.color}22` }}>{sfEmoji(p.key)}</button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Budget</span>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5">
            {(['percent', 'fixed'] as const).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${mode === m ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/60'}`}>{m === 'percent' ? '% of income' : '$ fixed'}</button>
            ))}
          </div>
          <input value={value} onChange={(e) => setValue(e.target.value)} inputMode="decimal" className="w-16 border border-textTitle/15 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
        </div>
      </div>
      <button onClick={() => { const v = parseFloat(value) || 0; onAdd(name, preset.key, preset.color, mode, v); setName(''); setOpen(false) }}
        className="bg-brandGreen text-white font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-[#3d4e3d]">Add box</button>
      <button onClick={() => setOpen(false)} className="text-sm text-textTitle/50 py-2.5">Cancel</button>
    </div>
  )
}

function WarnRow({ live, tier, cls, text }: { live: boolean; tier: string; cls: 't1' | 't2' | 't3'; text: string }) {
  const styles: Record<string, { bg: string; pill: string }> = {
    t1: { bg: 'rgba(209,169,69,.1)', pill: 'rgba(209,169,69,.2)' },
    t2: { bg: 'rgba(232,132,58,.1)', pill: 'rgba(232,132,58,.2)' },
    t3: { bg: 'rgba(217,79,79,.1)', pill: 'rgba(217,79,79,.2)' },
  }
  const pillText: Record<string, string> = { t1: '#9c7d1f', t2: '#c25f1c', t3: '#b23838' }
  return (
    <div className="flex gap-3 items-start rounded-xl px-3.5 py-3 text-[13px] transition-opacity" style={{ background: styles[cls].bg, opacity: live ? 1 : 0.5 }}>
      <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap shrink-0" style={{ background: styles[cls].pill, color: pillText[cls] }}>{tier}</span>
      <p className="m-0 text-textTitle/60">{text}</p>
    </div>
  )
}
