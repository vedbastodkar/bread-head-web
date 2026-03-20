'use client'

// ── §4 Lessons Preview ──────────────────────────────────────────
// 2-col: left = eyebrow + h2 + auto-carousel; right = sticky phone mockup
// Carousel auto-advances every 3.5s, fade+slide transition 400ms
// Phone: device frame with notch, sticky centered in right col

import { useState, useEffect, useRef } from 'react'
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
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const advance = () => {
    setDirection(1)
    setIndex((i) => (i + 1) % lessons.length)
  }

  useEffect(() => {
    intervalRef.current = setInterval(advance, 3500)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const lesson = lessons[index]

  return (
    <section className="bg-bgSage">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8 py-12 lg:py-20">
        <div className="flex flex-col lg:flex-row gap-10 lg:gap-16 items-start">

          {/* ── Left column (55%) ── */}
          <div className="w-full lg:w-[55%] flex flex-col">

            {/* Header */}
            <FadeUp delay={0}>
              <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-2">
                The Curriculum
              </p>
              <h2
                className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08] mb-8"
                style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
              >
                Real topics. Zero condescension.
              </h2>
            </FadeUp>

            {/* Carousel card */}
            <div className="relative overflow-hidden" style={{ minHeight: '260px' }}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={lesson.topic}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                >
                  <div className="bg-cardBg card-border rounded-2xl p-7 flex flex-col w-full">
                    {/* Duration pill */}
                    <span
                      className="font-body font-medium text-[11px] tracking-[0.10em] uppercase text-brandGreen w-fit mb-5"
                      style={{ background: 'rgba(74,93,74,0.10)', borderRadius: '100px', padding: '4px 12px' }}
                    >
                      {lesson.time}
                    </span>

                    {/* Lesson number + title */}
                    <p className="font-body font-bold text-brandGreen text-[13px] mb-1">
                      {lesson.number}
                    </p>
                    <h3 className="font-body font-semibold text-textTitle text-[20px] leading-snug mb-2">
                      {lesson.topic}
                    </h3>

                    {/* Short description */}
                    <p
                      className="font-body text-[14px] leading-[1.6] flex-1"
                      style={{ color: 'rgba(26,46,26,0.55)' }}
                    >
                      {lesson.shortDesc}
                    </p>

                    {/* Divider + CTA */}
                    <div
                      className="flex items-center mt-auto"
                      style={{ borderTop: '0.5px solid rgba(26,46,26,0.08)', paddingTop: '16px', marginTop: '20px' }}
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
            <div className="flex items-center gap-2 mt-5">
              {lessons.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width:  i === index ? '20px' : '6px',
                    height: '6px',
                    background: i === index ? '#4A5D4A' : 'rgba(74,93,74,0.20)',
                  }}
                />
              ))}
            </div>

            {/* "More coming" note */}
            <p
              className="font-body font-medium text-[11px] tracking-[0.08em] mt-4"
              style={{ color: 'rgba(26,46,26,0.30)' }}
            >
              Subscriptions, investing, renting vs. buying, and more — coming soon.
            </p>
          </div>

          {/* ── Right column (45%): sticky phone ── */}
          <div className="w-full lg:w-[45%] flex justify-center">
            <div
              className="lg:sticky flex items-center justify-center"
              style={{ top: '50%', transform: 'translateY(-50%)' }}
            >
              {/* Device frame */}
              <div
                className="relative rounded-[44px] overflow-hidden"
                style={{
                  width: 'clamp(240px, 28vw, 320px)',
                  aspectRatio: '9/19.5',
                  border: '8px solid #1A2E1A',
                  background: '#1A2E1A',
                }}
              >
                {/* Status bar / notch */}
                <div
                  className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
                  style={{ height: '28px', background: '#1A2E1A' }}
                >
                  <div
                    className="rounded-full"
                    style={{ width: '80px', height: '6px', background: '#000' }}
                  />
                </div>

                {/* App screenshot — fills below the status bar */}
                <div className="absolute inset-0" style={{ top: '28px' }}>
                  <Image
                    src="/assets/lesson_home_screen.png"
                    alt="Bread Head lesson in progress"
                    fill
                    className="object-cover object-top"
                    sizes="(max-width: 1024px) 240px, 320px"
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
