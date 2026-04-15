// ── §2 Problem ──────────────────────────────────────────────────
// bg: white (#FFFFFF), followed by full-width bgSage mission strip

import WordReveal from '@/app/components/WordReveal'

export default function Problem() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* Eyebrow */}
        <div className="flex items-center gap-2 mb-2">
          <p className="font-body font-medium text-[11px] tracking-[0.13em] max-md:tracking-[0.08em] uppercase text-brandGreen" style={{ margin: 0 }}>
            The Gap
          </p>
        </div>

        {/* H2 */}
        <h2
          className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-5 max-w-2xl"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
        >
          Schools teach algebra.
        </h2>

        {/* WordReveal */}
        <div className="max-w-3xl mb-6">
          <WordReveal
            lines={[
              'Not how to read a pay stub.',
              'Not how a mortgage works.',
              'Not what a credit score actually means.',
            ]}
          />
        </div>

        {/* Stat + closer copy */}
        <div
          className="mt-8 pt-6 flex flex-col md:flex-row md:items-start gap-8 max-w-2xl"
          style={{ borderTop: '0.5px solid rgba(26,46,26,0.12)' }}
        >
          <div className="shrink-0">
            <p className="font-display font-bold text-textTitle leading-none" style={{ fontSize: '48px' }}>
              21
            </p>
            <p className="font-body text-[13px] max-md:text-[14px] mt-2 leading-snug max-w-[140px] max-md:max-w-none"
               style={{ color: 'rgba(26,46,26,0.50)' }}>
              states don&apos;t require personal finance education in high school
            </p>
          </div>

          <div className="w-px self-stretch hidden md:block" style={{ background: 'rgba(26,46,26,0.10)' }} />

          <div className="pt-1">
            <p className="font-body text-[15px] leading-[1.7]" style={{ color: 'rgba(26,46,26,0.65)' }}>
              Even the states that do rarely go beyond a checkbox. A semester of
              theory doesn&apos;t build awareness of your own habits, your own
              patterns, or what your choices are actually costing you.
            </p>
            <p className="font-body font-semibold text-textTitle text-[14px] mt-4">
              Bread Head closes the gap.
            </p>
          </div>
        </div>

      </div>

      {/* Mission strip — full-width bgSage */}
      <div style={{ background: '#E6EDD9' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14 lg:py-16">
          <p
            className="font-body font-semibold uppercase tracking-[0.13em]"
            style={{ fontSize: '11px', color: '#4A5D4A', marginBottom: '20px' }}
          >
            Our Mission
          </p>
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
            Bread Head gives every teenager the financial literacy and real-world money skills to budget, save, and build wealth — so they can take control of their future no matter where they&apos;re starting from.
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
