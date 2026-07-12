'use client'

// Sticky nav — transparent → bgSage blur on scroll past 80px.
// Mobile: hamburger menu replaces links + CTA.

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useScroll, useMotionValueEvent, motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { APP_STORE_URL } from '@/lib/links'

const LINKS = [
  { label: 'About',    href: '/about' },
  { label: 'App',      href: '/features' },
  { label: 'Partners', href: '/partners' },
]

const APP_SUB_LINKS = [
  { label: 'Lessons',   href: '/lessons' },
  { label: 'Budgeting', href: '/budget' },
  { label: 'Journal',   href: '/journal' },
]

export default function Nav() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [appHovered, setAppHovered] = useState(false)
  const leaveTimer = useRef<ReturnType<typeof setTimeout>>()

  const showApp    = () => { clearTimeout(leaveTimer.current); setAppHovered(true) }
  const cancelHide = () => { clearTimeout(leaveTimer.current) }
  const hideApp    = () => { leaveTimer.current = setTimeout(() => setAppHovered(false), 150) }

  const { user } = useAuth()
  const pathname = usePathname()

  const navLinkStyle: React.CSSProperties = {
    fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '14px',
    letterSpacing: '0.03em', color: 'rgba(26,46,26,0.7)', textDecoration: 'none',
    transition: 'color 0.2s ease', minHeight: '44px', display: 'flex',
    alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
  }

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 80))

  // Focus view: inside a lesson the marketing nav is hidden (the LessonPlayer draws
  // its own logo + "Exit lesson" bar).
  const inLesson = pathname === '/lesson' || (pathname?.startsWith('/learn') ?? false)

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  if (inLesson) return null

  return (
    <>
      <nav
        onMouseLeave={hideApp}
        onMouseEnter={cancelHide}
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
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center' }}>
          <Image
            src="/assets/logo_w_text.png"
            alt="Bread Head"
            width={163}
            height={44}
            sizes="163px"
            style={{ objectFit: 'contain', objectPosition: 'left' }}
            priority
          />
        </Link>

        {/* Desktop: Links + CTA */}
        <div className="hidden md:flex" style={{ alignItems: 'center', gap: '32px' }}>
          {LINKS.map((link) =>
            link.label === 'App' ? (
              <div
                key="App"
                style={{ position: 'relative' }}
                onMouseEnter={showApp}
              >
                <a
                  href={link.href}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '14px',
                    letterSpacing: '0.03em',
                    color: appHovered ? '#1A2E1A' : 'rgba(26,46,26,0.7)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                    minHeight: '44px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  App
                </a>

                {/* Dropdown — flush extension of the nav bar */}
                <motion.div
                  onMouseEnter={cancelHide}
                  onMouseLeave={hideApp}
                  animate={{ opacity: appHovered ? 1 : 0, y: appHovered ? 0 : -2 }}
                  transition={{ duration: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{
                    position: 'fixed',
                    top: '92px',
                    left: 0,
                    right: 0,
                    background: 'rgba(230,237,217,0.97)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    borderTop: '0.5px solid rgba(26,46,26,0.10)',
                    borderBottom: '0.5px solid rgba(26,46,26,0.10)',
                    boxShadow: '0 4px 16px rgba(26,46,26,0.06)',
                    pointerEvents: appHovered ? 'auto' : 'none',
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '4px',
                    padding: '10px 32px',
                  }}
                >
                  {APP_SUB_LINKS.map((sub) => (
                    <a
                      key={sub.href}
                      href={sub.href}
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 500,
                        fontSize: '13px',
                        color: 'rgba(26,46,26,0.65)',
                        textDecoration: 'none',
                        padding: '6px 16px',
                        transition: 'color 0.14s ease',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = '#1A2E1A' }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(26,46,26,0.65)' }}
                    >
                      {sub.label}
                    </a>
                  ))}
                </motion.div>
              </div>
            ) : (
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
            )
          )}

          {/* Auth-aware controls */}
          {user ? (
            <a
              href="/dashboard"
              style={navLinkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1A2E1A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(26,46,26,0.7)')}
            >
              Dashboard
            </a>
          ) : (
            <a
              href="/login"
              style={navLinkStyle}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1A2E1A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(26,46,26,0.7)')}
            >
              Log in
            </a>
          )}

          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
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
            Download on the App Store
          </a>
        </div>

        {/* Mobile: Hamburger */}
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

      {/* Mobile overlay menu */}
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
            {/* App sub-links on mobile */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', paddingTop: '12px', paddingBottom: '12px', borderBottom: '0.5px solid rgba(26,46,26,0.1)' }}>
              {APP_SUB_LINKS.map((sub) => (
                <a
                  key={sub.href}
                  href={sub.href}
                  onClick={() => setMenuOpen(false)}
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 500,
                    fontSize: '13px',
                    color: 'rgba(26,46,26,0.50)',
                    textDecoration: 'none',
                  }}
                >
                  {sub.label}
                </a>
              ))}
            </div>

            {/* Auth-aware controls (mobile) */}
            {user ? (
              <a
                href="/dashboard"
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', textAlign: 'center', paddingTop: '16px', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '16px', color: '#1A2E1A', textDecoration: 'none' }}
              >
                Dashboard
              </a>
            ) : (
              <a
                href="/login"
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', textAlign: 'center', paddingTop: '16px', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: '16px', color: '#1A2E1A', textDecoration: 'none' }}
              >
                Log in
              </a>
            )}

            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
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
              Download on the App Store
            </a>
          </nav>
        </div>
      )}
    </>
  )
}
