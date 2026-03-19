'use client'

// Subtle scroll parallax for the Hero phone mockup.
// As the page scrolls 0 → 300px, the phone floats from y:0 → y:-40px.
// useSpring adds spring physics so the motion feels natural, not mechanical.

import { useScroll, useTransform, useSpring, motion } from 'framer-motion'

export default function PhoneParallax({ children }: { children: React.ReactNode }) {
  // scrollY tracks the raw window scroll position
  const { scrollY } = useScroll()

  // Map scroll 0–300px to y 0 → -40px
  const rawY = useTransform(scrollY, [0, 300], [0, -40])

  // Add spring physics over the transform
  const y = useSpring(rawY, { stiffness: 80, damping: 20 })

  return <motion.div style={{ y }}>{children}</motion.div>
}
