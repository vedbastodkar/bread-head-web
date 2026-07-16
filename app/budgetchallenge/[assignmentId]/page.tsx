'use client'
import { useRef, useState } from 'react'
import Link from 'next/link'
import { useStudent } from '@/app/student/useStudent'
import {
  getLibraryChallenge,
} from '@/lib/challenges/library'
import {
  evaluateChallenge,
  allocatedDollars,
  resolveBoxDollars,
  clampAmount,
  essentialsFloor,
  type AllocationBox,
  type BoxRole,
  type Challenge,
} from '@/lib/challenges/challenge'

const money = (n: number) => {
  const v = Math.round(n * 100) / 100
  return (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })
}

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
  const [submittedSnapshot, setSubmittedSnapshot] = useState<string | null>(null)
  const lastAddedId = useRef<string | null>(null)

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
          <p className="text-textTitle/70 text-sm mb-6 max-w-[46ch] mx-auto">
            We couldn’t find this Budget Challenge for your account. It may have been unassigned, or the link is out of date.
          </p>
          <Link href="/dashboard" className="inline-block bg-brandGreen text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#3d4e3d]">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  // ---- everything below is derived live from `boxes` on every render ----
  const income = ch.monthly?.income ?? 0
  const floor = essentialsFloor(ch)
  const savingsTarget = ch.criteria.find((c) => c.kind === 'min_savings_rate')?.value ?? 0
  const result = evaluateChallenge(ch, { boxes })
  const allocated = allocatedDollars({ boxes }, income)
  const unallocated = income - allocated
  const needsTotal = boxes.filter((b) => b.role === 'need').reduce((s, b) => s + resolveBoxDollars(b, income), 0)
  const savedTotal = boxes.filter((b) => b.role === 'save').reduce((s, b) => s + resolveBoxDollars(b, income), 0)
  const savingsPct = income > 0 ? (savedTotal / income) * 100 : 0
  const dirtySinceSubmit = submittedSnapshot !== null && JSON.stringify(boxes) !== submittedSnapshot

  // ---- box actions (all boxes are student-owned; nothing is seeded/locked) ----
  const addBox = () => {
    const id = newId()
    lastAddedId.current = id
    setBoxes((b) => [...b, { id, name: '', role: 'need' as BoxRole, targetMode: 'fixed', targetValue: 0 }])
  }
  const updateBox = (id: string, patch: Partial<AllocationBox>) => {
    setBoxes((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)))
  }
  const deleteBox = (id: string) => {
    setBoxes((b) => b.filter((x) => x.id !== id))
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
        setSubmittedSnapshot(JSON.stringify(boxes))
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
            <p className="font-display italic text-3xl leading-none mt-1 tabular-nums text-bgSage">{money(income)}</p>
            <p className="text-[11px] text-bgSage/60 mt-1">Fixed — you don’t set this</p>
          </div>
        </div>
        <p className="text-textTitle/70 text-[15px] leading-relaxed mt-3 max-w-[62ch]">{ch.prompt}</p>
        <Link href="/dashboard" className="inline-block mt-3 text-sm text-textTitle/70 hover:text-textTitle">← Back to dashboard</Link>

        {/* ===== sticky live budget summary ===== */}
        <div className="sticky top-[76px] z-10 mt-6 bg-white/95 backdrop-blur border border-textTitle/10 rounded-2xl px-4 py-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[13px]">
            <span className="text-textTitle/70 tabular-nums">Income <b className="text-textTitle">{money(income)}</b></span>
            <span className="text-textTitle/70 tabular-nums">Allocated <b className="text-textTitle">{money(allocated)}</b></span>
            <span className={`font-semibold tabular-nums ${Math.abs(unallocated) <= 0.01 ? 'text-brandGreen' : 'text-[#9c7d1f]'}`}>
              Unallocated {money(unallocated)}
            </span>
            <span className="text-textTitle/70 tabular-nums">Save {savingsPct.toFixed(0)}%/{savingsTarget}%</span>
            <span className="text-textTitle/70 tabular-nums">Needs {money(needsTotal)}/{money(floor)}</span>
          </div>
        </div>

        {/* ===== the allocation form ===== */}
        <section className="mt-6 rounded-3xl border border-textTitle/10 p-5" style={{ background: 'linear-gradient(180deg,#EEF2E4,#E1E9D0)' }}>
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Give every dollar a job</p>
          </div>

          {boxes.length === 0 ? (
            <p className="text-textTitle/70 text-sm py-4 text-center">Add your first bucket — give every dollar a job.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {boxes.map((box) => (
                <li key={box.id} className="bg-white border border-textTitle/10 rounded-2xl p-3.5">
                  <BoxRow
                    box={box}
                    income={income}
                    autoFocus={lastAddedId.current === box.id}
                    onChange={(p) => updateBox(box.id, p)}
                    onDelete={() => deleteBox(box.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          <button type="button" onClick={addBox} className="mt-4 text-sm font-semibold text-brandGreen hover:underline">
            + Add a bucket
          </button>
        </section>

        {/* ===== live checklist (preview) ===== */}
        <section className="mt-6 bg-white rounded-3xl border border-textTitle/10 p-5">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Live checklist</p>
            <span className="text-[11px] text-textTitle/70">Preview — your grade is set when you submit</span>
          </div>
          <ul className="flex flex-col gap-2">
            {result.perCriterion.map((c, i) => (
              <li key={i} className="flex items-center gap-2.5 text-[14px]">
                <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                <span className={c.passed ? 'text-textTitle' : 'text-textTitle/70'}>{c.detail}</span>
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

        {dirtySinceSubmit && (
          <div className="mt-6 rounded-xl bg-[#D1A945]/15 border border-[#D1A945]/40 text-[#7a5f18] text-sm px-4 py-3">
            You’ve changed your budget since submitting — resubmit to update your grade.
          </div>
        )}

        {server ? (
          <section className="mt-6 rounded-3xl border p-5" style={{ borderColor: server.allPassed ? '#4A5D4A55' : '#D1A94555', background: server.allPassed ? '#EEF4E6' : '#FBF6E7' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl" aria-hidden>{server.allPassed ? '🎉' : '📋'}</span>
              <div>
                <h2 className="font-display italic text-2xl text-textTitle m-0">
                  {server.allPassed ? 'All criteria passed!' : 'Submitted — some criteria still open'}
                </h2>
                <p className="text-[13px] text-textTitle/70 m-0">
                  Score {Math.round(server.score * 100)}% · Status: {server.status === 'complete' ? 'Complete' : 'In progress'}
                </p>
              </div>
            </div>
            <ul className="flex flex-col gap-2 mt-4">
              {server.perCriterion.map((c, i) => (
                <li key={i} className="flex items-center gap-2.5 text-[14px]">
                  <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                  <span className={c.passed ? 'text-textTitle' : 'text-textTitle/70'}>{c.detail}</span>
                </li>
              ))}
            </ul>
            <div className="flex items-center gap-4 mt-5 flex-wrap">
              <Link href="/grades" className="bg-brandGreen text-white font-bold text-sm px-5 py-3 rounded-xl hover:bg-[#3d4e3d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
                View in Grades →
              </Link>
              <button onClick={submit} disabled={pending}
                className="bg-white text-brandGreen border border-brandGreen font-bold text-sm px-5 py-3 rounded-xl hover:bg-brandGreen/5 disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
                {pending ? 'Submitting…' : 'Resubmit'}
              </button>
            </div>
          </section>
        ) : (
          <div className="mt-6">
            <button onClick={submit} disabled={pending}
              className="bg-brandGreen text-white font-bold text-sm px-6 py-3.5 rounded-xl hover:bg-[#3d4e3d] disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
              {pending ? 'Submitting…' : submittedSnapshot !== null ? 'Resubmit' : 'Submit challenge →'}
            </button>
            <p className="text-[12px] text-textTitle/70 mt-2">Your grade is scored on the server — the checklist above is just a preview.</p>
          </div>
        )}
      </div>
    </main>
  )
}

// ---- an editable student-owned bucket ----
function BoxRow({ box, income, autoFocus, onChange, onDelete }: {
  box: AllocationBox
  income: number
  autoFocus?: boolean
  onChange: (patch: Partial<AllocationBox>) => void
  onDelete: () => void
}) {
  const dollars = resolveBoxDollars(box, income)
  return (
    <div className="flex items-end gap-3 flex-wrap">
      <label className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/70">Bucket name</span>
        <input value={box.name} onChange={(e) => onChange({ name: e.target.value })}
          placeholder="What's this for? e.g. Rent, Groceries, Savings" autoFocus={autoFocus}
          className="w-56 border border-textTitle/15 rounded-lg px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
      </label>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/70">Type</span>
        <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5" role="group" aria-label="Bucket type">
          {(['need', 'want', 'save'] as BoxRole[]).map((r) => (
            <button key={r} type="button" onClick={() => onChange({ role: r })} aria-pressed={box.role === r}
              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${box.role === r ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/70'}`}>
              {roleLabel[r]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-textTitle/70">Amount</span>
        <div className="flex items-center gap-2">
          <div className="inline-flex bg-[#DCE5C9] rounded-lg p-0.5" role="group" aria-label="Amount mode">
            {(['fixed', 'percent'] as const).map((m) => (
              <button key={m} type="button" onClick={() => onChange({ targetMode: m, targetValue: clampAmount(box.targetValue, m, income) })} aria-pressed={box.targetMode === m}
                className={`text-xs font-semibold px-2.5 py-1.5 rounded-md ${box.targetMode === m ? 'bg-white text-textTitle shadow-sm' : 'text-textTitle/70'}`}>
                {m === 'fixed' ? '$ fixed' : '% of income'}
              </button>
            ))}
          </div>
          <input value={box.targetValue} inputMode="decimal" aria-label="Amount value"
            onChange={(e) => onChange({ targetValue: clampAmount(parseFloat(e.target.value) || 0, box.targetMode, income) })}
            className="w-16 border border-textTitle/15 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40" />
          {box.targetMode === 'percent' && (
            <span className="text-[12px] text-textTitle/70 tabular-nums whitespace-nowrap">= {money(dollars)}</span>
          )}
        </div>
      </div>

      <button type="button" onClick={onDelete} aria-label={`Delete ${box.name || 'bucket'}`}
        className="ml-auto text-sm text-[#B23838] font-semibold px-2 py-1.5 rounded-lg hover:bg-[#D94F4F]/10 self-center">
        🗑
      </button>
    </div>
  )
}
