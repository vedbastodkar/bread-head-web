// ── §6 Journal ──────────────────────────────────────────────────
// 2-col: left = sticky phone mockup (real screenshot), right = text + feature rows
// Mirror of Lessons section structure

import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'

// ── Inline SVG icons for feature rows ────────────────────────────
function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11 2.5L13.5 5L5.5 13H3V10.5L11 2.5Z" stroke="#4A5D4A" strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9.5 4L12 6.5" stroke="#4A5D4A" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}
function ChartIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M2 11L6 7.5L9.5 10L14 5" stroke="#4A5D4A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="7.5" r="1.2" fill="#4A5D4A"/>
      <circle cx="9.5" cy="10" r="1.2" fill="#4A5D4A"/>
    </svg>
  )
}
function MirrorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="5" stroke="#4A5D4A" strokeWidth="1.4"/>
      <path d="M8 3.5V8" stroke="#4A5D4A" strokeWidth="1.4" strokeLinecap="round"/>
      <circle cx="8" cy="10" r="1" fill="#4A5D4A"/>
    </svg>
  )
}

const features = [
  {
    Icon: PencilIcon,
    label: 'Short prompts',
    sub: 'Designed to fit in a break, not carve out a block',
  },
  {
    Icon: ChartIcon,
    label: 'Pattern view',
    sub: 'See your spending emotions over weeks, not days',
  },
  {
    Icon: MirrorIcon,
    label: 'No judgment',
    sub: 'This is a mirror, not a report card',
  },
]

export default function Journal() {
  return (
    <section style={{ position: 'relative', overflow: 'hidden', background: '#E6EDD9' }}
             className="py-12 lg:py-16">
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">

          {/* ── Left: sticky phone — hidden on mobile ── */}
          <div className="hidden lg:block"
               style={{ width: '45%', position: 'sticky', top: '24px', alignSelf: 'flex-start' }}>
            <div
              className="relative rounded-[44px] overflow-hidden"
              style={{
                width: '100%',
                maxWidth: '340px',
                aspectRatio: '9/19.5',
                border: '8px solid #1A2E1A',
                background: '#1A2E1A',
              }}
            >
              {/* Notch */}
              <div
                style={{ height: '28px', background: '#1A2E1A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                className="absolute top-0 left-0 right-0 z-10"
              >
                <div style={{ width: '80px', height: '6px', background: '#000', borderRadius: '100px' }} />
              </div>

              {/* Screen content */}
              <div className="absolute inset-0" style={{ top: '28px' }}>
                <Image
                  src="/assets/journal_photo.png"
                  alt="Bread Head journal screen"
                  fill
                  className="object-cover object-top"
                  quality={90}
                />
              </div>
            </div>
          </div>

          {/* ── Right: text content ── */}
          <div className="w-full lg:w-[55%]"
               style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingTop: '40px' }}>

            <FadeUp delay={0}>
              {/* Eyebrow */}
              <p className="font-body font-medium uppercase text-brandGreen"
                 style={{ fontSize: '11px', letterSpacing: '0.13em', marginBottom: '12px' }}>
                Your Money, Your Words
              </p>

              {/* H2 — DM Sans 700, NOT Playfair */}
              <h2
                className="font-body font-bold text-textTitle"
                style={{ fontSize: 'clamp(28px, 3.5vw, 42px)', lineHeight: 1.15, marginBottom: '16px', fontFamily: 'var(--font-body), sans-serif' }}
              >
                Reflection is the skill schools skip hardest.
              </h2>

              {/* Body */}
              <p className="font-body"
                 style={{ fontSize: '15px', lineHeight: 1.7, color: 'rgba(26,46,26,0.65)', marginBottom: '32px', maxWidth: '480px' }}>
                You can read every lesson about spending and still blow your paycheck — because habits aren&apos;t built by knowing. They&apos;re built by noticing, pausing, and choosing differently next time.
              </p>
            </FadeUp>

            {/* Feature rows */}
            <div>
              {features.map(({ Icon, label, sub }, i) => (
                <FadeUp key={label} delay={0.1 + i * 0.05}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '20px' }}>
                    {/* Icon block */}
                    <div className="journal-icon" style={{
                      width: '32px', height: '32px', flexShrink: 0,
                      background: 'rgba(74,93,74,0.10)', borderRadius: '8px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon />
                    </div>
                    {/* Text */}
                    <div>
                      <p className="font-body font-semibold text-textTitle" style={{ fontSize: '14px', margin: 0 }}>
                        {label}
                      </p>
                      <p className="font-body" style={{ fontSize: '13px', color: 'rgba(26,46,26,0.55)', marginTop: '4px', lineHeight: 1.5 }}>
                        {sub}
                      </p>
                    </div>
                  </div>
                </FadeUp>
              ))}
            </div>

          </div>

        </div>
      </div>
    </section>
  )
}
