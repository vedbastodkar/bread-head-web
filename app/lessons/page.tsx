import type { Metadata } from 'next'
import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import CurriculumAccordion from './CurriculumAccordion'

export const metadata: Metadata = {
  title: 'Lessons — Bread Head',
  description: 'Bite-sized financial lessons built for discovery. Tap through slides, answer to unlock, and understand the why behind every right and wrong answer.',
}

const APPROACH = [
  {
    number: '01',
    title: 'Tap through like stories.',
    body: "Short slides. One idea at a time. No walls of text, no 45-minute videos. Each lesson is a conversation — not a lecture.",
  },
  {
    number: '02',
    title: 'Answer to unlock the next slide.',
    body: "Key concepts are gated behind a question. You can't skim past what matters. You have to engage with it.",
  },
  {
    number: '03',
    title: 'Wrong answers teach too.',
    body: "Hit the wrong option? You'll see exactly why it's wrong — and exactly why the right answer is right. Not just a checkmark. An explanation.",
  },
]


export default function LessonsPage() {
  return (
    <main>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9', overflow: 'hidden' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '160px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
          className="lessons-hero-grid"
        >
          {/* Left: copy */}
          <FadeUp delay={0}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
                The Curriculum
              </p>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  color: '#1A2E1A',
                  lineHeight: 1.1,
                  marginBottom: '24px',
                }}
              >
                Not just a course.
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '480px' }}>
                Bread Head teaches personal finance the way you actually learn — by doing, not by reading.
                Tap through bite-sized slides, answer to move forward, and understand exactly why you got it right or wrong.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '480px' }}>
                10 units. 8–15 lessons each. 3–5 minutes per lesson.
              </p>
              <a
                href="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#E6EDD9',
                  background: '#4A5D4A',
                  padding: '14px 30px',
                  borderRadius: '100px',
                  textDecoration: 'none',
                }}
              >
                Get Early Access →
              </a>
            </div>
          </FadeUp>

          {/* Right: phone mockup */}
          <FadeUp delay={0.15}>
            <div className="lessons-hero-phone" style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '280px',
                  borderRadius: '40px',
                  aspectRatio: '9/19.5',
                  border: '7px solid #1A2E1A',
                  background: '#111D11',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.40)',
                }}
              >
                {/* Notch */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', background: '#111D11', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '64px', height: '5px', borderRadius: '3px', background: '#000' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, top: '24px' }}>
                  <Image
                    src="/assets/lesson_home_screen.png"
                    alt="Bread Head lesson in progress"
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                    sizes="280px"
                    quality={90}
                    priority
                  />
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── APPROACH ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              How It Works
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '48px',
                maxWidth: '560px',
              }}
            >
              Learning by discovering, not by being told.
            </h2>
          </FadeUp>

          <div
            className="lessons-approach-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}
          >
            {APPROACH.map((item, i) => (
              <FadeUp key={item.number} delay={i * 0.1}>
                <div
                  className="card-border card-hover"
                  style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px 32px' }}
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '36px', color: '#D1A945', lineHeight: 1, marginBottom: '16px' }}>
                    {item.number}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '18px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '12px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CURRICULUM ────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <div style={{ marginBottom: '56px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '14px' }}>
                Full Curriculum · 10 Units
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(28px, 3.2vw, 44px)',
                  color: '#1A2E1A',
                  lineHeight: 1.1,
                  marginBottom: '14px',
                }}
              >
                Everything you actually need to know.
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.65 }}>
                Tap any unit to see every lesson inside it. Each one is 3–5 minutes — tap through slides, answer to unlock, understand the why.
              </p>
            </div>
          </FadeUp>

          <CurriculumAccordion />
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          <FadeUp delay={0}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.5vw, 42px)',
                color: '#E6EDD9',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Ready to actually learn this stuff?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.60)', lineHeight: 1.7, marginBottom: '36px' }}>
              Bread Head is free to start. No credit card, no commitment.
              Just 10 units of financial education built for real life.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#1A2E1A',
                background: '#D1A945',
                padding: '14px 32px',
                borderRadius: '100px',
                textDecoration: 'none',
              }}
            >
              Get Early Access →
            </a>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
