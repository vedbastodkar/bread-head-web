'use client'

// Full-screen page intro overlay — fires once on initial load, not on navigation.
// bgSage (#E6EDD9) overlay: opacity 1 → 0, y 0 → -24px over 0.6s with 0.1s delay.
// AnimatePresence removes it from DOM after the animation completes.

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

export default function PageTransition() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    // 0.1s delay + 0.6s duration = 0.7s, add a small buffer
    const id = setTimeout(() => setVisible(false), 850)
    return () => clearTimeout(id)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-transition"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: '#E6EDD9',
            pointerEvents: 'none',
          }}
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 0, y: -24 }}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.1, 0.25, 1],
            delay: 0.1,
          }}
        />
      )}
    </AnimatePresence>
  )
}
