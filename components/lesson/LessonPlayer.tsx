'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { Lesson, Slide } from '@/lib/curriculum/slideTypes'
import { isInteractive } from '@/lib/curriculum/slideTypes'
import { sfEmoji } from '@/lib/sfIcon'
import { DEFAULT_CONTROLS, type LessonControls } from '@/lib/curriculum/controls'

// Mirrors LessonLogic: slideIndex + completedSlides; interactive slides gate next().
export function LessonPlayer({
  lesson,
  onExit,
  onComplete,
  onNext,
  nextLabel,
  initialSlide = 0,
  onSlideChange,
  controls = DEFAULT_CONTROLS,
  onReport,
}: {
  lesson: Lesson
  onExit?: () => void
  onComplete?: () => void
  onNext?: () => void          // provided → "Next lesson" button on completion
  nextLabel?: string           // e.g. "Unit 2 · Lesson 3" — shown under the button
  initialSlide?: number        // resume from a saved slide
  onSlideChange?: (index: number) => void
  controls?: LessonControls    // teacher-set enforcement (pacing lives upstream)
  onReport?: (info: { lessonId: string; slide: number; text: string }) => Promise<void>
}) {
  const total = lesson.slides.length
  const start = Math.min(Math.max(initialSlide, 0), total - 1)
  const [index, setIndex] = useState(start)
  const [completed, setCompleted] = useState<Set<number>>(new Set())
  const [maxReached, setMaxReached] = useState(start)
  const [done, setDone] = useState(false)
  const [reporting, setReporting] = useState(false)

  const [elapsed, setElapsed] = useState(0)

  const slide = lesson.slides[index]
  const isLast = index === total - 1
  const requireCorrect = controls.lockUntilCorrect
  const answerGated = isInteractive(slide) && !completed.has(index)
  const timeLeft = Math.max(0, controls.minSecondsPerSlide - elapsed)
  const timeGated = timeLeft > 0
  const gated = answerGated || timeGated

  useEffect(() => {
    setMaxReached((m) => Math.max(m, index))
    onSlideChange?.(index)
  }, [index, onSlideChange])

  // Minimum-time-per-slide dwell timer: reset on slide change, tick each second.
  useEffect(() => {
    setElapsed(0)
    if (controls.minSecondsPerSlide <= 0) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [index, controls.minSecondsPerSlide])

  const markCurrentComplete = useCallback(() => {
    setCompleted((prev) => { const n = new Set(prev); n.add(index); return n })
  }, [index])

  const next = useCallback(() => {
    if (gated) return
    if (isLast) { setDone(true); onComplete?.(); return }
    setIndex((i) => Math.min(i + 1, total - 1))
  }, [gated, isLast, total, onComplete])

  const prev = useCallback(() => setIndex((i) => Math.max(i - 1, 0)), [])
  const jump = useCallback((i: number) => { if (i <= maxReached) setIndex(i) }, [maxReached])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (reporting) return
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, prev, reporting])

  if (done) {
    return (
      <div className="min-h-screen bg-bgSage flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
        <Confetti />
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 13 }}
          className="w-20 h-20 rounded-full bg-brandGreen text-white flex items-center justify-center text-3xl mb-5 relative z-10"
        >
          ✓
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="font-display text-3xl text-textTitle mb-2 relative z-10"
        >
          Lesson complete!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
          className="text-textTitle/65 mb-8 max-w-md relative z-10"
        >
          {lesson.name}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.38 }}
          className="flex items-center gap-3 relative z-10"
        >
          <button onClick={onExit} className="px-6 py-3 rounded-xl border border-textTitle/15 text-textTitle/80 hover:bg-white">Back to dashboard</button>
          {onNext && <button onClick={onNext} className="px-6 py-3 rounded-xl bg-brandGreen text-white">Next lesson →</button>}
        </motion.div>
        {onNext && nextLabel && (
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}
            className="text-textTitle/65 text-sm mt-4 relative z-10"
          >
            {nextLabel}
          </motion.p>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bgSage flex flex-col">
      {/* focus-view top bar: logo (left) · report + exit (right).
          Logo box + padding match the marketing Nav (163×44 at 20px/32px) so it
          looks identical entering a lesson — nothing moves or resizes. */}
      <div className="fixed top-0 left-0 right-0 z-20 bg-bgSage/95 backdrop-blur flex items-center justify-between" style={{ padding: '20px 32px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo_w_text.png" alt="Bread Head" style={{ width: 163, height: 'auto' }} />
        <div className="flex items-center gap-1">
          <button
            onClick={() => setReporting(true)}
            aria-label="Report a problem"
            title="Report a problem"
            className="w-9 h-9 flex items-center justify-center rounded-full text-textTitle/65 hover:text-textTitle hover:bg-white/60 transition"
          >
            <FlagIcon />
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-2 text-sm text-textTitle/65 hover:text-textTitle px-3 py-1.5 rounded-full hover:bg-white/60 transition"
          >
            <span aria-hidden className="text-base leading-none">✕</span> Exit
          </button>
        </div>
      </div>

      {/* slide */}
      <div className="flex-1 flex items-center justify-center px-6 pt-36 pb-36">
        <div className="w-full max-w-3xl lg:w-1/2 lg:max-w-none">
          <SlideView slide={slide} onAnswered={markCurrentComplete} requireCorrect={requireCorrect} />
        </div>
      </div>

      {/* bottom bar: Back · dot progress · Next */}
      <div className="fixed bottom-0 left-0 right-0 bg-bgSage/90 backdrop-blur px-6 py-5 flex items-center justify-between gap-4">
        <button
          onClick={prev}
          disabled={index === 0}
          className="px-5 py-3 rounded-xl border border-textTitle/15 text-base text-textTitle/70 disabled:opacity-40"
        >
          Back
        </button>

        <div className="flex items-center gap-1.5 flex-wrap justify-center max-w-[55%]">
          {lesson.slides.map((_, i) => {
            const reachable = i <= maxReached && !controls.noSkipAhead
            return (
              <button
                key={i}
                onClick={() => { if (reachable) jump(i) }}
                disabled={!reachable}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === index}
                className={`rounded-full transition-all ${reachable ? 'cursor-pointer' : 'cursor-default'} ${
                  i === index ? 'w-3.5 h-3.5 bg-brandGreen'
                    : i <= maxReached ? 'w-2 h-2 bg-brandGreen/45 hover:bg-brandGreen/70'
                      : 'w-2 h-2 bg-textTitle/15'
                }`}
              />
            )
          })}
        </div>

        <button
          onClick={next}
          disabled={gated}
          className="px-7 py-3 rounded-xl bg-brandGreen text-white text-base disabled:opacity-40"
          title={answerGated ? (requireCorrect ? 'Answer correctly to continue' : 'Answer to continue') : timeGated ? 'Please keep reading' : undefined}
        >
          {timeGated ? `Next · ${timeLeft}s` : isLast ? 'Finish' : 'Next'}
        </button>
      </div>

      {reporting && <ReportModal lesson={lesson.id} slide={index + 1} onSubmit={onReport} onClose={() => setReporting(false)} />}
    </div>
  )
}

