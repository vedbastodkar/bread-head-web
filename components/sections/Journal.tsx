// ── §6 Journal ──────────────────────────────────────────────────
// bg: bgSage (#E6EDD9)
// Card: bg white, 0.5px border, 16px radius, 28px padding, NO shadows
// h2: Playfair italic (emotional — "Reflection is the skill...")
// accentGold: NOT used here
// Pass 3: journal card wrapped in FadeUp delay 0.1

import FadeUp from '@/app/components/FadeUp'
// Image placeholder — uncomment and swap src when asset is ready
// SHOOT: teen at desk with notebook/phone, natural window light, warm tones, unposed
// import Image from 'next/image'

const entry = {
  week:  'Week 3',
  title: 'Coffee Reality Check',
  date:  'Thursday, March 14',
  lines: [
    'This week I tracked every coffee. $14 in 7 days.',
    "That's $56 a month. $728 a year. Just coffee.",
    "I'm not quitting. But now I'm choosing.",
  ],
  mood: 'Reflective',
  tags: ['Awareness', 'Small Spending', 'Habits'],
  nextPrompt: "What's one purchase this week you wouldn't make again?",
}

export default function Journal() {
  return (
    <section className="bg-bgSage">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">

          {/* ── Left: journal entry card ────────────────────── */}
          <FadeUp delay={0.1}>
          <div>
            {/* Journal photo placeholder — uncomment when /assets/journal-photo.jpg is ready */}
            {/* <Image src="/assets/journal-photo.jpg" alt="" width={480} height={240} className="rounded-2xl object-cover w-full mb-4" /> */}
            <div className="bg-cardBg card-border card-hover rounded-2xl overflow-hidden" style={{ borderTop: '3px solid #4A5D4A' }}>

              {/* Card header */}
              <div
                className="bg-bgSage px-7 py-5 flex items-start justify-between"
                style={{ borderBottom: '0.5px solid rgba(26,46,26,0.10)' }}
              >
                <div>
                  <p className="font-body font-medium text-[10px] tracking-[0.12em] uppercase text-brandGreen mb-1">
                    {entry.week}
                  </p>
                  <h3 className="font-body font-semibold text-textTitle text-[18px]">
                    {entry.title}
                  </h3>
                </div>
                <p className="font-body text-[11px] mt-1 shrink-0 ml-4"
                   style={{ color: 'rgba(26,46,26,0.40)' }}>
                  {entry.date}
                </p>
              </div>

              {/* Entry body */}
              <div className="px-7 py-7">
                <div className="space-y-3 mb-7">
                  {entry.lines.map((line) => (
                    <p key={line} className="font-body text-[15px] leading-[1.7]"
                       style={{ color: 'rgba(26,46,26,0.75)' }}>
                      {line}
                    </p>
                  ))}
                </div>

                {/* Mood */}
                <div className="flex items-center gap-2.5 mb-6 pb-6"
                     style={{ borderBottom: '0.5px solid rgba(26,46,26,0.10)' }}>
                  <span className="font-body font-medium text-[10px] tracking-[0.10em] uppercase"
                        style={{ color: 'rgba(26,46,26,0.40)' }}>
                    Mood
                  </span>
                  <span
                    className="font-body font-medium text-[12px] text-brandGreen px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(74,93,74,0.08)', border: '0.5px solid rgba(74,93,74,0.2)' }}
                  >
                    {entry.mood}
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {entry.tags.map((tag) => (
                    <span
                      key={tag}
                      className="font-body font-medium text-[12px] text-brandGreen px-3 py-1.5 rounded-full"
                      style={{ background: 'rgba(74,93,74,0.08)', border: '0.5px solid rgba(74,93,74,0.2)' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Next prompt footer */}
              <div
                className="bg-bgSage px-7 py-5"
                style={{ borderTop: '0.5px solid rgba(26,46,26,0.10)' }}
              >
                <p className="font-body font-medium text-[10px] tracking-[0.10em] uppercase text-brandGreen mb-1.5">
                  Next prompt
                </p>
                <p className="font-body text-[14px]"
                   style={{ color: 'rgba(26,46,26,0.55)', fontStyle: 'italic' }}>
                  {entry.nextPrompt}
                </p>
              </div>

            </div>
          </div>
          </FadeUp>

          {/* ── Right: copy ──────────────────────────────────── */}
          <div>
            {/* Eyebrow */}
            <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-2">
              Your Money, Your Words
            </p>

            {/* H2 — DM Sans 700, not Playfair */}
            <h2
              className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-3 max-w-md"
              style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
            >
              Reflection is the skill schools skip hardest.
            </h2>

            <p className="font-body text-[16px] leading-[1.7] mb-6 max-w-lg"
               style={{ color: 'rgba(26,46,26,0.65)' }}>
              You can read every lesson about spending and still blow your
              paycheck — because habits aren&apos;t built by knowing. They&apos;re built
              by noticing, pausing, and choosing differently next time.
            </p>

            <p className="font-body text-[15px] leading-[1.7] mb-10 max-w-lg"
               style={{ color: 'rgba(26,46,26,0.65)' }}>
              The Bread Head journal gives you short prompts — 2 to 3 minutes —
              that surface patterns you&apos;d otherwise miss.
            </p>

            {/* Feature list */}
            <ul className="space-y-5">
              {[
                { label: 'Short prompts', desc: 'Designed to fit in a break, not carve out a block' },
                { label: 'Pattern view',  desc: 'See your spending emotions over weeks, not days'   },
                { label: 'No judgment',   desc: 'This is a mirror, not a report card'               },
              ].map((f) => (
                <li key={f.label} className="flex gap-4">
                  <div
                    className="w-[3px] shrink-0 rounded-full mt-[3px]"
                    style={{ background: 'rgba(74,93,74,0.30)', minHeight: '40px' }}
                  />
                  <div>
                    <p className="font-body font-semibold text-textTitle text-[14px] mb-0.5">{f.label}</p>
                    <p className="font-body text-[14px]"
                       style={{ color: 'rgba(26,46,26,0.55)' }}>
                      {f.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </section>
  )
}
