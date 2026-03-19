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
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* Eyebrow */}
        <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-2">
          Everything in one place
        </p>

        {/* H2 — DM Sans 700, not Playfair */}
        <h2
          className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-6 max-w-xl"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
        >
          Learn. Simulate. Reflect.
        </h2>

        {/* Three cards */}
        <div className="grid md:grid-cols-3 gap-5">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.number} delay={i * 0.15}>
            <div
              className="card-border card-hover rounded-2xl p-7 flex flex-col relative overflow-hidden"
              style={{
                background: i % 2 === 1 ? '#E6EDD9' : '#FFFFFF',
                borderLeft: '3px solid #4A5D4A',
              }}
            >
              {/* Ghost number — large, behind content */}
              <span
                className="absolute top-3 right-4 font-body font-bold select-none pointer-events-none"
                style={{ fontSize: '56px', color: 'rgba(74,93,74,0.08)', lineHeight: 1, zIndex: 0 }}
                aria-hidden="true"
              >
                {pillar.number}
              </span>

              {/* Label row */}
              <div className="flex items-center gap-3 mb-5 relative z-10">
                <div className="flex-1 h-px" style={{ background: 'rgba(26,46,26,0.10)' }} />
                <span className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen">
                  {pillar.label}
                </span>
              </div>

              {/* H3 — DM Sans 600, 20px */}
              <h3 className="font-body font-semibold text-textTitle text-[20px] leading-snug mb-3 relative z-10">
                {pillar.headline}
              </h3>

              {/* Body */}
              <p className="font-body text-[15px] leading-[1.7] mb-5 flex-1 relative z-10"
                 style={{ color: 'rgba(26,46,26,0.65)' }}>
                {pillar.body}
              </p>

              {/* Bullets — tighter, square dot */}
              <ul className="space-y-1.5 relative z-10">
                {pillar.bullets.map((b) => (
                  <li key={b} className="flex items-center">
                    <span
                      style={{
                        display: 'inline-block',
                        width: '4px',
                        height: '4px',
                        background: '#4A5D4A',
                        marginRight: '10px',
                        flexShrink: 0,
                        verticalAlign: 'middle',
                      }}
                    />
                    <span className="font-body text-[14px]"
                          style={{ color: 'rgba(26,46,26,0.65)' }}>
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
