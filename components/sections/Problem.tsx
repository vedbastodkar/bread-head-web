// ── §3 The Gap ──────────────────────────────────────────────────
// bg: textTitle (#1A2E1A) — dark, followed by a full-width bgSage mission strip.
// Dark because §2 Traction above is white and the Ticker / §4 below is sage:
// this section is what separates them. accentGold (#D1A945) on the eyebrow and
// the stat figures, the same treatment the old dark WhyItMatters grid used.
//
// This section absorbed the old standalone WhyItMatters stat grid. The
// homepage previously stated the same problem three times — "The Gap"
// here, "Why It Matters" in a 2×2 grid below, then "The gap is real" as
// its heading — across five sourced statistics. It is now one statement
// with the three tightest numbers, each still carrying its source.

import WordReveal from '@/app/components/WordReveal'

const STATS = [
  {
    hero: '68%',
    suffix: ' / 31%',
    label: 'of teens want a personal finance class. Only 31% can take one at school.',
    source: 'https://jagkc.org/68-percent-teens-want-financial-education/',
  },
  {
    hero: '$246B',
    label: 'lost every year by Americans to financial illiteracy.',
    source: 'https://www.financialeducatorscouncil.org/financial-illiteracy-costs/',
  },
  {
    hero: '$34K',
    label: 'average total debt for Gen Z entering adulthood.',
    source: 'https://www.experian.com/blogs/ask-experian/average-american-debt-by-age/',
  },
]

export default function Problem() {
  return (
    <section className="bg-textTitle grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-16">

        {/* Eyebrow */}

        {/* H2 */}
        <h2
          className="font-body font-bold tracking-[-0.02em] leading-[1.08] mb-5 max-w-2xl"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)', color: '#E6EDD9' }}
        >
          Schools teach algebra.
        </h2>

        {/* WordReveal */}
        <div className="max-w-3xl mb-8">
          <WordReveal
            subColor="rgba(230,237,217,0.72)"
            lines={[
              'Not how to read a pay stub.',
              'Not how a mortgage works.',
              'Not what a credit score actually means.',
            ]}
          />
        </div>

        {/* Closer copy */}
        <p
          className="font-body text-[16px] leading-[1.75] max-w-2xl"
          style={{ color: 'rgba(230,237,217,0.62)' }}
        >
          Twenty-one states still don&apos;t require personal finance to graduate, and
          the states that do rarely go beyond a checkbox. A semester of theory
          doesn&apos;t build awareness of your own habits, your own patterns, or what
          your choices are actually costing you.{' '}
          <span className="font-semibold" style={{ color: '#E6EDD9' }}>Bread Head closes that gap.</span>
        </p>

        {/* Three sourced numbers — one row, replaces the old 2×2 grid */}
        <div
          className="problem-stats mt-12 pt-10 grid grid-cols-3 gap-10 lg:gap-16"
          style={{ borderTop: '1px solid rgba(230,237,217,0.14)' }}
        >
          {STATS.map((s) => (
            <div key={s.hero}>
              <p
                className="problem-stat-num font-display font-bold italic leading-none mb-4"
                style={{ fontSize: 'clamp(38px, 4.4vw, 62px)', color: '#D1A945' }}
              >
                {s.hero}
                {s.suffix && (
                  <span style={{ color: 'rgba(230,237,217,0.45)', fontSize: '0.5em' }}>{s.suffix}</span>
                )}
              </p>
              <p
                className="font-body text-[14px] leading-[1.6] mb-3"
                style={{ color: 'rgba(230,237,217,0.58)' }}
              >
                {s.label}
              </p>
              <a
                href={s.source}
                target="_blank"
                rel="noopener noreferrer"
                className="source-link-dark font-body"
                style={{
                  fontSize: '11px',
                  color: 'rgba(230,237,217,0.55)',
                  textDecoration: 'none',
                  transition: 'color 0.15s ease',
                }}
              >
                Source ↗
              </a>
            </div>
          ))}
        </div>

      </div>

      {/* Mission strip — full-width bgSage */}
      <div style={{ background: '#E6EDD9', position: 'relative', zIndex: 11 }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-16">
          <p
            className="font-display"
            style={{
              fontStyle: 'italic',
              fontSize: 'clamp(24px, 3vw, 40px)',
              color: '#1A2E1A',
              lineHeight: 1.3,
              maxWidth: '800px',
              marginBottom: '32px',
            }}
          >
            Bread Head gives every teenager the financial literacy and real-world money skills to budget, save, and build wealth, so they can take control of their future no matter where they&apos;re starting from.
          </p>
          <a
            href="/about"
            className="inline-flex items-center gap-2 font-body font-medium"
            style={{ fontSize: '14px', color: '#4A5D4A', textDecoration: 'none' }}
          >
            See more
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  )
}
