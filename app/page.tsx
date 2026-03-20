// ── Marketing home page ─────────────────────────────────────────
// Section background rhythm (exact — no deviations):
//   §1 Hero         → bgSage  (#E6EDD9)
//   §2 Problem      → white   (#FFFFFF)
//   §3 Pillars      → bgSage  (#E6EDD9)
//   — Ticker strip  → bgSage  (seamless extension of §3)
//   §4 Lessons      → white   (#FFFFFF)
//   §5 Gamification → dark    (#1A2E1A)  ← accentGold approved
//   §6 Journal      → bgSage  (#E6EDD9)
//   §7 Partners     → white   (#FFFFFF)
//   §8 Final CTA    → dark    (#1A2E1A)  ← accentGold headline

import Hero           from '@/components/sections/Hero'
import Problem        from '@/components/sections/Problem'
import Pillars        from '@/components/sections/Pillars'
import Ticker         from '@/components/sections/Ticker'
import LessonsPreview from '@/components/sections/LessonsPreview'
import Gamification   from '@/components/sections/Gamification'
import Journal        from '@/components/sections/Journal'
import Partners       from '@/components/sections/Partners'
import WhyItMatters  from '@/components/sections/WhyItMatters'
import FinalCTA       from '@/components/sections/FinalCTA'
import Footer         from '@/app/components/Footer'

export default function Home() {
  return (
    <main>
      <Hero />
      <Problem />
      <Pillars />
      <Ticker />
      <LessonsPreview />
      <Gamification />
      <Journal />
      <Partners />
      <WhyItMatters />
      <FinalCTA />
      <Footer />
    </main>
  )
}
