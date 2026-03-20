// ── §1 Hero ─────────────────────────────────────────────────────
// min-h-screen, flex items-center — content vertically centered
// No forced top padding — nav overlay handled by fixed positioning

import FadeUp         from '@/app/components/FadeUp'
import CountUp        from '@/app/components/CountUp'
import PhoneParallax  from '@/app/components/PhoneParallax'
import MagneticButton from '@/app/components/MagneticButton'

export default function Hero() {
  return (
    <section
      className="bg-bgSage min-h-screen flex items-center"
      style={{
        background: 'radial-gradient(ellipse at 30% 50%, rgba(74,93,74,0.08) 0%, transparent 60%), #E6EDD9',
      }}
    >
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* ── Left: copy ── */}
          <div>

            {/* Eyebrow with vertical bar */}
            <FadeUp delay={0}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-[2px] h-5 bg-brandGreen shrink-0" />
                <span
                  className="font-body font-semibold uppercase text-brandGreen"
                  style={{ fontSize: '11px', letterSpacing: '0.15em' }}
                >
                  Personal Finance · Built for Teens
                </span>
              </div>
            </FadeUp>

            {/* H1 */}
            <FadeUp delay={0.1}>
              <h1
                className="font-display italic font-bold text-textTitle tracking-[-0.02em]"
                style={{
                  fontSize: 'clamp(32px, 4.5vw, 52px)',
                  lineHeight: 1.15,
                  marginBottom: '16px',
                  maxWidth: '520px',
                }}
              >
                The money stuff school forgot to teach you.
              </h1>
            </FadeUp>

            {/* Sub */}
            <FadeUp delay={0.2}>
              <p
                className="font-body"
                style={{
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: 'rgba(26,46,26,0.65)',
                  maxWidth: '440px',
                  marginBottom: '28px',
                }}
              >
                Bite-sized lessons on pay stubs, credit, and taxes. A budget
                simulator that shows tradeoffs before they cost you. A private
                journal that turns choices into habits.
              </p>
            </FadeUp>

            {/* Stat card */}
            <FadeUp delay={0.28}>
              <div
                className="inline-flex items-center gap-4 rounded-2xl"
                style={{
                  background: '#FFFFFF',
                  border: '0.5px solid rgba(26,46,26,0.10)',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  maxWidth: '380px',
                  marginBottom: '28px',
                }}
              >
                <CountUp
                  target={73}
                  suffix="%"
                  className="font-display font-bold text-brandGreen leading-none shrink-0"
                  style={{ fontSize: '36px' }}
                />
                <p
                  className="font-body"
                  style={{ fontSize: '13px', lineHeight: 1.6, color: 'rgba(26,46,26,0.65)', margin: 0 }}
                >
                  of teens have never seen a pay stub — yet they&apos;re expected
                  to manage their own money within months of graduation.
                </p>
              </div>
            </FadeUp>

            {/* CTA */}
            <FadeUp delay={0.35}>
              <MagneticButton>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 font-body font-semibold rounded-full"
                  style={{
                    background: '#4A5D4A',
                    color: '#E6EDD9',
                    padding: '14px 32px',
                    fontSize: '15px',
                    textDecoration: 'none',
                  }}
                >
                  Start Learning Free →
                </a>
              </MagneticButton>
              <p
                className="font-body"
                style={{ fontSize: '12px', color: 'rgba(26,46,26,0.45)', marginTop: '10px' }}
              >
                Free to start · No credit card
              </p>
            </FadeUp>

          </div>

          {/* ── Right: phone mockup ── */}
          <div className="flex justify-center lg:justify-end">
            <PhoneParallax>
              <div className="relative flex justify-center items-center">

                {/* Decorative radial glow behind phone */}
                <div
                  style={{
                    position: 'absolute',
                    width: '340px',
                    height: '340px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(74,93,74,0.08) 0%, transparent 70%)',
                    zIndex: 0,
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                />

                {/* Phone shell */}
                <div
                  className="bg-cardBg card-border overflow-hidden flex flex-col"
                  style={{
                    width: 'clamp(240px, 20vw, 300px)',
                    borderRadius: '40px',
                    aspectRatio: '9 / 19.5',
                    boxShadow: 'none',
                    position: 'relative',
                    zIndex: 1,
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
                          style={{ background: `rgba(26,46,26,${i === 3 ? 0.15 : 0.3})` }}
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
                    <p className="font-body text-[10px] mt-1" style={{ color: 'rgba(26,46,26,0.40)' }}>
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
                        <p className="font-body font-semibold text-textTitle text-[13px]">{row.value}</p>
                        <p className="font-body text-[9px]" style={{ color: 'rgba(26,46,26,0.45)' }}>
                          {row.sub}
                        </p>
                      </div>
                    ))}

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
                          style={{ background: i === 0 ? 'rgba(74,93,74,0.12)' : 'rgba(26,46,26,0.07)' }}
                        />
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Floating streak badge */}
                <div
                  className="absolute bg-cardBg card-border rounded-2xl px-4 py-3"
                  style={{ right: '-20px', top: '38%', zIndex: 2 }}
                >
                  <p className="font-body text-[10px] mb-0.5" style={{ color: 'rgba(26,46,26,0.40)' }}>
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
