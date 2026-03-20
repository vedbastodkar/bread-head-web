'use client'

// ── §8 Final CTA ─────────────────────────────────────────────────
// bg: textTitle (#1A2E1A) — dark
// h2: Playfair Display italic, accentGold (#D1A945) — approved gold use
// Submit button: brandGreen bg, bgSage text
// Email input: rgba(255,255,255,0.08) bg, rgba(255,255,255,0.15) border

import MagneticButton from '@/app/components/MagneticButton'

export default function FinalCTA() {
  return (
    <section className="bg-textTitle grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-28 lg:py-40">
        <div className="max-w-2xl mx-auto text-center">

          {/* Eyebrow */}
          <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase mb-8"
             style={{ color: 'rgba(230,237,217,0.40)' }}>
            Ready when you are
          </p>

          {/* H2 — Playfair italic, accentGold — approved gold use */}
          <h2
            className="final-cta-h2 font-display italic font-bold text-accentGold tracking-[-0.02em] leading-[1.06] mb-8"
            style={{ fontSize: 'clamp(40px, 5.5vw, 68px)' }}
          >
            Your financial education starts now.
          </h2>

          <p className="font-body text-[16px] leading-[1.7] mb-12 max-w-lg mx-auto"
             style={{ color: 'rgba(230,237,217,0.55)' }}>
            Join thousands of teens building better money habits — one
            5-minute lesson at a time.
          </p>

          {/* Email capture */}
          <form
            className="final-cta-form flex flex-col md:flex-row gap-3 max-w-md mx-auto mb-5"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="your@email.com"
              aria-label="Email address"
              className="final-cta-input flex-1 font-body text-[14px] text-bgSage placeholder:text-bgSage/30 focus:outline-none transition-colors"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '0.5px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '14px 18px',
              }}
            />
            {/* Dark-section button: brandGreen bg, bgSage text — MagneticButton wrapper */}
            <MagneticButton>
              <button
                type="submit"
                className="final-cta-btn font-body font-medium text-bgSage bg-brandGreen rounded-full shrink-0 hover:opacity-90 transition-opacity touch-cta"
                style={{ padding: '12px 28px', fontSize: '14px' }}
              >
                Get Early Access →
              </button>
            </MagneticButton>
          </form>

          {/* Fine print */}
          <p className="font-body text-[12px]"
             style={{ color: 'rgba(230,237,217,0.25)' }}>
            No spam. No credit card. Unsubscribe anytime.
          </p>

        </div>
      </div>
    </section>
  )
}
