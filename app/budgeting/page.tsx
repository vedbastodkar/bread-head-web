import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Budgeting — Bread Head',
  description: 'Track your income and spending with a live budget built for real life. Set categories, see patterns, and take control.',
}

const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Set your income.',
    body: 'Start with what you actually bring in — job, allowance, side hustle. The budget is built on your real numbers, not someone else\'s.',
  },
  {
    number: '02',
    title: 'Build your categories.',
    body: 'Needs, wants, savings, giving. You decide what matters and how much to allocate. No rigid template — your life, your categories.',
  },
  {
    number: '03',
    title: 'Track it live.',
    body: 'Log a purchase in seconds. Watch your budget update in real time. See what\'s left before you decide to spend.',
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
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '520px' }}>
              Most budgeting tools are built for adults with mortgages. Bread Head&apos;s is built for your life — part-time jobs, lunch money, and everything in between.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '520px' }}>
              Set your income, build your categories, and track every dollar without a spreadsheet.
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

      {/* ── HOW IT WORKS ── */}
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
              How It Works
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '56px',
                maxWidth: '560px',
              }}
            >
              A budget you&apos;ll actually use.
            </h2>
          </FadeUp>

          <div
            className="budgeting-how-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}
          >
            {HOW_IT_WORKS.map((item, i) => (
              <FadeUp key={item.number} delay={i * 0.1} style={{ height: '100%' }}>
                <div
                  className="card-border"
                  style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px 32px', height: '100%', boxSizing: 'border-box' }}
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '36px', color: '#D1A945', lineHeight: 1, marginBottom: '16px' }}>
                    {item.number}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '18px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '12px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
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
                fontSize: 'clamp(26px, 3.5vw, 44px)',
                color: '#E6EDD9',
                lineHeight: 1.2,
                marginBottom: '20px',
              }}
            >
              Knowing your budget is already ahead.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.60)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '560px', margin: '0 auto 16px' }}>
              Most adults have never built a real budget. Not because they&apos;re bad with money — because nobody taught them and the tools weren&apos;t built for them.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.60)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '560px', margin: '0 auto 40px' }}>
              Starting now means you won&apos;t have to unlearn bad habits later.
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
                color: '#1A2E1A',
                background: '#D1A945',
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
