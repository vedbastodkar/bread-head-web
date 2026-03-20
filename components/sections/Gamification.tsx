// ── §5 Gamification ─────────────────────────────────────────────
// bg: textTitle (#1A2E1A) — dark
// accentGold (#D1A945): XP bar fill, streak number, badge borders — approved use
// ALL text: bgSage (#E6EDD9) or rgba(230,237,217,0.6) for muted
// ZERO brandGreen in this section
// Pass 3: XPBar replaces static bar div; CountUp replaces streak "12"

import XPBar   from '@/app/components/XPBar'
import CountUp from '@/app/components/CountUp'

const achievements = [
  { label: 'First Lesson',    earned: true  },
  { label: '3-Day Streak',    earned: true  },
  { label: 'Budget Builder',  earned: true  },
  { label: 'Tax Basics',      earned: false },
  { label: 'Credit Champion', earned: false },
]

export default function Gamification() {
  return (
    <section className="bg-textTitle grain-overlay">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Left: copy ──────────────────────────────────── */}
          <div>
            {/* Eyebrow — accentGold (gold rules in this section) */}
            <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-accentGold mb-2">
              Built to Stick
            </p>

            {/* H2 — DM Sans 700, not Playfair */}
            <h2
              className="font-body font-bold text-bgSage tracking-[-0.02em] leading-[1.08] mb-3"
              style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
            >
              Learning that rewards showing up.
            </h2>

            <p className="font-body text-[16px] leading-[1.7] mb-3 max-w-lg"
               style={{ color: 'rgba(230,237,217,0.65)' }}>
              Every lesson earns XP. Every day you practice builds your streak.
              Every week you finish smarter than the last.
            </p>

            <p className="font-body text-[15px] leading-[1.7] max-w-lg"
               style={{ color: 'rgba(230,237,217,0.50)' }}>
              Bread Head uses the same mechanics that make games addictive —
              aimed at a skill that compounds for the rest of your life.
            </p>

            {/* Feature list */}
            <ul className="mt-5 space-y-3">
              {[
                'XP points for every lesson and journal entry',
                'Daily streaks with milestone rewards',
                'Level system from Beginner to Money Master',
                'Unlockable lessons as your knowledge builds',
              ].map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0 mt-[7px]"
                    style={{ background: '#D1A945' }}
                  />
                  <span className="font-body text-[14px]"
                        style={{ color: 'rgba(230,237,217,0.60)' }}>
                    {f}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: XP + streak UI ───────────────────────── */}
          <div className="space-y-4">

            {/* Profile + XP bar */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
            >
              <div className="flex items-center gap-4 mb-7">
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full shrink-0 flex items-center justify-center"
                  style={{ background: 'rgba(74,93,74,0.35)', border: '0.5px solid rgba(74,93,74,0.40)' }}
                >
                  <span className="font-body font-semibold text-bgSage text-[12px]">JD</span>
                </div>
                <div>
                  <p className="font-body font-semibold text-bgSage text-[14px]">Jordan D.</p>
                  <p className="font-body text-[11px]"
                     style={{ color: 'rgba(230,237,217,0.45)' }}>
                    Level 4 · Money Builder
                  </p>
                </div>
                {/* Streak badge — accentGold */}
                <div
                  className="ml-auto rounded-xl px-4 py-2 flex items-center gap-2"
                  style={{
                    background: 'rgba(209,169,69,0.12)',
                    border: '0.5px solid rgba(209,169,69,0.30)',
                  }}
                >
                  <span className="text-[15px]">🔥</span>
                  <div>
                    <CountUp
                    target={12}
                    className="font-display font-bold text-accentGold text-[15px] max-md:text-[48px] leading-none"
                    style={{}}
                  />
                    <p className="font-body text-[9px]"
                       style={{ color: 'rgba(209,169,69,0.60)' }}>day streak</p>
                  </div>
                </div>
              </div>

              {/* XP bar */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <p className="font-body font-medium text-[10px] tracking-[0.10em] uppercase"
                     style={{ color: 'rgba(230,237,217,0.45)' }}>
                    XP Progress
                  </p>
                  <p className="font-body text-[13px]" style={{ color: 'rgba(230,237,217,0.70)' }}>
                    <span className="font-semibold text-accentGold">750</span>
                    <span style={{ color: 'rgba(230,237,217,0.35)' }}> / 1,000</span>
                  </p>
                </div>
                <XPBar percentage={75} />
                <p className="font-body text-[11px] mt-1.5"
                   style={{ color: 'rgba(230,237,217,0.35)' }}>
                  250 XP to Level 5 · Credit Aware
                </p>
              </div>
            </div>

            {/* Achievements */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
            >
              <p className="font-body font-medium text-[10px] tracking-[0.10em] uppercase mb-5"
                 style={{ color: 'rgba(230,237,217,0.40)' }}>
                Achievements
              </p>
              <div className="achievements-grid flex flex-wrap gap-2">
                {achievements.map((a) => (
                  <div
                    key={a.label}
                    className="achievement-badge font-body font-medium text-[12px] px-3.5 py-1.5 rounded-full"
                    style={
                      a.earned
                        ? {
                            background: 'rgba(209,169,69,0.08)',
                            border: '1.5px solid #D1A945',
                            color: '#D1A945',
                          }
                        : {
                            background: 'rgba(255,255,255,0.04)',
                            border: '0.5px solid rgba(255,255,255,0.10)',
                            color: 'rgba(230,237,217,0.22)',
                            opacity: 0.35,
                          }
                    }
                  >
                    {a.earned ? '✓ ' : ''}{a.label}
                  </div>
                ))}
              </div>
            </div>

            {/* Recent activity */}
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.10)' }}
            >
              <p className="font-body font-medium text-[10px] tracking-[0.10em] uppercase mb-5"
                 style={{ color: 'rgba(230,237,217,0.40)' }}>
                Recent Activity
              </p>
              <div className="space-y-4">
                {[
                  { action: 'Completed "Reading Your First Pay Stub"', xp: '+120 XP', time: '2h ago' },
                  { action: 'Journal entry: Coffee Reality Check',      xp: '+40 XP',  time: 'Yesterday' },
                  { action: 'Budget simulation: First Paycheck',        xp: '+80 XP',  time: '2d ago' },
                ].map((item) => (
                  <div key={item.action} className="flex items-start justify-between gap-4">
                    <p className="font-body text-[13px] leading-snug flex-1"
                       style={{ color: 'rgba(230,237,217,0.55)' }}>
                      {item.action}
                    </p>
                    <div className="text-right shrink-0">
                      <p className="font-body font-semibold text-[12px] text-accentGold">{item.xp}</p>
                      <p className="font-body text-[10px]"
                         style={{ color: 'rgba(230,237,217,0.30)' }}>
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
