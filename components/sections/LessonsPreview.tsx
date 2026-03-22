'use client'

// ── §4 Lessons Preview ──────────────────────────────────────────
// Mobile: single column, phone hidden, waterfall height 400px

import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'

const units = [
  {
    number: '01',
    topic: 'Introduction to Personal Finance',
    shortDesc: 'What money is, how the system works, and why it matters to you now — not someday.',
  },
  {
    number: '02',
    topic: 'Income and Career Planning',
    shortDesc: 'How you get paid, what affects your earnings, and how to build toward what you actually want.',
  },
  {
    number: '03',
    topic: 'Budgeting',
    shortDesc: 'Where your money goes, how to take control of it, and why it doesn\'t have to feel like punishment.',
  },
  {
    number: '04',
    topic: 'Credit and Loans',
    shortDesc: 'What borrowing actually costs you, how credit scores work, and when debt is worth it.',
  },
  {
    number: '05',
    topic: 'Saving',
    shortDesc: 'How to make saving automatic, what to save for first, and how to build a cushion that holds.',
  },
  {
    number: '06',
    topic: 'Investing',
    shortDesc: 'How the market works, why starting early beats starting big, and what to actually do with money you\'re not spending.',
  },
  {
    number: '07',
    topic: 'Insurance',
    shortDesc: 'What it is, when you need it, and how to not get caught off guard by the fine print.',
  },
  {
    number: '08',
    topic: 'Taxes',
    shortDesc: 'What gets taken from your paycheck, how to file, and how to stop leaving money on the table.',
  },
  {
    number: '09',
    topic: 'Other Topics',
    shortDesc: 'Banking, scams, big purchases, and the money stuff that doesn\'t fit neatly into one category.',
  },
  {
    number: '10',
    topic: 'Next Steps and Reflection',
    shortDesc: 'Where you are, where you\'re going, and how to keep building real financial habits from here.',
  },
]

const doubled = [...units, ...units]

export default function LessonsPreview() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', paddingTop: '64px', paddingBottom: '64px' }}>
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
              10 units. Each one 8–15 mini lessons, 3–5 minutes long. Built around decisions real teens actually have to make.
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
              {doubled.map((unit, i) => (
                <div key={i} className="bg-cardBg card-border card-hover rounded-2xl p-5 md:p-6 flex flex-col w-full">
                  <div className="flex items-center gap-2 mb-4">
                    <span
                      className="font-body font-medium text-[11px] tracking-[0.10em] uppercase text-brandGreen w-fit"
                      style={{ background: 'rgba(74,93,74,0.10)', borderRadius: '100px', padding: '4px 12px' }}
                    >
                      Unit {unit.number}
                    </span>
                    <span
                      className="font-body font-medium text-[11px] tracking-[0.10em] uppercase w-fit"
                      style={{ background: 'rgba(26,46,26,0.06)', borderRadius: '100px', padding: '4px 12px', color: 'rgba(26,46,26,0.45)' }}
                    >
                      8–15 lessons · 3–5 min each
                    </span>
                  </div>
                  <h3 className="font-body font-semibold text-textTitle text-[15px] md:text-[18px] leading-snug mb-2">
                    {unit.topic}
                  </h3>
                  <p className="font-body text-[13px] md:text-[14px] leading-[1.6]"
                     style={{ color: 'rgba(26,46,26,0.55)' }}>
                    {unit.shortDesc}
                  </p>
                  <div
                    className="flex items-center mt-4 pt-4"
                    style={{ borderTop: '0.5px solid rgba(26,46,26,0.08)' }}
                  >
                    <span className="lesson-start-link font-body font-medium text-[13px] text-brandGreen">
                      Start unit →
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
