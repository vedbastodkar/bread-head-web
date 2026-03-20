// ── §1 Hero ─────────────────────────────────────────────────────
// min-h-screen, flex items-center — content vertically centered
// No forced top padding — nav overlay handled by fixed positioning

import Image          from 'next/image'
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
              <div className="flex items-center gap-3 mb-3">
                <div className="w-[2px] h-5 bg-brandGreen shrink-0" />
                <span
                  className="font-body font-semibold uppercase text-brandGreen"
                  style={{ fontSize: '11px', letterSpacing: '0.15em' }}
                >
                  Personal Finance · Built for Teens
                </span>
              </div>
              <p
                className="font-body font-semibold"
                style={{ fontSize: '13px', color: 'rgba(26,46,26,0.4)', letterSpacing: '0.04em', marginBottom: '16px' }}
              >
                Know Your Dough.
              </p>
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
                  className="overflow-hidden relative"
                  style={{
                    width: 'clamp(240px, 20vw, 300px)',
                    borderRadius: '44px',
                    aspectRatio: '9 / 19.5',
                    border: '8px solid #1A2E1A',
                    background: '#1A2E1A',
                    zIndex: 1,
                  }}
                >
                  {/* Notch */}
                  <div
                    className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
                    style={{ height: '28px', background: '#1A2E1A' }}
                  >
                    <div className="rounded-full" style={{ width: '80px', height: '6px', background: '#000' }} />
                  </div>

                  {/* Welcome screen image */}
                  <div className="absolute inset-0" style={{ top: '28px' }}>
                    <Image
                      src="/assets/welcome_screen.png"
                      alt="Bread Head welcome screen"
                      fill
                      className="object-cover object-top"
                      sizes="300px"
                      quality={90}
                      priority
                    />
                  </div>
                </div>

              </div>
            </PhoneParallax>
          </div>

        </div>
      </div>
    </section>
  )
}
