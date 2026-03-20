import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import PartnerForm from './PartnerForm'

export const metadata: Metadata = {
  title: 'Partners — Bread Head',
  description:
    'Partner with Bread Head to bring financial literacy to every teen you serve. Schools, nonprofits, and foundations welcome.',
}

// ── Partner type cards ────────────────────────────────────────────
const PARTNER_TYPES = [
  {
    number: '01',
    title: 'Individual Students',
    badge: 'Free forever',
    description:
      'No school. No program. No institution required. Bread Head is free to download and use for any student, anywhere. If you\'re a teen who wants to learn how money actually works, just get the app.',
    features: [
      'Free to download, free to use — always',
      'No account required to start',
      'Works on iPhone and Android',
      'No ads, no upsells, no paywalls',
    ],
    cta: null,
  },
  {
    number: '02',
    title: 'Schools & Districts',
    badge: 'Most common',
    description:
      'Integrate Bread Head into existing economics, life skills, or financial literacy courses. Lessons are standards-aligned, self-paced, and require zero teacher training to deploy.',
    features: [
      'Standards-aligned curriculum',
      'Student progress dashboards',
      'Zero cost to students or families',
      'Works alongside existing coursework',
    ],
    cta: 'Talk to us about your district →',
  },
  {
    number: '03',
    title: 'Youth Organizations',
    badge: null,
    description:
      'Bring financial literacy to after-school programs, summer camps, and community centers. The self-paced format works without a classroom structure or dedicated teacher.',
    features: [
      'No classroom structure required',
      'Works on any device',
      'Flexible pacing for any program format',
      'Measurable outcomes for grant reporting',
    ],
    cta: 'Talk to us about your program →',
  },
  {
    number: '04',
    title: 'Corporate & Foundation',
    badge: null,
    description:
      'Fund access for underserved communities, sponsor a cohort of students, or partner to build curriculum that responsibly introduces teens to real financial products and decisions.',
    features: [
      'Named sponsorship opportunities',
      'Impact reporting and reach metrics',
      'Co-branded curriculum options',
      'Direct community investment',
    ],
    cta: 'Talk to us about funding →',
  },
]

// ── Gap stats ─────────────────────────────────────────────────────
const GAP_STATS = [
  { number: '73%', label: 'of teens have never seen a pay stub' },
  { number: '0 hrs', label: 'required financial education in most US states' },
  { number: '$1,300', label: 'average credit card debt of adults under 25' },
]

