'use client'
// First-run budgeting onboarding for the web. Mirrors the iOS BudgetOnboardingFlow
// (welcome → 5 concept slides → overview → income → template → settings → ready),
// adapted to the web's receipt-printer + boxes interaction model. Pure UI + local
// state; the parent performs the Firestore writes via onComplete.
import { useState } from 'react'
import { sfEmoji } from '@/lib/sfIcon'
import { BUDGET_TEMPLATES, type BudgetTemplate } from '@/lib/budget/templates'

export interface OnboardingResult {
  income: number
  template: BudgetTemplate
  autoSweepUnallocatedToSavings: boolean
  weeklyCheckInWeekday: number // 0–6 (Sun–Sat)
  skimRate: number // 0.0–1.0
}

const STEPS = [
  'welcome', 'how1', 'how2', 'how3', 'how4', 'how5',
  'overview', 'income', 'template', 'settings', 'ready',
] as const
type Step = (typeof STEPS)[number]

const CONCEPT_LAST = 6 // steps 0..6 are intro/concept (skippable → jump to income)
const INCOME_STEP = 7
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

const money = (n: number) => '$' + (Math.round(n * 100) / 100).toLocaleString(undefined, { maximumFractionDigits: 2 })

export default function BudgetOnboarding({ onComplete }: { onComplete: (r: OnboardingResult) => Promise<void> | void }) {
  const [i, setI] = useState(0)
  const step: Step = STEPS[i]

  const [incomeStr, setIncomeStr] = useState('')
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [autoSweep, setAutoSweep] = useState(true)
  const [weekday, setWeekday] = useState(1)
  const [skimPct, setSkimPct] = useState('20')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const income = parseFloat(incomeStr) || 0
  const template = BUDGET_TEMPLATES.find((t) => t.id === templateId) ?? null

  const canAdvance =
    step === 'income' ? income > 0 :
    step === 'template' ? !!template :
    true

  const go = (n: number) => { setErr(''); setI(Math.max(0, Math.min(STEPS.length - 1, n))) }
  const next = () => { if (canAdvance) go(i + 1) }
  const back = () => go(i - 1)
  const skipIntro = () => go(INCOME_STEP)

  const finish = async () => {
    if (!template || income <= 0) { go(INCOME_STEP); return }
    setBusy(true); setErr('')
    try {
      await onComplete({
        income,
        template,
        autoSweepUnallocatedToSavings: autoSweep,
        weeklyCheckInWeekday: weekday,
        skimRate: Math.max(0, Math.min(100, parseFloat(skimPct) || 0)) / 100,
      })
    } catch {
      setErr('Something went wrong saving your budget. Check your connection and try again.')
      setBusy(false)
    }
  }

  const progress = (i / (STEPS.length - 1)) * 100

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* progress */}
      <div className="h-1 rounded-full bg-textTitle/10 overflow-hidden mb-8">
        <div className="h-full bg-brandGreen transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full">
        {step === 'welcome' && <Welcome />}
        {step === 'how1' && <How1 />}
        {step === 'how2' && <How2 />}
        {step === 'how3' && <How3 />}
        {step === 'how4' && <How4 />}
        {step === 'how5' && <How5 />}
        {step === 'overview' && <Overview />}
        {step === 'income' && <Income value={incomeStr} onChange={setIncomeStr} />}
        {step === 'template' && <Templates selected={templateId} onSelect={setTemplateId} />}
        {step === 'settings' && (
          <Settings autoSweep={autoSweep} setAutoSweep={setAutoSweep} weekday={weekday} setWeekday={setWeekday} skimPct={skimPct} setSkimPct={setSkimPct} />
        )}
        {step === 'ready' && template && <Ready income={income} template={template} />}
      </div>

      {err && <p className="max-w-2xl mx-auto w-full mt-4 text-sm text-[#B23838]">{err}</p>}

      {/* nav */}
      <div className="max-w-2xl mx-auto w-full mt-10 flex items-center gap-3">
        {i > 0 && (
          <button onClick={back} disabled={busy} className="text-sm font-semibold text-textTitle/65 hover:text-textTitle px-4 py-3 disabled:opacity-50">← Back</button>
        )}
        {i <= CONCEPT_LAST && (
          <button onClick={skipIntro} className="text-sm text-textTitle/65 hover:text-textTitle underline">Skip intro</button>
        )}
        <div className="ml-auto">
          {step === 'ready' ? (
            <button onClick={finish} disabled={busy} className="bg-brandGreen text-white font-bold text-sm px-7 py-3 rounded-xl hover:bg-[#3d4e3d] disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
              {busy ? 'Setting up…' : 'Enter my budget →'}
            </button>
          ) : (
            <button onClick={next} disabled={!canAdvance} className="bg-brandGreen text-white font-bold text-sm px-7 py-3 rounded-xl hover:bg-[#3d4e3d] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accentGold">
              {i <= CONCEPT_LAST ? 'Continue →' : 'Next →'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- shared bits ----
function Eyebrow() {
  return <p className="text-[11px] font-semibold tracking-[0.14em] uppercase text-brandGreen">Bread Head · Budget</p>
}
function H({ children }: { children: React.ReactNode }) {
  return <h1 className="font-display italic text-textTitle text-3xl md:text-4xl leading-tight mt-1">{children}</h1>
}
function Sub({ children }: { children: React.ReactNode }) {
  return <p className="text-textTitle/65 text-[15px] leading-relaxed mt-3 max-w-[52ch]">{children}</p>
}
function Note({ children }: { children: React.ReactNode }) {
  return <p className="mt-6 text-[13px] text-textTitle/65 bg-white/60 border border-textTitle/10 rounded-xl px-4 py-3">{children}</p>
}
function Badge({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-white border border-textTitle/10 rounded-xl px-4 py-3">
      <span className="text-xl">{icon}</span>
      <span className="text-[14px] font-medium text-textTitle">{text}</span>
    </div>
  )
}

// ---- steps ----
function Welcome() {
  return (
    <div>
      <Eyebrow />
      <H>Welcome to Budgeting!</H>
      <Sub>Master your money with envelope-style budgeting made for teens.</Sub>
      <div className="flex flex-col gap-2.5 mt-7">
        <Badge icon="📅" text="Continuous monthly tracking" />
        <Badge icon="📊" text="Weekly advisory check-ins" />
        <Badge icon="💵" text="Smart savings suggestions" />
      </div>
    </div>
  )
}
function How1() {
  return (
    <div>
      <Eyebrow />
      <H>Step 1 · Available Bread</H>
      <Sub>Think of this as your monthly money pool — everything you have to work with.</Sub>
      <div className="mt-6 bg-white border border-textTitle/10 rounded-2xl p-5">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-textTitle/65 mb-2">Examples</p>
        <ul className="text-[14px] text-textTitle/70 space-y-1.5">
          <li>• $200 allowance per month</li>
          <li>• $400 from a part-time job</li>
          <li>• $150 birthday money + $50 allowance</li>
        </ul>
      </div>
      <Note>This is the starting point — the total money you have to work with each month.</Note>
    </div>
  )
}
function How2() {
  return (
    <div>
      <Eyebrow />
      <H>Step 2 · Category Boxes</H>
      <Sub>Divide your money into spending categories — each box is one category.</Sub>
      <Note>Each box gets its own “envelope” with a planned amount. When it’s gone, you know you’ve hit your limit. 💡 You can add, rename, and manage boxes anytime.</Note>
    </div>
  )
}
function How3() {
  return (
    <div>
      <Eyebrow />
      <H>Step 3 · Track Spending</H>
      <Sub>Two easy moves to log an expense:</Sub>
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        <div className="bg-white border border-textTitle/10 rounded-2xl p-5">
          <div className="text-2xl mb-2">🧾</div>
          <p className="font-semibold text-[14px] text-textTitle">1 · Print a receipt</p>
          <p className="text-[13px] text-textTitle/65 mt-1">Enter an amount and what it was for.</p>
        </div>
        <div className="bg-white border border-textTitle/10 rounded-2xl p-5">
          <div className="text-2xl mb-2">📦</div>
          <p className="font-semibold text-[14px] text-textTitle">2 · Drag it into a box</p>
          <p className="text-[13px] text-textTitle/65 mt-1">Drop the receipt onto a category to file it.</p>
        </div>
      </div>
      <Note>Your progress bars update instantly — you always know exactly how much you have left. 💵 You can add income too, like birthday money, bonuses, or cash gifts.</Note>
    </div>
  )
}
function How4() {
  return (
    <div>
      <Eyebrow />
      <H>Step 4 · Monthly Reset</H>
      <Sub>A fresh start every month — completely automatic.</Sub>
      <Note>No manual work needed. Your budget refreshes when a new month starts, based on your standing targets.</Note>
    </div>
  )
}
function How5() {
  return (
    <div>
      <Eyebrow />
      <H>Step 5 · Weekly Guidance</H>
      <Sub>Helpful insights and suggestions — all optional.</Sub>
      <Note>Nothing is automatic or mandatory. You’re always in control of your money.</Note>
    </div>
  )
}
function Overview() {
  const items = [
    { n: '1', t: 'Set your income', d: 'How much you have to work with this month.' },
    { n: '2', t: 'Pick a starter plan', d: 'We’ll create your boxes for you.' },
    { n: '3', t: 'Choose your preferences', d: 'How your budget behaves automatically.' },
  ]
  return (
    <div>
      <Eyebrow />
      <H>Set up your budget</H>
      <Sub>It takes less than a minute. Here’s what we’ll do:</Sub>
      <div className="flex flex-col gap-2.5 mt-6">
        {items.map((it) => (
          <div key={it.n} className="flex items-start gap-3.5 bg-white border border-textTitle/10 rounded-xl px-4 py-3.5">
            <span className="shrink-0 w-7 h-7 grid place-items-center rounded-full bg-brandGreen text-white font-bold text-sm">{it.n}</span>
            <div>
              <p className="font-semibold text-[14px] text-textTitle">{it.t}</p>
              <p className="text-[13px] text-textTitle/65">{it.d}</p>
            </div>
          </div>
        ))}
      </div>
      <Note>💡 You can change any of this later.</Note>
    </div>
  )
}
function Income({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Eyebrow />
      <H>What’s your income this month?</H>
      <Sub>Enter how much you expect to earn — your boxes scale automatically.</Sub>
      <div className="mt-7 bg-white border border-textTitle/10 rounded-2xl p-6">
        <label className="flex flex-col gap-2">
          <span className="text-[10.5px] font-bold tracking-[0.1em] uppercase text-textTitle/65">Monthly amount</span>
          <span className="font-display italic text-4xl text-textTitle">$
            <input autoFocus value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" placeholder="600"
              className="w-40 border-b-2 border-textTitle/15 focus:border-brandGreen outline-none font-display italic text-4xl bg-transparent" />
          </span>
        </label>
      </div>
      <Note>Tip: include allowance, part-time job, or any expected money.</Note>
    </div>
  )
}
function Templates({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  return (
    <div>
      <Eyebrow />
      <H>Choose your budget style</H>
      <Sub>Pick a starter plan to get going quickly.</Sub>
      <div className="grid gap-3 mt-6">
        {BUDGET_TEMPLATES.map((t) => {
          const on = selected === t.id
          return (
            <button key={t.id} onClick={() => onSelect(t.id)} aria-pressed={on} type="button"
              className={`text-left bg-white rounded-2xl p-5 border-2 transition ${on ? 'border-brandGreen shadow-[0_8px_20px_rgba(26,46,26,0.12)]' : 'border-textTitle/10 hover:border-textTitle/25'}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="font-semibold text-[15px] text-textTitle">{t.name}</p>
                <span className={`shrink-0 w-5 h-5 rounded-full border-2 grid place-items-center ${on ? 'border-brandGreen bg-brandGreen' : 'border-textTitle/25'}`}>
                  {on && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
              </div>
              <p className="text-[13px] text-textTitle/65 mt-1.5 leading-relaxed">{t.description}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {t.categories.map((c) => (
                  <span key={c.name} className="inline-flex items-center gap-1 text-[11.5px] font-medium text-textTitle/70 bg-[#DCE5C9] rounded-full px-2.5 py-1">
                    <span>{sfEmoji(c.iconKey)}</span>{c.name} {c.targetValue}%
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      <Note>You can add, remove, and customize boxes later.</Note>
    </div>
  )
}
function Settings({ autoSweep, setAutoSweep, weekday, setWeekday, skimPct, setSkimPct }: {
  autoSweep: boolean; setAutoSweep: (v: boolean) => void
  weekday: number; setWeekday: (v: number) => void
  skimPct: string; setSkimPct: (v: string) => void
}) {
  return (
    <div>
      <Eyebrow />
      <H>Configure your preferences</H>
      <Sub>Customize how your budget behaves automatically. These run on the mobile app.</Sub>
      <div className="flex flex-col gap-3 mt-6">
        <div className="flex items-center justify-between gap-4 bg-white border border-textTitle/10 rounded-2xl p-4">
          <div>
            <p className="font-semibold text-[14px] text-textTitle">Auto-sweep leftovers to savings</p>
            <p className="text-[13px] text-textTitle/65">Move unspent money into savings at month’s end.</p>
          </div>
          <button role="switch" aria-checked={autoSweep} onClick={() => setAutoSweep(!autoSweep)}
            className={`shrink-0 w-12 h-7 rounded-full transition relative ${autoSweep ? 'bg-brandGreen' : 'bg-textTitle/20'}`}>
            <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-[left] ${autoSweep ? 'left-[22px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex items-center justify-between gap-4 bg-white border border-textTitle/10 rounded-2xl p-4">
          <div>
            <p className="font-semibold text-[14px] text-textTitle">Weekly check-in day</p>
            <p className="text-[13px] text-textTitle/65">When to nudge you to review your spending.</p>
          </div>
          <select value={weekday} onChange={(e) => setWeekday(parseInt(e.target.value))}
            className="border border-textTitle/15 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brandGreen/40 bg-white">
            {WEEKDAYS.map((d, idx) => <option key={d} value={idx}>{d}</option>)}
          </select>
        </div>
        <div className="flex items-center justify-between gap-4 bg-white border border-textTitle/10 rounded-2xl p-4">
          <div>
            <p className="font-semibold text-[14px] text-textTitle">Skim rate</p>
            <p className="text-[13px] text-textTitle/65">Auto-save this % of new income.</p>
          </div>
          <div className="flex items-center gap-1">
            <input value={skimPct} onChange={(e) => setSkimPct(e.target.value)} inputMode="decimal"
              className="w-16 border border-textTitle/15 rounded-lg px-2 py-2 text-sm text-center outline-none focus:ring-2 focus:ring-brandGreen/40" />
            <span className="text-textTitle/65 text-sm">%</span>
          </div>
        </div>
      </div>
      <Note>You can change these later in Settings.</Note>
    </div>
  )
}
function Ready({ income, template }: { income: number; template: BudgetTemplate }) {
  return (
    <div>
      <Eyebrow />
      <H>You’re all set!</H>
      <Sub>Your budget workspace is ready. Your boxes refresh each month based on your standing targets.</Sub>
      <div className="mt-6 bg-white border border-textTitle/10 rounded-2xl p-5 flex flex-col gap-2.5">
        <Row label="Monthly income" value={money(income)} />
        <Row label="Starter plan" value={template.name} />
        <Row label="Boxes" value={`${template.categories.length} categories`} />
      </div>
    </div>
  )
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[14px]">
      <span className="text-textTitle/65">{label}</span>
      <span className="font-semibold text-textTitle tabular-nums">{value}</span>
    </div>
  )
}
