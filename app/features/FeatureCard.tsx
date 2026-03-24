'use client'

import Link from 'next/link'

function BookIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="6" y="4" width="14" height="24" rx="2" stroke="#E6EDD9" strokeWidth="1.6"/>
      <path d="M6 8h14M6 12h14M6 16h9" stroke="#E6EDD9" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M22 10l4 4-4 4" stroke="#D1A945" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function BudgetIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <circle cx="16" cy="16" r="11" stroke="#E6EDD9" strokeWidth="1.6"/>
      <path d="M16 5v11l7 7" stroke="#D1A945" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M16 16L9 9" stroke="#E6EDD9" strokeWidth="1.4" strokeLinecap="round" strokeOpacity="0.5"/>
    </svg>
  )
}

function JournalIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="7" y="5" width="18" height="22" rx="2" stroke="#E6EDD9" strokeWidth="1.6"/>
      <path d="M11 11h10M11 15h10M11 19h6" stroke="#E6EDD9" strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M20 19l2-2 2 2-2 2-2-2z" fill="#D1A945"/>
    </svg>
  )
}

const ICONS = { book: BookIcon, budget: BudgetIcon, journal: JournalIcon }

interface FeatureCardProps {
  number: string
  name: string
  tagline: string
  description: string
  href: string
  stat: string
  iconName: keyof typeof ICONS
}

export default function FeatureCard({ number, name, tagline, description, href, stat, iconName }: FeatureCardProps) {
  const Icon = ICONS[iconName]
  return (
    <Link
      href={href}
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div
        className="feature-card"
        style={{
          borderRadius: '20px',
          overflow: 'hidden',
          border: '1px solid rgba(26,46,26,0.10)',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          transition: 'border-color 0.22s ease, box-shadow 0.22s ease, transform 0.22s cubic-bezier(0.25,0.1,0.25,1)',
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(74,93,74,0.35)'
          el.style.boxShadow = '0 12px 40px rgba(26,46,26,0.10)'
          el.style.transform = 'translateY(-6px)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement
          el.style.borderColor = 'rgba(26,46,26,0.10)'
          el.style.boxShadow = 'none'
          el.style.transform = 'translateY(0)'
        }}
      >
        {/* Dark top */}
        <div style={{ background: '#1A2E1A', padding: '36px 32px 32px' }}>
          <div style={{ marginBottom: '20px' }}>
            <Icon />
          </div>
          <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: '11px', letterSpacing: '0.10em', color: 'rgba(230,237,217,0.40)', marginBottom: '6px', textTransform: 'uppercase' }}>
            {number}
          </p>
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontSize: '32px',
              color: '#E6EDD9',
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {name}
          </h2>
        </div>

        {/* Light bottom */}
        <div style={{ background: '#FAFCF8', padding: '28px 32px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '14px', color: '#1A2E1A', lineHeight: 1.4, marginBottom: '10px' }}>
            {tagline}
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '13.5px', color: 'rgba(26,46,26,0.58)', lineHeight: 1.65, marginBottom: '24px', flex: 1 }}>
            {description}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.10em', textTransform: 'uppercase', color: '#4A5D4A' }}>
              {stat}
            </span>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '14px', color: '#4A5D4A' }}>
              Explore →
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
