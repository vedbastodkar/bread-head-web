'use client'

// Reusable scroll-triggered fade-up animation.
// Wraps any content; renders a motion.div that fades in from y:32 on inView.
// Use delay to stagger sibling elements.

import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

interface FadeUpProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
}

export default function FadeUp({
  children,
  delay = 0,
  duration = 0.6,
  className,
}: FadeUpProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Trigger when 15% of the element is visible; fire once only
  const inView = useInView(ref, { once: true, amount: 0.15 })

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{
        duration,
        delay,
        ease: [0.25, 0.1, 0.25, 1],
      }}
    >
      {children}
    </motion.div>
  )
}
