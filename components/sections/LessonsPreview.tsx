'use client'

// ── §4 Lessons Preview ──────────────────────────────────────────
// 2-col flex row: left = header + fixed-height carousel card + dots
//                 right = sticky phone, same height as left column via items-stretch

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion } from 'framer-motion'
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

export default function LessonsPreview() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % lessons.length)
    }, 3500)
    return () => clearInterval(interval)
  }, [])

  const lesson = lessons[currentIndex]

  return (
    <section className="relative bg-bgSage py-12 lg:py-16 xl:py-20 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">

        {/* ── Outer grid — items-stretch so both columns match height ── */}
        <div className="flex flex-col lg:flex-row items-stretch gap-12 lg:gap-16">

          {/* ── Left column ── */}
          <div className="flex flex-col justify-between w-full lg:w-[55%]">

            {/* Title block */}
            <FadeUp delay={0}>
              <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-2">
                The Curriculum
              </p>
              <h2
                className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-2"
                style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
              >
                Real topics. Zero condescension.
              </h2>
              <p className="font-body text-[15px] leading-[1.7] mb-6 max-w-lg"
                 style={{ color: 'rgba(26,46,26,0.55)' }}>
                Every lesson is 5–9 minutes, built around a decision a real teen actually has to make.
              </p>
            </FadeUp>

            {/* Carousel — flex-1 so it fills remaining height, card fixed height */}
            <div className="flex-1 flex flex-col justify-center">
              <div className="relative overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={currentIndex}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.4, ease: 'easeInOut' }}
                  >
                    <div className="bg-cardBg card-border rounded-2xl w-full flex flex-col justify-between p-7 h-[240px] lg:h-[280px]">
                      {/* Top: pill + number + title + desc */}
                      <div>
                        <span
                          className="font-body font-medium text-[11px] tracking-[0.10em] uppercase text-brandGreen w-fit mb-4 inline-block"
                          style={{ background: 'rgba(74,93,74,0.10)', borderRadius: '100px', padding: '4px 12px' }}
                        >
                          {lesson.time}
                        </span>
                        <p className="font-body font-bold text-brandGreen text-[13px] mb-1">{lesson.number}</p>
                        <h3 className="font-body font-semibold text-textTitle text-[18px] lg:text-[20px] leading-snug mb-2">
                          {lesson.topic}
                        </h3>
                        <p className="font-body text-[13px] lg:text-[14px] leading-[1.6]"
                           style={{ color: 'rgba(26,46,26,0.55)' }}>
                          {lesson.shortDesc}
                        </p>
                      </div>

                      {/* Bottom: CTA */}
                      <div
                        style={{ borderTop: '0.5px solid rgba(26,46,26,0.08)', paddingTop: '14px' }}
                      >
                        <span className="font-body font-medium text-[13px] text-brandGreen">
                          Start lesson →
                        </span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dot indicators */}
              <div className="flex gap-2 mt-4">
                {lessons.map((_, i) => (
                  <div
                    key={i}
                    className="h-2 rounded-full transition-all duration-300"
                    style={{
                      width: i === currentIndex ? '16px' : '8px',
                      background: i === currentIndex ? '#4A5D4A' : 'rgba(74,93,74,0.2)',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Footer note pinned to bottom */}
            <p
              className="font-body font-medium text-[11px] tracking-[0.08em] mt-6"
              style={{ color: 'rgba(26,46,26,0.30)' }}
            >
              Subscriptions, investing, renting vs. buying, and more — coming soon.
            </p>
          </div>

          {/* ── Right column: sticky phone — hidden on mobile/tablet ── */}
          <div className="hidden lg:flex items-center justify-center w-[45%]">
            <div className="sticky" style={{ top: 'calc(50vh - 350px)' }}>
              <div
                className="relative rounded-[44px] overflow-hidden"
                style={{
                  width: 'clamp(320px, 28vw, 420px)',
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
                    sizes="(max-width: 1280px) 380px, 420px"
                    quality={85}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
