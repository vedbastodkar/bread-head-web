'use client'

// Animated XP progress bar for the Gamification section.
// Framer Motion animates width from 0% → target% when the bar enters view.
// Visual styles match Pass 2 exactly — only the width animates.

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface XPBarProps {
  percentage: number // 0–100
}

export default function XPBar({ percentage }: XPBarProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })

  return (
    <div
      ref={ref}
      className="h-2 rounded-full overflow-hidden"
      style={{ background: 'rgba(255,255,255,0.08)' }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: '#D1A945' }}
        initial={{ width: '0%' }}
        animate={inView ? { width: `${percentage}%` } : { width: '0%' }}
        transition={{
          duration: 1.4,
          ease: [0.25, 0.1, 0.25, 1],
          delay: 0.3,
        }}
      />
    </div>
  )
}
