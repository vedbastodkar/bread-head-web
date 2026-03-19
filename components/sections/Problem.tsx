// ── §2 Problem ──────────────────────────────────────────────────
// bg: white (#FFFFFF)
// Pass 3: WordReveal replaces h2 + data-reveal block
// Stat: Playfair 700 48px

import WordReveal from '@/app/components/WordReveal'

export default function Problem() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-28 lg:py-36">

        {/* Eyebrow */}
        <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-7">
          The Gap
        </p>

        {/* WordReveal — headlineIndex=0 renders "Schools teach algebra." as Playfair h2 */}
        <div className="max-w-3xl mb-14">
          <WordReveal
            lines={[
              'Schools teach algebra.',
              'Not how to read a pay stub.',
              'Not how a mortgage works.',
              'Not what a credit score actually means.',
            ]}
            headlineIndex={0}
          />
        </div>

        {/* Stat + closer copy */}
        <div
          className="mt-20 pt-10 flex flex-col sm:flex-row sm:items-start gap-8 max-w-2xl"
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
            <p className="font-body text-[13px] mt-2 leading-snug max-w-[140px]"
               style={{ color: 'rgba(26,46,26,0.50)' }}>
              required hours of personal finance in the average US high school
            </p>
          </div>

          <div className="w-px self-stretch hidden sm:block"
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
