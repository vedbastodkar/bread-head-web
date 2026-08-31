// ── TEMPORARY recruiting strip (homepage) ─────────────────────────
// Runs while team applications are open. To pull it down: delete the
// <JoinTeamStrip /> line in app/page.tsx (the /apply page and the nav chip
// stay). Sits between Partners (bgSage) and FinalCTA (dark), so it is white.
import Link from 'next/link'
import FadeUp from '@/app/components/FadeUp'
import { APPLY_FORM_URL } from '@/lib/links'

export default function JoinTeamStrip() {
  return (
    <section style={{ background: '#FFFFFF' }} data-testid="join-team">
      <div
        className="join-team-inner"
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '72px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '56px',
        }}
      >
        {/* Copy */}
        <FadeUp>
          <div style={{ maxWidth: '700px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: '#4A5D4A',
                background: 'rgba(74,93,74,0.10)',
                border: '1px solid rgba(74,93,74,0.28)',
                borderRadius: '100px',
                padding: '6px 14px',
                marginBottom: '20px',
              }}
            >
              7 roles · applications close Sept 11
            </span>

            <h2
              className="join-team-h2"
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(24px, 2.6vw, 38px)',
                lineHeight: 1.15,
                color: '#1A2E1A',
                margin: '0 0 14px',
              }}
            >
              Driven young people wanted.
            </h2>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '15px',
                lineHeight: 1.7,
                color: 'rgba(26,46,26,0.65)',
                margin: 0,
                maxWidth: '660px',
              }}
            >
              Bread Head is built by high school and college students, and we are taking
              applications for seven positions across design, engineering, content, research,
              social, and partnerships. Semester-long, renewable, and you hear back in 2 to 3
              business days. Applications close September 11. This is a spot on the team, not a
              signup for the app.
            </p>
          </div>
        </FadeUp>

        {/* Actions */}
        <FadeUp delay={0.08}>
          <div
            className="join-team-actions"
            style={{ display: 'flex', flexDirection: 'column', gap: '12px', flexShrink: 0 }}
          >
            <a
              href={APPLY_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#E6EDD9',
                background: '#4A5D4A',
                textDecoration: 'none',
                padding: '14px 28px',
                borderRadius: '100px',
                minHeight: '48px',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
              }}
            >
              Apply here →
            </a>
            <Link
              href="/apply"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#1A2E1A',
                background: '#FFFFFF',
                border: '1px solid rgba(26,46,26,0.18)',
                textDecoration: 'none',
                padding: '14px 28px',
                borderRadius: '100px',
                minHeight: '48px',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
              }}
            >
              See the roles
            </Link>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}
