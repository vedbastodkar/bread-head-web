// ── §6 Journal ──────────────────────────────────────────────────
// 2-col: left = sticky phone mockup (coded UI), right = text + feature rows
// Mirror of Lessons section structure

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

// ── Bottom nav SVG icons ──────────────────────────────────────────
function ProgressIcon({ active }: { active: boolean }) {
  const c = active ? '#4A5D4A' : 'rgba(26,46,26,0.35)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="10" width="3" height="6" rx="1" fill={c}/>
      <rect x="7.5" y="6" width="3" height="10" rx="1" fill={c}/>
      <rect x="13" y="2" width="3" height="14" rx="1" fill={c}/>
    </svg>
  )
}
function LearnIcon({ active }: { active: boolean }) {
  const c = active ? '#4A5D4A' : 'rgba(26,46,26,0.35)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 4.5C3 4.5 6 3 9 3C12 3 15 4.5 15 4.5V14C15 14 12 12.5 9 12.5C6 12.5 3 14 3 14V4.5Z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
      <path d="M9 3V12.5" stroke={c} strokeWidth="1.3"/>
    </svg>
  )
}
function DashboardIcon({ active }: { active: boolean }) {
  const c = active ? '#4A5D4A' : 'rgba(26,46,26,0.35)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2.5L15.5 8V15.5H12V11H6V15.5H2.5V8L9 2.5Z" stroke={c} strokeWidth="1.3" strokeLinejoin="round"/>
    </svg>
  )
}
function BudgetIcon({ active }: { active: boolean }) {
  const c = active ? '#4A5D4A' : 'rgba(26,46,26,0.35)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="4.5" width="14" height="10" rx="1.5" stroke={c} strokeWidth="1.3"/>
      <path d="M2 7.5H16" stroke={c} strokeWidth="1.3"/>
      <circle cx="5.5" cy="11" r="1" fill={c}/>
    </svg>
  )
}
function JournalIcon({ active }: { active: boolean }) {
  const c = active ? '#4A5D4A' : 'rgba(26,46,26,0.35)'
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="4" y="2.5" width="10" height="13" rx="1.5" stroke={c} strokeWidth="1.3"/>
      <path d="M7 6.5H11" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 9H11" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M7 11.5H9.5" stroke={c} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

const navTabs = [
  { label: 'Progress',  Icon: ProgressIcon,  active: false },
  { label: 'Learn',     Icon: LearnIcon,      active: false },
  { label: 'Dashboard', Icon: DashboardIcon,  active: false },
  { label: 'Budget',    Icon: BudgetIcon,     active: false },
  { label: 'Journal',   Icon: JournalIcon,    active: true  },
]

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

function PhoneScreen() {
  const font = 'var(--font-body), sans-serif'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#F7F9F4', fontFamily: font, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 4px' }}>
        <p style={{ margin: 0, fontWeight: 600, fontSize: '18px', color: '#1A2E1A', lineHeight: 1.3 }}>Journal</p>
      </div>

      {/* Subheader */}
      <div style={{ padding: '0 20px 12px' }}>
        <p style={{ margin: 0, fontWeight: 400, fontSize: '12px', color: 'rgba(26,46,26,0.5)' }}>Week 3 · 3 entries</p>
      </div>

      {/* Card 1 — New Entry CTA */}
      <div style={{
        background: '#1A2E1A', borderRadius: '16px',
        padding: '14px 18px', margin: '0 14px 8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#E6EDD9', fontSize: '22px', lineHeight: 1, fontWeight: 300, marginTop: '-1px' }}>+</span>
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#E6EDD9' }}>New Journal Entry</span>
        </div>
        <span style={{ color: 'rgba(230,237,217,0.5)', fontSize: '18px', lineHeight: 1 }}>›</span>
      </div>

      {/* Card 2 — View Past Entries */}
      <div style={{
        background: 'rgba(26,46,26,0.06)', borderRadius: '16px',
        padding: '12px 18px', margin: '0 14px 8px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
            <circle cx="6.5" cy="6.5" r="5" stroke="#1A2E1A" strokeWidth="1.1"/>
            <path d="M6.5 4V6.5L8 7.8" stroke="#1A2E1A" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
          <span style={{ fontWeight: 500, fontSize: '13px', color: '#1A2E1A' }}>View Past Entries</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            background: 'rgba(74,93,74,0.10)', color: '#4A5D4A',
            fontWeight: 600, fontSize: '11px',
            borderRadius: '100px', padding: '2px 7px',
          }}>3</span>
          <span style={{ color: 'rgba(26,46,26,0.45)', fontSize: '16px', lineHeight: 1 }}>›</span>
        </div>
      </div>

      {/* Card 3 — Latest entry */}
      <div style={{
        background: 'white', borderRadius: '16px',
        padding: '14px 18px', margin: '0 14px 8px',
        borderTop: '3px solid #4A5D4A',
        flexShrink: 0,
      }}>
        <p style={{ margin: '0 0 3px', fontWeight: 600, fontSize: '13px', color: '#1A2E1A' }}>Coffee Reality Check</p>
        <p style={{ margin: '0 0 7px', fontWeight: 400, fontSize: '11px', color: 'rgba(26,46,26,0.45)' }}>Thursday, March 14</p>
        <p style={{ margin: 0, fontWeight: 400, fontSize: '12px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.55 }}>
          This week I tracked every coffee. $14 in 7 days.
        </p>
        <div style={{ display: 'flex', gap: '5px', marginTop: '9px', flexWrap: 'wrap' }}>
          {['Reflective', 'Awareness', 'Habits'].map((tag) => (
            <span key={tag} style={{
              background: 'rgba(74,93,74,0.08)', color: '#4A5D4A',
              border: '0.5px solid rgba(74,93,74,0.2)',
              borderRadius: '100px', padding: '2px 9px',
              fontSize: '10px', fontWeight: 500,
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Spacer — pushes prompt + nav to bottom */}
      <div style={{ flex: 1 }} />

      {/* Next prompt strip */}
      <div style={{ background: 'rgba(74,93,74,0.06)', padding: '11px 18px' }}>
        <p style={{
          margin: '0 0 4px', fontWeight: 500, fontSize: '10px',
          letterSpacing: '0.1em', color: 'rgba(26,46,26,0.4)', textTransform: 'uppercase',
        }}>Next Prompt</p>
        <p style={{ margin: 0, fontWeight: 400, fontSize: '11px', color: 'rgba(26,46,26,0.65)', fontStyle: 'italic', lineHeight: 1.5 }}>
          What&apos;s one purchase this week you wouldn&apos;t make again?
        </p>
      </div>

      {/* Bottom nav */}
      <div style={{
        background: 'white', borderTop: '0.5px solid rgba(26,46,26,0.08)',
        display: 'flex', justifyContent: 'space-around',
        padding: '7px 0 10px', flexShrink: 0,
      }}>
        {navTabs.map(({ label, Icon, active }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
            <Icon active={active} />
            <span style={{
              fontWeight: active ? 500 : 400,
              fontSize: '9px',
              color: active ? '#4A5D4A' : 'rgba(26,46,26,0.35)',
            }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

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
                <PhoneScreen />
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
                    <div style={{
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
