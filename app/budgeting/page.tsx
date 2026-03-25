import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Budgeting — Bread Head',
  description: 'A complete monthly budgeting system — plan your income, build categories, track every transaction, and get three-tier warnings before things go wrong.',
}

const FEATURES = [
  {
    number: '01',
    title: 'Budget Simulator',
    body: 'The main dashboard. See your full picture: Available Bread (what\'s left to spend), allocated vs. unallocated income, per-category progress, and your savings rate — all live in one place.',
  },
  {
    number: '02',
    title: 'Category Center',
    body: 'Create and organize your own spending categories. Add fixed payments — recurring bills, subscriptions — as children of any category. Archive what you\'re not using without losing history.',
  },
  {
    number: '03',
    title: 'Transaction Entry',
    body: 'Log an expense or income in seconds. One modal handles both. Every transaction is tagged to a category and updates your budget the moment you save it.',
  },
  {
    number: '04',
    title: 'Budget Insights',
    body: 'Spending-by-category charts, trend pacing, month-over-month comparisons, and a Month in Review summary at the end of each month. See patterns you\'d otherwise miss.',
  },
]

const WARNINGS = [
  {
    tier: 'T1',
    label: 'Advisory',
    color: '#D1A945',
    bg: 'rgba(209,169,69,0.12)',
    border: 'rgba(209,169,69,0.28)',
    examples: [
      "You've used 80% of your dining budget.",
      "Your budget has unallocated income — every dollar should have a job.",
    ],
  },
  {
    tier: 'T2',
    label: 'Significant',
    color: '#E8843A',
    bg: 'rgba(232,132,58,0.12)',
    border: 'rgba(232,132,58,0.28)',
    examples: [
      "Over 50% of your income is locked in fixed payments.",
      "You're on pace to overspend entertainment by 40% this month.",
      "Discretionary spending is above 60% of your total budget.",
    ],
  },
  {
    tier: 'T3',
    label: 'Critical',
    color: '#D94F4F',
    bg: 'rgba(217,79,79,0.12)',
    border: 'rgba(217,79,79,0.28)',
    examples: [
      "You've spent more than your income this month.",
      "Your budget is exhausted — no remaining funds.",
      "Savings rate is critically below your target.",
    ],
  },
]

const METRICS = [
  {
    name: 'Available Bread',
    description: 'Remaining spendable money this month — income minus committed bills, savings allocation, and what you\'ve already spent.',
  },
  {
    name: 'Allocated vs. Unallocated',
    description: 'How much of your income has been assigned to a category. An unallocated dollar is a dollar without a plan.',
  },
  {
    name: 'Spent vs. Budget',
    description: 'Per-category and overall progress against your plan. Updated in real time every time you log a transaction.',
  },
  {
    name: 'Savings Rate',
    description: 'Actual savings as a percentage of income, tracked against your personal target — not a generic rule.',
  },
]

export default function BudgetingPage() {
  return (
    <main>

      {/* ── HERO ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '160px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              Budgeting
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(32px, 4.5vw, 60px)',
                color: '#1A2E1A',
                lineHeight: 1.08,
                marginBottom: '24px',
                maxWidth: '720px',
              }}
            >
              See where your money actually goes.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '540px' }}>
              Most budgeting tools are built for adults with mortgages. Bread Head&apos;s is built for your life — part-time income, categories that actually make sense, and warnings that catch problems before they become habits.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '540px' }}>
              Plan your month, track every transaction, and watch <strong style={{ color: '#1A2E1A', fontWeight: 600 }}>Available Bread</strong> — your real, spendable balance — update in real time.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#E6EDD9',
                background: '#4A5D4A',
                padding: '14px 30px',
                borderRadius: '100px',
                textDecoration: 'none',
              }}
            >
              Get Early Access →
            </a>
          </FadeUp>
        </div>
      </section>

      {/* ── CORE FEATURES ── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              What&apos;s Inside
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3vw, 42px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '56px',
                maxWidth: '560px',
              }}
            >
              A complete budgeting system.
            </h2>
          </FadeUp>

          <div
            className="budgeting-how-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}
          >
            {FEATURES.map((item, i) => (
              <FadeUp key={item.number} delay={i * 0.08} style={{ height: '100%' }}>
                <div
                  className="card-border"
                  style={{ background: '#FFFFFF', borderRadius: '20px', padding: '32px 28px', height: '100%', boxSizing: 'border-box' }}
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '36px', color: '#D1A945', lineHeight: 1, marginBottom: '16px' }}>
                    {item.number}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '16px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '10px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'rgba(26,46,26,0.58)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── KEY METRICS ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              Key Metrics
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3vw, 42px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '56px',
                maxWidth: '560px',
              }}
            >
              Your financial pulse, at a glance.
            </h2>
          </FadeUp>

          <div
            className="budgeting-metrics-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}
          >
            {METRICS.map((m, i) => (
              <FadeUp key={m.name} delay={i * 0.07} style={{ height: '100%' }}>
                <div
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '28px 24px',
                    height: '100%',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(26,46,26,0.08)',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '10px' }}>
                    {m.name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.65, margin: 0 }}>
                    {m.description}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WARNING SYSTEM ── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D1A945', marginBottom: '16px' }}>
              Financial Pulse Hub
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.2vw, 46px)',
                color: '#F5F0E8',
                lineHeight: 1.12,
                marginBottom: '16px',
                maxWidth: '640px',
              }}
            >
              Three-tier warnings. Caught before they become habits.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.75, maxWidth: '560px', marginBottom: '64px' }}>
              Bread Head watches your spending, allocation, and savings rate automatically. When something&apos;s off, you get a warning — graded by how serious it is, not just that it exists.
            </p>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {WARNINGS.map((w, i) => (
              <FadeUp key={w.tier} delay={i * 0.1}>
                <div
                  className="warning-row"
                  style={{
                    paddingTop: '36px',
                    paddingBottom: '36px',
                    borderTop: '1px solid rgba(245,240,232,0.08)',
                    display: 'grid',
                    gridTemplateColumns: '180px 1fr',
                    gap: '48px',
                    alignItems: 'start',
                  }}
                >
                  {/* Tier badge */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: w.color,
                        background: w.bg,
                        border: `1px solid ${w.border}`,
                        borderRadius: '100px',
                        padding: '6px 14px',
                        width: 'fit-content',
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: w.color, flexShrink: 0 }} />
                      {w.tier} · {w.label}
                    </span>
                  </div>

                  {/* Examples */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {w.examples.map((ex) => (
                      <p key={ex} style={{ fontFamily: 'var(--font-body)', fontSize: '14.5px', color: 'rgba(245,240,232,0.65)', lineHeight: 1.6, margin: 0 }}>
                        &ldquo;{ex}&rdquo;
                      </p>
                    ))}
                  </div>
                </div>
              </FadeUp>
            ))}
            <div style={{ borderTop: '1px solid rgba(245,240,232,0.08)', paddingTop: '32px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(245,240,232,0.35)', lineHeight: 1.7, maxWidth: '560px', margin: 0 }}>
                Warnings come from two sources: your live budget math (spending vs. allocation) and the Budget Insights Engine (trend analysis). Both feed the Financial Pulse Hub on your main screen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          <FadeUp delay={0}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.5vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Knowing your budget is already ahead.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.7, marginBottom: '36px' }}>
              Most adults have never built a real budget — not because they&apos;re bad with money, but because nobody taught them and the tools weren&apos;t made for them.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#E6EDD9',
                background: '#4A5D4A',
                padding: '14px 32px',
                borderRadius: '100px',
                textDecoration: 'none',
              }}
            >
              Get Early Access →
            </a>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
