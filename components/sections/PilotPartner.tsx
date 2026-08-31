// ── Pilot partner band ──────────────────────────────────────────
// Names the first program partner. Used on the homepage Partners section
// and on /partners. White card so it reads on either sage background.
import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'

export default function PilotPartner() {
  return (
    <FadeUp>
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
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Image
            src="/assets/breakthroughmlps_logo.png"
            alt="Breakthrough Twin Cities"
            width={200}
            height={100}
            sizes="200px"
            style={{ width: '160px', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Copy */}
        <div>
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
            Partnered with Breakthrough Twin Cities for a 2026 summer pilot.
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
            We provided the Bread Head app to students in their summer program, our first
            partnership putting it in the hands of a full cohort.
          </p>
        </div>
      </div>
    </FadeUp>
  )
}
