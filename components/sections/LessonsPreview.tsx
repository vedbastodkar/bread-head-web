// ── §4 Lessons Preview ──────────────────────────────────────────
// bg: white (#FFFFFF)
// Cards: bg white, 0.5px border, 16px radius, 28px padding, NO shadows
// Horizontal scroll row of 5 lesson topic cards + "more" card
// h2: Playfair bold (non-italic — informational)
// Pass 3: heading block FadeUp delay 0, card row FadeUp delay 0.15

import Image  from 'next/image'
import FadeUp from '@/app/components/FadeUp'

const lessons = [
  {
    number: '01',
    topic: 'Reading Your First Pay Stub',
    shortDesc: 'Decode every line of your paycheck.',
    time: '6 min',
  },
  {
    number: '02',
    topic: 'How Credit Scores Actually Work',
    shortDesc: 'The three-digit number that follows you everywhere.',
    time: '7 min',
  },
  {
    number: '03',
    topic: 'Taxes: What Gets Taken & Why',
    shortDesc: 'Where your money goes and why.',
    time: '8 min',
  },
  {
    number: '04',
    topic: 'Mortgages for People Who Rent Right Now',
    shortDesc: 'What you\'re really signing when you buy a home.',
    time: '9 min',
  },
  {
    number: '05',
    topic: 'Compound Interest: The Eighth Wonder',
    shortDesc: 'Make your money work while you sleep.',
    time: '5 min',
  },
]

export default function LessonsPreview() {
  return (
    <section className="bg-bgSage">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* Header */}
        <FadeUp delay={0}>
          <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-2">
            The Curriculum
          </p>

          <h2
            className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-2 max-w-xl"
            style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
          >
            Real topics. Zero condescension.
          </h2>

          <p className="font-body text-[16px] leading-[1.7] mb-6 max-w-lg"
             style={{ color: 'rgba(26,46,26,0.65)' }}>
            Every lesson is 5–9 minutes, built around a decision a real teen
            actually has to make.
          </p>
        </FadeUp>

        {/* 16:9 aspect wrapper — height scales with width, no layout shift */}
        <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden mb-6">
          <Image
            src="/assets/lesson_home_screen.png"
            alt="Bread Head lesson in progress"
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 100vw, 900px"
            quality={80}
          />
        </div>

        {/* Horizontal scroll */}
        <FadeUp delay={0.15}>
        <div className="scroll-row">
          <div className="flex gap-4 pb-3" style={{ width: 'max-content' }}>
            {lessons.map((lesson) => (
              <div
                key={lesson.topic}
                className="bg-cardBg card-border card-hover rounded-2xl p-7 flex flex-col w-[300px] lg:w-[320px] shrink-0"
              >
                {/* Duration pill — DM Sans 500, 11px, uppercase, softGreen bg */}
                <span
                  className="font-body font-medium text-[11px] tracking-[0.10em] uppercase text-brandGreen w-fit mb-5 px-3 py-1 rounded-full"
                  style={{ background: 'rgba(74,93,74,0.10)', borderRadius: '100px', padding: '4px 12px' }}
                >
                  {lesson.time}
                </span>

                {/* Title */}
                <h3 className="font-body font-semibold text-textTitle text-[16px] leading-snug mb-2">
                  {lesson.topic}
                </h3>

                {/* Short one-line description */}
                <p className="font-body text-[13px] leading-[1.6] flex-1"
                   style={{ color: 'rgba(26,46,26,0.55)' }}>
                  {lesson.shortDesc}
                </p>

                {/* Divider + CTA */}
                <div className="flex items-center justify-between mt-auto"
                     style={{ borderTop: '0.5px solid rgba(26,46,26,0.08)', paddingTop: '16px', marginTop: '20px' }}>
                  <span className="font-body font-medium text-[13px] text-brandGreen">
                    Start lesson →
                  </span>
                </div>
              </div>
            ))}

            {/* "More coming" card */}
            <div
              className="bg-cardBg card-border rounded-2xl p-7 flex flex-col items-center justify-center w-[300px] lg:w-[320px] shrink-0 text-center"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
                style={{ background: 'rgba(74,93,74,0.10)' }}
              >
                <span className="font-body font-semibold text-brandGreen text-lg leading-none">+</span>
              </div>
              <h3 className="font-body font-semibold text-textTitle text-[16px] mb-2">
                More lessons on the way
              </h3>
              <p className="font-body text-[14px]"
                 style={{ color: 'rgba(26,46,26,0.50)' }}>
                Subscriptions, investing, renting vs. buying, and more.
              </p>
            </div>
          </div>
        </div>

        <p className="font-body font-medium text-[11px] tracking-[0.08em] mt-5"
           style={{ color: 'rgba(26,46,26,0.30)' }}>
          ← Scroll to explore all lessons →
        </p>
        </FadeUp>

      </div>
    </section>
  )
}
