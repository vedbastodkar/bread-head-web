// Minimal footer — bg textTitle (#1A2E1A) bleeds from Final CTA, no border.
// No client directive needed — purely static markup.

import Image from 'next/image'

export default function Footer() {
  return (
    <footer style={{ background: '#1A2E1A' }}>
      {/* Centered bread icon mark */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '28px' }}>
        <Image src="/assets/icon_clear.png" alt="" width={22} height={22} style={{ opacity: 0.28 }} />
      </div>

      <div
        className="footer-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 40px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        {/* Logo */}
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: '16px',
            color: 'rgba(230,237,217,0.50)',
          }}
        >
          Bread Head
        </span>

        {/* Nav links */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '13px',
            color: 'rgba(230,237,217,0.40)',
            margin: 0,
          }}
        >
          About · Blog · Partners · Contact
        </p>

        {/* Copyright */}
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '12px',
            color: 'rgba(230,237,217,0.30)',
            margin: 0,
          }}
        >
          © 2025 Bread Head
        </p>
      </div>
    </footer>
  )
}
