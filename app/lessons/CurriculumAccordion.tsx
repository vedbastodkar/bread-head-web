'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── SVG helpers ─────────────────────────────────────────────────────

function LessonCircle({ n }: { n: number }) {
  const small = n >= 10
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden style={{ flexShrink: 0 }}>
      <circle cx="13" cy="13" r="11.5" stroke="#4A5D4A" strokeWidth="1.25"/>
      <text
        x="13" y={small ? "17.5" : "17.5"}
        textAnchor="middle"
        fill="#4A5D4A"
        fontSize={small ? "8.5" : "10"}
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600"
        letterSpacing="-0.02em"
      >
        {n}
      </text>
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden style={{ flexShrink: 0, opacity: 0.22 }}>
      <path d="M4.5 2.5l4 4-4 4" stroke="#1A2E1A" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ── Data ─────────────────────────────────────────────────────────────

const UNITS = [
  {
    number: '01',
    topic: 'Introduction to Personal Finance',
    tag: 'Foundation',
    lessons: [
      'What is Personal Finance?',
      'Why Personal Finance Matters',
      'Why Start Early?',
      'What it Looks Like for You',
      'Course Overview',
    ],
  },
  {
    number: '02',
    topic: 'Income and Career Planning',
    tag: 'Earning',
    lessons: [
      'What is Income?',
      'Types of Income',
      'Earned vs. Unearned Income',
      'Active Income',
      'Passive Income',
      'Side Hustles',
      'Self-Employment',
      'Entrepreneurship',
      'Jobs vs. Careers',
      'Hourly vs. Salary Pay',
      'Minimum Wage and Worker Rights',
      'How to Read a Pay Stub',
      'Employee Benefits',
      'Education and Experience',
      'Skill Building and Networking',
      'Internships & First Jobs',
      'Negotiating Pay and Growth',
    ],
  },
  {
    number: '03',
    topic: 'Budgeting',
    tag: 'Spending',
    lessons: [
      'What is a Budget?',
      'Why Budget?',
      'Needs vs. Wants',
      'Debt, Savings, and Loans',
      'Budgeting Methods',
      'The 50/30/20 Rule',
      'The Envelope Method',
      'Building Your Own Budget',
      'Budgeting Tools & Apps',
      'Goals, Sticking to It, and Adjusting',
    ],
  },
  {
    number: '04',
    topic: 'Credit and Loans',
    tag: 'Borrowing',
    lessons: [
      'What is Credit?',
      'Credit Cards vs. Debit Cards',
      'Credit Scores: What, Why, and How',
      'Building Credit Safely',
      'Interest, APR, and Debt Traps',
      'Borrowing Smart',
      'Buy Now, Pay Later',
      'Installment Loans',
      'How Loans Work',
      'Interest and Amortization',
      'Loan Terms & Down Payments',
      'Principal vs. Interest Payments',
      'Renting vs. Buying a Home',
      'Mortgages',
      'Escrow, APR, and Closing Costs',
      'Student Loans',
      'FAFSA, Interest, and Repayment Options',
      'Buying vs. Leasing a Car',
      'Budgeting for Big Purchases',
      'Utility Bills, Leases, and Responsibilities',
    ],
  },
  {
    number: '05',
    topic: 'Saving',
    tag: 'Saving',
    lessons: [
      'Why Save?',
      'Emergency Fund vs. Goal-Based Saving',
      'How Much to Save',
      'Savings Accounts & Interest',
      'Compound Interest',
      'Saving Habits & Mindset',
      'Retirement Savings Overview',
      '401(k)',
      'Roth IRA',
      'HSA and Less Common Account Types',
    ],
  },
  {
    number: '06',
    topic: 'Investing',
    tag: 'Growing',
    lessons: [
      'What is Investing?',
      'Risk vs. Reward',
      'Stocks, Bonds, Index Funds, and ETFs',
      'Time Horizon and Compound Growth',
      'Diversification',
      'Investing Apps and Getting Started',
    ],
  },
  {
    number: '07',
    topic: 'Insurance',
    tag: 'Protection',
    lessons: [
      'What is Insurance?',
      'Why Insurance Matters',
      'Health Insurance',
      'Life Insurance',
      'Auto Insurance',
      'Renters Insurance',
      'Premiums',
      'Deductibles',
      'Claims',
      'Understanding Policies',
      'Disputing Claims',
      'When Teens Should Care',
      'Auto Loans Require Car Insurance',
      "Mortgages Require Homeowners' Insurance",
    ],
  },
  {
    number: '08',
    topic: 'Taxes',
    tag: 'Taxes',
    lessons: [
      'What Are Taxes and Why Do We Pay Them?',
      'Types of Taxes: Income',
      'Sales and Property Taxes',
      'How Jobs Are Taxed',
      'W-2s, 1099s, and Pay Stubs',
      'Deductions',
      'Withholdings',
      'Refunds',
      'Filing Basics for Teens',
    ],
  },
  {
    number: '09',
    topic: 'Other Topics',
    tag: 'Real Life',
    lessons: [
      'Financial Scams and Fraud',
      'Phishing and Fake Scholarships',
      'Investment Scams and Identity Theft',
      'What to Do if You Are a Victim',
      'Banking Basics: Checking vs. Savings',
      'Overdraft Fees',
      'How to Choose a Bank or Credit Union',
      'Digital Money: Venmo and CashApp Safety',
      'Digital Wallets and Wire Transfers',
      'Financial Conversations',
      'Talking About Money with Family',
      'Splitting Costs with Roommates',
      'International and Immigrant Money Topics',
      'Financial Mental Health',
      'Money Anxiety and Financial Trauma',
      'Lifestyle Inflation and the Psychology of Spending',
      'Negotiating Pay and Services',
      'Giving, Values, and Charitable Giving',
    ],
  },
  {
    number: '10',
    topic: 'Next Steps and Reflection',
    tag: 'Reflection',
    lessons: [
      'Putting It All Together',
      'Setting Financial Goals',
      'Reflection & Action Plan',
      'Avoiding Common Mistakes',
      'Planning Your Financial Future',
      'Where to Go Next: Books, Apps, and Mentors',
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────

export default function CurriculumAccordion() {
  const [open, setOpen] = useState<Set<string>>(new Set(['01']))

  const toggle = (num: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      return next
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {UNITS.map((unit) => {
        const isOpen = open.has(unit.number)

        return (
          <div
            key={unit.number}
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
              border: isOpen
                ? '1px solid rgba(74,93,74,0.30)'
                : '1px solid rgba(26,46,26,0.10)',
              boxShadow: isOpen
                ? '0 8px 32px rgba(26,46,26,0.08)'
                : 'none',
              transition: 'border-color 0.2s ease, box-shadow 0.25s ease',
            }}
          >

            {/* ── Trigger ── */}
            <button
              onClick={() => toggle(unit.number)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'stretch',
                background: isOpen ? '#FAFCF8' : '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background 0.2s ease',
                textAlign: 'left',
              }}
            >
              {/* Chapter number gutter */}
              <div
                style={{
                  width: '88px',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: `2px solid ${isOpen ? 'rgba(74,93,74,0.18)' : 'rgba(26,46,26,0.07)'}`,
                  transition: 'border-color 0.2s ease',
                  padding: '24px 0',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontWeight: 700,
                    fontSize: '42px',
                    color: isOpen ? '#4A5D4A' : 'rgba(26,46,26,0.22)',
                    lineHeight: 1,
                    letterSpacing: '-0.03em',
                    transition: 'color 0.2s ease',
                    userSelect: 'none',
                  }}
                >
                  {unit.number}
                </span>
              </div>

              {/* Title area */}
              <div
                style={{
                  flex: 1,
                  padding: '22px 24px 22px 28px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  gap: '5px',
                  minWidth: 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.13em',
                      textTransform: 'uppercase',
                      color: isOpen ? '#D1A945' : '#4A5D4A',
                      background: isOpen ? 'rgba(209,169,69,0.12)' : 'rgba(74,93,74,0.10)',
                      borderRadius: '100px',
                      padding: '3px 10px',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {unit.tag}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '12px',
                      color: 'rgba(26,46,26,0.30)',
                    }}
                  >
                    {unit.lessons.length} lessons
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(16px, 1.6vw, 22px)',
                    color: isOpen ? '#1A2E1A' : 'rgba(26,46,26,0.65)',
                    lineHeight: 1.2,
                    margin: 0,
                    transition: 'color 0.2s ease',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {unit.topic}
                </h3>
              </div>

              {/* Chevron */}
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  paddingRight: '28px',
                }}
              >
                <motion.svg
                  width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                >
                  <path
                    d="M3.5 6.5l5.5 5.5 5.5-5.5"
                    stroke={isOpen ? '#4A5D4A' : 'rgba(26,46,26,0.30)'}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
              </div>
            </button>

            {/* ── Expanded lesson list ── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  {/* Separator */}
                  <div style={{ height: '1px', background: 'rgba(74,93,74,0.12)', marginLeft: '88px' }} />

                  {/* 2-col grid of lesson rows */}
                  <div
                    className="curriculum-lesson-grid"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      background: 'rgba(26,46,26,0.04)',
                      gap: '1px',
                    }}
                  >
                    {unit.lessons.map((lesson, i) => (
                      <LessonRow key={lesson} lesson={lesson} index={i} />
                    ))}

                    {/* If odd number of lessons, fill last cell */}
                    {unit.lessons.length % 2 !== 0 && (
                      <div style={{ background: '#FAFCF8' }} />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        )
      })}
    </div>
  )
}

// ── Individual lesson row (separate component for hover state) ──────

function LessonRow({ lesson, index }: { lesson: string; index: number }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#F0F5ED' : '#FAFCF8',
        padding: '13px 20px 13px 22px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        transition: 'background 0.14s ease',
        cursor: 'default',
      }}
    >
      <LessonCircle n={index + 1} />
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13.5px',
          color: hovered ? '#1A2E1A' : 'rgba(26,46,26,0.70)',
          lineHeight: 1.45,
          flex: 1,
          transition: 'color 0.14s ease',
        }}
      >
        {lesson}
      </span>
      <ArrowRight />
    </div>
  )
}
