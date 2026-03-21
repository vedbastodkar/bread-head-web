// ── Marketing home page ─────────────────────────────────────────
// Section background rhythm:
//   §1 Hero         → bgSage  (#E6EDD9)
//   §2 Problem      → white   (#FFFFFF)
//   §2b WhyItMatters→ white   (#FFFFFF)  ← data bridge after Problem
//   §3 Pillars      → bgSage  (#E6EDD9)
//   — Ticker strip  → bgSage  (seamless extension of §3)
//   §4 Lessons      → white   (#FFFFFF)
//   §5 Gamification → dark    (#1A2E1A)  ← accentGold approved
//   §6 Journal      → bgSage  (#E6EDD9)
//   §7 Partners     → bgSage  (#E6EDD9)
//   §8 Final CTA    → dark    (#1A2E1A)  ← accentGold headline

import Hero           from '@/components/sections/Hero'
import Problem        from '@/components/sections/Problem'
import WhyItMatters  from '@/components/sections/WhyItMatters'
import Pillars        from '@/components/sections/Pillars'
import Ticker         from '@/components/sections/Ticker'
import LessonsPreview from '@/components/sections/LessonsPreview'
import Gamification   from '@/components/sections/Gamification'
import Journal        from '@/components/sections/Journal'
import Partners       from '@/components/sections/Partners'
import FinalCTA       from '@/components/sections/FinalCTA'
import Footer         from '@/app/components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <WhyItMatters bg="#1A2E1A" />
      <Pillars />
      <Ticker />
      <LessonsPreview />
      <Gamification />
      <Journal />
      <Partners />
      <FinalCTA />
      <Footer />
    </main>
  )
}
