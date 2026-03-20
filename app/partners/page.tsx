import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import PartnerForm from './PartnerForm'

export const metadata: Metadata = {
  title: 'Partners — Bread Head',
  description:
    'Partner with Bread Head to bring financial literacy to every teen you serve. Schools, nonprofits, and foundations welcome.',
}

// ── Partner type rows ─────────────────────────────────────────────
const PARTNER_TYPES = [
  {
    number: '01',
    title: 'Individual Students',
    description:
      "No school. No program. No institution required. Bread Head is free to download and use for any student, anywhere. If you're a teen who wants to learn how money actually works, just get the app.",
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

// ── Why It Matters stats ──────────────────────────────────────────
const WHY_STATS = [
  {
    number: 'More than 1 in 3',
    label: 'dollars of wealth inequality traced to financial knowledge gaps',
    source: 'https://pensionresearchcouncil.wharton.upenn.edu/wp-content/uploads/2015/08/WP2015-01.pdf',
  },
  {
    number: '$246B',
    label: 'lost yearly to financial illiteracy',
    source: 'https://www.financialeducatorscouncil.org/financial-illiteracy-costs/',
  },
  {
    number: '68% vs 31%',
    label: 'teens who want vs have access to financial education',
    source: 'https://jagkc.org/68-percent-teens-want-financial-education/',
  },
  {
    number: '$34K',
    label: 'average total debt entering adulthood for Gen Z',
    source: 'https://www.experian.com/blogs/ask-experian/average-american-debt-by-age/',
  },
]

export default function PartnersPage() {
  return (
    <main>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          className="partners-hero-inner"
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '120px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            gap: '48px',
          }}
        >
          {/* Left: text */}
          <div style={{ flex: '0 0 55%', maxWidth: '55%' }} className="partners-hero-text">
            <FadeUp delay={0}>
              {/* Eyebrow with green bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <div style={{ width: '2px', height: '20px', background: '#4A5D4A', flexShrink: 0 }} />
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 600,
                    fontSize: '11px',
                    letterSpacing: '0.13em',
                    textTransform: 'uppercase',
                    color: '#4A5D4A',
                    lineHeight: 1,
                  }}
                >
                  Institutional Grade
                </span>
              </div>

              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(32px, 4.5vw, 56px)',
                  color: '#1A2E1A',
                  lineHeight: 1.1,
                  maxWidth: '600px',
                  marginBottom: '20px',
                }}
              >
                Bring financial literacy to every teen you serve.
              </h1>

              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                  fontSize: '16px',
                  color: 'rgba(26,46,26,0.65)',
                  lineHeight: 1.7,
                  maxWidth: '500px',
                  marginBottom: '32px',
                }}
              >
                Whether you represent a school district, a youth nonprofit, or a
                corporate foundation — Bread Head is built to scale with you.
              </p>

              {/* CTA buttons */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <a
                  href="#contact-form"
                  className="partners-cta-primary"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '14px',
                    color: '#E6EDD9',
                    textDecoration: 'none',
                    background: '#4A5D4A',
                    borderRadius: '100px',
                    padding: '12px 28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'opacity 0.15s ease',
                    minHeight: '44px',
                  }}
                >
                  Talk to us →
                </a>
                <a
                  href="#why"
                  className="partners-cta-ghost"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '14px',
                    color: '#1A2E1A',
                    textDecoration: 'none',
                    background: 'transparent',
                    border: '1px solid rgba(26,46,26,0.2)',
                    borderRadius: '100px',
                    padding: '12px 28px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    transition: 'background 0.15s ease',
                    minHeight: '44px',
                  }}
                >
                  See how it works ↓
                </a>
              </div>
            </FadeUp>
          </div>

          {/* Right: stat cards */}
          <div style={{ flex: '0 0 45%', maxWidth: '45%', display: 'flex', flexDirection: 'column', gap: '16px' }} className="partners-hero-stats">
            <FadeUp delay={0.1}>
              {[
                { number: '2,400+', label: 'teens on the waitlist' },
                { number: '100%', label: 'free for students, always' },
              ].map((s) => (
                <div
                  key={s.number}
                  style={{
                    background: '#FFFFFF',
                    border: '0.5px solid rgba(26,46,26,0.10)',
                    borderRadius: '16px',
                    padding: '24px 28px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 700,
                      fontSize: '52px',
                      color: '#1A2E1A',
                      lineHeight: 1,
                      marginBottom: '6px',
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
            </FadeUp>
          </div>
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
            paddingLeft: '32px',
            paddingRight: '32px',
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
              Who We Work With
            </p>

            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                color: '#E6EDD9',
                lineHeight: 1.15,
                marginBottom: '16px',
              }}
            >
              Four ways to partner.
            </h2>
          </FadeUp>

          {/* ── Desktop rows (lg+) ── */}
          <div className="hidden lg:block" style={{ marginTop: '48px' }}>
            {PARTNER_TYPES.map((p, i) => (
              <FadeUp key={p.number} delay={0}>
                <div
                  className="partners-type-row"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '64px',
                    paddingTop: '48px',
                    paddingBottom: '48px',
                    borderBottom:
                      i < PARTNER_TYPES.length - 1
                        ? '0.5px solid rgba(230,237,217,0.10)'
                        : 'none',
                  }}
                >
                  {/* Number block */}
                  <div style={{ width: '160px', flexShrink: 0 }}>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '80px',
                        color: 'rgba(230,237,217,0.08)',
                        lineHeight: 1,
                        marginBottom: '8px',
                      }}
                    >
                      {p.number}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 600,
                        fontSize: '11px',
                        letterSpacing: '0.13em',
                        textTransform: 'uppercase',
                        color: '#D1A945',
                        lineHeight: 1,
                        margin: 0,
                      }}
                    >
                      {p.title}
                    </p>
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '22px',
                        color: '#E6EDD9',
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '8px',
                      }}
                    >
                      {p.title}
                    </h3>

                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        fontSize: '15px',
                        color: 'rgba(230,237,217,0.65)',
                        lineHeight: 1.7,
                        maxWidth: '580px',
                        marginBottom: '20px',
                      }}
                    >
                      {p.description}
                    </p>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
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
                            color: 'rgba(230,237,217,0.65)',
                            lineHeight: 1.6,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '6px',
                              height: '6px',
                              borderRadius: '2px',
                              background: '#D1A945',
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
                        href="#contact-form"
                        className="partners-row-cta"
                        style={{
                          display: 'inline-block',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 500,
                          fontSize: '14px',
                          color: '#D1A945',
                          textDecoration: 'none',
                          marginTop: '20px',
                          transition: 'text-decoration 0.15s ease',
                        }}
                      >
                        {p.cta}
                      </a>
                    )}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* ── Mobile / tablet grid (below lg) ── */}
          <div className="lg:hidden partners-mobile-grid grid grid-cols-2 gap-4 md:gap-6" style={{ marginTop: '40px' }}>
            {PARTNER_TYPES.map((p) => (
              <FadeUp key={p.number} delay={0}>
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '0.5px solid rgba(26,46,26,0.12)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                  }}
                >
                  {/* Top row: label + ghost number */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: '#4A5D4A',
                          lineHeight: 1,
                          margin: 0,
                        }}
                      >
                        {p.title}
                      </p>
                    </div>
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '32px',
                        color: 'rgba(26,46,26,0.07)',
                        lineHeight: 1,
                        margin: 0,
                        flexShrink: 0,
                      }}
                    >
                      {p.number}
                    </p>
                  </div>

                  {/* H3 */}
                  <h3
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '15px',
                      color: '#1A2E1A',
                      lineHeight: 1.25,
                      marginTop: '12px',
                      marginBottom: '8px',
                    }}
                  >
                    {p.title}
                  </h3>

                  {/* Description — first sentence, line-clamp */}
                  <p
                    className="line-clamp-3"
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '12px',
                      color: 'rgba(26,46,26,0.6)',
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {p.description.split('. ')[0] + '.'}
                  </p>

                  {/* CTA — pinned to bottom */}
                  {p.cta ? (
                    <a
                      href="#contact-form"
                      className="partners-row-cta"
                      style={{
                        display: 'inline-block',
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        fontSize: '12px',
                        color: '#4A5D4A',
                        textDecoration: 'none',
                        marginTop: 'auto',
                        paddingTop: '12px',
                        transition: 'text-decoration 0.15s ease',
                      }}
                    >
                      Learn more →
                    </a>
                  ) : (
                    <div style={{ marginTop: 'auto', paddingTop: '12px' }} />
                  )}
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY IT MATTERS ──────────────────────────────────────── */}
      <section id="why" style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
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
                gridTemplateColumns: '45fr 55fr',
                gap: '64px',
                marginTop: '48px',
                alignItems: 'flex-start',
              }}
            >
              {/* Left: stats */}
              <div>
                {WHY_STATS.map((s, i) => (
                  <div
                    key={s.number}
                    style={{
                      paddingBottom: i < WHY_STATS.length - 1 ? '32px' : '0',
                      marginBottom: i < WHY_STATS.length - 1 ? '32px' : '0',
                      borderBottom:
                        i < WHY_STATS.length - 1
                          ? '0.5px solid rgba(26,46,26,0.08)'
                          : 'none',
                    }}
                  >
                    <p
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 700,
                        fontSize: 'clamp(32px, 3.5vw, 48px)',
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
                        lineHeight: 1.5,
                        marginBottom: '6px',
                      }}
                    >
                      {s.label}
                    </p>
                    <a
                      href={s.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="partners-source-link"
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 400,
                        fontSize: '11px',
                        color: 'rgba(26,46,26,0.3)',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      Source ↗
                    </a>
                  </div>
                ))}
              </div>

              {/* Right: paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
      <section id="contact-form" style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '32px',
            paddingRight: '32px',
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
                fontSize: 'clamp(24px, 3vw, 36px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '12px',
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
            paddingTop: '40px',
            paddingBottom: '40px',
            paddingLeft: '32px',
            paddingRight: '32px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontStyle: 'italic',
              fontSize: '15px',
              color: 'rgba(230,237,217,0.5)',
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
