'use client'

// Sticky nav — transparent → bgSage blur on scroll past 80px.
// Mobile: hamburger menu replaces links + CTA.

import Image from 'next/image'
import { useState, useEffect } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'

const LINKS = [
  { label: 'About',    href: '/about' },
  { label: 'Lessons',  href: '/#lessons' },
  { label: 'Partners', href: '/partners' },
]

export default function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 80))

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease',
          background: scrolled ? 'rgba(230,237,217,0.85)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled
            ? '0.5px solid rgba(26,46,26,0.10)'
            : '0.5px solid transparent',
        }}
      >
        {/* Logo — height 44px, width proportional */}
        <Image
          src="/assets/logo_w_text.png"
          alt="Bread Head"
          width={163}
          height={44}
          sizes="163px"
          style={{ objectFit: 'contain', objectPosition: 'left' }}
          priority
        />

        {/* Desktop: Links + CTA — hidden below 768px */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '32px' }}>
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '14px',
                letterSpacing: '0.03em',
                color: 'rgba(26,46,26,0.7)',
                textDecoration: 'none',
                transition: 'color 0.2s ease',
                minHeight: '44px',
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1A2E1A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(26,46,26,0.7)')}
            >
              {link.label}
            </a>
          ))}

          {/* CTA — solid brandGreen */}
          <a
            href="/#cta"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 600,
              fontSize: '14px',
              color: '#E6EDD9',
              textDecoration: 'none',
              background: '#4A5D4A',
              borderRadius: '100px',
              padding: '10px 22px',
              transition: 'opacity 0.2s ease',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          >
            Get Early Access
          </a>
        </div>

        {/* Mobile: Hamburger button — shown below 768px */}
        <button
          className="flex md:hidden flex-col items-center justify-center"
          onClick={() => setMenuOpen(true)}
          aria-label="Open menu"
          style={{
            minWidth: '44px',
            minHeight: '44px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            gap: '5px',
            padding: '0',
          }}
        >
          <span style={{ display: 'block', width: '20px', height: '2px', background: '#1A2E1A', borderRadius: '1px' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', background: '#1A2E1A', borderRadius: '1px' }} />
          <span style={{ display: 'block', width: '20px', height: '2px', background: '#1A2E1A', borderRadius: '1px' }} />
        </button>
      </nav>

      {/* Mobile full-screen overlay menu */}
      {menuOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 60,
            background: '#E6EDD9',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          {/* Close button — top right, 44×44 touch target */}
          <button
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
            style={{
              position: 'absolute',
              top: '20px',
              right: '24px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              fontSize: '20px',
              color: '#1A2E1A',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Nav links + CTA */}
          <nav style={{ width: '100%', maxWidth: '320px' }}>
            {LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  fontSize: '32px',
                  color: '#1A2E1A',
                  textDecoration: 'none',
                  textAlign: 'center',
                  paddingTop: '16px',
                  paddingBottom: '16px',
                  borderBottom: '0.5px solid rgba(26,46,26,0.1)',
                  minHeight: '44px',
                }}
              >
                {link.label}
              </a>
            ))}

            {/* Get Early Access CTA */}
            <a
              href="/#cta"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '32px',
                width: '100%',
                background: '#4A5D4A',
                color: '#E6EDD9',
                padding: '16px',
                borderRadius: '100px',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '16px',
                textDecoration: 'none',
                textAlign: 'center',
                minHeight: '48px',
                boxSizing: 'border-box',
              }}
            >
              Get Early Access
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
