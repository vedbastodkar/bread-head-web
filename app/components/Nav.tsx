'use client'

// Sticky nav — transparent → bgSage blur on scroll past 80px.

import Image from 'next/image'
import { useState } from 'react'
import { useScroll, useMotionValueEvent } from 'framer-motion'

const LINKS = ['About', 'Lessons', 'Partners']

export default function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 80))

  return (
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

      {/* Links + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {LINKS.map((link) => (
          <a
            key={link}
            href="#"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: '14px',
              letterSpacing: '0.03em',
              color: 'rgba(26,46,26,0.7)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1A2E1A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(26,46,26,0.7)')}
          >
            {link}
          </a>
        ))}

        {/* CTA — solid brandGreen */}
        <a
          href="#"
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
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.85')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          Get Early Access
        </a>
      </div>
    </nav>
  )
}
