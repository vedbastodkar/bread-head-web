'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const UNITS = [
  {
    number: '01',
    topic: 'Introduction to Personal Finance',
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

export default function CurriculumAccordion() {
  const [open, setOpen] = useState<Set<string>>(new Set(['01']))

  const toggle = (num: string) =>
    setOpen(prev => {
      const next = new Set(prev)
      next.has(num) ? next.delete(num) : next.add(num)
      return next
    })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {UNITS.map((unit) => {
        const isOpen = open.has(unit.number)
        return (
          <div
            key={unit.number}
            className="card-border"
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              overflow: 'hidden',
            }}
          >
            {/* ── Header / trigger ── */}
            <button
              onClick={() => toggle(unit.number)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '28px 36px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Ghost number */}
              <span
                aria-hidden
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontFamily: 'var(--font-display)',
                  fontWeight: 700,
                  fontSize: '88px',
                  color: isOpen ? 'rgba(74,93,74,0.07)' : 'rgba(26,46,26,0.04)',
                  lineHeight: 1,
                  letterSpacing: '-0.04em',
                  userSelect: 'none',
                  pointerEvents: 'none',
                  transition: 'color 0.2s ease',
                }}
              >
                {unit.number}
              </span>

              {/* Content — offset past ghost */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, paddingLeft: '72px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: isOpen ? '#4A5D4A' : 'rgba(26,46,26,0.40)',
                    background: isOpen ? 'rgba(74,93,74,0.10)' : 'rgba(26,46,26,0.05)',
                    borderRadius: '100px',
                    padding: '4px 12px',
                    flexShrink: 0,
                    transition: 'color 0.2s, background 0.2s',
                  }}
                >
                  Unit {unit.number}
                </span>

                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontStyle: 'italic',
                    fontSize: 'clamp(17px, 1.8vw, 24px)',
                    color: isOpen ? '#1A2E1A' : 'rgba(26,46,26,0.70)',
                    lineHeight: 1.2,
                    margin: 0,
                    flex: 1,
                    transition: 'color 0.2s',
                  }}
                >
                  {unit.topic}
                </h3>
              </div>

              {/* Right: count + chevron */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: 'rgba(26,46,26,0.35)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {unit.lessons.length} lessons
                </span>
                <motion.svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ flexShrink: 0 }}
                >
                  <path d="M3 6l5 5 5-5" stroke="rgba(26,46,26,0.40)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </motion.svg>
              </div>
            </button>

            {/* ── Expanded lesson list ── */}
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.26, ease: [0.25, 0.1, 0.25, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ borderTop: '1px solid rgba(26,46,26,0.07)' }}>
                    <div
                      className="unit-lessons-grid"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '2px',
                        background: 'rgba(26,46,26,0.05)',
                      }}
                    >
                      {unit.lessons.map((lesson, i) => (
                        <div
                          key={lesson}
                          style={{
                            background: '#FAFCF8',
                            padding: '14px 20px',
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: '10px',
                          }}
                        >
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontWeight: 700,
                              fontSize: '11px',
                              color: '#4A5D4A',
                              flexShrink: 0,
                              minWidth: '20px',
                              lineHeight: 1.6,
                            }}
                          >
                            {i + 1}.
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-body)',
                              fontSize: '13px',
                              color: 'rgba(26,46,26,0.70)',
                              lineHeight: 1.55,
                            }}
                          >
                            {lesson}
                          </span>
                        </div>
                      ))}
                    </div>
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
