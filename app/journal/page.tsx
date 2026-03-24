import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Journal — Bread Head',
  description: 'Short daily prompts to help you notice your money patterns, understand your habits, and build a healthier relationship with spending.',
}

const FEATURES = [
  {
    number: '01',
    title: 'Short prompts. Not essays.',
    body: 'Each journal prompt takes 2–3 minutes. Designed to fit in a break, not carve out a block in your day.',
  },
  {
    number: '02',
    title: 'Notice your patterns.',
    body: 'See your money emotions and habits over weeks, not just days. Anxiety, impulse, avoidance — patterns you can\'t fix until you can see them.',
  },
  {
    number: '03',
    title: 'A mirror, not a report card.',
    body: 'There are no wrong answers. The journal isn\'t grading you — it\'s helping you understand yourself. That\'s the whole point.',
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
              You can read every lesson about spending and still blow your paycheck — because habits aren&apos;t built by knowing. They&apos;re built by noticing, pausing, and choosing differently next time.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '520px' }}>
              The Bread Head journal turns that reflection into a daily practice.
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

      {/* ── FEATURES ── */}
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

      {/* ── CLOSING ── */}
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
              Your money story, in your own words.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.60)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '520px', margin: '0 auto 40px' }}>
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