// One-shot confetti burst for the completion screen — pops up from the badge,
// then rains down. Pure framer-motion, no extra dependency.
function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 560,
        rise: 70 + Math.random() * 140,
        fall: 340 + Math.random() * 240,
        rot: (Math.random() - 0.5) * 720,
        delay: Math.random() * 0.25,
        size: 6 + Math.random() * 9,
        color: ['#4A5D4A', '#D1A945', '#D4AF5A', '#8FA382', '#1A2E1A'][i % 5],
        round: Math.random() > 0.5,
      })),
    [],
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: p.x, y: [0, -p.rise, p.fall], opacity: [1, 1, 0], rotate: p.rot }}
          transition={{ duration: 1.7, ease: 'easeOut', delay: p.delay }}
          style={{
            position: 'absolute',
            left: '50%',
            top: '42%',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '9999px' : '2px',
          }}
        />
      ))}
    </div>
  )
}

function FlagIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  )
}

// Report-a-problem — Send posts to /api/report via the onSubmit handler.
function ReportModal({ lesson, slide, onSubmit, onClose }: {
  lesson: string
  slide: number
  onSubmit?: (info: { lessonId: string; slide: number; text: string }) => Promise<void>
  onClose: () => void
}) {
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function send() {
    if (!text.trim()) return
    setBusy(true); setError('')
    try {
      if (onSubmit) await onSubmit({ lessonId: lesson, slide, text: text.trim() })
      setSent(true)
    } catch {
      setError('Could not send. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <div className="text-3xl mb-2">✓</div>
            <p className="text-textTitle">Thanks — we’ll take a look.</p>
            <button onClick={onClose} className="mt-5 px-5 py-2 rounded-xl bg-brandGreen text-white text-sm">Close</button>
          </div>
        ) : (
          <>
            <h2 className="font-display text-xl text-textTitle mb-1">Report a problem</h2>
            <p className="text-xs text-textTitle/65 mb-4">Lesson {lesson} · slide {slide}</p>
            <textarea
              value={text} onChange={(e) => setText(e.target.value)}
              placeholder="What looks wrong on this slide?"
              className="w-full h-28 px-4 py-3 rounded-xl border border-textTitle/15 text-sm outline-none focus:border-brandGreen"
            />
            {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
            <div className="flex justify-end gap-2 mt-3">
              <button onClick={onClose} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
              <button onClick={send} disabled={!text.trim() || busy} className="px-5 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-50">{busy ? 'Sending…' : 'Send'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ---- shared ----
function SlideImage({ src }: { src?: string | null }) {
  if (!src) return null
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="rounded-2xl mx-auto mb-6 max-h-80 md:max-h-96 object-contain" />
}

// ---- slide renderers ----
function SlideView({ slide, onAnswered, requireCorrect }: { slide: Slide; onAnswered: () => void; requireCorrect: boolean }) {
  switch (slide.type) {
    case 'title':
      return (
        <div className="text-center">
          <SlideImage src={slide.image} />
          <h1 className="font-display text-5xl md:text-6xl text-textTitle mb-6 leading-tight">{slide.title}</h1>
          {slide.subtitle && <p className="text-textTitle/70 text-xl md:text-2xl mb-3 leading-relaxed">{slide.subtitle}</p>}
          {slide.detailText && <p className="text-textTitle/65 text-lg md:text-xl">{slide.detailText}</p>}
        </div>
      )
    case 'objectives':
      return (
        <div>
          <SlideImage src={slide.image} />
          <h2 className="font-display text-3xl md:text-4xl text-textTitle mb-2">{slide.headerTitle}</h2>
          {slide.subheader && <p className="text-textTitle/65 text-lg mb-6">{slide.subheader}</p>}
          <ul className="space-y-3">
            {slide.objectives.map((o, i) => (
              <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-5 shadow-sm">
                <span className="text-brandGreen mt-1 text-lg">◆</span>
                <span className="text-textTitle text-lg">{o}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    case 'poll':
      return <Poll slide={slide} onAnswered={onAnswered} />
    case 'badHabitWarning':
      return (
        <div>
          {slide.habits.map((h, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm mb-4 border-l-4 border-accentGold">
              <div className="font-display text-2xl text-textTitle mb-2">⚠ {h}</div>
              <p className="text-textTitle/70">{slide.whyBadExplanations[i]}</p>
            </div>
          ))}
        </div>
      )
    case 'reflectPrompt':
      return (
        <div className="text-center">
          <div className="text-sm uppercase tracking-wider text-textTitle/65 mb-3">{slide.mainTitle ?? 'Reflect & Think'}</div>
          <p className="font-display text-2xl md:text-3xl text-textTitle leading-relaxed">{slide.prompt}</p>
        </div>
      )
    case 'recap':
      return (
        <div className="text-center">
          <SlideImage src={slide.image} />
          {slide.eyebrow && <div className="text-sm uppercase tracking-wider text-textTitle/65 mb-2">{slide.eyebrow}</div>}
          {slide.title && <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-4">{slide.title}</h2>}
          <div className="space-y-3">
            {slide.takeaways.map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm text-textTitle text-lg">{t}</div>
            ))}
          </div>
        </div>
      )
    case 'termDefinition':
      return (
        <div className="text-center">
          <div className="font-display text-5xl md:text-6xl text-textTitle mb-5">{slide.term}</div>
          <p className="text-textTitle/70 text-xl md:text-2xl leading-relaxed">{slide.definition}</p>
        </div>
      )
    case 'trueFalse':
      return <TrueFalse slide={slide} onAnswered={onAnswered} requireCorrect={requireCorrect} />
    case 'multipleChoice':
      return <MultipleChoice slide={slide} onAnswered={onAnswered} requireCorrect={requireCorrect} />
    case 'realLifeScenario':
      return <RealLifeScenario slide={slide} onAnswered={onAnswered} requireCorrect={requireCorrect} />
    case 'thisOrThat':
      return <ThisOrThat slide={slide} onAnswered={onAnswered} />
    case 'mythBusting':
      return <MythBusting slide={slide} onAnswered={onAnswered} />
    case 'tapToReveal':
      return <TapToReveal slide={slide} onAnswered={onAnswered} />
    case 'matchConcept':
      return <MatchConcept slide={slide} onAnswered={onAnswered} />
    case 'iconBreakdown':
      return (
        <div>
          <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-6 text-center">{slide.title}</h2>
          <div className="space-y-3">
            {slide.items.map((it, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-2xl p-5 shadow-sm">
                <span className="text-2xl mt-0.5 leading-none w-8 text-center shrink-0">{sfEmoji(it.icon)}</span>
                <div>
                  <div className="text-textTitle font-medium text-lg">{it.title}</div>
                  {it.description && <div className="text-textTitle/65">{it.description}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case 'stepByStep':
      return (
        <div>
          {slide.eyebrow && <div className="text-sm uppercase tracking-wider text-textTitle/65 mb-1 text-center">{slide.eyebrow}</div>}
          <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-1 text-center">{slide.title}</h2>
          {slide.subtitle && <p className="text-textTitle/65 text-lg mb-6 text-center">{slide.subtitle}</p>}
          <ol className="space-y-3">
            {slide.steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-5 shadow-sm">
                <span className="w-8 h-8 rounded-full bg-brandGreen text-white flex items-center justify-center text-base shrink-0">{i + 1}</span>
                <span className="text-textTitle text-lg">{s}</span>
              </li>
            ))}
          </ol>
        </div>
      )
    case 'prosAndCons':
      return (
        <div>
          <h2 className="font-display text-2xl text-textTitle mb-6 text-center">{slide.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-brandGreen font-medium mb-2">Pros</div>
              {slide.pros.map((p, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm mb-2">
                  <div className="text-textTitle font-medium">{p.title}</div>
                  {p.description && <div className="text-textTitle/65 text-sm">{p.description}</div>}
                </div>
              ))}
            </div>
            <div>
              <div className="text-red-600 font-medium mb-2">Cons</div>
              {slide.cons.map((c, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 shadow-sm mb-2">
                  <div className="text-textTitle font-medium">{c.title}</div>
                  {c.description && <div className="text-textTitle/65 text-sm">{c.description}</div>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    case 'contextualComparison':
      return (
        <div>
          {slide.eyebrow && <div className="text-sm uppercase tracking-wider text-textTitle/65 mb-1 text-center">{slide.eyebrow}</div>}
          <h2 className="font-display text-2xl text-textTitle mb-6 text-center">{slide.title}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {[{ t: slide.leftTitle, b: slide.leftBody }, { t: slide.rightTitle, b: slide.rightBody }].map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="font-display text-lg text-textTitle mb-2">{c.t}</div>
                <p className="text-textTitle/70 text-sm">{c.b}</p>
              </div>
            ))}
          </div>
          {slide.footer && <p className="text-center text-textTitle/65 text-sm mt-4">{slide.footer}</p>}
        </div>
      )
    case 'visualAnalogy':
      return (
        <div className="text-center">
          {slide.title && <h2 className="font-display text-2xl text-textTitle mb-1">{slide.title}</h2>}
          {slide.subtitle && <p className="text-textTitle/65 mb-6">{slide.subtitle}</p>}
          <div className="grid gap-3">
            {slide.contexts.map((c, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                {c.emoji && <div className="text-2xl mb-1">{c.emoji}</div>}
                {c.label && <div className="text-textTitle font-medium">{c.label}</div>}
                {c.text && <div className="text-textTitle/65 text-sm">{c.text}</div>}
              </div>
            ))}
          </div>
        </div>
      )
    case 'image':
      return (
        <div className="text-center">
          <SlideImage src={slide.image} />
          <h2 className="font-display text-2xl text-textTitle mb-2">{slide.title}</h2>
          {slide.caption && <p className="text-textTitle/65">{slide.caption}</p>}
        </div>
      )
    case 'interactiveGrowthVisual':
      return <InteractiveGrowthVisual slide={slide} onAnswered={onAnswered} />
    case 'calloutQuote':
      return (
        <div className="text-center">
          <p className="font-display text-2xl italic text-textTitle">“{slide.quote}”</p>
          {slide.author && <p className="text-textTitle/65 mt-3">— {slide.author}</p>}
        </div>
      )
    case 'callToAction':
      return (
        <div className="text-center">
          <h2 className="font-display text-3xl text-textTitle mb-3">{slide.title}</h2>
          <p className="text-textTitle/70 mb-6">{slide.message}</p>
          <span className="inline-block px-6 py-3 rounded-xl bg-accentGold text-white">{slide.actionText}</span>
        </div>
      )
    case 'checklist':
      return (
        <div>
          <h2 className="font-display text-2xl text-textTitle mb-6 text-center">{slide.title}</h2>
          <ul className="space-y-2">
            {slide.items.map((it, i) => (
              <li key={i} className="flex items-start gap-3 bg-white rounded-2xl p-4 shadow-sm">
                <span className="text-brandGreen">✓</span><span className="text-textTitle">{it}</span>
              </li>
            ))}
          </ul>
        </div>
      )
    case 'beforeAfter':
      return (
        <div>
          {slide.title && <h2 className="font-display text-2xl text-textTitle mb-6 text-center">{slide.title}</h2>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-textTitle/20">
              <div className="text-xs uppercase tracking-wider text-textTitle/65 mb-2">Before</div>
              <p className="text-textTitle/80">{slide.beforeText}</p>
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm border-l-4 border-brandGreen">
              <div className="text-xs uppercase tracking-wider text-brandGreen mb-2">After</div>
              <p className="text-textTitle/80">{slide.afterText}</p>
            </div>
          </div>
        </div>
      )
    case 'content':
      return (
        <div>
          <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-4 text-center">{slide.title}</h2>
          <div className="space-y-2">
            {slide.body.map((b, i) => (
              <p key={i} className="bg-white rounded-2xl p-5 shadow-sm text-textTitle/80 text-lg">{b}</p>
            ))}
          </div>
        </div>
      )
  }
}

function Poll({ slide, onAnswered }: { slide: Extract<Slide, { type: 'poll' }>; onAnswered: () => void }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div>
      <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-6 text-center">{slide.title}</h2>
      <div className="space-y-3">
        {slide.options.map((o, i) => (
          <button
            key={i}
            onClick={() => { setPicked(i); onAnswered() }}
            className={`w-full text-left px-6 py-5 rounded-2xl shadow-sm transition text-lg ${
              picked === i ? 'bg-brandGreen text-white' : 'bg-white text-textTitle hover:bg-white/70'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
      {picked !== null && <p className="text-center text-textTitle/70 text-lg mt-5">{slide.afterVoting}</p>}
    </div>
  )
}

function TrueFalse({ slide, onAnswered, requireCorrect }: { slide: Extract<Slide, { type: 'trueFalse' }>; onAnswered: () => void; requireCorrect: boolean }) {
  const [picked, setPicked] = useState<boolean | null>(null)
  const correct = picked !== null && picked === slide.correctAnswer
  return (
    <div className="text-center">
      <div className="text-sm uppercase tracking-wider text-textTitle/65 mb-3">True or False</div>
      <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-6">{slide.question}</h2>
      <div className="flex gap-3 justify-center mb-5">
        {[true, false].map((v) => (
          <button
            key={String(v)}
            onClick={() => {
              if (requireCorrect && picked === slide.correctAnswer) return // already correct
              setPicked(v)
              if (!requireCorrect || v === slide.correctAnswer) onAnswered()
            }}
            className={`px-10 py-4 rounded-2xl shadow-sm text-lg ${
              picked === v ? (v === slide.correctAnswer ? 'bg-brandGreen text-white' : 'bg-red-500 text-white') : 'bg-white text-textTitle'
            }`}
          >
            {v ? 'True' : 'False'}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className="bg-white rounded-2xl p-4 shadow-sm text-left">
          <div className={`font-medium mb-1 ${correct ? 'text-brandGreen' : 'text-red-600'}`}>{correct ? 'Correct!' : 'Not quite.'}</div>
          <p className="text-textTitle/70 text-sm">{slide.explanation}</p>
        </div>
      )}
    </div>
  )
}

function MultipleChoice({ slide, onAnswered, requireCorrect }: { slide: Extract<Slide, { type: 'multipleChoice' }>; onAnswered: () => void; requireCorrect: boolean }) {
  const [picked, setPicked] = useState<number | null>(null)
  const correctSet = new Set(slide.correctAnswerIndices)
  const alreadyCorrect = picked !== null && correctSet.has(picked)
  return (
    <div>
      {slide.title && <div className="text-sm uppercase tracking-wider text-textTitle/65 mb-2">{slide.title}</div>}
      <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-6">{slide.question}</h2>
      <div className="space-y-3">
        {slide.options.map((o, i) => {
          const chosen = picked === i
          const showState = picked !== null && (chosen || correctSet.has(i))
          const good = correctSet.has(i)
          return (
            <button
              key={i}
              onClick={() => {
                if (requireCorrect) {
                  if (alreadyCorrect) return           // locked once correct
                  setPicked(i)
                  if (correctSet.has(i)) onAnswered()
                } else if (picked === null) {
                  setPicked(i); onAnswered()
                }
              }}
              className={`w-full text-left px-6 py-5 rounded-2xl shadow-sm transition text-lg ${
                showState ? (good ? 'bg-brandGreen text-white' : 'bg-red-500 text-white') : 'bg-white text-textTitle hover:bg-white/70'
              }`}
            >
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && slide.explanations[picked] && (
        <p className="text-textTitle/70 text-sm mt-4 bg-white rounded-2xl p-4 shadow-sm">{slide.explanations[picked]}</p>
      )}
    </div>
  )
}

function RealLifeScenario({ slide, onAnswered, requireCorrect }: { slide: Extract<Slide, { type: 'realLifeScenario' }>; onAnswered: () => void; requireCorrect: boolean }) {
  const [picked, setPicked] = useState<number | null>(null)
  return (
    <div>
      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4 text-textTitle/80 text-lg">{slide.scenario}</div>
      <h2 className="font-display text-2xl md:text-3xl text-textTitle mb-4">{slide.question}</h2>
      <div className="space-y-3">
        {slide.options.map((o, i) => {
          const show = picked !== null && (picked === i || i === slide.correctAnswerIndex)
          const good = i === slide.correctAnswerIndex
          return (
            <button key={i} onClick={() => {
              if (requireCorrect) {
                if (picked === slide.correctAnswerIndex) return  // locked once correct
                setPicked(i)
                if (good) onAnswered()
              } else if (picked === null) {
                setPicked(i); onAnswered()
              }
            }}
              className={`w-full text-left px-6 py-5 rounded-2xl shadow-sm transition text-lg ${show ? (good ? 'bg-brandGreen text-white' : 'bg-red-500 text-white') : 'bg-white text-textTitle hover:bg-white/70'}`}>
              {o}
            </button>
          )
        })}
      </div>
      {picked !== null && slide.explanations[picked] && (
        <p className="text-textTitle/70 text-sm mt-4 bg-white rounded-2xl p-4 shadow-sm">{slide.explanations[picked]}</p>
      )}
    </div>
  )
}

function ThisOrThat({ slide, onAnswered }: { slide: Extract<Slide, { type: 'thisOrThat' }>; onAnswered: () => void }) {
  const [picked, setPicked] = useState<'A' | 'B' | null>(null)
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl text-textTitle mb-6">{slide.title}</h2>
      <div className="grid sm:grid-cols-2 gap-3">
        {(['A', 'B'] as const).map((k) => (
          <button key={k} onClick={() => { setPicked(k); onAnswered() }}
            className={`px-5 py-4 rounded-2xl shadow-sm ${picked === k ? 'bg-brandGreen text-white' : 'bg-white text-textTitle'}`}>
            {k === 'A' ? slide.optionA : slide.optionB}
          </button>
        ))}
      </div>
      {picked && (
        <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm text-left">
          <div className="bg-white rounded-2xl p-4 shadow-sm"><b>{slide.optionA}:</b> {slide.consequenceA}</div>
          <div className="bg-white rounded-2xl p-4 shadow-sm"><b>{slide.optionB}:</b> {slide.consequenceB}</div>
        </div>
      )}
    </div>
  )
}

function MythBusting({ slide, onAnswered }: { slide: Extract<Slide, { type: 'mythBusting' }>; onAnswered: () => void }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="text-center">
      <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 border-l-4 border-red-400">
        <div className="text-xs uppercase tracking-wider text-red-500 mb-2">Myth</div>
        <p className="text-textTitle text-lg">{slide.myth}</p>
      </div>
      {revealed ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm border-l-4 border-brandGreen">
          <div className="text-xs uppercase tracking-wider text-brandGreen mb-2">Truth</div>
          <p className="text-textTitle text-lg">{slide.truth}</p>
        </div>
      ) : (
        <button onClick={() => { setRevealed(true); onAnswered() }} className="px-6 py-3 rounded-xl bg-brandGreen text-white">Reveal the truth</button>
      )}
    </div>
  )
}

function TapToReveal({ slide, onAnswered }: { slide: Extract<Slide, { type: 'tapToReveal' }>; onAnswered: () => void }) {
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="text-center">
      {slide.title && <h2 className="font-display text-2xl text-textTitle mb-4">{slide.title}</h2>}
      <p className="text-textTitle/80 text-lg mb-5">{slide.prompt}</p>
      {revealed ? (
        <div className="bg-white rounded-2xl p-6 shadow-sm text-textTitle">{slide.revealedContent}</div>
      ) : (
        <button onClick={() => { setRevealed(true); onAnswered() }} className="px-6 py-3 rounded-xl bg-brandGreen text-white">Tap to reveal</button>
      )}
    </div>
  )
}

// Click-to-match: pick a concept, then a definition — pairs validate against correctMatches.
function MatchConcept({ slide, onAnswered }: { slide: Extract<Slide, { type: 'matchConcept' }>; onAnswered: () => void }) {
  const shuffledDefs = useRef<string[]>(
    [...slide.definitions].sort(() => Math.random() - 0.5),
  )
  const [pickedConcept, setPickedConcept] = useState<string | null>(null)
  const [matched, setMatched] = useState<Record<string, string>>({}) // concept -> definition
  const [wrong, setWrong] = useState<string | null>(null)

  const correctDefFor = (concept: string) => slide.correctMatches[concept] ?? slide.definitions[slide.concepts.indexOf(concept)]
  const usedDefs = new Set(Object.values(matched))

  function chooseDef(def: string) {
    if (!pickedConcept || usedDefs.has(def)) return
    if (correctDefFor(pickedConcept) === def) {
      const nm = { ...matched, [pickedConcept]: def }
      setMatched(nm); setPickedConcept(null); setWrong(null)
      if (Object.keys(nm).length === slide.concepts.length) onAnswered()
    } else {
      setWrong(def); setTimeout(() => setWrong(null), 600)
    }
  }

  return (
    <div>
      <h2 className="font-display text-xl md:text-2xl text-textTitle mb-5 text-center">{slide.title}</h2>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          {slide.concepts.map((c) => {
            const done = c in matched
            const active = pickedConcept === c
            return (
              <button key={c} onClick={() => !done && setPickedConcept(active ? null : c)} disabled={done}
                className={`w-full text-left px-4 py-3 rounded-2xl shadow-sm text-sm transition ${
                  done ? 'bg-brandGreen/15 text-textTitle/65' : active ? 'bg-brandGreen text-white' : 'bg-white text-textTitle hover:bg-white/70'
                }`}>
                {c}
              </button>
            )
          })}
        </div>
        <div className="space-y-2">
          {shuffledDefs.current.map((d) => {
            const done = usedDefs.has(d)
            const isWrong = wrong === d
            return (
              <button key={d} onClick={() => chooseDef(d)} disabled={done || !pickedConcept}
                className={`w-full text-left px-4 py-3 rounded-2xl shadow-sm text-sm transition ${
                  done ? 'bg-brandGreen/15 text-textTitle/65' : isWrong ? 'bg-red-500 text-white' : 'bg-white text-textTitle hover:bg-white/70 disabled:opacity-60'
                }`}>
                {d}
              </button>
            )
          })}
        </div>
      </div>
      <p className="text-center text-xs text-textTitle/65 mt-4">
        {Object.keys(matched).length === slide.concepts.length ? 'All matched!' : pickedConcept ? 'Now pick its match →' : 'Pick a term, then its match.'}
      </p>
    </div>
  )
}

// Proper compound interest: monthly compounding of an initial amount + a fixed
// monthly contribution, comparing an early start vs one delayed by `delayYears`.
function InteractiveGrowthVisual({ slide, onAnswered }: { slide: Extract<Slide, { type: 'interactiveGrowthVisual' }>; onAnswered: () => void }) {
  const [principal, setPrincipal] = useState(Math.min(Math.max(slide.initialValue || 1000, 0), 10000))
  const [ratePct, setRatePct] = useState(Math.min(Math.max(slide.secondaryValue || 7, 1), 15))
  const monthly = 100
  const touched = useRef(false)
  const touch = () => { if (!touched.current) { touched.current = true; onAnswered() } }

  const years = Math.max(2, slide.timeYears || 40)
  const delay = Math.min(Math.max(slide.delayYears || 10, 0), years - 1)
  const rMonthly = ratePct / 100 / 12

  // future value series (yearly samples), compounded monthly with $monthly contributions
  function series(startYear: number): number[] {
    const out: number[] = []
    let bal = 0
    for (let y = 0; y <= years; y++) {
      if (y === startYear) bal += principal // deposit initial when investing begins
      out.push(bal)
      // advance 12 months to next sample
      for (let m = 0; m < 12; m++) {
        if (y >= startYear) bal = bal * (1 + rMonthly) + monthly
      }
    }
    return out
  }
  const early = series(0)
  const late = series(delay)
  const maxVal = Math.max(early[early.length - 1], 1)

  const W = 360, H = 180, padL = 6, padB = 14
  const x = (y: number) => padL + (y / years) * (W - padL)
  const yPos = (v: number) => (H - padB) - (v / maxVal) * (H - padB)
  const path = (s: number[]) => s.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ')
  const gridY = [0.25, 0.5, 0.75, 1].map((f) => ({ v: maxVal * f, y: yPos(maxVal * f) }))

  const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : `$${Math.round(n)}`)
  const delta = early[early.length - 1] - late[late.length - 1]

  return (
    <div className="flex flex-col items-center gap-5">
      <h2 className="font-display text-2xl md:text-3xl text-textTitle text-center">{slide.title}</h2>
      {slide.subtitle && <p className="text-sm text-textTitle/65 text-center">{slide.subtitle}</p>}

      <div className="w-full max-w-md flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-sm"><span className="font-medium text-textTitle">Starting amount</span><span className="font-bold text-brandGreen">${Math.round(principal).toLocaleString()}</span></div>
          <input type="range" min={0} max={10000} step={100} value={principal} onChange={(e) => { setPrincipal(Number(e.target.value)); touch() }} className="accent-brandGreen" />
        </label>
        <label className="flex flex-col gap-1">
          <div className="flex justify-between text-sm"><span className="font-medium text-textTitle">Annual return</span><span className="font-bold text-brandGreen">{ratePct.toFixed(1)}%</span></div>
          <input type="range" min={1} max={15} step={0.5} value={ratePct} onChange={(e) => { setRatePct(Number(e.target.value)); touch() }} className="accent-brandGreen" />
        </label>
        <div className="text-xs text-textTitle/65 text-center">plus ${monthly}/mo, compounded monthly over {years} years</div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white shadow-sm p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          {gridY.map((g, i) => (
            <g key={i}>
              <line x1={padL} y1={g.y} x2={W} y2={g.y} stroke="currentColor" className="text-textTitle/10" strokeWidth={1} />
              <text x={W - 2} y={g.y - 2} textAnchor="end" className="fill-textTitle/40" fontSize={9}>{fmt(g.v)}</text>
            </g>
          ))}
          <path d={path(late)} fill="none" className="text-textTitle/65" stroke="currentColor" strokeWidth={2.5} />
          <path d={path(early)} fill="none" className="text-brandGreen" stroke="currentColor" strokeWidth={3} />
        </svg>
        <div className="flex items-center justify-center gap-5 text-xs mt-1">
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-brandGreen inline-block" /> {slide.earlyCaption || 'Start now'}</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-3 h-1 rounded bg-textTitle/30 inline-block" /> {slide.lateCaption || `Wait ${delay} yrs`}</span>
        </div>
      </div>

      <div className="text-center">
        <div className="font-display text-2xl text-brandGreen">Starting early = {fmt(delta)} more</div>
        <div className="text-sm text-textTitle/65">{slide.summaryMessage}</div>
      </div>
    </div>
  )
}
