// ── Why It Matters — reusable stat grid section ──────────────────
// Used on: homepage (bgSage), partners page (white)
// 2×2 grid with shared 1px borders, no gutters.
// Each cell: hero number (serif italic), descriptor, Source pill (top-right).

import FadeUp from '@/app/components/FadeUp'

interface StatCard {
  prefix?: string       // text before the accented hero figure
  hero: string          // the accented key figure
  suffix?: string       // text after the hero figure (muted)
  label: string         // descriptor line
  source: string        // citation URL
}

const STATS: StatCard[] = [
  {
    prefix: 'More than ',
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
  const border = bg === '#FFFFFF'
    ? '1px solid rgba(26,46,26,0.10)'
    : '1px solid rgba(26,46,26,0.13)'

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
              color: '#4A5D4A',
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
              color: '#1A2E1A',
              lineHeight: 1.15,
              marginBottom: '40px',
            }}
          >
            The gap is real. The solution is ready.
          </h2>

          {/* 2×2 stat grid — shared borders, no gutters */}
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
              const isTop = i < 2
              return (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    padding: '40px',
                    borderRight: isLeft ? border : 'none',
                    borderBottom: isTop ? border : 'none',
                    background: bg === '#FFFFFF' ? '#FFFFFF' : '#E6EDD9',
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
                      color: 'rgba(26,46,26,0.5)',
                      border: '0.5px solid rgba(26,46,26,0.18)',
                      borderRadius: '100px',
                      padding: '4px 10px',
                      textDecoration: 'none',
                      background: 'transparent',
                      transition: 'background 0.18s ease, color 0.18s ease, border-color 0.18s ease',
                    }}
                  >
                    Source
                  </a>

                  {/* Hero number */}
                  <p
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontStyle: 'italic',
                      fontWeight: 700,
                      fontSize: 'clamp(48px, 5vw, 72px)',
                      lineHeight: 1,
                      marginBottom: '16px',
                      color: '#1A2E1A',
                    }}
                  >
                    {s.prefix && (
                      <span style={{ color: 'rgba(26,46,26,0.35)', fontSize: '0.55em', fontStyle: 'italic' }}>
                        {s.prefix}
                      </span>
                    )}
                    <span style={{ color: '#4A5D4A' }}>{s.hero}</span>
                    {s.suffix && (
                      <span style={{ color: 'rgba(26,46,26,0.3)', fontSize: '0.65em' }}>{s.suffix}</span>
                    )}
                  </p>

                  {/* Descriptor */}
                  <p
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 400,
                      fontSize: '14px',
                      color: 'rgba(26,46,26,0.6)',
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
