// ── Why It Matters — reusable stat grid section ──────────────────
// Used on: homepage (dark #1A2E1A), partners page (white)
// 2×2 grid with shared borders, no gutters.
// Each cell: prefix small on top, hero number big + left, descriptor below.

import FadeUp from '@/app/components/FadeUp'

interface StatCard {
  prefix?: string       // small label above the hero figure
  hero: string          // the big key figure
  suffix?: string       // muted text after the hero (inline)
  label: string         // descriptor below
  source: string        // citation URL
}

const STATS: StatCard[] = [
  {
    prefix: 'More than',
    hero: '1 in 3',
    label: 'dollars of U.S. wealth inequality can be traced back to differences in financial knowledge — not income, not circumstance.',
    source: 'https://pensionresearchcouncil.wharton.upenn.edu/wp-content/uploads/2015/08/WP2015-01.pdf',
  },
  {
    hero: '$246B',
    label: 'lost every year by Americans due to financial illiteracy. Not a knowledge gap — a national economic crisis.',
    source: 'https://www.financialeducatorscouncil.org/financial-illiteracy-costs/',
  },
  {
    hero: '68%',
    suffix: ' / 31%',
    label: '68% of teens want a financial literacy class. Only 31% have access to one at school. The gap isn\'t apathy — it\'s access.',
    source: 'https://jagkc.org/68-percent-teens-want-financial-education/',
  },
  {
    hero: '$34K',
    label: 'average total debt for Gen Z — with a $3,000 credit card balance already. They\'re entering adulthood in a hole they were never taught to avoid.',
    source: 'https://www.experian.com/blogs/ask-experian/average-american-debt-by-age/',
  },
]

interface Props {
  bg?: string
}

export default function WhyItMatters({ bg = '#E6EDD9' }: Props) {
  const dark = bg === '#1A2E1A'

  const border = dark
    ? '1px solid rgba(230,237,217,0.10)'
    : bg === '#FFFFFF'
      ? '1px solid rgba(26,46,26,0.10)'
      : '1px solid rgba(26,46,26,0.13)'

  const eyebrowColor  = dark ? '#D1A945'               : '#4A5D4A'
  const headingColor  = dark ? '#E6EDD9'               : '#1A2E1A'
  const cellBg        = dark ? 'rgba(230,237,217,0.03)' : bg === '#FFFFFF' ? '#FFFFFF' : '#E6EDD9'
  const heroColor     = dark ? '#D1A945'               : '#4A5D4A'
  const prefixColor   = dark ? 'rgba(230,237,217,0.40)' : 'rgba(26,46,26,0.40)'
  const suffixColor   = dark ? 'rgba(230,237,217,0.30)' : 'rgba(26,46,26,0.30)'
  const labelColor    = dark ? 'rgba(230,237,217,0.60)' : 'rgba(26,46,26,0.60)'
  const pillColor     = dark ? 'rgba(230,237,217,0.45)' : 'rgba(26,46,26,0.50)'
  const pillBorder    = dark ? 'rgba(230,237,217,0.20)' : 'rgba(26,46,26,0.18)'

  return (
    <section style={{ background: bg }}>
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
              color: eyebrowColor,
              marginBottom: '16px',
              lineHeight: 1,
            }}
          >
            Why It Matters
          </p>

          {/* H2 */}
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 'clamp(26px, 3vw, 40px)',
              color: headingColor,
              lineHeight: 1.15,
              marginBottom: '40px',
            }}
          >
            The gap is real. The solution? Bread Head.
          </h2>

          {/* 2×2 stat grid */}
          <div
            className="why-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              border,
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {STATS.map((s, i) => {
              const isLeft = i % 2 === 0
              const isTop  = i < 2
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    padding: '40px',
                    borderRight:  isLeft ? border : 'none',
                    borderBottom: isTop  ? border : 'none',
                    background: cellBg,
                  }}
                >
                  {/* Source pill — absolute top-right */}
                  <a
                    href={s.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-pill"
                    style={{
                      position: 'absolute',
                      top: '16px',
                      right: '16px',
                      fontFamily: 'var(--font-body)',
                      fontWeight: 500,
                      fontSize: '10px',
                      letterSpacing: '0.04em',
                      color: pillColor,
                      border: `0.5px solid ${pillBorder}`,
                      borderRadius: '100px',
                      padding: '4px 10px',
                      textDecoration: 'none',
                      background: 'transparent',
                      transition: 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease',
                    }}
                  >
                    Source
                  </a>

                  {/* Prefix — small label above the number */}
                  {s.prefix && (
                    <p
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        fontSize: '12px',
                        color: prefixColor,
                        lineHeight: 1,
                        marginBottom: '6px',
                      }}
                    >
                      {s.prefix}
                    </p>
                  )}

                  {/* Hero number — big, left-aligned */}
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 700,
                      fontSize: 'clamp(52px, 6vw, 80px)',
                      lineHeight: 1,
                      marginBottom: '16px',
                      color: heroColor,
                    }}
                  >
                    {s.hero}
                    {s.suffix && (
                      <span style={{ color: suffixColor, fontSize: '0.55em', fontStyle: 'italic' }}>
                        {s.suffix}
                      </span>
                    )}
                  </p>

                  {/* Descriptor */}
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '14px',
                      color: labelColor,
                      lineHeight: 1.65,
                      margin: 0,
                      maxWidth: '380px',
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              )
            })}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
