'use client'

import { useState } from 'react'

// ── §8 Final CTA ─────────────────────────────────────────────────
// bg: textTitle (#1A2E1A) — dark
// h2: Playfair Display italic, accentGold (#D1A945) — approved gold use
// Submit button: brandGreen bg, bgSage text
// Email input: rgba(255,255,255,0.08) bg, rgba(255,255,255,0.15) border

import Image from 'next/image'
import MagneticButton from '@/app/components/MagneticButton'

export default function FinalCTA() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    const form = e.currentTarget
    const email = (form.elements.namedItem('email') as HTMLInputElement).value
    const companyWebsite = (form.elements.namedItem('company_website') as HTMLInputElement | null)?.value ?? ''
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, company_website: companyWebsite }),
      })
      if (!res.ok) {
        const msg = await res.json().then((d) => d?.error).catch(() => null)
        throw new Error(msg || 'Something went wrong. Please try again.')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-textTitle grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-28 lg:py-40">
        <div className="max-w-2xl mx-auto text-center">


          {/* Eyebrow */}

          {/* H2 — Playfair italic, accentGold — approved gold use */}
          <h2
            className="final-cta-h2 font-display italic font-bold text-accentGold tracking-[-0.02em] leading-[1.06] mb-8"
            style={{ fontSize: 'clamp(40px, 5.5vw, 68px)' }}
          >
            Your financial education starts now.
          </h2>

          <p className="font-body text-[16px] leading-[1.7] mb-12 max-w-lg mx-auto"
             style={{ color: 'rgba(230,237,217,0.55)' }}>
            95 lessons, a budget simulator, and a private journal. Free on the
            App Store, or leave your email and we&apos;ll keep you posted.
          </p>

          {/* Email capture */}
          {submitted ? (
            <p className="font-body text-[15px] mb-5" style={{ color: 'rgba(230,237,217,0.65)' }}>
              ✓ You&apos;re on the list. We&apos;ll be in touch soon.
            </p>
          ) : (
          <form
            className="final-cta-form relative flex flex-col md:flex-row gap-3 max-w-md mx-auto mb-5"
            onSubmit={handleSubmit}
          >
            {/* Honeypot — hidden from people, irresistible to bots. A filled
                value makes the server drop the submission silently. */}
            <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }}>
              <label htmlFor="cta-company-website">Do not fill this in</label>
              <input id="cta-company-website" name="company_website" type="text" tabIndex={-1} autoComplete="off" />
            </div>
            <input
              type="email"
              name="email"
              placeholder="your@email.com"
              required
              aria-label="Email address"
              className="final-cta-input flex-1 font-body text-[14px] text-bgSage placeholder:text-bgSage/60 focus:outline-none focus-visible:outline-none focus:border-bgSage/60 focus:ring-2 focus:ring-bgSage/40 transition-colors"
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
                disabled={loading}
                className="final-cta-btn font-body font-medium text-bgSage bg-brandGreen rounded-full shrink-0 hover:opacity-90 transition-opacity touch-cta"
                style={{ padding: '12px 28px', fontSize: '14px', opacity: loading ? 0.6 : 1, cursor: loading ? 'default' : 'pointer' }}
              >
                {loading ? 'Joining…' : 'Get Early Access →'}
              </button>
            </MagneticButton>
          </form>
          )}

          {/* Inline error — dark section, readable light-red tone */}
          {error && !submitted && (
            <p
              className="font-body text-[13px] max-w-md mx-auto mb-5"
              role="alert"
              style={{
                color: 'rgba(240,180,180,0.95)',
                background: 'rgba(220,80,80,0.10)',
                border: '0.5px solid rgba(240,180,180,0.30)',
                borderRadius: '12px',
                padding: '10px 16px',
              }}
            >
              {error}
            </p>
          )}

          {/* Fine print */}
          <p className="font-body text-[12px]"
             style={{ color: 'rgba(230,237,217,0.55)' }}>
            No spam. No credit card. Unsubscribe anytime.
          </p>

        </div>
      </div>
    </section>
  )
}
