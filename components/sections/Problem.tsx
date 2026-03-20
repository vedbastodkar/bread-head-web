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
          className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-3 max-w-2xl"
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
          {/* Stat number — Playfair 700 48px */}
          <div className="shrink-0">
            <p
              className="font-display font-bold text-textTitle leading-none"
              style={{ fontSize: '48px' }}
            >
              0
            </p>
            <p className="font-body text-[13px] max-md:text-[14px] mt-2 leading-snug max-w-[140px] max-md:max-w-none"
               style={{ color: 'rgba(26,46,26,0.50)' }}>
              required hours of personal finance in the average US high school
            </p>
          </div>

          <div className="w-px self-stretch hidden md:block"
               style={{ background: 'rgba(26,46,26,0.10)' }} />

          <div className="pt-1">
            <p className="font-body text-[15px] leading-[1.7]"
               style={{ color: 'rgba(26,46,26,0.65)' }}>
              Financial literacy isn&apos;t a nice-to-have. It&apos;s the difference
              between building wealth in your twenties and spending your thirties
              undoing decisions you didn&apos;t know were mistakes.
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
