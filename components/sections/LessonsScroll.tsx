'use client'

// ── §4 — features flip tour (replaces LessonsPreview) ──────────
// Verbatim section header kept from the original LessonsPreview.
// A pinned phone flips 180° (alternating R / L / R) through the four
// app surfaces; a side stepper lets you jump, gliding through each.

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { Icon } from '@/app/components/Icon'
import s from './LessonsScroll.module.css'

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))

const SCREENS = [
  '/assets/lesson_home_screen.png', // 0 Learn
  '/assets/app_journal.png',        // 1 Journal
  '/assets/app_budget.png',         // 2 Budget
  '/assets/app_progress.png',       // 3 Progress
]

export default function LessonsScroll() {
  const featRef = useRef<HTMLDivElement>(null)
  const flipRef = useRef<HTMLDivElement>(null)
  const frontRef = useRef<HTMLImageElement>(null)
  const backRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const feat = featRef.current
    const flip = flipRef.current
    const front = frontRef.current
    const back = backRef.current
    if (!feat || !flip || !front || !back) return

    const chips = Array.from(feat.querySelectorAll<HTMLElement>('[data-chip]'))
    const blocks = Array.from(feat.querySelectorAll<HTMLElement>('[data-block]'))
    const steps = Array.from(feat.querySelectorAll<HTMLButtonElement>('[data-step]'))
    const N = 4

    const featPos = () => {
      const r = feat.getBoundingClientRect()
      const total = feat.offsetHeight - window.innerHeight
      const fp = total > 0 ? clamp(-r.top / total, 0, 1) : 0
      return fp * (N - 1)
    }

    const update = () => {
      const raw = featPos()
      const seg = Math.max(0, Math.min(Math.floor(raw), N - 2))
      // smoothstep the per-segment progress → dwell on each screen, then zip
      // through the edge-on transition so the flip never rests in that off-state
      const lt = raw - seg
      // gentle smoothstep: screens feel lightly weighted, but scroll always
      // moves freely — no forced snap, no scroll-jacking (yields to the user)
      const et = lt * lt * (3 - 2 * lt)
      const fc = seg + et

      const rotY = seg % 2 === 0 ? 180 * et : 180 - 180 * et
      flip.style.transform = `rotateX(2deg) rotateY(${rotY}deg)`

      const fi = fc < 1.5 ? 0 : 2
      const bi = fc < 2.5 ? 1 : 3
      if (front.dataset.k !== String(fi)) { front.src = SCREENS[fi]; front.dataset.k = String(fi) }
      if (back.dataset.k !== String(bi)) { back.src = SCREENS[bi]; back.dataset.k = String(bi) }

      chips.forEach((c) => {
        const d = fc - +(c.dataset.i || 0)
        c.style.opacity = String(clamp(1 - Math.abs(d) * 2.2, 0, 1))
        c.style.transform = `translateY(${d * 8}px)`
      })
      blocks.forEach((b, i) => {
        const d = fc - i
        b.style.opacity = String(clamp(1 - Math.abs(d) * 1.8, 0, 1))
        b.style.transform = `translateY(${d * 16}px)`
        b.style.pointerEvents = Math.abs(d) < 0.5 ? 'auto' : 'none'
      })
      const active = Math.round(fc)
      steps.forEach((st, i) => st.classList.toggle(s.stepOn, i === active))
    }

    // custom tween (native smooth-scroll is unreliable / reduced-motion disabled)
    let scrollRAF = 0
    const tweenScrollTo = (to: number, dur: number) => {
      const from = window.scrollY
      const t0 = performance.now()
      cancelAnimationFrame(scrollRAF)
      const step = (now: number) => {
        const t = clamp((now - t0) / dur, 0, 1)
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
        // behavior:'instant' overrides the global `html{scroll-behavior:smooth}`,
        // so our own easing drives the glide instead of fighting it
        window.scrollTo({ top: from + (to - from) * e, left: 0, behavior: 'instant' as ScrollBehavior })
        if (t < 1) scrollRAF = requestAnimationFrame(step)
      }
      scrollRAF = requestAnimationFrame(step)
    }
    const onStep = (e: Event) => {
      const i = +((e.currentTarget as HTMLElement).dataset.i || 0)
      const total = feat.offsetHeight - window.innerHeight
      const absTop = window.scrollY + feat.getBoundingClientRect().top // page-absolute, offsetParent-safe
      const crossed = Math.abs(i - Math.round(featPos()))
      tweenScrollTo(absTop + (i / (N - 1)) * total, 420 + 220 * crossed)
    }
    steps.forEach((st) => st.addEventListener('click', onStep))

    // Settle-on-idle: when the user stops scrolling inside the pin (trackpad
    // lifted, momentum ended), gently glide to the nearest screen so it never
    // sits in the mid-flip limbo. But ANY new scroll input cancels it instantly
    // (wheel/touch → yield), so it never fights the user — the GSAP principle.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let idleTimer: ReturnType<typeof setTimeout>
    let snapRAF = 0
    let snapping = false
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

    const settle = () => {
      const rect = feat.getBoundingClientRect()
      const total = feat.offsetHeight - window.innerHeight
      const fp = total > 0 ? -rect.top / total : -1
      if (fp <= 0.015 || fp >= 0.985) return           // at the edges → hand off freely
      const nearest = Math.round(fp * (N - 1))
      const from = window.scrollY
      const dist = window.scrollY + rect.top + (nearest / (N - 1)) * total - from
      if (Math.abs(dist) < 2) return
      const dur = clamp(Math.abs(dist) * 0.7, 200, 460)
      const t0 = performance.now()
      snapping = true
      const step = (now: number) => {
        if (!snapping) return                          // user grabbed control → abort
        const t = clamp((now - t0) / dur, 0, 1)
        window.scrollTo({ top: from + dist * easeOut(t), left: 0, behavior: 'instant' as ScrollBehavior })
        if (t < 1) snapRAF = requestAnimationFrame(step); else snapping = false
      }
      snapRAF = requestAnimationFrame(step)
    }
    const arm = () => {                                // real user input → yield + re-arm
      snapping = false
      cancelAnimationFrame(snapRAF)
      clearTimeout(idleTimer)
      if (!reduce) idleTimer = setTimeout(settle, 180)
    }

    let raf = 0
    const loop = () => { update(); raf = requestAnimationFrame(loop) }
    const onScroll = () => {
      update()
      if (!snapping && !reduce) { clearTimeout(idleTimer); idleTimer = setTimeout(settle, 180) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', update)
    window.addEventListener('wheel', arm, { passive: true })
    window.addEventListener('touchmove', arm, { passive: true })
    update()
    raf = requestAnimationFrame(loop)

    return () => {
      steps.forEach((st) => st.removeEventListener('click', onStep))
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', update)
      window.removeEventListener('wheel', arm)
      window.removeEventListener('touchmove', arm)
      clearTimeout(idleTimer)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(snapRAF)
      cancelAnimationFrame(scrollRAF)
    }
  }, [])

  return (
    <section className={s.section} data-testid="lessons">
      {/* ── verbatim header from the original LessonsPreview ── */}
      <div className={s.header}>
        <p className={s.eyebrow}>The Curriculum</p>
        <h2 className={s.h2}>Real topics. Zero condescension.</h2>
        <p className={s.sub}>
          10 units. Each one 8–15 mini lessons, 3–5 minutes long. Built around
          decisions real teens actually have to make.
        </p>
      </div>

      {/* ── pinned flip tour ── */}
      <div className={s.features} ref={featRef}>
        <div className={s.sticky}>
          <div className={s.inner}>

            <div className={s.phonewrap}>
              <div className={s.flip} ref={flipRef}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className={`${s.face} ${s.front}`}><img ref={frontRef} src={SCREENS[0]} alt="Bread Head lessons" data-k="0" /></div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <div className={`${s.face} ${s.back}`}><img ref={backRef} src={SCREENS[1]} alt="Bread Head journal" data-k="1" /></div>
              </div>
            </div>

            <div className={s.text}>
              <div className={s.block} data-block>
                <div className={s.num}>01 · Learn</div>
                <h3>95 lessons school <em>never taught</em>.</h3>
                <p>Bite-sized, unit by unit, from your first pay stub to credit and taxes. Each lesson ends in one clear takeaway, not a quiz you forget.</p>
                <ul className={s.featureList}>
                  <li><span className={s.fIcon}><Icon name="book-open" size={18} /></span><div><div className={s.fLabel}>Tap through like stories</div><div className={s.fSub}>Short slides, one idea at a time, no walls of text</div></div></li>
                  <li><span className={s.fIcon}><Icon name="unlock" size={18} /></span><div><div className={s.fLabel}>Answer to unlock</div><div className={s.fSub}>Key concepts are gated behind a question, so there&apos;s no skimming past what matters</div></div></li>
                  <li><span className={s.fIcon}><Icon name="lightbulb" size={18} /></span><div><div className={s.fLabel}>Wrong answers teach too</div><div className={s.fSub}>See exactly why it&apos;s wrong, and why the right answer is right</div></div></li>
                </ul>
                <Link href="/lessons" className={s.moreBtn}>See more on Lessons →</Link>
              </div>
              <div className={s.block} data-block>
                <div className={s.num}>02 · Journal</div>
                <h3>Reflection is the skill schools <em>skip hardest</em>.</h3>
                <p>You can read every lesson about spending and still blow your paycheck, because habits aren&apos;t built by knowing. They&apos;re built by noticing, pausing, and choosing differently next time.</p>
                <ul className={s.featureList}>
                  <li><span className={s.fIcon}><Icon name="pen" size={18} /></span><div><div className={s.fLabel}>Short prompts</div><div className={s.fSub}>Designed to fit in a break, not carve out a block</div></div></li>
                  <li><span className={s.fIcon}><Icon name="trending-up" size={18} /></span><div><div className={s.fLabel}>Pattern view</div><div className={s.fSub}>See your spending emotions over weeks, not days</div></div></li>
                  <li><span className={s.fIcon}><Icon name="mirror" size={18} /></span><div><div className={s.fLabel}>No judgment</div><div className={s.fSub}>This is a mirror, not a report card</div></div></li>
                </ul>
                <Link href="/journal" className={s.moreBtn}>See more on the Journal →</Link>
              </div>
              <div className={s.block} data-block>
                <div className={s.num}>03 · Budget</div>
                <h3>A budgeting <em>simulator</em>, not a spreadsheet.</h3>
                <p>Real deep-dive metrics: budget usage, free cash flow, spending momentum. Teens practice with play money before it&apos;s the real thing.</p>
                <ul className={s.featureList}>
                  <li><span className={s.fIcon}><Icon name="tags" size={18} /></span><div><div className={s.fLabel}>Categories</div><div className={s.fSub}>Your budget, organized the way you live: Groceries, Rent, Dining, Savings</div></div></li>
                  <li><span className={s.fIcon}><Icon name="pin" size={18} /></span><div><div className={s.fLabel}>Fixed payments</div><div className={s.fSub}>Recurring bills committed before you spend a dollar</div></div></li>
                  <li><span className={s.fIcon}><Icon name="receipt" size={18} /></span><div><div className={s.fLabel}>Transactions</div><div className={s.fSub}>Every expense and income, tagged and counted</div></div></li>
                </ul>
                <Link href="/budget" className={s.moreBtn}>See more on Budgeting →</Link>
              </div>
              <div className={s.block} data-block>
                <div className={s.num}>04 · Progress</div>
                <h3>Streaks, crumbs, and <em>a sandwich</em> to grow.</h3>
                <p>A Behavior Score rewards consistency: logging, reflecting, staying on budget. Earn Crumbs and achievements as your money habits build.</p>
                <ul className={s.featureList}>
                  <li><span className={s.fIcon}><Icon name="star" size={18} /></span><div><div className={s.fLabel}>Behavior Score</div><div className={s.fSub}>Rewards consistency: logging, reflecting, staying on budget</div></div></li>
                  <li><span className={s.fIcon}><Icon name="coins" size={18} /></span><div><div className={s.fLabel}>Earn Crumbs</div><div className={s.fSub}>Currency for building good money habits over time</div></div></li>
                  <li><span className={s.fIcon}><Icon name="sandwich" size={18} /></span><div><div className={s.fLabel}>Build your Sandwich</div><div className={s.fSub}>Achievements that stack as you grow</div></div></li>
                </ul>
                <Link href="/features" className={s.moreBtn}>See more on the App →</Link>
              </div>
            </div>

            <div className={s.stepper}>
              <button className={`${s.step} ${s.stepOn}`} data-step data-i="0"><span className={s.rail} /><span className={s.idx}>01</span> Learn</button>
              <button className={s.step} data-step data-i="1"><span className={s.rail} /><span className={s.idx}>02</span> Journal</button>
              <button className={s.step} data-step data-i="2"><span className={s.rail} /><span className={s.idx}>03</span> Budget</button>
              <button className={s.step} data-step data-i="3"><span className={s.rail} /><span className={s.idx}>04</span> Progress</button>
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
