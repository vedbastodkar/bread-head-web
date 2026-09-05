// ── Pilot partner band ──────────────────────────────────────────
// Names the program partners. Used on the homepage Partners section
// and on /partners. White cards so they read on either sage background.
import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'

type Partner = {
  name: string
  logo: string
  /** Rendered logo box — set by whichever dimension keeps the mark optically even. */
  logoStyle: React.CSSProperties
  headline: string
  body: string
  /** Partner's own site — opens in a new tab from the band's arrow button. */
  url: string
}

const PARTNERS: Partner[] = [
  {
    name: 'Breakthrough Twin Cities',
    logo: '/assets/breakthroughmlps_logo.png',
    logoStyle: { width: '160px', height: 'auto' },
    url: 'https://www.breakthroughtwincities.org/',
    headline: 'Partnered with Breakthrough Twin Cities for a 2026 summer pilot.',
    body:
      'We provided the Bread Head app to students in their summer program, our first ' +
      'partnership putting it in the hands of a full cohort.',
  },
  {
    name: 'Young Kings & Queens Foundation',
    logo: '/assets/youngkingsqueens_logo.png',
    logoStyle: { width: 'auto', height: '96px' },
    url: 'https://www.youngkingsandqueensfoundation.com/',
    headline: 'Partnered with the Young Kings & Queens Foundation.',
    body:
      'Young Kings & Queens Foundation empowers youth ages 10–17 through mentoring, ' +
      'hands-on life skills, financial education, career readiness, and confidence-building activities.',
  },
]

export default function PilotPartner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {PARTNERS.map((partner) => (
        <FadeUp key={partner.name}>
          <div
            className="card-border pilot-partner"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '28px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
            }}
          >
            {/* Partner logo */}
            <div
              className="pilot-partner-logo"
              style={{
                flexShrink: 0,
                width: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Image
                src={partner.logo}
                alt={partner.name}
                width={200}
                height={100}
                sizes="200px"
                style={{ objectFit: 'contain', ...partner.logoStyle }}
              />
            </div>

            {/* Copy */}
            <div style={{ flex: 1 }}>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: '#4A5D4A',
                  margin: '0 0 8px',
                }}
              >
                Program partner
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '18px',
                  lineHeight: 1.4,
                  color: '#1A2E1A',
                  margin: '0 0 6px',
                }}
              >
                {partner.headline}
              </p>
              <p
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 400,
                  fontSize: '15px',
                  lineHeight: 1.7,
                  color: 'rgba(26,46,26,0.65)',
                  margin: 0,
                  maxWidth: '560px',
                }}
              >
                {partner.body}
              </p>
            </div>

            {/* Link to the partner's own site */}
            <a
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pilot-partner-cta"
              aria-label={`Visit ${partner.name}`}
              style={{
                flexShrink: 0,
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '14px',
                color: '#E6EDD9',
                textDecoration: 'none',
                background: '#4A5D4A',
                borderRadius: '100px',
                padding: '12px 24px',
                display: 'inline-flex',
                alignItems: 'center',
                transition: 'opacity 0.15s ease',
                minHeight: '44px',
              }}
            >
              Visit&nbsp;→
            </a>
          </div>
        </FadeUp>
      ))}
    </div>
  )
}
