// app/support/page.tsx
import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import SupportForm from './SupportForm'

export const metadata: Metadata = {
  title: 'Support — Bread Head',
  description: 'Get help with Bread Head. Reach out with questions, feedback, bug reports, or media inquiries.',
}

export default function SupportPage() {
  return (
    <main>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: '120px',
            paddingBottom: '64px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <FadeUp delay={0}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '2px', height: '20px', background: '#4A5D4A', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: '#4A5D4A',
                  lineHeight: 1,
                }}
              >
                Get Help
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                color: '#1A2E1A',
                lineHeight: 1.1,
                marginBottom: '20px',
              }}
            >
              We&apos;re here to help.
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '16px',
                color: 'rgba(26,46,26,0.65)',
                lineHeight: 1.7,
                maxWidth: '520px',
                marginBottom: '12px',
              }}
            >
              Fill out the form below or email us directly — we respond to every message.
            </p>

            <a
              href="mailto:breadhead.org@gmail.com"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '15px',
                color: '#4A5D4A',
                textDecoration: 'none',
              }}
            >
              breadhead.org@gmail.com
            </a>
          </FadeUp>
        </div>
      </section>

      {/* ── FORM ────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9', paddingBottom: '80px' }}>
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <FadeUp delay={0.05}>
            <SupportForm />
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
