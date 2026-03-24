import type { Metadata } from 'next'
import Image from 'next/image'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import LessonDemo from './LessonDemo'

export const metadata: Metadata = {
  title: 'Lessons — Bread Head',
  description: 'Bite-sized financial lessons built for discovery. Tap through slides, answer to unlock, and understand the why behind every right and wrong answer.',
}

const APPROACH = [
  {
    number: '01',
    title: 'Tap through like stories.',
    body: "Short slides. One idea at a time. No walls of text, no 45-minute videos. Each lesson is a conversation — not a lecture.",
  },
  {
    number: '02',
    title: 'Answer to unlock the next slide.',
    body: "Key concepts are gated behind a question. You can't skim past what matters. You have to engage with it.",
  },
  {
    number: '03',
    title: 'Wrong answers teach too.',
    body: "Hit the wrong option? You'll see exactly why it's wrong — and exactly why the right answer is right. Not just a checkmark. An explanation.",
  },
]

const UNITS = [
  {
    number: '01', topic: 'Introduction to Personal Finance',
    lessons: ['What is personal finance?', 'Why does it matter?', 'Start Early', 'What it looks like for you', 'Course Overview'],
  },
  {
    number: '02', topic: 'Income and Career Planning',
    lessons: ['What is Income?', 'Types of Income', 'Earned vs. Unearned Income', 'Active Income', 'Passive Income', 'Side Hustles', 'Self-Employment', 'Entrepreneurship', 'Jobs vs. Careers', 'Hourly vs. Salary Pay', 'Minimum Wage and Worker Rights', 'How to Read a Pay Stub', 'Employee Benefits', 'Education and Experience', 'Skill Building and Networking', 'Internships & First Jobs', 'Negotiating Pay and Growth'],
  },
  {
    number: '03', topic: 'Budgeting',
    lessons: ['What is a budget?', 'Why budget?', 'Needs vs. Wants', 'Debt, Savings, and Loans', 'Budgeting Methods', '50/30/20 Rule', 'The Envelope Method', 'Building Your Own Budget', 'Budgeting Tools & Apps', 'Goals, Sticking to It, Adjusting'],
  },
  {
    number: '04', topic: 'Credit and Loans',
    lessons: ['What is credit?', 'Credit Cards vs. Debit Cards', 'Credit Scores: What, Why, and How', 'Building Credit Safely', 'Interest, APR, and Debt Traps', 'Borrowing Smart', 'Installment Loans', 'How Loans Work', 'Interest and Amortization', 'Loan Terms & Down Payments', 'Principal vs. Interest Payments', 'Renting vs. Buying a Home', 'Mortgages', 'Escrow, APR, and Closing Costs', 'Student Loans', 'FAFSA, Interest, and Repayment Options', 'Buying vs. Leasing a Car', 'Budgeting for Big Purchases', 'Utility Bills, Leases, and Responsibilities'],
  },
  {
    number: '05', topic: 'Saving',
    lessons: ['Why Save?', 'Emergency Fund vs. Goal-Based Saving', 'How Much to Save', 'Savings Accounts & Interest', 'Compound Interest', 'Saving Habits & Mindset', 'Retirement Savings', '401k and Roth IRA'],
  },
  {
    number: '06', topic: 'Investing',
    lessons: ['What is Investing?', 'Risk vs. Reward', 'Stocks, Bonds, Index Funds, and ETFs', 'Time Horizon and Compound Growth', 'Diversification', 'Investing Apps and Getting Started'],
  },
  {
    number: '07', topic: 'Insurance',
    lessons: ['What is Insurance?', 'Why Insurance Matters', 'Health and Life Insurance', 'Auto and Renters Insurance', 'Premiums', 'Deductibles', 'Claims', 'Understanding Policies', 'Disputing Claims', 'When Teens Should Care', 'Auto Loans Require Car Insurance', 'Mortgages Require Homeowners\' Insurance'],
  },
  {
    number: '08', topic: 'Taxes',
    lessons: ['What Are Taxes and Why Do We Pay Them?', 'Types of Taxes: Income, Sales, Property', 'How Jobs Are Taxed', 'W-2s, 1099s, and Pay Stubs', 'Filing Basics for Teens', 'Deductions, Refunds, and Withholdings'],
  },
  {
    number: '09', topic: 'Other Topics',
    lessons: ['Banking Basics', 'Avoiding Financial Scams', 'Buying a Car', 'Renting an Apartment', 'Understanding Utility Bills', 'Big Financial Decisions'],
  },
  {
    number: '10', topic: 'Next Steps and Reflection',
    lessons: ['Putting It All Together', 'Setting Financial Goals', 'Reflection & Action Plan', 'Avoiding Common Mistakes', 'Planning Your Financial Future', 'Where to Go Next: Books, Apps, Mentors'],
  },
]

