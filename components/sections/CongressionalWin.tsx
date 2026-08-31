import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'

export default function CongressionalWin() {
  return (
    <section
      id="CongressionalWin"
      className="congressional-win"
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Background: wide ceremony shot ── */}
      <Image
        src="/assets/omar_townhall_wide.png"
        alt="Congressional App Challenge award ceremony, Minneapolis"
        fill
        style={{ objectFit: 'cover', objectPosition: 'center 30%' }}
        sizes="100vw"
        quality={90}
        priority
      />

      {/* ── Navy gradient overlay ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(110deg, rgba(26,46,26,0.93) 0%, rgba(26,46,26,0.82) 55%, rgba(26,46,26,0.60) 100%)',
          zIndex: 1,
        }}
      />

      {/* ── Content grid ── */}
      <div
        className="congressional-inner"
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '104px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1.25fr',
          gap: '72px',
          alignItems: 'center',
        }}
      >

        {/* ── Left: editorial close-up ── */}
        <FadeUp delay={0}>
          <div
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1.5px solid rgba(212,175,90,0.28)',
              boxShadow: '0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            <Image
              src="/assets/omar_townhall_presenting_award.png"
              alt="Ved Bastodkar receiving the Congressional App Challenge award"
              width={480}
              height={600}
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 40vw"
              quality={92}
            />
          </div>
        </FadeUp>

        {/* ── Right: copy ── */}
        <FadeUp delay={0.12}>
          <div>

            {/* Winner badge */}
            <div style={{ marginBottom: '28px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: '#D4AF5A',
                  background: 'rgba(212,175,90,0.10)',
                  border: '1px solid rgba(212,175,90,0.32)',
                  borderRadius: '100px',
                  padding: '8px 18px',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M6 0l1.35 3.9H11l-3 2.2 1.14 3.9L6 7.9l-3.14 2.1L4 6.1 1 3.9h3.65L6 0z" fill="#D4AF5A"/>
                </svg>
                2025 Winner · MN-05
              </span>
            </div>

            {/* Competition label */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '12px',
                letterSpacing: '0.13em',
                textTransform: 'uppercase',
                color: 'rgba(245,240,232,0.45)',
                margin: '0 0 14px',
              }}
            >
              Congressional App Challenge · U.S. House of Representatives
            </p>

            {/* Headline */}
            <h2
              className="congressional-h2"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(28px, 3.2vw, 50px)',
                color: '#F5F0E8',
                lineHeight: 1.1,
                marginBottom: '28px',
              }}
            >
              Bread Head won a national competition run by the U.S. House of Representatives.
            </h2>

            {/* Body */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'rgba(245,240,232,0.68)',
                lineHeight: 1.75,
                marginBottom: '14px',
              }}
            >
              The Congressional App Challenge is one of the most prestigious student
              technology competitions in the country, a nationwide program where
              high school students compete by building original apps, judged district-by-district
              by members of the U.S. Congress.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '16px',
                color: 'rgba(245,240,232,0.68)',
                lineHeight: 1.75,
                marginBottom: '40px',
              }}
            >
              Bread Head took the win for Minnesota&apos;s 5th Congressional District in 2025.
              The award was presented at a congressional district townhall in Minneapolis.
            </p>

            {/* CTA */}
            <a
              href="https://www.congressionalappchallenge.us/25-MN05/"
              target="_blank"
              rel="noopener noreferrer"
              className="congressional-cta"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#1A2E1A',
                background: '#D4AF5A',
                padding: '14px 30px',
                borderRadius: '100px',
                textDecoration: 'none',
                letterSpacing: '0.01em',
              }}
            >
              View Official Listing →
            </a>

            {/* Location caption */}
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: 'rgba(245,240,232,0.60)',
                marginTop: '20px',
                letterSpacing: '0.04em',
              }}
            >
              Presented at a congressional district townhall, Minneapolis
            </p>

          </div>
        </FadeUp>
      </div>
    </section>
  )
}
