// ── Ticker — full-width CSS marquee between §3 Pillars and §4 Lessons ──
// bgSage background (seamlessly extends Pillars' sage).
// Pure CSS animation — no JS, no Framer Motion.
// Duplicate spans ensure the loop is seamless at any viewport width.

const TICKER_ITEMS =
  'Pay Stubs\u2002·\u2002Mortgages\u2002·\u2002Taxes 101\u2002·\u2002Credit Scores\u2002·\u2002Budgeting\u2002·\u2002Investing Basics\u2002·\u2002'

export default function Ticker() {
  // Repeat enough to guarantee span width > max viewport before duplicating
  const content = TICKER_ITEMS.repeat(6)

  return (
    <div
      className="bg-bgSage overflow-hidden py-3"
      style={{ borderTop: '1px solid rgba(74,93,74,0.12)', borderBottom: '1px solid rgba(74,93,74,0.12)' }}
      aria-hidden="true"
    >
      {/* animate-ticker: 0 → -50% over 25s — defined in tailwind.config.js */}
      <div className="flex whitespace-nowrap animate-ticker will-change-transform">
        <span className="shrink-0 font-body font-medium text-[14px] tracking-[0.08em] text-brandGreen select-none">
          {content}
        </span>
        {/* Second copy makes the loop visually seamless */}
        <span className="shrink-0 font-body font-medium text-[14px] tracking-[0.08em] text-brandGreen select-none">
          {content}
        </span>
      </div>
    </div>
  )
}
