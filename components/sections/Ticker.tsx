// ── Ticker — full-width CSS marquee between §3 Pillars and §4 Lessons ──
// bgSage background (seamlessly extends Pillars' sage).
// Pure CSS animation — no JS, no Framer Motion.
// Duplicate spans ensure the loop is seamless at any viewport width.

import Image from 'next/image'

const TICKER_ITEMS = ['Pay Stubs', 'Mortgages', 'Taxes 101', 'Credit Scores', 'Budgeting', 'Investing Basics']

// Repeat 4× so the span width comfortably exceeds any viewport
const items = Array.from({ length: 4 }, () => TICKER_ITEMS).flat()

function TickerContent() {
  return (
    <span className="inline-flex items-center shrink-0">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center">
          <span className="font-body font-medium text-[13px] md:text-[14px] tracking-[0.08em] text-brandGreen select-none">
            {item}
          </span>
          <span className="inline-flex items-center mx-3 md:mx-4" aria-hidden="true">
            <Image src="/assets/icon_clear.png" alt="" width={14} height={14} style={{ opacity: 0.38 }} />
          </span>
        </span>
      ))}
    </span>
  )
}

export default function Ticker() {
  return (
    <div
      className="bg-bgSage overflow-hidden py-2 md:py-3"
      style={{ borderTop: '1px solid rgba(74,93,74,0.12)', borderBottom: '1px solid rgba(74,93,74,0.12)' }}
      aria-hidden="true"
    >
      {/* animate-ticker: 0 → -50% over 25s — defined in tailwind.config.js */}
      <div className="flex whitespace-nowrap animate-ticker will-change-transform">
        <TickerContent />
        {/* Second copy makes the loop visually seamless */}
        <TickerContent />
      </div>
    </div>
  )
}
