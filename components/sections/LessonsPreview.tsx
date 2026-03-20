'use client'

// ── §4 Lessons Preview ──────────────────────────────────────────
// 2-col flex row: left = header + single-card carousel + dots
//                 right = sticky phone mockup

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
    <section className="bg-bgSage py-16 overflow-hidden">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">

        <div className="flex flex-col lg:flex-row items-start gap-12">

          {/* ── Left column ── */}
          <div className="w-full lg:w-[55%] flex flex-col min-h-[700px] justify-between">

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

            {/* Carousel */}
            <div className="flex-1 flex flex-col justify-center">
              {/* Card */}
              <div className="relative" style={{ minHeight: '260px' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={currentIndex}
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

                      {/* Number + title */}
                      <p className="font-body font-bold text-brandGreen text-[13px] mb-1">
                        {lesson.number}
                      </p>
                      <h3 className="font-body font-semibold text-textTitle text-[20px] leading-snug mb-2">
                        {lesson.topic}
                      </h3>

                      {/* Description */}
                      <p
                        className="font-body text-[14px] leading-[1.6] flex-1"
                        style={{ color: 'rgba(26,46,26,0.55)' }}
                      >
                        {lesson.shortDesc}
                      </p>

                      {/* CTA */}
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

            {/* Footer note */}
            <p
              className="font-body font-medium text-[11px] tracking-[0.08em] mt-6"
              style={{ color: 'rgba(26,46,26,0.30)' }}
            >
              Subscriptions, investing, renting vs. buying, and more — coming soon.
            </p>
          </div>

          {/* ── Right column: sticky phone ── */}
          <div className="hidden lg:block w-[45%] relative">
            <div className="sticky" style={{ top: 'calc(50vh - 350px)' }}>
              {/* Device frame */}
              <div className="flex justify-center">
                <div
                  className="relative rounded-[44px] overflow-hidden"
                  style={{
                    width: 'clamp(240px, 22vw, 300px)',
                    aspectRatio: '9/19.5',
                    border: '8px solid #1A2E1A',
                    background: '#1A2E1A',
                  }}
                >
                  {/* Notch / status bar */}
                  <div
                    className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center"
                    style={{ height: '28px', background: '#1A2E1A' }}
                  >
                    <div
                      className="rounded-full"
                      style={{ width: '80px', height: '6px', background: '#000' }}
                    />
                  </div>

                  {/* App screenshot */}
                  <div className="absolute inset-0" style={{ top: '28px' }}>
                    <Image
                      src="/assets/lesson_home_screen.png"
                      alt="Bread Head lesson in progress"
                      fill
                      className="object-cover object-top"
                      sizes="300px"
                      quality={85}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
