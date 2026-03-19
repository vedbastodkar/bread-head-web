'use client'

// Animated number counter that fires once when the element enters the viewport.
// Default style: Playfair Display 700, 48px (matches stat number spec).
// Pass className + style={{}} to override for contextual usage (e.g. streak).

import { useEffect, useRef, useState } from 'react'
import { useInView } from 'framer-motion'

interface CountUpProps {
  target: number
  suffix?: string
  duration?: number
  // Set true to format with locale commas: 2400 → "2,400"
  format?: boolean
  // Override default Playfair 700 / 48px styling
  className?: string
  style?: React.CSSProperties
}

export default function CountUp({
  target,
  suffix = '',
  duration = 1.8,
  format = false,
  className,
  style,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return

    const startTime = performance.now()
    let rafId: number

    // Cubic ease-out: fast start, slow finish
    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3)
    }

    function tick(now: number) {
      const elapsed = (now - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      setValue(Math.round(easeOut(progress) * target))
      if (progress < 1) rafId = requestAnimationFrame(tick)
    }

    rafId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId)
  }, [inView, target, duration])

  const display = format
    ? Math.round(value).toLocaleString()
    : String(Math.round(value))

  // Defaults match the spec stat number style
  const defaultClass = 'font-display font-bold text-textTitle leading-none'
  const defaultStyle: React.CSSProperties = { fontSize: '48px' }

  return (
    <span
      ref={ref}
      className={className !== undefined ? className : defaultClass}
      style={style !== undefined ? style : defaultStyle}
    >
      {display}{suffix}
    </span>
  )
}
