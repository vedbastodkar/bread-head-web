// ── §1 Hero ─────────────────────────────────────────────────────
// Pass 3 additions (no visual style changes):
//   · FadeUp wraps eyebrow (0), h1 (0.1), sub (0.2), stat card (0.28), CTA (0.35)
//   · CountUp replaces static "73%"
//   · PhoneParallax wraps the phone mockup container

import FadeUp         from '@/app/components/FadeUp'
import CountUp        from '@/app/components/CountUp'
import PhoneParallax  from '@/app/components/PhoneParallax'
import MagneticButton from '@/app/components/MagneticButton'

export default function Hero() {
  return (
    <section className="bg-bgSage min-h-screen flex items-center">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Left: copy ──────────────────────────────────── */}
          <div>

            {/* Eyebrow — FadeUp delay 0 */}
            <FadeUp delay={0}>
              <p
                className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-6"
                style={{ color: '#4A5D4A' }}
              >
                Personal Finance · Built for Teens
              </p>
            </FadeUp>

            {/* H1 — FadeUp delay 0.1 */}
            <FadeUp delay={0.1}>
              <h1
                className="font-display italic font-bold text-textTitle leading-[1.06] tracking-[-0.02em] mb-7"
                style={{ fontSize: 'clamp(44px, 6vw, 72px)' }}
              >
                The money stuff school forgot to teach you.
              </h1>
            </FadeUp>

            {/* Sub — FadeUp delay 0.2 */}
            <FadeUp delay={0.2}>
              <p
                className="font-body text-[16px] leading-[1.7] mb-10 max-w-[480px]"
                style={{ color: 'rgba(26,46,26,0.65)' }}
              >
                Bite-sized lessons on pay stubs, credit, and taxes. A budget
                simulator that shows tradeoffs before they cost you. A private
                journal that turns choices into habits.
              </p>
            </FadeUp>

            {/* Stat callout card — FadeUp delay 0.28 */}
            <FadeUp delay={0.28}>
              <div className="bg-cardBg card-border rounded-2xl p-7 mb-10 max-w-[420px] flex items-start gap-5">
                {/* CountUp replaces static "73%" */}
                <CountUp target={73} suffix="%" />
                <p
                  className="font-body text-[14px] leading-[1.6]"
                  style={{ color: 'rgba(26,46,26,0.65)' }}
                >
                  of teens have never seen a pay stub — yet they&apos;re expected
                  to manage their own money within months of graduation.
                </p>
              </div>
            </FadeUp>

            {/* CTA — FadeUp delay 0.35 + MagneticButton */}
            <FadeUp delay={0.35}>
              <MagneticButton>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-body font-medium text-brandGreen rounded-full"
                  style={{
                    background: 'rgba(74,93,74,0.10)',
                    border: '1px solid rgba(74,93,74,0.25)',
                    padding: '12px 28px',
                    fontSize: '14px',
                  }}
                >
                  Start Learning Free
                  <span aria-hidden="true">→</span>
                </a>
              </MagneticButton>

              <p
                className="font-body text-[12px] mt-4"
                style={{ color: 'rgba(26,46,26,0.40)' }}
              >
                Free to start · No credit card
              </p>
            </FadeUp>

          </div>

          {/* ── Right: phone mockup — PhoneParallax ─────────── */}
          <div className="flex justify-center lg:justify-end">
            <PhoneParallax>
              <div className="relative">

                {/* Phone shell */}
                <div
                  className="w-[260px] lg:w-[280px] bg-cardBg card-border overflow-hidden flex flex-col"
                  style={{
                    borderRadius: '40px',
                    aspectRatio: '9 / 19.5',
                    boxShadow: 'none',
                  }}
                >
                  {/* Status bar */}
                  <div className="flex justify-between items-center px-6 pt-5 pb-2 shrink-0">
                    <span
                      className="font-body font-medium text-[10px]"
                      style={{ color: 'rgba(26,46,26,0.45)' }}
                    >
                      9:41
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-3 h-[5px] rounded-full"
                          style={{
                            background: `rgba(26,46,26,${i === 3 ? 0.15 : 0.3})`,
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  {/* App header */}
                  <div className="bg-bgSage px-5 py-4 shrink-0">
                    <p className="font-body font-medium text-[10px] tracking-[0.10em] uppercase text-brandGreen mb-1">
                      Today&apos;s Lesson
                    </p>
                    <p className="font-body font-semibold text-textTitle text-[13px] leading-snug">
                      Reading Your First Pay Stub
                    </p>
                    <div
                      className="mt-2.5 h-[5px] rounded-full overflow-hidden"
                      style={{ background: 'rgba(26,46,26,0.08)' }}
                    >
                      <div className="h-full w-3/5 bg-brandGreen rounded-full" />
                    </div>
                    <p
                      className="font-body text-[10px] mt-1"
                      style={{ color: 'rgba(26,46,26,0.40)' }}
                    >
                      3 of 5 slides
                    </p>
                  </div>

                  {/* Content rows */}
                  <div className="flex-1 px-5 py-4 flex flex-col gap-3">
                    {[
                      { label: 'Gross Pay', value: '$1,240.00', sub: 'What you earned' },
                      { label: 'Net Pay',   value: '$978.44',   sub: 'What hits your account' },
                    ].map((row) => (
                      <div key={row.label} className="bg-bgSage rounded-[12px] px-3.5 py-3">
                        <p className="font-body font-medium text-[9px] tracking-[0.10em] uppercase text-brandGreen mb-0.5">
                          {row.label}
                        </p>
                        <p className="font-body font-semibold text-textTitle text-[13px]">
                          {row.value}
                        </p>
                        <p
                          className="font-body text-[9px]"
                          style={{ color: 'rgba(26,46,26,0.45)' }}
                        >
                          {row.sub}
                        </p>
                      </div>
                    ))}

                    {/* Quick check */}
                    <div className="bg-cardBg card-border rounded-[12px] px-3.5 py-3">
                      <p className="font-body font-medium text-[9px] tracking-[0.10em] uppercase text-brandGreen mb-0.5">
                        Quick Check
                      </p>
                      <p className="font-body text-[10px] text-textTitle leading-snug">
                        Why is net pay $261.56 less than gross?
                      </p>
                    </div>
                  </div>

                  {/* Bottom nav */}
                  <div
                    className="shrink-0 flex justify-around py-3 px-2"
                    style={{ borderTop: '0.5px solid rgba(26,46,26,0.10)' }}
                  >
                    {['Lessons', 'Budget', 'Journal'].map((tab, i) => (
                      <button
                        key={tab}
                        className="font-body font-medium text-[9px] flex flex-col items-center gap-1"
                        style={{ color: i === 0 ? '#4A5D4A' : 'rgba(26,46,26,0.35)' }}
                      >
                        <div
                          className="w-[14px] h-[14px] rounded-full"
                          style={{
                            background:
                              i === 0 ? 'rgba(74,93,74,0.12)' : 'rgba(26,46,26,0.07)',
                          }}
                        />
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating streak badge */}
                <div className="absolute -right-5 top-[38%] bg-cardBg card-border rounded-2xl px-4 py-3">
                  <p
                    className="font-body text-[10px] mb-0.5"
                    style={{ color: 'rgba(26,46,26,0.40)' }}
                  >
                    Streak
                  </p>
                  <p className="font-body font-semibold text-textTitle text-[13px]">🔥 12 days</p>
                </div>

              </div>
            </PhoneParallax>
          </div>

        </div>
      </div>
    </section>
  )
}
