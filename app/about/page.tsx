import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About — Bread Head',
  description:
    'Learn why Bread Head exists, what we believe, and who\'s building it.',
}

// ── Value card data ───────────────────────────────────────────────
const VALUES = [
  {
    title: 'Respect the learner',
    body: "Teens aren't children. We don't talk down, dumb down, or sugarcoat. Every lesson treats the reader like the capable adult they're becoming.",
  },
  {
    title: 'Real over theoretical',
    body: 'Pay stubs over abstract economics. Apartment budgets over hypothetical portfolios. If a teen won\'t face it in the next five years, it\'s not in the curriculum.',
  },
  {
    title: 'Habits over knowledge',
    body: "Knowing isn't doing. Bread Head is built around repetition, reflection, and small daily actions — because that's what actually changes financial behavior.",
  },
  {
    title: 'Access for everyone',
    body: "A teen in a well-funded district shouldn't have a better financial future than one who isn't. We're building toward universal access, regardless of zip code.",
  },
]

// ── Stats bar data ────────────────────────────────────────────────
const STATS = [
  { number: '2,400+', label: 'teens on the waitlist' },
  { number: '5–9 min', label: 'per lesson, no fluff' },
  { number: '3', label: 'core features: learn, simulate, reflect' },
  { number: '100%', label: 'free for students, always' },
]

