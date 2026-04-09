// Footer — dark bg bleeds from Final CTA.
// Includes Instagram social link and Privacy Notice.

import Image from 'next/image'
import Link from 'next/link'

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
          padding: '16px 40px 20px',
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

        {/* Instagram icon */}
        <a
          href="https://www.instagram.com/breadhead_mn/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Bread Head on Instagram"
          className="footer-social-icon"
        >
          {/* Instagram SVG */}
          <svg
            width="16"
            height="16"
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
      </div>

      {/* Bottom bar — divider + legal links */}
      <div
        style={{
          borderTop: '1px solid rgba(230,237,217,0.08)',
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '14px 40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 400,
            fontSize: '12px',
            color: 'rgba(230,237,217,0.28)',
            margin: 0,
          }}
        >
          © 2026 Bread Head
        </p>

        <div style={{ display: 'flex', gap: '24px' }}>
          <Link
            href="/privacy-notice"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '12px',
              color: 'rgba(230,237,217,0.35)',
              textDecoration: 'none',
            }}
          >
            Privacy Notice
          </Link>
          <Link
            href="/privacy-notice#terms"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '12px',
              color: 'rgba(230,237,217,0.35)',
              textDecoration: 'none',
            }}
          >
            Terms of Use
          </Link>
        </div>
      </div>
    </footer>
  )
}
