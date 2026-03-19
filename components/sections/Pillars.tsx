// ── §3 Pillars ──────────────────────────────────────────────────
// bg: bgSage (#E6EDD9)
// Cards: bg white, 0.5px border, 16px radius, 28px padding, NO shadows
// h2: Playfair italic (emotional — "Learn. Simulate. Reflect.")
// h3: DM Sans 600, 20px
// Pass 3: each card wrapped in FadeUp with delays 0, 0.15, 0.3

import FadeUp from '@/app/components/FadeUp'

const pillars = [
  {
    number: '01',
    label: 'Learn',
    headline: 'Real topics. Not textbook examples.',
    body: 'Bite-sized lessons on the money decisions that actually come up — reading your first pay stub, understanding your credit score, filing taxes, comparing apartments.',
    bullets: [
      '5–7 minute lessons',
      'Built around teen decisions',
      'Progress that sticks',
    ],
  },
  {
    number: '02',
    label: 'Simulate',
    headline: 'See the tradeoffs before they cost you.',
    body: 'Drag dollars between needs, wants, savings, and goals. Every adjustment updates your month in real time. A budget sandbox, not a spreadsheet.',
    bullets: [
      'Drag-and-drop dough',
      'Scenario testing',
      'What-if without consequences',
    ],
  },
  {
    number: '03',
    label: 'Reflect',
    headline: "Turn your choices into patterns.",
    body: "A private money journal with short prompts designed for 2–3 minutes. Notice where your money goes. Notice how it makes you feel. Notice what you'd change.",
    bullets: [
      'Short prompts, real insights',
      'Weekly pattern view',
      'No judgment, ever',
    ],
  },
]

export default function Pillars() {
  return (
    <section className="bg-bgSage">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-28 lg:py-36">

        {/* Eyebrow */}
        <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-5">
          Everything in one place
        </p>

        {/* H2 — Playfair italic */}
        <h2
          className="font-display italic font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-16 max-w-xl"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
        >
          Learn. Simulate. Reflect.
        </h2>

        {/* Three cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.number} delay={i * 0.15}>
            <div
              className="bg-cardBg card-border card-hover rounded-2xl p-7 flex flex-col"
            >
              {/* Number + divider + label */}
              <div className="flex items-center gap-3 mb-7">
                <span className="font-body font-medium text-[11px]"
                      style={{ color: 'rgba(26,46,26,0.30)' }}>
                  {pillar.number}
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(26,46,26,0.10)' }} />
                <span className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen">
                  {pillar.label}
                </span>
              </div>

              {/* H3 — DM Sans 600, 20px */}
              <h3 className="font-body font-semibold text-textTitle text-[20px] leading-snug mb-4">
                {pillar.headline}
              </h3>

              {/* Body */}
              <p className="font-body text-[15px] leading-[1.7] mb-7 flex-1"
                 style={{ color: 'rgba(26,46,26,0.65)' }}>
                {pillar.body}
              </p>

              {/* Bullets */}
              <ul className="space-y-2.5">
                {pillar.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-2.5">
                    <span className="w-[5px] h-[5px] rounded-full bg-brandGreen shrink-0" />
                    <span className="font-body text-[13px]"
                          style={{ color: 'rgba(26,46,26,0.60)' }}>
                      {b}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            </FadeUp>
          ))}
        </div>

      </div>
    </section>
  )
}
