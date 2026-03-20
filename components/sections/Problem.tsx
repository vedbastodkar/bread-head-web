// ── §2 Problem ──────────────────────────────────────────────────
// bg: white (#FFFFFF)
// Pass 3: WordReveal replaces h2 + data-reveal block
// Stat: Playfair 700 48px

import WordReveal from '@/app/components/WordReveal'

export default function Problem() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* Eyebrow */}
        <p className="font-body font-medium text-[11px] tracking-[0.13em] max-md:tracking-[0.08em] uppercase text-brandGreen mb-2">
          The Gap
        </p>

        {/* H2 — DM Sans 700, not Playfair */}
        <h2
          className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-5 max-w-2xl"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
        >
          Schools teach algebra.
        </h2>

        {/* WordReveal — sub-lines only, no headlineIndex */}
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
          {/* Stat — prose callout */}
          <div className="shrink-0 max-w-[200px] max-md:max-w-none">
            <p
              className="font-display font-bold text-textTitle leading-[1.1]"
              style={{ fontSize: '22px' }}
            >
              Nearly 20 states don&apos;t require teaching personal finance at all.
            </p>
          </div>

          <div className="w-px self-stretch hidden md:block"
               style={{ background: 'rgba(26,46,26,0.10)' }} />

          <div className="pt-1">
            <p className="font-body text-[15px] leading-[1.7]"
               style={{ color: 'rgba(26,46,26,0.65)' }}>
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
    </section>
  )
}
