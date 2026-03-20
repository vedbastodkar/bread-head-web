'use client'

// ── §4 Lessons Preview ──────────────────────────────────────────
// Mobile: single column, phone hidden, waterfall height 400px

import Image from 'next/image'
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
    shortDesc: "What you're really signing when you buy a home.",
    time: '9 min',
  },
  {
    number: '05',
    topic: 'Compound Interest: The Eighth Wonder',
    shortDesc: 'Make your money work while you sleep.',
    time: '5 min',
  },
]

const doubled = [...lessons, ...lessons]

export default function LessonsPreview() {
  return (
    <section id="lessons" style={{ position: 'relative', overflow: 'hidden', paddingTop: '64px', paddingBottom: '64px' }}>
      <div
        className="lessons-layout"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: '48px',
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
        }}
      >

        {/* ── Left column 55% → full width on mobile ── */}
        <div
          className="lessons-left-col"
          style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '55%' }}
        >

          {/* Title block */}
          <FadeUp delay={0}>
            <p className="font-body font-medium text-[11px] tracking-[0.13em] max-md:tracking-[0.08em] uppercase text-brandGreen mb-2">
              The Curriculum
            </p>
            <h2
              className="lessons-h2 font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-2"
              style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
            >
              Real topics. Zero condescension.
            </h2>
            <p className="font-body text-[15px] leading-[1.7]"
               style={{ color: 'rgba(26,46,26,0.55)', maxWidth: '480px' }}>
              Every lesson is 5–9 minutes, built around a decision a real teen actually has to make.
            </p>
          </FadeUp>

          {/* Waterfall container */}
          <div
            className="lessons-waterfall-wrap"
            style={{
              height: '560px',
              overflow: 'hidden',
              maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
              WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)',
            }}
          >
            <div className="flex flex-col gap-4 waterfall-scroll">
              {doubled.map((lesson, i) => (
                <div key={i} className="bg-cardBg card-border card-hover rounded-2xl p-5 md:p-6 flex flex-col w-full">
                  <span
                    className="font-body font-medium text-[11px] tracking-[0.10em] uppercase text-brandGreen w-fit mb-4"
                    style={{ background: 'rgba(74,93,74,0.10)', borderRadius: '100px', padding: '4px 12px' }}
                  >
                    {lesson.time}
                  </span>
                  <p className="font-body font-bold text-brandGreen text-[13px] mb-1">{lesson.number}</p>
                  <h3 className="font-body font-semibold text-textTitle text-[15px] md:text-[18px] leading-snug mb-2">
                    {lesson.topic}
                  </h3>
                  <p className="font-body text-[13px] md:text-[14px] leading-[1.6]"
                     style={{ color: 'rgba(26,46,26,0.55)' }}>
                    {lesson.shortDesc}
                  </p>
                  <div
                    className="flex items-center mt-4 pt-4"
                    style={{ borderTop: '0.5px solid rgba(26,46,26,0.08)' }}
                  >
                    <span className="lesson-start-link font-body font-medium text-[13px] text-brandGreen">
                      Start lesson →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ── Right column 45% — sticky, hidden below lg ── */}
        <div
          className="hidden lg:block"
          style={{ width: '45%', position: 'sticky', top: '24px', alignSelf: 'flex-start' }}
        >
          <div
            className="relative rounded-[44px] overflow-hidden"
            style={{
              width: '100%',
              maxWidth: '380px',
              aspectRatio: '9/19.5',
              border: '8px solid #1A2E1A',
              background: '#1A2E1A',
            }}
          >
            {/* Notch */}
            <div
              className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
              style={{ height: '28px', background: '#1A2E1A' }}
            >
              <div className="rounded-full" style={{ width: '80px', height: '6px', background: '#000' }} />
            </div>

            {/* Screenshot */}
            <div className="absolute inset-0" style={{ top: '28px' }}>
              <Image
                src="/assets/lesson_home_screen.png"
                alt="Bread Head lesson in progress"
                fill
                className="object-cover object-top"
                sizes="380px"
                quality={85}
              />
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
