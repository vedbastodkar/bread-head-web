'use client'

// Magnetic button wrapper — purely a motion layer, no visual style.
// On mousemove: calculates offset from center and applies (offset * 0.35) shift.
// On mouseleave: springs back to 0,0 (stiffness:200, damping:20).

import { useRef } from 'react'
import { motion, useSpring } from 'framer-motion'

const SPRING = { stiffness: 200, damping: 20 }

export default function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const x = useSpring(0, SPRING)
  const y = useSpring(0, SPRING)

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return
    x.set((e.clientX - (rect.left + rect.width  / 2)) * 0.35)
    y.set((e.clientY - (rect.top  + rect.height / 2)) * 0.35)
  }

  function onMouseLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <motion.div
      ref={ref}
      style={{ x, y, display: 'inline-block' }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </motion.div>
  )
}
