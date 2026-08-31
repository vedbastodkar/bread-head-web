import type { Metadata } from 'next'
import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'

export const metadata: Metadata = {
  title: 'Journal',
  description: 'Short reflection prompts tied to your real financial activity. Notice your patterns, understand your habits, and build awareness that sticks.',
  openGraph: {
    title: 'Bread Head Journal: Reflect on Your Money Habits',
    description: 'Short daily prompts drawn from your own budget data help you notice patterns, understand habits, and turn awareness into better decisions.',
  },
}

const HOW_IT_WORKS = [
  {
    number: '01',
    title: 'Tied to your actual activity.',
    body: 'Prompts are generated from your real budget data: your transactions, your categories, your warnings. You\'re never answering a generic question about money. You\'re answering one about what you specifically did this week.',
  },
  {
    number: '02',
    title: 'Short by design.',
    body: 'Each entry takes 2–3 minutes. The goal isn\'t volume. It\'s one honest thought, named before it drifts. You\'re not writing a financial diary. You\'re surfacing the thing you almost didn\'t notice.',
  },
  {
    number: '03',
    title: 'Builds over time.',
    body: 'Each entry stands alone, but together they form a record of how your thinking about money is changing. Patterns you couldn\'t see in week one become obvious by month three.',
  },
]

const THEMES = [
  {
    number: '01',
    name: 'Spending Awareness',
    description: 'When a pattern surfaces in your transactions (dining three times in a week, impulse purchases clustering together), the journal asks how each one felt. Not to judge. To make it visible before it becomes invisible again.',
  },
  {
    number: '02',
    name: 'Savings Check-In',
    description: 'When your savings rate shifts, you\'re asked what changed. A one-time unexpected expense is different from a slow, unnoticed drift. The journal helps you tell the difference, and decide which one to fix.',
  },
  {
    number: '03',
    name: 'Budget Habits',
    description: 'Consistently over- or under-spending in a category prompts a real question: is the budget unrealistic, or is the habit? Seeing the number is one thing. Naming the cause is how you actually change it.',
  },
  {
    number: '04',
    name: 'Goal Alignment',
    description: 'Connects day-to-day spending to the bigger picture you\'ve set for yourself. Are the choices you\'re making right now moving you toward what you said you wanted, or quietly working against it?',
  },
  {
    number: '05',
    name: 'Month in Review',
    description: 'Every month closes with a full reflection prompt: what you planned, what actually happened, what surprised you, and one thing to carry forward. One entry. The whole month.',
  },
]

const WHY = [
  {
    stat: '90%',
    label: 'of financial habits form before 25',
    body: 'The patterns you build right now (how you respond to stress, how you treat leftover money, whether you notice drift or let it slide) are the ones you carry into your adult financial life. The journal is where those patterns first become visible.',
  },
  {
    stat: '2–3 min',
    label: 'is all a habit shift requires',
    body: 'You don\'t need a long session. You need to name the thing. Once you see that you always overspend when you\'re bored, or skip savings when you\'re stressed, the pattern loses its grip. Naming it is the first step to changing it.',
  },
  {
    stat: '1 prompt',
    label: 'per event, never a wall of questions',
    body: 'You\'ll never open the journal to ten pending questions. One prompt surfaces at a time, tied to one specific thing that happened. It stays small so you actually do it, and actually carry something away from it.',
  },
]

const PROMPTS = [
  {
    prompt: 'You logged three dining transactions this week. How did each one feel: planned, impulsive, or social?',
    context: 'After a spending pattern surfaces',
  },
  {
    prompt: 'Your savings rate dropped below target this month. What got in the way: an unexpected expense, or a gradual drift?',
    context: 'After a T2 savings warning',
  },
  {
    prompt: 'You stayed under budget in every category this week. What made that easier than usual?',
    context: 'After a strong week',
  },
  {
    prompt: 'You\'ve overspent in the same category three months in a row. Is the budget wrong, or is the habit?',
    context: 'After a recurring overage',
  },
  {
    prompt: 'You allocated everything in your budget this month. How does having every dollar assigned feel compared to before?',
    context: 'After first full zero-based budget',
  },
  {
    prompt: 'You skipped your savings contribution this month. Was it a conscious trade-off, or something that just slipped by?',
    context: 'After a missed savings target',
  },
]

