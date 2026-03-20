// ── §7 Partners ─────────────────────────────────────────────────
// bg: white (#FFFFFF)
// Stat numbers: Playfair Display 700, 48px, textTitle
// h2: Playfair bold (non-italic — formal/institutional tone)
// Button: light-section style (softGreen bg, brandGreen text)
// accentGold: NOT used here
// Pass 3: stat blocks wrapped in FadeUp (delays 0, 0.1, 0.2, 0.3)
//         CountUp for 2400+ (format), 3, 100%; "5–9" stays static

import Link    from 'next/link'
import FadeUp  from '@/app/components/FadeUp'
import CountUp from '@/app/components/CountUp'

const partnerTypes = [
  {
    number: '01',
    label: 'Individual Students',
    body: 'No school or program required. Any student can download Bread Head for free and start learning immediately — on any device, at any pace.',
  },
  {
    number: '02',
    label: 'Schools & Districts',
    body: 'Integrate Bread Head into existing economics or life skills courses. Standards-aligned lessons, progress dashboards, and zero cost to students.',
  },
  {
    number: '03',
    label: 'Youth Organizations',
    body: 'Bring financial literacy to after-school programs, summer camps, and community centers. Self-paced format works without a classroom structure.',
  },
  {
    number: '04',
    label: 'Corporate & Foundation',
    body: 'Fund access for underserved communities, sponsor a cohort, or partner to build curriculum around your financial products — responsibly.',
  },
]

export default function Partners() {
  return (
    <section className="bg-bgSage">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 lg:py-16">

        {/* Header row */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-end mb-10">
          <div>
            <p className="font-body font-medium text-[11px] tracking-[0.13em] uppercase text-brandGreen mb-2">
              Institutional Grade
            </p>
            <h2
              className="font-body font-bold text-textTitle tracking-[-0.02em] leading-[1.08]"
              style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}
            >
              Bringing Bread Head to every classroom.
            </h2>
          </div>
          <div>
            <p className="font-body text-[16px] leading-[1.7] mb-8"
               style={{ color: 'rgba(26,46,26,0.65)' }}>
              Bread Head is built to scale. Whether you represent a district,
              a youth nonprofit, or a foundation, we want to bring this to
              every teen who needs it — regardless of zip code.
            </p>
            {/* Light-section CTA button */}
            <Link
              href="/partners"
              className="inline-flex items-center gap-2 font-body font-medium text-brandGreen rounded-full"
              style={{
                background: 'rgba(74,93,74,0.10)',
                border: '1px solid rgba(74,93,74,0.25)',
                padding: '12px 28px',
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Partner with Bread Head →
            </Link>
          </div>
        </div>

        {/* Stats row — Playfair 700 48px per spec */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-8 mb-10 pb-10"
          style={{ borderBottom: '0.5px solid rgba(26,46,26,0.10)' }}
        >
          {/* 2,400+ — CountUp with format + suffix */}
          <FadeUp delay={0}>
            <div>
              <CountUp target={2400} suffix="+" format={true} className="partners-stat-num font-display font-bold text-textTitle leading-none" style={{ fontSize: '48px' }} />
              <p className="font-body text-[13px] mt-3"
                 style={{ color: 'rgba(26,46,26,0.50)' }}>
                teens on the waitlist
              </p>
            </div>
          </FadeUp>

          {/* 3 — CountUp */}
          <FadeUp delay={0.1}>
            <div>
              <CountUp target={3} className="partners-stat-num font-display font-bold text-textTitle leading-none" style={{ fontSize: '48px' }} />
              <p className="font-body text-[13px] mt-3"
                 style={{ color: 'rgba(26,46,26,0.50)' }}>
                states in initial rollout
              </p>
            </div>
          </FadeUp>

          {/* 5–9 — static (range, not a number) */}
          <FadeUp delay={0.2}>
            <div>
              <p
                className="partners-stat-num font-display font-bold text-textTitle leading-none mb-3"
                style={{ fontSize: '48px' }}
              >
                5–9
              </p>
              <p className="font-body text-[13px]"
                 style={{ color: 'rgba(26,46,26,0.50)' }}>
                minutes per lesson
              </p>
            </div>
          </FadeUp>

          {/* 100% — CountUp */}
          <FadeUp delay={0.3}>
            <div>
              <CountUp target={100} suffix="%" className="partners-stat-num font-display font-bold text-textTitle leading-none" style={{ fontSize: '48px' }} />
              <p className="font-body text-[13px] mt-3"
                 style={{ color: 'rgba(26,46,26,0.50)' }}>
                free for students
              </p>
            </div>
          </FadeUp>
        </div>

        {/* Partner type columns — white cards on sage */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {partnerTypes.map((p) => (
            <div key={p.label} className="bg-cardBg card-border rounded-2xl p-7 flex flex-col">
              <span className="font-body font-bold text-brandGreen text-[13px] mb-4">
                {p.number}
              </span>
              <h3 className="font-body font-semibold text-textTitle text-[20px] leading-snug mb-3">
                {p.label}
              </h3>
              <p className="font-body text-[14px] leading-[1.7] flex-1"
                 style={{ color: 'rgba(26,46,26,0.60)' }}>
                {p.body}
              </p>
              <a
                href="mailto:partners@bread-head.org"
                className="font-body font-medium text-brandGreen text-[13px] mt-5 hover:underline inline-flex items-center gap-1"
              >
                Get in touch →
              </a>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
