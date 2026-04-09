// Footer — dark bg bleeds from Final CTA.

import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#1A2E1A' }}>
      {/* Centered bread icon mark */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '32px' }}>
        <Image src="/assets/icon_clear.png" alt="" width={22} height={22} style={{ opacity: 0.28 }} />
      </div>

      {/* Main footer row — logo + nav */}
      <div
        className="footer-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '16px 48px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
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

        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '13px',
            color: 'rgba(230,237,217,0.38)',
            margin: 0,
          }}
        >
          About · Blog · Partners · Contact
        </p>
      </div>

      {/* Combined bottom bar — social + legal */}
      <div style={{ borderTop: '1px solid rgba(230,237,217,0.10)' }}>
        <div
          className="footer-bottom-inner"
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '28px 48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '20px',
          }}
        >
          {/* Instagram */}
          <a
            href="https://www.instagram.com/breadhead_mn/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bread Head on Instagram"
            className="footer-social-icon"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </a>

          {/* Legal links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '36px' }}>
            <Link href="/privacy-notice" className="footer-legal-link">
              Privacy Notice
            </Link>
            <Link href="/privacy-notice#terms" className="footer-legal-link">
              Terms of Use
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
