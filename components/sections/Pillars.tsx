// ── §3 Pillars ──────────────────────────────────────────────────
// bg: bgSage (#E6EDD9)
// H2: gold outline (transparent + text-stroke #D1A945)
// Card top row: label left, ghost number right
// Mobile: top border replaces left border

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

        {/* Eyebrow — gold fill + dark outline */}
        <p
          className="pillars-eyebrow font-body font-semibold text-[13px] tracking-[0.13em] max-md:tracking-[0.08em] uppercase mb-2"
          style={{
            color: '#D1A945',
            WebkitTextStroke: '0.5px #1A2E1A',
          }}
        >
          Everything in one place
        </p>

        {/* H2 — DM Sans 700, solid dark green */}
        <h2
          className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-6 max-w-xl"
          style={{ fontSize: 'clamp(32px, 4.5vw, 56px)' }}
        >
          Learn. Simulate. Reflect.
        </h2>

        {/* Three cards */}
        <div className="grid md:grid-cols-3 gap-5 max-md:gap-4">
          {pillars.map((pillar, i) => (
            <FadeUp key={pillar.number} delay={i * 0.15}>
            <div
              className="pillar-card card-border card-hover rounded-2xl p-7 max-md:p-6 flex flex-col"
              style={{
                background: i % 2 === 1 ? '#E6EDD9' : '#FFFFFF',
                borderLeft: '3px solid #4A5D4A',
              }}
            >
              {/* Top row: label left, ghost number right */}
              <div className="flex justify-between items-start mb-5">
                {/* Label — flush left, no pill */}
                <span className="font-body font-semibold text-[10px] tracking-[0.13em] uppercase text-brandGreen">
                  {pillar.label}
                </span>
                {/* Ghost number — top right, in flow */}
                <span
                  className="font-body font-bold select-none pointer-events-none"
                  style={{ fontSize: '52px', color: 'rgba(26,46,26,0.07)', lineHeight: 1, textAlign: 'right' }}
                  aria-hidden="true"
                >
                  {pillar.number}
                </span>
              </div>

              {/* H3 — DM Sans 600, 18px, flush left */}
              <h3 className="font-body font-semibold text-textTitle text-[18px] leading-[1.25] mb-[10px]">
                {pillar.headline}
              </h3>

              {/* Body */}
              <p className="font-body text-[14px] leading-[1.65] mb-4 flex-1"
                 style={{ color: 'rgba(26,46,26,0.60)' }}>
                {pillar.body}
              </p>

              {/* Bullets — square dot */}
              <ul className="space-y-1.5">
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
                    <span className="font-body text-[14px] max-md:text-[13px]"
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