export default function LessonsPage() {
  return (
    <main>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9', overflow: 'hidden' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '160px',
            paddingBottom: '96px',
            paddingLeft: '24px',
            paddingRight: '24px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '64px',
            alignItems: 'center',
          }}
          className="lessons-hero-grid"
        >
          {/* Left: copy */}
          <FadeUp delay={0}>
            <div>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
                The Curriculum
              </p>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  fontSize: 'clamp(32px, 4vw, 56px)',
                  color: '#1A2E1A',
                  lineHeight: 1.1,
                  marginBottom: '24px',
                }}
              >
                Not just a course.
              </h1>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '16px', maxWidth: '480px' }}>
                Bread Head teaches personal finance the way you actually learn — by doing, not by reading.
                Tap through bite-sized slides, answer to move forward, and understand exactly why you got it right or wrong.
              </p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '17px', color: 'rgba(26,46,26,0.65)', lineHeight: 1.75, marginBottom: '40px', maxWidth: '480px' }}>
                10 units. 8–15 lessons each. 3–5 minutes per lesson.
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
            </div>
          </FadeUp>

          {/* Right: phone mockup */}
          <FadeUp delay={0.15}>
            <div className="lessons-hero-phone" style={{ display: 'flex', justifyContent: 'center' }}>
              <div
                style={{
                  width: '280px',
                  borderRadius: '40px',
                  aspectRatio: '9/19.5',
                  border: '7px solid #1A2E1A',
                  background: '#111D11',
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 40px 100px rgba(0,0,0,0.40)',
                }}
              >
                {/* Notch */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '24px', background: '#111D11', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '64px', height: '5px', borderRadius: '3px', background: '#000' }} />
                </div>
                <div style={{ position: 'absolute', inset: 0, top: '24px' }}>
                  <Image
                    src="/assets/lesson_home_screen.png"
                    alt="Bread Head lesson in progress"
                    fill
                    style={{ objectFit: 'cover', objectPosition: 'top' }}
                    sizes="280px"
                    quality={90}
                    priority
                  />
                </div>
              </div>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── APPROACH ──────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1200px',
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
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '48px',
                maxWidth: '560px',
              }}
            >
              Learning by discovering, not by being told.
            </h2>
          </FadeUp>

          <div
            className="lessons-approach-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}
          >
            {APPROACH.map((item, i) => (
              <FadeUp key={item.number} delay={i * 0.1}>
                <div
                  className="card-border card-hover"
                  style={{ background: '#FFFFFF', borderRadius: '20px', padding: '36px 32px' }}
                >
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '28px', color: 'rgba(26,46,26,0.08)', lineHeight: 1, marginBottom: '20px' }}>
                    {item.number}
                  </p>
                  <h3 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '18px', color: '#1A2E1A', lineHeight: 1.3, marginBottom: '12px' }}>
                    {item.title}
                  </h3>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.60)', lineHeight: 1.7, margin: 0 }}>
                    {item.body}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ──────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <div style={{ textAlign: 'center', marginBottom: '48px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '12px' }}>
                Try It
              </p>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: 'clamp(24px, 3vw, 38px)',
                  color: '#1A2E1A',
                  lineHeight: 1.15,
                  marginBottom: '12px',
                }}
              >
                A real lesson. Right now.
              </h2>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.55)', lineHeight: 1.65 }}>
                This is 3 slides from Unit 02. Tap through, answer the question, and see how it feels.
              </p>
            </div>
          </FadeUp>

          <LessonDemo />
        </div>
      </section>

      {/* ── CURRICULUM ────────────────────────────────────────────── */}
      <section style={{ background: '#FFFFFF' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            paddingTop: '80px',
            paddingBottom: '80px',
            paddingLeft: '24px',
            paddingRight: '24px',
          }}
        >
          <FadeUp delay={0}>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.13em', textTransform: 'uppercase', color: '#4A5D4A', marginBottom: '16px' }}>
              10 Units
            </p>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: 'clamp(26px, 3vw, 40px)',
                color: '#1A2E1A',
                lineHeight: 1.15,
                marginBottom: '8px',
              }}
            >
              Everything you actually need to know.
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(26,46,26,0.55)', marginBottom: '48px' }}>
              8–15 lessons per unit · 3–5 min each · built around real decisions
            </p>
          </FadeUp>

          <div
            className="lessons-units-grid"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2px', background: 'rgba(26,46,26,0.07)', borderRadius: '20px', overflow: 'hidden' }}
          >
            {UNITS.map((unit, i) => (
              <FadeUp key={unit.number} delay={Math.floor(i / 2) * 0.06}>
                <div
                  style={{
                    background: '#FFFFFF',
                    padding: '32px',
                    height: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* Header row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-body)',
                        fontWeight: 700,
                        fontSize: '11px',
                        letterSpacing: '0.10em',
                        textTransform: 'uppercase',
                        color: '#4A5D4A',
                        background: 'rgba(74,93,74,0.10)',
                        borderRadius: '100px',
                        padding: '4px 12px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      Unit {unit.number}
                    </span>
                    <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '15px', color: '#1A2E1A', margin: 0, lineHeight: 1.3 }}>
                      {unit.topic}
                    </p>
                  </div>
                  {/* Lesson list */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {unit.lessons.map((lesson) => (
                      <span
                        key={lesson}
                        style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '12px',
                          color: 'rgba(26,46,26,0.55)',
                          background: 'rgba(26,46,26,0.05)',
                          borderRadius: '6px',
                          padding: '3px 9px',
                          lineHeight: 1.6,
                        }}
                      >
                        {lesson}
                      </span>
                    ))}
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section style={{ background: '#1A2E1A' }}>
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
                fontSize: 'clamp(26px, 3.5vw, 42px)',
                color: '#E6EDD9',
                lineHeight: 1.2,
                marginBottom: '16px',
              }}
            >
              Ready to actually learn this stuff?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.60)', lineHeight: 1.7, marginBottom: '36px' }}>
              Bread Head is free to start. No credit card, no commitment.
              Just 10 units of financial education built for real life.
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
                color: '#1A2E1A',
                background: '#D1A945',
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
