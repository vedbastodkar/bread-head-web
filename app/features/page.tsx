import type { Metadata } from 'next'
import Link from 'next/link'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'App — Bread Head',
  description: 'Three tools built to make financial literacy stick: bite-sized lessons, a personal budget tracker, and a reflection journal.',
}

const FEATURES = [
  {
    number: '01',
    verb: 'Learn',
    name: 'Lessons',
    description: 'Bite-sized slides on every personal finance concept that matters. Tap through, answer to unlock, and understand exactly why you got it right — or wrong.',
    href: '/lessons',
    stat: '10 units · 80+ lessons',
  },
  {
    number: '02',
    verb: 'Track',
    name: 'Budgeting',
    description: 'Set your income, build spending categories, and log purchases as you make them. Not a simulation — a real record of where your money actually goes.',
    href: '/budgeting',
    stat: 'Real-time tracking',
  },
  {
    number: '03',
    verb: 'Reflect',
    name: 'Journal',
    description: 'Short daily prompts to help you notice your money habits, recognize your patterns, and turn that awareness into different decisions.',
    href: '/journal',
    stat: '2–3 min prompts',
  },
]

const WHY = [
  {
    lead: 'Learn without tracking or reflecting.',
    body: 'You understand compound interest, opportunity cost, and why budgets matter. Then you get paid on Friday and the money is gone by Sunday. Knowledge without reflection is just trivia — it doesn\'t change behavior on its own.',
  },
  {
    lead: 'Track without learning or reflecting.',
    body: 'You can see every dollar you\'ve spent. You can watch yourself make the same bad call every single month. But seeing a problem you don\'t understand — and haven\'t thought about — doesn\'t fix it. It just makes you feel worse.',
  },
  {
    lead: 'Reflect without tracking or learning.',
    body: 'You know you\'re off with money. You feel it. But reflection without data is just a feeling, and feelings without knowledge don\'t point anywhere useful. You can\'t course-correct without something real to work from.',
  },
]

export default function FeaturesPage() {
  return (
    <main>

      {/* ── HERO ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            paddingTop: '160px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              The App
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(34px, 5vw, 64px)',
                color: '#1A2E1A',
                lineHeight: 1.08,
                marginBottom: '20px',
              }}
            >
              One app. Three tools.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 20px' }}>
              Bread Head is built around a complete loop: learn the concepts, track what you actually do, reflect on the gap between them.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {['Learn', 'Track', 'Reflect'].map((label, i) => (
                <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: '#4A5D4A' }}>{label}</span>
                  {i < 2 && <span style={{ color: 'rgba(26,46,26,0.25)', fontSize: '13px' }}>→</span>}
                </span>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FEATURE TILES + WHY SECTION ── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >

          {/* Tiles */}
          <div
            className="features-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '96px' }}
          >
            {FEATURES.map((f, i) => (
              <FadeUp key={f.number} delay={i * 0.1} style={{ height: '100%' }}>
                <Link href={f.href} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
                  <div
                    className="card-border card-hover"
                    style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px 32px', height: '100%', boxSizing: 'border-box', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}
                  >
                    <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '40px', color: '#D1A945', lineHeight: 1, marginBottom: '12px' }}>
                      {f.number}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '10px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '4px' }}>
                      {f.verb}
                    </p>
                    <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '20px', color: '#1A2E1A', lineHeight: 1.2, marginBottom: '14px' }}>
                      {f.name}
                    </h3>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(26,46,26,0.58)', lineHeight: 1.7, flex: 1, marginBottom: '24px' }}>
                      {f.description}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(26,46,26,0.35)' }}>
                        {f.stat}
                      </span>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '13px', color: '#4A5D4A' }}>
                        Explore →
                      </span>
                    </div>
                  </div>
                </Link>
              </FadeUp>
            ))}
          </div>

          {/* Why all three */}
          <FadeUp delay={0}>
            <div style={{ borderTop: '1px solid rgba(26,46,26,0.08)', paddingTop: '72px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
                Why All Three
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(26px, 3vw, 42px)',
                  color: '#1A2E1A',
                  lineHeight: 1.15,
                  marginBottom: '16px',
                  maxWidth: '600px',
                }}
              >
                Each tool is incomplete without the others.
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.75, marginBottom: '56px', maxWidth: '580px' }}>
                Most financial apps do one thing. Bread Head is built around a complete cycle — because knowing, tracking, and reflecting don&apos;t work in isolation.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                {WHY.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: '32px',
                      paddingBottom: '32px',
                      borderTop: '1px solid rgba(26,46,26,0.08)',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.6fr',
                      gap: '48px',
                      alignItems: 'start',
                    }}
                    className="why-row"
                  >
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '17px', color: '#1A2E1A', lineHeight: 1.4, margin: 0 }}>
                      {item.lead}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.58)', lineHeight: 1.75, margin: 0 }}>
                      {item.body}
                    </p>
                  </div>
                ))}
                <div style={{ paddingTop: '40px', borderTop: '1px solid rgba(26,46,26,0.08)' }}>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: '#1A2E1A', lineHeight: 1.75, maxWidth: '640px', fontWeight: 500 }}>
                    The loop closes when you have all three. The lessons teach you what to do. The budget tracker shows you what you&apos;re actually doing. The journal helps you understand the gap between them — and close it.
                  </p>
                </div>
              </div>
            </div>
          </FadeUp>
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
              All three. Free to start.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.7, marginBottom: '36px' }}>
              No credit card. No commitment. Just a better relationship with money.
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