export default function PartnersPage() {
  return (
    <main>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
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
              Institutional Grade
            </p>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(32px, 5vw, 60px)',
                color: '#1A2E1A',
                lineHeight: 1.1,
                maxWidth: '720px',
                marginBottom: '24px',
              }}
            >
              Bring financial literacy to every teen you serve.
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '17px',
                color: 'rgba(26,46,26,0.65)',
                lineHeight: 1.7,
                maxWidth: '560px',
                marginBottom: '40px',
              }}
            >
              Whether you represent a school district, a youth nonprofit, or a
              corporate foundation — Bread Head is built to scale with you.
            </p>

            {/* Hero stats */}
            <div
              className="partners-hero-stats"
              style={{ display: 'inline-flex', gap: '64px' }}
            >
              {[
                { number: '2,400+', label: 'teens on the waitlist' },
                { number: '100%', label: 'free for students' },
              ].map((s) => (
                <div key={s.number}>
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '48px',
                      color: '#1A2E1A',
                      lineHeight: 1,
                      marginBottom: '8px',
                    }}
                  >
                    {s.number}
                  </p>
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '13px',
                      color: 'rgba(26,46,26,0.5)',
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

      {/* ── PARTNER TYPES ───────────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
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
              Who We Work With
            </p>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                color: '#E6EDD9',
                lineHeight: 1.15,
                marginBottom: '48px',
              }}
            >
              Four ways to partner.
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {PARTNER_TYPES.map((p) => (
                <div
                  key={p.number}
                  className="card-border partners-type-card"
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    padding: '40px',
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap: '48px',
                    alignItems: 'start',
                  }}
                >
                  {/* Left */}
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '48px',
                        color: '#D1A945',
                        WebkitTextStroke: '1.5px #1A2E1A',
                        lineHeight: 1,
                        marginBottom: '8px',
                      }}
                    >
                      {p.number}
                    </p>
                    <h3
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '20px',
                        color: '#1A2E1A',
                        marginBottom: p.badge ? '12px' : '0',
                      }}
                    >
                      {p.title}
                    </h3>
                    {p.badge && (
                      <span
                        style={{
                          display: 'inline-block',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 500,
                          fontSize: '11px',
                          color: '#4A5D4A',
                          background: 'rgba(74,93,74,0.10)',
                          borderRadius: '100px',
                          padding: '4px 10px',
                        }}
                      >
                        {p.badge}
                      </span>
                    )}
                  </div>

                  {/* Right */}
                  <div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        fontSize: '15px',
                        color: 'rgba(26,46,26,0.65)',
                        lineHeight: 1.7,
                        marginBottom: '20px',
                      }}
                    >
                      {p.description}
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {p.features.map((f) => (
                        <li
                          key={f}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '10px',
                            fontFamily: 'var(--font-body)',
                            fontWeight: 400,
                            fontSize: '14px',
                            color: 'rgba(26,46,26,0.65)',
                            lineHeight: 1.6,
                            marginBottom: '8px',
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '6px',
                              borderRadius: '2px',
                              background: '#4A5D4A',
                              marginTop: '6px',
                              flexShrink: 0,
                            }}
                          />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {p.cta && (
                      <a
                        href="/partners"
                        style={{
                          display: 'inline-block',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 500,
                          fontSize: '14px',
                          color: '#4A5D4A',
                          textDecoration: 'none',
                          marginTop: '24px',
                          transition: 'text-decoration 0.15s ease',
                        }}
                      >
                        {p.cta}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── WHY BREAD HEAD ──────────────────────────────────────── */}
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
              Why It Matters
            </p>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: 0,
              }}
            >
              The gap is real. The solution is ready.
            </h2>

            <div
              className="partners-why-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '64px',
                marginTop: '48px',
                alignItems: 'start',
              }}
            >
              {/* Left: gap stats */}
              <div>
                {GAP_STATS.map((s, i) => (
                  <div
                    key={s.number}
                    style={{
                      borderBottom:
                        i < GAP_STATS.length - 1
                          ? '0.5px solid rgba(26,46,26,0.08)'
                          : 'none',
                      paddingBottom: i < GAP_STATS.length - 1 ? '32px' : '0',
                      marginBottom: i < GAP_STATS.length - 1 ? '32px' : '0',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: '52px',
                        color: '#4A5D4A',
                        lineHeight: 1,
                        marginBottom: '8px',
                      }}
                    >
                      {s.number}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        fontSize: '14px',
                        color: 'rgba(26,46,26,0.6)',
                        margin: 0,
                      }}
                    >
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>

              {/* Right: paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  "Financial illiteracy isn't a personal failing. It's a systemic gap. The teenagers who struggle most with money in their twenties weren't irresponsible — they were just never taught.",
                  "Bread Head exists to close that gap at scale. And we can only do that with institutional partners who believe the same thing.",
                  "Every partnership directly funds expanded access for students who can't afford to learn these lessons the hard way.",
                ].map((text, i) => (
                  <p
                    key={i}
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '15px',
                      color: 'rgba(26,46,26,0.65)',
                      lineHeight: 1.75,
                      margin: 0,
                    }}
                  >
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── CONTACT FORM ────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
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
              Get In Touch
            </p>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 38px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '16px',
              }}
            >
              Let&apos;s talk about your students.
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '15px',
                color: 'rgba(26,46,26,0.6)',
                marginBottom: '40px',
                lineHeight: 1.6,
              }}
            >
              Fill out the form below and we&apos;ll respond within 2 business days.
            </p>

            <PartnerForm />
          </FadeUp>
        </div>
      </section>

      {/* ── REASSURANCE STRIP ───────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            paddingTop: '48px',
            paddingBottom: '48px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '16px',
              color: 'rgba(230,237,217,0.6)',
              margin: 0,
            }}
          >
            Every message gets a real response. No automated sales sequences.
          </p>
        </div>
      </section>

      <Footer />
    </main>
  )
}
