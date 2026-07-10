'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useStudent } from '@/app/student/useStudent'
import {
  getLibraryChallenge,
} from '@/lib/challenges/library'
import {
  seedBoxes,
  evaluateChallenge,
  allocatedDollars,
  resolveBoxDollars,
  clampAmount,
  type AllocationBox,
  type BoxRole,
  type Challenge,
} from '@/lib/challenges/challenge'

const money = (n: number) => {
  const v = Math.round(n * 100) / 100
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

const roleEmoji: Record<BoxRole, string> = { need: '🏠', want: '🎮', save: '💰' }
const roleLabel: Record<BoxRole, string> = { need: 'Need', want: 'Want', save: 'Save' }

// Local-only id — this surface never persists boxes to Firestore (sandbox).
const newId = () =>
  (typeof crypto !== 'undefined' && 'randomUUID' in crypto)
    ? crypto.randomUUID()
    : 'box-' + Math.random().toString(36).slice(2)

interface ServerResult {
  score: number
  allPassed: boolean
  perCriterion: { kind: string; passed: boolean; detail: string }[]
  status: 'complete' | 'in_progress'
}

export default function ChallengePage({ params }: { params: { assignmentId: string } }) {
  const assignmentId = params.assignmentId
  const { data, err, loading, user } = useStudent()

  const assignment = data?.assignments.find((a) => a.id === assignmentId)
  const challengeId = assignment?.challengeId
  const ch: Challenge | null = challengeId ? getLibraryChallenge(challengeId) : null
  const resolvable = !!assignment && assignment.type === 'challenge' && !!ch

  const [boxes, setBoxes] = useState<AllocationBox[]>([])
  const [reflection, setReflection] = useState('')
  const [pending, setPending] = useState(false)
  const [submitErr, setSubmitErr] = useState('')
  const [server, setServer] = useState<ServerResult | null>(null)
  const seededRef = useRef(false)

  // Seed the mandatory (locked) boxes once the challenge resolves.
  useEffect(() => {
    if (ch && !seededRef.current) {
      seededRef.current = true
      setBoxes(seedBoxes(ch))
    }
  }, [ch])

  // ---- loading / auth / not-found gates (useStudent redirects to /login) ----
  if (loading || (!data && !err)) {
    return <main className="min-h-screen bg-bgSage pt-28" />
  }
  if (!user) {
    // useStudent() already router.replace('/login'); render nothing meanwhile.
    return <main className="min-h-screen bg-bgSage pt-28" />
  }
  if (!resolvable || !ch) {
    return (
      <main className="min-h-screen bg-bgSage pt-28 pb-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Bread Head · Budget Challenge</p>
          <h1 className="font-display italic text-textTitle text-4xl mt-2 mb-3">Challenge not found</h1>
          <p className="text-textTitle/60 text-sm mb-6 max-w-[46ch] mx-auto">
            We couldn’t find this Budget Challenge for your account. It may have been unassigned, or the link is out of date.
          </p>
          <Link href="/dashboard" className="inline-block bg-brandGreen text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#3d4e3d]">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const income = ch.monthly?.income ?? 0
  const result = evaluateChallenge(ch, { boxes })
  const unallocated = income - allocatedDollars({ boxes }, income)

  // ---- box actions (own boxes only; seeded boxes carry mandatoryId → locked) ----
  const addBox = (name: string, role: BoxRole, targetMode: 'fixed' | 'percent', targetValue: number) => {
    setBoxes((b) => [...b, { id: newId(), name: name.trim() || 'New box', role, targetMode, targetValue: clampAmount(targetValue, targetMode, income) }])
    setServer(null)
  }
  const updateBox = (id: string, patch: Partial<AllocationBox>) => {
    setBoxes((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
    setServer(null)
  }
  const deleteBox = (id: string) => {
    setBoxes((b) => b.filter((x) => x.id !== id))
    setServer(null)
  }

  // ---- submit (the ONLY network write on this surface) ----
  const submit = async () => {
    if (!user || !assignment) return
    setPending(true)
    setSubmitErr('')
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/challenge/submit', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId: assignment.classId,
          assignmentId,
          allocation: { boxes },
          reflection: ch.reflection ? reflection : undefined,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json.ok) {
        setSubmitErr(json.error ? `Couldn’t submit: ${json.error}.` : 'Couldn’t submit. Check your connection and try again.')
      } else {
        setServer({ score: json.score, allPassed: json.allPassed, perCriterion: json.perCriterion, status: json.status })
      }
    } catch {
      setSubmitErr('Couldn’t submit. Check your connection and try again.')
    }
    setPending(false)
  }

  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        {/* header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Bread Head · Budget Challenge</p>
            <h1 className="font-display italic text-textTitle text-4xl md:text-5xl leading-tight mt-1">{ch.title}</h1>
          </div>
          <div className="bg-textTitle text-bgSage rounded-2xl px-6 py-4 shrink-0">
            <p className="text-[10.5px] font-bold tracking-[0.14em] uppercase text-accentGold m-0">Monthly income</p>
            <p className="font-display italic text-3xl leading-none mt-1 tabular-nums">{money(income)}</p>
            <p className="text-[11px] text-bgSage/60 mt-1">Fixed — you don’t set this</p>
          </div>
        </div>
        <p className="text-textTitle/70 text-[15px] leading-relaxed mt-3 max-w-[62ch]">{ch.prompt}</p>
        <Link href="/dashboard" className="inline-block mt-3 text-sm text-textTitle/50 hover:text-textTitle">← Back to dashboard</Link>

        {/* ===== the allocation form ===== */}
        <section className="mt-6 rounded-3xl border border-textTitle/10 p-5" style={{ background: 'linear-gradient(180deg,#EEF2E4,#E1E9D0)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Give every dollar a job</p>
            <p className={`text-[13px] font-semibold tabular-nums ${Math.abs(unallocated) <= 0.01 ? 'text-brandGreen' : 'text-[#9c7d1f]'}`}>
              Unallocated: {money(unallocated)}
            </p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {boxes.map((box) => {
              const dollars = resolveBoxDollars(box, income)
              const locked = !!box.mandatoryId
              return (
                <li key={box.id} className="bg-white border border-textTitle/10 rounded-2xl p-3.5">
                  {locked ? (
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-lg" aria-hidden>{roleEmoji[box.role]}</span>
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-textTitle m-0 truncate">{box.name}</p>
                        <p className="text-[11px] text-textTitle/45 m-0">Required bill · locked</p>
                      </div>
                      <span className="ml-auto font-mono text-sm text-textTitle tabular-nums">{money(dollars)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wide text-textTitle/35" aria-hidden>🔒</span>
                    </div>
                  ) : (
                    <BoxRow box={box} income={income} onChange={(p) => updateBox(box.id, p)} onDelete={() => deleteBox(box.id)} />
                  )}
                </li>
              )
            })}
          </ul>

          <AddBoxForm onAdd={addBox} />
        </section>

        {/* ===== live checklist (preview) ===== */}
        <section className="mt-6 bg-white rounded-3xl border border-textTitle/10 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Live checklist</p>
            <span className="text-[11px] text-textTitle/45">Preview — your grade is set when you submit</span>
          </div>
          <ul className="flex flex-col gap-2">
            {result.perCriterion.map((c, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[14px]">
                <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                <span className={c.passed ? 'text-textTitle' : 'text-textTitle/60'}>{c.detail}</span>
                <span className="sr-only">{c.passed ? 'passing' : 'not yet passing'}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 h-2 rounded-full bg-[#DCE5C9] overflow-hidden" role="progressbar"
            aria-valuenow={Math.round(result.score * 100)} aria-valuemin={0} aria-valuemax={100} aria-label="Criteria passed">
            <div className="h-full rounded-full bg-brandGreen transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${result.score * 100}%` }} />
          </div>
        </section>

        {/* ===== reflection (optional) ===== */}
        {ch.reflection && (
          <section className="mt-6 bg-white rounded-3xl border border-textTitle/10 p-5">
            <label htmlFor="reflection" className="block text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen mb-1">Reflection</label>
            <p className="text-[14px] text-textTitle/70 mb-2">{ch.reflection}</p>
            <textarea id="reflection" value={reflection} onChange={(e) => setReflection(e.target.value)} rows={3}
              placeholder="Optional — a sentence or two."
              className="w-full border border-textTitle/15 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40 resize-y" />
          </section>
        )}

        {/* ===== submit + result ===== */}
        {submitErr && (
          <div className="mt-6 rounded-xl bg-[#D94F4F]/10 border border-[#D94F4F]/30 text-[#B23838] text-sm px-4 py-3">{submitErr}</div>
        )}

        {server ? (
          <section className="mt-6 rounded-3xl border p-5" style={{ borderColor: server.allPassed ? '#4A5D4A55' : '#D1A94555', background: server.allPassed ? '#EEF4E6' : '#FBF6E7' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl" aria-hidden>{server.allPassed ? '🎉' : '📋'}</span>
              <div>
                <h2 className="font-display italic text-2xl text-textTitle m-0">
                  {server.allPassed ? 'All criteria passed!' : 'Submitted — some criteria still open'}
                </h2>
                <p className="text-[13px] text-textTitle/60 m-0">
                  Score {Math.round(server.score * 100)}% · Status: {server.status === 'complete' ? 'Complete' : 'In progress'}
                </p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 mt-4">
              {server.perCriterion.map((c, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px]">
                  <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                  <span className={c.passed ? 'text-textTitle' : 'text-textTitle/60'}>{c.detail}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 mt-5 flex-wrap">
              <Link href="/grades" className="bg-brandGreen text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#3d4e3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
                View in Grades →
              </Link>
              <button onClick={() => setServer(null)} className="text-sm font-semibold text-brandGreen hover:underline">
                Keep editing
              </button>
            </div>
          </section>
        ) : (
          <div className="mt-6">
            <button onClick={submit} disabled={pending}
              className="bg-brandGreen text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-[#3d4e3d] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
              {pending ? 'Submitting…' : 'Submit challenge →'}
            </button>
            <p className="text-[12px] text-textTitle/45 mt-2">Your grade is scored on the server — the checklist above is just a preview.</p>
          </div>
        )}
      </div>
    </main>
  )
}

// ---- an editable student-owned box ----
function BoxRow({ box, income, onChange, onDelete }: {
  box: AllocationBox
  income: number
  onChange: (patch: Partial<AllocationBox>) => void
  onDelete: () => void
}) {
  const dollars = resolveBoxDollars(box, income)
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Box name</span>
        <input value={box.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="Groceries"
          className="w-36 border border-textTitle/15 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Type</span>
        <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5" role="group" aria-label="Box type">
          {(['need', 'want', 'save'] as BoxRole[]).map((r) => (
            <button key={r} type="button" onClick={() => onChange({ role: r })} aria-pressed={box.role === r}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${box.role === r ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/60'}`}>
              {roleLabel[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Amount</span>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5" role="group" aria-label="Amount mode">
            {(['fixed', 'percent'] as const).map((m) => (
              <button key={m} type="button" onClick={() => onChange({ targetMode: m, targetValue: clampAmount(box.targetValue, m, income) })} aria-pressed={box.targetMode === m}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${box.targetMode === m ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/60'}`}>
                {m === 'fixed' ? '$ fixed' : '% of income'}
              </button>
            ))}
          </div>
          <input value={box.targetValue} inputMode="decimal" aria-label="Amount value"
            onChange={(e) => onChange({ targetValue: clampAmount(parseFloat(e.target.value) || 0, box.targetMode, income) })}
            className="w-16 border border-textTitle/15 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
        </div>
      </div>

      <span className="font-mono text-sm text-textTitle/70 tabular-nums ml-auto self-center">{money(dollars)}</span>
      <button type="button" onClick={onDelete} aria-label={`Delete ${box.name} box`}
        className="text-sm text-[#B23838] font-semibold px-2 py-1.5 rounded-lg hover:bg-[#D94F4F]/10 self-center">
        Delete
      </button>
    </div>
  )
}

// ---- add-a-box form ----
function AddBoxForm({ onAdd }: { onAdd: (name: string, role: BoxRole, mode: 'fixed' | 'percent', value: number) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [role, setRole] = useState<BoxRole>('need')
  const [mode, setMode] = useState<'fixed' | 'percent'>('fixed')
  const [value, setValue] = useState('100')

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)} className="mt-4 text-sm font-semibold text-brandGreen hover:underline">+ Add a box</button>
  }
  return (
    <div className="mt-4 bg-white border border-dashed border-brandGreen/40 rounded-2xl p-4 flex items-end gap-3 flex-wrap">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/40">New box name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Groceries" autoFocus
          className="w-36 border border-textTitle/15 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
      </label>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Type</span>
        <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5" role="group" aria-label="New box type">
          {(['need', 'want', 'save'] as BoxRole[]).map((r) => (
            <button key={r} type="button" onClick={() => setRole(r)} aria-pressed={role === r}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${role === r ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/60'}`}>
              {roleLabel[r]}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/40">Amount</span>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5" role="group" aria-label="New box amount mode">
            {(['fixed', 'percent'] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMode(m)} aria-pressed={mode === m}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${mode === m ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/60'}`}>
                {m === 'fixed' ? '$ fixed' : '% of income'}
              </button>
            ))}
          </div>
          <input value={value} inputMode="decimal" aria-label="New box amount value"
            onChange={(e) => setValue(e.target.value)}
            className="w-16 border border-textTitle/15 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
        </div>
      </div>
      <button type="button"
        onClick={() => { onAdd(name, role, mode, Math.max(0, parseFloat(value) || 0)); setName(''); setValue('100'); setOpen(false) }}
        className="bg-brandGreen text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#3d4e3d]">Add box</button>
      <button type="button" onClick={() => setOpen(false)} className="text-sm text-textTitle/50 py-2">Cancel</button>
    </div>
  )
}
