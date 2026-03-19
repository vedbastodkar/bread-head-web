'use client'

// Lenis smooth scroll — wraps the entire app in layout.tsx.
// Also registers GSAP ScrollTrigger and calls ScrollTrigger.update()
// on every raf frame so Lenis and GSAP never fall out of sync.

import { useEffect } from 'react'
import Lenis from '@studio-freight/lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register ScrollTrigger once at the app level so all GSAP scroll
    // animations share the same plugin instance.
    gsap.registerPlugin(ScrollTrigger)

    const lenis = new Lenis({
      lerp: 0.08,
      duration: 1.2,
      smoothWheel: true,
    })

    let rafId: number

    function raf(time: number) {
      lenis.raf(time)
      // Keep GSAP ScrollTrigger in sync with Lenis's virtual scroll position
      ScrollTrigger.update()
      rafId = requestAnimationFrame(raf)
    }

    rafId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(rafId)
      lenis.destroy()
    }
  }, [])

  return <>{children}</>
}
