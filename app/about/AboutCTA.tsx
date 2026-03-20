'use client'

import Link from 'next/link'

export default function AboutCTA() {
  return (
    <div
      className="about-cta-buttons"
      style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}
    >
      <Link
        href="/partners"
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '15px',
          color: '#E6EDD9',
          textDecoration: 'none',
          background: '#4A5D4A',
          borderRadius: '100px',
          padding: '12px 32px',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'opacity 0.2s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.85')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        Partner with us →
      </Link>

      <Link
        href="/#cta"
        style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: '15px',
          color: '#4A5D4A',
          textDecoration: 'none',
          background: 'rgba(74,93,74,0.10)',
          borderRadius: '100px',
          padding: '12px 32px',
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'background 0.2s ease',
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(74,93,74,0.16)')}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'rgba(74,93,74,0.10)')}
      >
        Get Early Access
      </Link>
    </div>
  )
}
