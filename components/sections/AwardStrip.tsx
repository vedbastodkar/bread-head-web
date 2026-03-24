import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'
import Link from 'next/link'

export default function AwardStrip() {
  return (
    <section style={{ background: '#FFFFFF' }}>
      <div
        className="award-strip-inner"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: '80px 24px',
          display: 'grid',
          gridTemplateColumns: '180px 1fr',
          gap: '48px',
          alignItems: 'center',
        }}
      >

        {/* ── Photo ── */}
        <FadeUp delay={0}>
          <div
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              border: '1px solid rgba(26,46,26,0.08)',
              boxShadow: '0 8px 32px rgba(26,46,26,0.10)',
              aspectRatio: '3/4',
              position: 'relative',
            }}
          >
            <Image
              src="/assets/omar_townhall_presenting_award.png"
              alt="Ved Bastodkar receiving the Congressional App Challenge award"
              fill
              style={{ objectFit: 'cover', objectPosition: 'center top' }}
              sizes="180px"
              quality={90}
            />
          </div>
        </FadeUp>

        {/* ── Copy ── */}
        <FadeUp delay={0.08}>
          <div>

            {/* Badge */}
            <div style={{ marginBottom: '16px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: '#B8922A',
                  background: 'rgba(193,154,50,0.09)',
                  border: '1px solid rgba(193,154,50,0.25)',
                  borderRadius: '100px',
                  padding: '6px 14px',
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 0l1.35 3.9H11l-3 2.2 1.14 3.9L6 7.9l-3.14 2.1L4 6.1 1 3.9h3.65L6 0z" fill="#B8922A"/>
                </svg>
                2025 Winner · MN-05
              </span>
            </div>

            {/* Headline */}
            <h2
              className="award-strip-h2"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(22px, 2.8vw, 36px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '10px',
              }}
            >
              Congressional App Challenge Winner.
            </h2>

            {/* Sub */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '15px',
                color: 'rgba(26,46,26,0.60)',
                lineHeight: 1.65,
                marginBottom: '24px',
              }}
            >
              Bread Head was selected as the winning app for Minnesota&apos;s 5th Congressional
              District — a nationwide competition run by the U.S. House of Representatives.
            </p>

            {/* Buttons row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="https://www.congressionalappchallenge.us/25-MN05/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#1A2E1A',
                  background: '#D1A945',
                  textDecoration: 'none',
                  padding: '11px 22px',
                  borderRadius: '100px',
                }}
              >
                View official listing ↗
              </a>
              <Link
                href="/about"
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '14px',
                  color: '#E6EDD9',
                  background: '#4A5D4A',
                  textDecoration: 'none',
                  padding: '11px 22px',
                  borderRadius: '100px',
                }}
              >
                See more →
              </Link>
            </div>

          </div>
        </FadeUp>
      </div>
    </section>
  )
}
