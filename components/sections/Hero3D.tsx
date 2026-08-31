'use client'

// ── §1 Hero — 3D barrel-loop ───────────────────────────────────
// Geometry + motion match the design mockup exactly (full 360° scroll-tied
// turn, lerp 0.09, ±46° tilt). Copy fades OUT as the scene turns away and
// fades back IN as it returns front. Verbatim hero copy preserved.

import { useEffect, useRef } from 'react'
import { APP_STORE_URL } from '@/lib/links'
import { Icon } from '@/app/components/Icon'
import s from './Hero3D.module.css'

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

export default function Hero3D() {
  const scrollRef = useRef<HTMLElement>(null)
  const sceneRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollEl = scrollRef.current
    const scene = sceneRef.current
    const phone = phoneRef.current
    const copy = copyRef.current
    const cue = cueRef.current
    if (!scrollEl || !scene || !phone || !copy) return

    // Open at the top so the hero starts at rest — browsers otherwise restore
    // the previous scroll position on refresh and land mid-turn (mirrored).
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const floats = Array.from(scene.querySelectorAll<HTMLElement>('[data-depth]'))
    floats.forEach((el, i) => {
      el.dataset.z = el.dataset.depth
      el.dataset.ang = String((i * 47) % 360)
    })

    let target = 0
    let cur = 0
    let raf = 0

    // push the whole flipping scene right, away from the text unit — responsive
    // so it opens more air on wide screens without clipping on narrow ones.
    let sceneShift = 0
    const computeShift = () => { sceneShift = clamp(window.innerWidth * 0.05, 24, 116) }
    computeShift()

    const onScroll = () => {
      const rect = scrollEl.getBoundingClientRect()
      const total = scrollEl.offsetHeight - window.innerHeight
      target = total > 0 ? clamp(-rect.top / total, 0, 1) : 0
    }
    const onResize = () => { computeShift(); onScroll() }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)

    const frame = () => {
      cur = lerp(cur, target, 0.09)
      const p = cur

      const rotY = p * 360
      const rotX = 12 + Math.sin(p * Math.PI) * 46
      scene.style.transform = `translateX(${sceneShift}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`

      // copy fades out as the scene turns away, back in as it returns front
      const away = Math.sin(p * Math.PI) // 0 = front-facing, 1 = mirrored middle
      copy.style.opacity = String(clamp(1 - away * 1.7, 0, 1))
      copy.style.transform = `translateZ(${lerp(60, -120, away)}px) translateY(${-away * 60}px)`
      if (cue) cue.style.opacity = String(clamp(1 - p * 4, 0, 1))

      floats.forEach((el) => {
        const z = +(el.dataset.z || 0)
        const ang = (+(el.dataset.ang || 0)) * Math.PI / 180
        const bob = Math.sin(p * Math.PI * 2 + ang) * 10
        const counter = -rotY * 0.15
        el.style.transform = `translateZ(${z}px) translateY(${bob}px) rotateY(${counter}deg)`
      })
      phone.style.transform = `translateZ(40px) rotateY(${Math.sin(p * Math.PI * 2) * 14}deg)`

      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <section className={s.scroll} ref={scrollRef} data-testid="hero">
      <div className={s.stageWrap}>
        <div className={s.stage}>

          {/* ── Left: verbatim hero copy ── */}
          <div className={s.copy} ref={copyRef}>
            <div className={s.eyebrowRow}>
              <div className={s.eyebrowBar} />
              <span className={s.eyebrow}>Personal Finance · Built for Teens</span>
            </div>
            <p className={s.kicker}>Know Your Dough.</p>
            <h1 className={s.h1}>The money stuff school forgot to teach you.</h1>
            <p className={s.sub}>
              Bite-sized lessons on pay stubs, credit, and taxes. A budget
              simulator that shows tradeoffs before they cost you. A private
              journal that turns choices into habits.
            </p>
            <div className={s.ctas}>
              <a className={s.cta} href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                Start Learning Free →
              </a>
            </div>
            <p className={s.micro}>Free to start · No credit card</p>
          </div>

          {/* ── Right: 3D scene ── */}
          <div className={s.scene} ref={sceneRef}>

            <div className={`${s.float} ${s.ribbon}`}>
              <div className={s.ribbonFace}>
                <svg viewBox="0 0 720 720">
                  <defs>
                    <path id="bhHeroRibbonA" d="M360,360 m-300,0 a300,300 0 1,1 600,0 a300,300 0 1,1 -600,0" />
                  </defs>
                  <text><textPath href="#bhHeroRibbonA" startOffset="0%">BUDGET · SAVE · INVEST · GROW · BUDGET · SAVE · INVEST · GROW · </textPath></text>
                </svg>
              </div>
              <div className={`${s.ribbonFace} ${s.ribbonBack}`}>
                <svg viewBox="0 0 720 720">
                  <defs>
                    <path id="bhHeroRibbonB" d="M360,360 m-300,0 a300,300 0 1,1 600,0 a300,300 0 1,1 -600,0" />
                  </defs>
                  <text><textPath href="#bhHeroRibbonB" startOffset="0%">BUDGET · SAVE · INVEST · GROW · BUDGET · SAVE · INVEST · GROW · </textPath></text>
                </svg>
              </div>
            </div>

            <div className={`${s.float} ${s.podium}`} />

            <div className={`${s.float} ${s.phone}`} ref={phoneRef}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/welcome_screen.png" alt="Bread Head app welcome screen" />
            </div>

            <div className={`${s.float} ${s.card} ${s.cBudget}`} data-depth="90">
              <div className={s.k}>Budgeting Simulator</div>
              <svg className={s.spark} viewBox="0 0 180 42" preserveAspectRatio="none">
                <polyline fill="none" stroke="#4A5D4A" strokeWidth="2.4" points="0,34 24,28 48,30 72,19 96,23 120,11 144,15 180,5" />
                <polyline fill="rgba(74,93,74,.12)" stroke="none" points="0,42 0,34 24,28 48,30 72,19 96,23 120,11 144,15 180,5 180,42" />
              </svg>
              <div className={s.row} style={{ justifyContent: 'space-between', marginTop: 8 }}>
                <span className={s.k} style={{ textTransform: 'none', letterSpacing: 0 }}>Food &amp; Drinks · 25%</span>
                <span className={s.v} style={{ fontSize: 18, color: '#4A5D4A' }}>$246 left</span>
              </div>
            </div>

            <div className={`${s.float} ${s.card} ${s.cStreak}`} data-depth="140">
              <div className={s.k}>Streak</div>
              <div className={s.row} style={{ marginTop: 6 }}><span style={{ fontSize: 26, color: '#D1A945', display: 'inline-flex' }}><Icon name="flame" /></span><span className={s.v}>12</span></div>
              <div className={s.k} style={{ textTransform: 'none', letterSpacing: 0, marginTop: 2 }}>days in a row</div>
            </div>

            {/* 73% stat — verbatim, floating like the mockup */}
            <div className={`${s.float} ${s.card} ${s.cStat}`} data-depth="70">
              <div className={s.v} style={{ fontSize: 34 }}>73%</div>
              <div className={s.k} style={{ textTransform: 'none', letterSpacing: 0, lineHeight: 1.42, marginTop: 4 }}>
                of teens have never seen a pay stub, yet they&apos;re expected to manage their own money within months of graduation.
              </div>
            </div>

            <div className={`${s.float} ${s.card} ${s.dark} ${s.cReward}`} data-depth="120">
              <div className={s.k}>Lesson complete!</div>
              <div style={{ fontWeight: 600, margin: '2px 0 10px' }}>Unit 4 · Credit and Loans</div>
              <div className={s.row}>
                <span className={s.badge} style={{ color: '#D1A945' }}><Icon name="gem" size={18} /></span><span className={s.v}>+8</span>
                <span className={s.k} style={{ color: 'rgba(234,240,223,.7)', textTransform: 'none', letterSpacing: 0 }}>Gems</span>
              </div>
            </div>

            <div className={`${s.float} ${s.tok} ${s.tGem}`} data-depth="200" style={{ color: '#D1A945' }}><Icon name="gem" /></div>
            <div className={`${s.float} ${s.tok} ${s.tCap}`} data-depth="180" style={{ color: '#4A5D4A' }}><Icon name="graduationcap" /></div>
            <div className={`${s.float} ${s.tok} ${s.tGem2}`} data-depth="220" style={{ color: '#D1A945' }}><Icon name="gem" /></div>
            <div className={`${s.float} ${s.tok} ${s.tCoin}`} data-depth="160" style={{ color: '#D1A945' }}><Icon name="coins" /></div>
            <div className={`${s.float} ${s.appicon}`} data-depth="175">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/logo_w_text.png" alt="Bread Head" />
            </div>

          </div>
        </div>

        <div className={s.cue} ref={cueRef}><span className={s.cueDot} />Scroll to loop</div>
      </div>
    </section>
  )
}
