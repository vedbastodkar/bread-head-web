'use client'

// GSAP word-by-word scroll reveal for the Problem section.
// Each word is wrapped in an overflow:hidden clip container so individual
// words slide up into view (y: 110% → 0) as the section enters the viewport.
//
// headlineIndex: if provided, that line index renders with Playfair Display
// bold / large sizing to preserve the h2 visual from Pass 2.

import { useEffect, useRef, Fragment } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

interface WordRevealProps {
  lines: string[]
  // Line at this index gets Playfair Display italic bold / h2 sizing
  headlineIndex?: number
}

export default function WordReveal({ lines, headlineIndex }: WordRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const container = containerRef.current
    if (!container) return

    const words = container.querySelectorAll<HTMLElement>('[data-word]')

    // gsap.context scopes cleanup to this component
    const ctx = gsap.context(() => {
      gsap.from(words, {
        y: '110%',
        opacity: 0,
        stagger: 0.04,
        duration: 0.7,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 70%',
          toggleActions: 'play none none none',
        },
      })
    }, container)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={containerRef} className="space-y-5">
      {lines.map((line, i) => {
        const isHeadline = i === headlineIndex

        return (
          <p
            key={i}
            className={
              isHeadline
                ? 'font-display italic font-bold text-textTitle tracking-[-0.02em] leading-[1.08]'
                : 'word-reveal-sub font-body font-normal leading-snug'
            }
            style={
              isHeadline
                ? { fontSize: 'clamp(36px, 4vw, 52px)' }
                : { fontSize: 'clamp(22px, 2.8vw, 36px)', color: 'rgba(26,46,26,0.75)' }
            }
          >
            {line.split(' ').map((word, j, arr) => (
              <Fragment key={j}>
                {/* Clip container: hides the word during its y:110% starting position */}
                <span
                  style={{
                    display: 'inline-block',
                    overflow: 'hidden',
                    verticalAlign: 'bottom',
                  }}
                >
                  <span data-word="" style={{ display: 'inline-block' }}>
                    {word}
                  </span>
                </span>
                {/* Plain text space between words — sits outside the clip container */}
                {j < arr.length - 1 && ' '}
              </Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
