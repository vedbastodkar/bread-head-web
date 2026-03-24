import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import FeatureCard from './FeatureCard'

export const metadata: Metadata = {
  title: 'App — Bread Head',
  description: 'Three tools built to make financial literacy stick: bite-sized lessons, a personal budget tracker, and a reflection journal.',
}

const FEATURES = [
  {
    number: '01',
    name: 'Lessons',
    tagline: 'Learn by discovering, not by being told.',
    description: '10 units. 80+ lessons. Tap through slides, answer to unlock, and understand exactly why you got it right or wrong.',
    href: '/lessons',
    iconName: 'book' as const,
    stat: '80+ lessons',
  },
  {
    number: '02',
    name: 'Budgeting',
    tagline: 'See where your money actually goes.',
    description: 'Set your income, build spending categories, and track your budget live. No spreadsheets. No shame. Just clarity.',
    href: '/budgeting',
    iconName: 'budget' as const,
    stat: 'Real-time tracking',
  },
  {
    number: '03',
    name: 'Journal',
    tagline: 'Reflection is the skill schools skip hardest.',
    description: 'Short daily prompts to help you notice your money patterns, understand your habits, and choose differently next time.',
    href: '/journal',
    iconName: 'journal' as const,
    stat: '2–3 min prompts',
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
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, maxWidth: '520px', margin: '0 auto 40px' }}>
              Bread Head combines structured lessons, a personal budget tracker, and a reflection journal — everything you need to actually get good with money.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── FEATURE CARDS ── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '100px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <div
            className="features-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', alignItems: 'stretch' }}
          >
            {FEATURES.map((f, i) => (
              <FadeUp key={f.number} delay={i * 0.1} style={{ height: '100%' }}>
                <FeatureCard
                  number={f.number}
                  name={f.name}
                  tagline={f.tagline}
                  description={f.description}
                  href={f.href}
                  stat={f.stat}
                  iconName={f.iconName}
                />
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#1A2E1A' }}>
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
                fontSize: 'clamp(26px, 3.5vw, 42px)',
                color: '#E6EDD9',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              All three. Free to start.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.60)', lineHeight: 1.7, marginBottom: '36px' }}>
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
