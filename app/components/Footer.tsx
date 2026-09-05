import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#1A2E1A' }}>
      <div
        className="footer-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Left — icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image
            src="/assets/icon_clear.png"
            alt=""
            width={28}
            height={28}
            style={{ opacity: 0.45 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '20px',
              color: 'rgba(230,237,217,0.55)',
            }}
          >
            Bread Head
          </span>
        </div>

        {/* Right — Instagram + LinkedIn + Support + Privacy Notice + copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
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

          <a
            href="https://www.linkedin.com/company/bread-head-org/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bread Head on LinkedIn"
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
              <line x1="7" y1="11" x2="7" y2="17" />
              <circle cx="7" cy="7.75" r="0.5" fill="currentColor" stroke="none" />
              <path d="M11 17v-6" />
              <path d="M11 13.5a2.5 2.5 0 0 1 5 0V17" />
            </svg>
          </a>

          <Link href="/apply" className="footer-legal-link">
            Join the team
          </Link>

          <Link href="/support" className="footer-legal-link">
            Support
          </Link>

          <Link href="/privacy-notice" className="footer-legal-link">
            Privacy Notice
          </Link>

          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '12px',
              color: 'rgba(230,237,217,0.3)',
            }}
          >
            © 2026 Bread Head · 501(c)(3) nonprofit
          </span>
        </div>
      </div>
    </footer>
  )
}
