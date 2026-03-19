'use client'

// Sticky nav that fades in on scroll past 80px.
// Transparent → bgSage with blur on scroll.
// useMotionValueEvent avoids manual addEventListener.

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
        height: '64px',
        padding: '0 40px',
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
      {/* Logo */}
      <Image
        src="/assets/logo_w_text.png"
        alt="Bread Head"
        width={120}
        height={32}
        sizes="120px"
        style={{ objectFit: 'contain', objectPosition: 'left' }}
        priority
      />

      {/* Links + CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
        {LINKS.map((link) => (
          <a
            key={link}
            href="#"
            className="nav-link"
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              fontSize: '14px',
              color: '#1A2E1A',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#4A5D4A')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#1A2E1A')}
          >
            {link}
          </a>
        ))}

        {/* CTA — light button style from Pass 2 */}
        <a
          href="#"
          style={{
            fontFamily: 'var(--font-body)',
            fontWeight: 500,
            fontSize: '13px',
            color: '#4A5D4A',
            textDecoration: 'none',
            background: 'rgba(74,93,74,0.10)',
            border: '1px solid rgba(74,93,74,0.25)',
            borderRadius: '100px',
            padding: '8px 20px',
            transition: 'background 0.2s ease',
          }}
        >
          Get Early Access
        </a>
      </div>
    </nav>
  )
}
