'use client'
import { useEffect, useRef } from 'react'
import Link from 'next/link'

// Custom 404 — a DVD-screensaver-style bouncing Bread Head logo behind a
// "couldn't find this page" message. Also the destination for genuinely dead
// URLs (e.g. mistyped dashboard routes).
export default function NotFound() {
  const areaRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const area = areaRef.current
    const logo = logoRef.current
    if (!area || !logo) return

    // start a bit in from the top-left, moving diagonally
    let x = 48
    let y = 48
    let vx = 2.9
    let vy = 2.3
    let raf = 0
    // recolor the logo on every wall hit, like the classic bouncing logo
    const tints = ['none', 'hue-rotate(55deg)', 'hue-rotate(-60deg)', 'hue-rotate(120deg)', 'hue-rotate(200deg)']
    let tint = 0

    const step = () => {
      const aw = area.clientWidth
      const ah = area.clientHeight
      const lw = logo.offsetWidth
      const lh = logo.offsetHeight

      x += vx
      y += vy
      let bounced = false

      if (x <= 0) { x = 0; vx = Math.abs(vx); bounced = true }
      else if (x + lw >= aw) { x = aw - lw; vx = -Math.abs(vx); bounced = true }
      if (y <= 0) { y = 0; vy = Math.abs(vy); bounced = true }
      else if (y + lh >= ah) { y = ah - lh; vy = -Math.abs(vy); bounced = true }

      if (bounced) {
        tint = (tint + 1) % tints.length
        logo.style.filter = tints[tint]
      }
      logo.style.transform = `translate(${x}px, ${y}px)`
      raf = requestAnimationFrame(step)
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <main className="relative min-h-screen overflow-hidden bg-bgSage">
      {/* bouncing logo layer */}
      <div ref={areaRef} className="absolute inset-0" aria-hidden>
        <div ref={logoRef} className="absolute left-0 top-0 will-change-transform">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/icon_clear.png"
            alt=""
            width={96}
            height={96}
            draggable={false}
            className="w-[96px] h-[96px] select-none pointer-events-none drop-shadow-sm"
          />
        </div>
      </div>

      {/* message layer */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center text-center px-6 pointer-events-none">
        <div className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brandGreen mb-3">Error 404</div>
        <h1 className="font-display text-4xl md:text-5xl text-textTitle mb-3">Couldn&rsquo;t find this page</h1>
        <p className="text-textTitle/60 text-sm mb-7 max-w-md">
          The page you&rsquo;re looking for moved, expired, or never existed. Meanwhile, enjoy the bread.
        </p>
        <Link
          href="/"
          className="pointer-events-auto px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm hover:opacity-90 transition"
        >
          Back to home
        </Link>
      </div>
    </main>
  )
}