export default function JournalPage() {
  return (
    <main>

      {/* ── HERO ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '160px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              Journal
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(32px, 4.5vw, 60px)',
                color: '#1A2E1A',
                lineHeight: 1.08,
                marginBottom: '24px',
                maxWidth: '720px',
              }}
            >
              Reflection is the skill schools skip hardest.
            </h1>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '540px' }}>
              You can know exactly how budgets work, track every dollar, and still keep making the same choices. That&apos;s not a knowledge problem; it&apos;s a reflection problem.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '540px' }}>
              The Bread Head journal surfaces prompts tied to your real financial activity, not generic advice, but questions based on what you&apos;re actually doing right now.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#E6EDD9',
                background: '#4A5D4A',
                padding: '14px 30px',
                borderRadius: '100px',
                textDecoration: 'none',
              }}
            >
              Get Early Access →
            </a>
          </FadeUp>
        </div>
      </section>

      {/* ── WHY REFLECTION ── */}
      <section style={{ background: '#1A2E1A', position: 'relative', overflow: 'hidden' }}>

        {/* Decorative bread */}
        <div style={{ position: 'absolute', top: '-20px', right: '-20px', opacity: 0.06, pointerEvents: 'none', transform: 'rotate(14deg)' }}>
          <Image src="/assets/bread.png" alt="" width={200} height={200} aria-hidden />
        </div>
        <div style={{ position: 'absolute', bottom: '32px', left: '-12px', opacity: 0.04, pointerEvents: 'none', transform: 'rotate(-10deg)' }}>
          <Image src="/assets/bread.png" alt="" width={130} height={130} aria-hidden />
        </div>

        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D1A945', marginBottom: '16px' }}>
              Why It Matters
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.2vw, 46px)',
                color: '#F5F0E8',
                lineHeight: 1.12,
                marginBottom: '16px',
                maxWidth: '640px',
              }}
            >
              Knowing isn&apos;t enough. Neither is tracking.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.75, maxWidth: '560px', marginBottom: '64px' }}>
              Most financial apps stop at the data. Bread Head goes one step further, because patterns only change when you actually see them for what they are.
            </p>
          </FadeUp>

          <div>
            {WHY.map((item, i) => (
              <FadeUp key={i} delay={i * 0.08}>
                <div
                  className="why-row"
                  style={{
                    paddingTop: '36px',
                    paddingBottom: '36px',
                    borderTop: '1px solid rgba(209,169,69,0.18)',
                    display: 'grid',
                    gridTemplateColumns: '220px 1fr',
                    gap: '48px',
                    alignItems: 'start',
                  }}
                >
                  <div style={{ paddingTop: '2px' }}>
                    <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: '40px', color: '#D1A945', lineHeight: 1, marginBottom: '6px' }}>
                      {item.stat}
                    </p>
                    <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.60)', margin: 0 }}>
                      {item.label}
                    </p>
                  </div>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.75, margin: 0, paddingTop: '4px' }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
            <div style={{ borderTop: '1px solid rgba(209,169,69,0.18)' }} />
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              How It Works
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3vw, 42px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '56px',
                maxWidth: '560px',
              }}
            >
              Two minutes a day. A year of clarity.
            </h2>
          </FadeUp>

          <div
            className="journal-features-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}
          >
            {HOW_IT_WORKS.map((item, i) => (
              <FadeUp key={item.number} delay={i * 0.1} style={{ height: '100%' }}>
                <div
                  className="card-border"
                  style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px 32px', height: '100%', boxSizing: 'border-box' }}
                >
                  <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '36px', color: '#D1A945', lineHeight: 1, marginBottom: '16px' }}>
                    {item.number}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '17px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '12px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOCUS THEMES ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              Focus Themes
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3vw, 42px)',
                color: '#1A2E1A',
                lineHeight: 1.12,
                marginBottom: '16px',
                maxWidth: '580px',
              }}
            >
              Each prompt has a purpose. Each purpose has a theme.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.75, maxWidth: '540px', marginBottom: '64px' }}>
              Journal entries aren&apos;t random. They fall into five focus areas tied to specific moments in your budget. When one of these moments occurs, the journal responds.
            </p>
          </FadeUp>

          <div>
            {THEMES.map((theme, i) => (
              <FadeUp key={theme.number} delay={i * 0.07}>
                <div
                  className="system-row"
                  style={{
                    paddingTop: '32px',
                    paddingBottom: '32px',
                    borderTop: '1px solid rgba(26,46,26,0.10)',
                    display: 'grid',
                    gridTemplateColumns: '56px 260px 1fr',
                    gap: '32px',
                    alignItems: 'start',
                  }}
                >
                  <span style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontWeight: 700, fontSize: '28px', color: '#D1A945', lineHeight: 1, paddingTop: '2px' }}>
                    {theme.number}
                  </span>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '16px', color: '#1A2E1A', lineHeight: 1.35, margin: 0, paddingTop: '3px' }}>
                    {theme.name}
                  </p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.75, margin: 0 }}>
                    {theme.description}
                  </p>
                </div>
              </FadeUp>
            ))}
            <div style={{ borderTop: '1px solid rgba(26,46,26,0.10)' }} />
          </div>
        </div>
      </section>

      {/* ── EXAMPLE PROMPTS ── */}
      <section style={{ background: '#1A2E1A' }}>
        <div
          style={{
            maxWidth: '1100px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#D1A945', marginBottom: '16px' }}>
              Example Prompts
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.2vw, 46px)',
                color: '#F5F0E8',
                lineHeight: 1.12,
                marginBottom: '16px',
                maxWidth: '600px',
              }}
            >
              Questions that come from your data, not a template.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(245,240,232,0.55)', lineHeight: 1.75, maxWidth: '540px', marginBottom: '64px' }}>
              Prompts surface based on what&apos;s actually happened in your budget: a pattern, a warning, a strong week, or a month closed out. You never answer a question about something that didn&apos;t happen to you.
            </p>
          </FadeUp>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {PROMPTS.map((p, i) => (
              <FadeUp key={i} delay={i * 0.07}>
                <div
                  className="prompt-row"
                  style={{
                    paddingTop: '32px',
                    paddingBottom: '32px',
                    borderTop: '1px solid rgba(245,240,232,0.08)',
                    display: 'grid',
                    gridTemplateColumns: '200px 1fr',
                    gap: '48px',
                    alignItems: 'start',
                  }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.60)', margin: 0, paddingTop: '3px' }}>
                    {p.context}
                  </p>
                  <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: 'clamp(15px, 1.4vw, 18px)', color: 'rgba(245,240,232,0.80)', lineHeight: 1.6, margin: 0 }}>
                    &ldquo;{p.prompt}&rdquo;
                  </p>
                </div>
              </FadeUp>
            ))}
            <div style={{ borderTop: '1px solid rgba(245,240,232,0.08)' }} />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            paddingTop: '96px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
            textAlign: 'center',
          }}
        >
          <FadeUp delay={0}>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(26px, 3.5vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Your money story, in your own words.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.7, marginBottom: '12px' }}>
              The journal doesn&apos;t track your net worth. It tracks how you think and feel about money, which is where every financial decision actually starts.
            </p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.7, marginBottom: '36px' }}>
              Two minutes. One honest answer. Every time you use it, it gets more useful.
            </p>
            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: 'var(--font-body)',
                fontWeight: 700,
                fontSize: '15px',
                color: '#E6EDD9',
                background: '#4A5D4A',
                padding: '14px 32px',
                borderRadius: '100px',
                textDecoration: 'none',
              }}
            >
              Get Early Access →
            </a>
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