export default function AboutPage() {
  return (
    <main>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '160px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: '#D1A945',
                marginBottom: '16px',
                lineHeight: 1,
              }}
            >
              Our Story
            </p>

            {/* H1 */}
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(36px, 5vw, 64px)',
                color: '#E6EDD9',
                lineHeight: 1.1,
                maxWidth: '700px',
                marginBottom: '24px',
              }}
            >
              Built by someone who wished it existed.
            </h1>

            {/* Subheadline */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '17px',
                color: 'rgba(230,237,217,0.7)',
                lineHeight: 1.7,
                maxWidth: '580px',
                margin: 0,
              }}
            >
              Bread Head started with a simple frustration — every teenager is
              expected to manage money, file taxes, and understand credit within
              months of graduating. Nobody teaches them how.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── MISSION ───────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
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
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: '#4A5D4A',
                marginBottom: '24px',
                lineHeight: 1,
              }}
            >
              The Mission
            </p>

            {/* Pull quote */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(24px, 3.5vw, 42px)',
                color: '#1A2E1A',
                lineHeight: 1.3,
                marginBottom: 0,
              }}
            >
              Financial literacy isn&apos;t a privilege.
              <br />
              It&apos;s a right. And right now,
              <br />
              most teenagers don&apos;t have it.
            </h2>

            {/* Supporting copy */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '16px',
                color: 'rgba(26,46,26,0.65)',
                lineHeight: 1.7,
                marginTop: '32px',
                marginBottom: 0,
              }}
            >
              We&apos;re closing the gap between what schools teach and what life
              actually requires — one 5-minute lesson at a time.
            </p>
          </FadeUp>
        </div>
      </section>

      {/* ── VALUES ────────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            {/* Eyebrow */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '11px',
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: '#4A5D4A',
                marginBottom: '16px',
                lineHeight: 1,
              }}
            >
              What We Believe
            </p>

            {/* Section H2 */}
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                margin: 0,
              }}
            >
              Principles we build by.
            </h2>

            {/* Value cards grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '24px',
                marginTop: '48px',
              }}
            >
              {VALUES.map((v) => (
                <div
                  key={v.title}
                  className="card-border card-hover"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '32px',
                  }}
                >
                  {/* Icon placeholder */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'rgba(74,93,74,0.10)',
                      marginBottom: '20px',
                      flexShrink: 0,
                    }}
                  />

                  <h3
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '16px',
                      color: '#1A2E1A',
                      marginBottom: '10px',
                    }}
                  >
                    {v.title}
                  </h3>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '14px',
                      color: 'rgba(26,46,26,0.65)',
                      lineHeight: 1.7,
                      margin: 0,
                    }}
                  >
                    {v.body}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FOUNDER ───────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <div
              className="about-founder-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 3fr',
                gap: '64px',
                alignItems: 'center',
              }}
            >
              {/* Left: photo placeholder */}
              <div
                style={{
                  width: '100%',
                  aspectRatio: '4 / 5',
                  borderRadius: '20px',
                  background: 'rgba(74,93,74,0.12)',
                  border: '0.5px solid rgba(74,93,74,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '13px',
                    color: 'rgba(26,46,26,0.4)',
                    margin: 0,
                    textAlign: 'center',
                  }}
                >
                  Photo coming soon
                </p>
              </div>

              {/* Right: bio */}
              <div>
                {/* Eyebrow */}
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.13em',
                    textTransform: 'uppercase',
                    color: '#4A5D4A',
                    marginBottom: '16px',
                    lineHeight: 1,
                  }}
                >
                  The Founder
                </p>

                {/* Name */}
                <h3
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '28px',
                    color: '#1A2E1A',
                    marginBottom: '4px',
                  }}
                >
                  Vedu
                </h3>

                {/* Role */}
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '14px',
                    color: '#4A5D4A',
                    marginBottom: '24px',
                    lineHeight: 1,
                  }}
                >
                  Founder &amp; Builder
                </p>

                {/* Bio paragraphs */}
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '15px',
                    color: 'rgba(26,46,26,0.65)',
                    lineHeight: 1.75,
                    marginBottom: '16px',
                  }}
                >
                  I built Bread Head because I got to the end of high school and
                  realized I had no idea how any of it worked — taxes, credit,
                  rent, insurance. The frustration wasn&apos;t that the information
                  was hard to find. It was that no one had ever thought to teach
                  it.
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '15px',
                    color: 'rgba(26,46,26,0.65)',
                    lineHeight: 1.75,
                    marginBottom: '16px',
                  }}
                >
                  My background is in software and product design. I&apos;ve spent
                  the last few years building apps and learning what makes people
                  actually change their behavior — not just what makes them nod
                  along in a classroom.
                </p>
                <p
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 400,
                    fontSize: '15px',
                    color: 'rgba(26,46,26,0.65)',
                    lineHeight: 1.75,
                    marginBottom: 0,
                  }}
                >
                  The goal is a world where every teenager — regardless of
                  where they grew up or what their parents knew — graduates
                  with the financial foundation to make real decisions. We&apos;re
                  nowhere near there yet. That&apos;s why this exists.
                </p>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            paddingTop: '64px',
            paddingBottom: '64px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <div
              className="about-stats-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '32px',
                textAlign: 'center',
              }}
            >
              {STATS.map((s) => (
                <div key={s.number}>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '48px',
                      color: '#D1A945',
                      lineHeight: 1,
                      marginBottom: '10px',
                    }}
                  >
                    {s.number}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '13px',
                      color: 'rgba(230,237,217,0.55)',
                      lineHeight: 1.4,
                      margin: 0,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
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
                fontWeight: 700,
                fontSize: 'clamp(24px, 3vw, 36px)',
                color: '#1A2E1A',
                lineHeight: 1.2,
                marginBottom: 0,
              }}
            >
              Want to bring Bread Head to your community?
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '15px',
                color: 'rgba(26,46,26,0.65)',
                lineHeight: 1.7,
                marginTop: '16px',
                marginBottom: '32px',
              }}
            >
              We&apos;re actively partnering with schools, youth organizations, and
              foundations. Reach out — we respond to every message.
            </p>

            {/* CTA buttons */}
            <div
              className="about-cta-buttons"
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/partners"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: '#E6EDD9',
                  textDecoration: 'none',
                  background: '#4A5D4A',
                  borderRadius: '100px',
                  padding: '12px 32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              >
                Partner with us →
              </Link>

              <Link
                href="/#cta"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: '#4A5D4A',
                  textDecoration: 'none',
                  background: 'rgba(74,93,74,0.10)',
                  borderRadius: '100px',
                  padding: '12px 32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'background 0.2s ease',
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(74,93,74,0.16)')}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(74,93,74,0.10)')}
              >
                Get Early Access
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
