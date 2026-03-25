import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Journal — Bread Head',
  description: 'Short reflection prompts tied to your real financial activity. Notice your patterns, understand your habits, and build awareness that sticks.',
}

const FEATURES = [
  {
    number: '01',
    title: 'Tied to your actual activity.',
    body: 'Journal entries are linked to your real financial data — not generic prompts. What you write connects to what you\'ve been spending, saving, and doing.',
  },
  {
    number: '02',
    title: 'Short by design.',
    body: 'Each prompt takes 2–3 minutes. The goal isn\'t to write essays about money — it\'s to surface one thought, notice one pattern, or name one feeling before it drives a decision.',
  },
  {
    number: '03',
    title: 'Month in Review.',
    body: 'At the end of each month, the journal surfaces a summary of your financial activity and prompts you to reflect on the full picture — what worked, what didn\'t, and what to do differently.',
  },
]

const PROMPTS = [
  {
    prompt: 'You logged three dining transactions this week. How did each one feel — planned, impulsive, or social?',
    context: 'After a spending pattern surfaces',
  },
  {
    prompt: 'Your savings rate dropped below target this month. What got in the way — an unexpected expense, or a gradual drift?',
    context: 'After a T2 savings warning',
  },
  {
    prompt: 'You stayed under budget in every category this week. What made that easier than usual?',
    context: 'After a strong week',
  },
  {
    prompt: 'You allocated everything in your budget this month. How does having every dollar assigned feel compared to before?',
    context: 'After first full zero-based budget',
  },
]

export default function JournalPage() {
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
              Journal
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(32px, 4.5vw, 60px)',
                color: '#1A2E1A',
                lineHeight: 1.08,
                marginBottom: '24px',
                maxWidth: '700px',
              }}
            >
              Reflection is the skill schools skip hardest.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '520px' }}>
              You can know exactly how budgets work, track every dollar you spend, and still keep making the same choices. That&apos;s not a knowledge problem — it&apos;s a reflection problem.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '520px' }}>
              The Bread Head journal surfaces prompts tied to your real financial activity — not generic advice, but questions based on what you&apos;re actually doing.
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
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3vw, 42px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '56px',
                maxWidth: '560px',
              }}
            >
              Two minutes a day. A year of clarity.
            </h2>
          </FadeUp>

          <div
            className="journal-features-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}
          >
            {FEATURES.map((item, i) => (
              <FadeUp key={item.number} delay={i * 0.1} style={{ height: '100%' }}>
                <div
                  className="card-border"
                  style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px 32px', height: '100%', boxSizing: 'border-box' }}
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '36px', color: '#D1A945', lineHeight: 1, marginBottom: '16px' }}>
                    {item.number}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '17px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '12px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── EXAMPLE PROMPTS ── */}
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
              Example Prompts
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.2vw, 46px)',
                color: '#F5F0E8',
                lineHeight: 1.12,
                marginBottom: '16px',
                maxWidth: '600px',
              }}
            >
              Questions that come from your data, not a template.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.75, maxWidth: '540px', marginBottom: '64px' }}>
              Prompts surface based on what&apos;s actually happened in your budget — a pattern, a warning, a good week, or a full month closed out.
            </p>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PROMPTS.map((p, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div
                  className="prompt-row"
                  style={{
                    paddingTop: '32px',
                    paddingBottom: '32px',
                    borderTop: '1px solid rgba(245,240,232,0.08)',
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap: '48px',
                    alignItems: 'start',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.30)', margin: 0, paddingTop: '3px' }}>
                    {p.context}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(245,240,232,0.80)', lineHeight: 1.6, margin: 0 }}>
                    &ldquo;{p.prompt}&rdquo;
                  </p>
                </div>
              </FadeUp>
            ))}
            <div style={{ borderTop: '1px solid rgba(245,240,232,0.08)' }} />
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
              Your money story, in your own words.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.7, marginBottom: '36px' }}>
              The journal doesn&apos;t track your net worth. It tracks how you think and feel about money — which is where every financial decision actually starts.
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
