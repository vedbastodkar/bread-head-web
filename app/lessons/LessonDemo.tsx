'use client'

import { useState } from 'react'

// ── Sample lesson: Unit 02, Slide set ─────────────────────────────
const SLIDES = [
  {
    type: 'content' as const,
    unit: 'Unit 02 · Income',
    title: 'Your first paycheck.',
    body: "You worked 40 hours at $12/hr. That's $480 earned. But when the money hits your bank account, you see $398.\n\nNot $480.",
    cta: 'Tap to continue →',
  },
  {
    type: 'question' as const,
    unit: 'Unit 02 · Income',
    question: 'What happened to the other $82?',
    options: [
      {
        id: 'a',
        text: 'Your employer docked your pay.',
        correct: false,
        wrongWhy: "Employers can't legally reduce wages you already earned. What came out wasn't a penalty; it was required by law, and it goes to the government, not your employer.",
      },
      {
        id: 'b',
        text: 'Taxes and deductions were withheld.',
        correct: true,
        rightWhy: "Federal income tax, Social Security (6.2%), and Medicare (1.45%) are taken out before you see a cent. This is called withholding; it's automatic on every paycheck, and your employer sends it straight to the IRS on your behalf.",
      },
      {
        id: 'c',
        text: 'The bank charged fees.',
        correct: false,
        wrongWhy: "Banks don't intercept your paycheck. Your direct deposit arrives after payroll withholding; fees can hit your balance later, but they're not what caused this gap.",
      },
      {
        id: 'd',
        text: 'It was a payroll error.',
        correct: false,
        wrongWhy: "This is exactly how every paycheck is supposed to work. If it's your first one, the gap feels like a mistake, but it isn't. Every W-2 employee sees this.",
      },
    ],
  },
  {
    type: 'content' as const,
    unit: 'Unit 02 · Income',
    title: "That's withholding.",
    body: "Every paycheck, your employer sends a portion of your earnings directly to the government, before you touch it.\n\nFederal tax. State tax. Social Security. Medicare.\n\nThis is why gross pay and net pay are always different numbers.",
    cta: null,
    last: true,
  },
] as const

type AnySlide = (typeof SLIDES)[number]
type QuestionSlide = Extract<AnySlide, { type: 'question' }>

// ── Option button states ────────────────────────────────────────────
type OptionState = 'idle' | 'wrong' | 'correct'

function optionStyle(state: OptionState, answered: boolean): React.CSSProperties {
  const base: React.CSSProperties = {
    width: '100%',
    textAlign: 'left',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    fontSize: '15px',
    lineHeight: 1.5,
    borderRadius: '12px',
    padding: '14px 16px',
    border: '1.5px solid',
    cursor: answered ? 'default' : 'pointer',
    transition: 'background 0.15s, border-color 0.15s',
    background: 'transparent',
  }

  if (state === 'correct') {
    return { ...base, borderColor: '#5A9A5A', background: 'rgba(90,154,90,0.15)', color: '#A8D4A8' }
  }
  if (state === 'wrong') {
    return { ...base, borderColor: 'rgba(200,80,80,0.6)', background: 'rgba(200,80,80,0.10)', color: 'rgba(230,237,217,0.6)' }
  }
  if (answered) {
    return { ...base, borderColor: 'rgba(230,237,217,0.08)', color: 'rgba(230,237,217,0.30)' }
  }
  return { ...base, borderColor: 'rgba(230,237,217,0.18)', color: 'rgba(230,237,217,0.85)' }
}

// ── Demo shell ──────────────────────────────────────────────────────
export default function LessonDemo() {
  const [idx, setIdx]         = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [answered, setAnswered] = useState(false)
  const [done, setDone]       = useState(false)

  const slide = SLIDES[idx]
  const total = SLIDES.length

  const advance = () => {
    if (idx < total - 1) {
      setIdx(i => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      setDone(true)
    }
  }

  const pick = (id: string) => {
    if (answered) return
    setSelected(id)
    setAnswered(true)
  }

  const currentQ = slide.type === 'question' ? (slide as QuestionSlide) : null
  const selectedOpt = currentQ?.options.find(o => o.id === selected) ?? null
  const isCorrect = selectedOpt?.correct ?? false

  // ── Shell container ─────────────────────────────────────────────
  const shell: React.CSSProperties = {
    background: '#111D11',
    borderRadius: '24px',
    border: '1px solid rgba(230,237,217,0.10)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
    overflow: 'hidden',
    maxWidth: '480px',
    width: '100%',
    margin: '0 auto',
    minHeight: '520px',
    display: 'flex',
    flexDirection: 'column',
  }

  // ── Completed state ────────────────────────────────────────────
  if (done) {
    return (
      <div style={shell}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 32px', textAlign: 'center', gap: '16px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>✓</div>
          <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '20px', color: '#E6EDD9', margin: 0 }}>
            Lesson complete.
          </p>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'rgba(230,237,217,0.55)', lineHeight: 1.6, margin: 0, maxWidth: '300px' }}>
            That was one slide set from Unit 02. The full unit has 12 lessons like this one.
          </p>
          <button
            onClick={() => { setIdx(0); setSelected(null); setAnswered(false); setDone(false) }}
            style={{
              marginTop: '16px',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '14px',
              color: '#111D11',
              background: '#D1A945',
              border: 'none',
              borderRadius: '100px',
              padding: '12px 24px',
              cursor: 'pointer',
            }}
          >
            Try again →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={shell}>

      {/* ── Progress bar ── */}
      <div style={{ padding: '16px 20px 0', display: 'flex', gap: '4px' }}>
        {SLIDES.map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: '3px',
              borderRadius: '2px',
              background: i < idx
                ? 'rgba(230,237,217,0.7)'
                : i === idx
                  ? '#D1A945'
                  : 'rgba(230,237,217,0.18)',
            }}
          />
        ))}
      </div>

      {/* ── Unit label ── */}
      <div style={{ padding: '12px 20px 0' }}>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(230,237,217,0.40)' }}>
          {slide.unit}
        </span>
      </div>

      {/* ── Slide content ── */}
      <div style={{ flex: 1, padding: '24px 24px 20px', display: 'flex', flexDirection: 'column' }}>

        {slide.type === 'content' && (
          <>
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '26px', color: '#E6EDD9', lineHeight: 1.2, marginBottom: '20px' }}>
              {slide.title}
            </h3>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '16px', color: 'rgba(230,237,217,0.72)', lineHeight: 1.75, flex: 1, whiteSpace: 'pre-line' }}>
              {slide.body}
            </p>
            {'last' in slide && slide.last ? (
              <div style={{ marginTop: '28px', padding: '16px', background: 'rgba(209,169,69,0.10)', borderRadius: '12px', border: '1px solid rgba(209,169,69,0.20)' }}>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '13px', color: '#D1A945', margin: 0 }}>
                  Unit 02 has 12 lessons like this one.
                </p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(230,237,217,0.50)', margin: '4px 0 0' }}>
                  Each one 3–5 minutes. Tap through, answer to unlock.
                </p>
              </div>
            ) : (
              <button
                onClick={advance}
                style={{
                  marginTop: '28px',
                  width: '100%',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '15px',
                  color: '#E6EDD9',
                  background: 'rgba(230,237,217,0.08)',
                  border: '1.5px solid rgba(230,237,217,0.16)',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {slide.cta}
              </button>
            )}
            {'last' in slide && slide.last && (
              <button
                onClick={advance}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#111D11',
                  background: '#D1A945',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                Finish lesson →
              </button>
            )}
          </>
        )}

        {slide.type === 'question' && currentQ && (
          <>
            <p style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(230,237,217,0.35)', marginBottom: '10px' }}>
              Question
            </p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', fontSize: '22px', color: '#E6EDD9', lineHeight: 1.3, marginBottom: '24px' }}>
              {currentQ.question}
            </h3>

            {/* Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
              {currentQ.options.map((opt) => {
                const state: OptionState =
                  selected === opt.id
                    ? opt.correct ? 'correct' : 'wrong'
                    : 'idle'

                return (
                  <div key={opt.id}>
                    <button
                      onClick={() => pick(opt.id)}
                      style={optionStyle(state, answered)}
                    >
                      {opt.text}
                    </button>

                    {/* Explanation — only shown for selected option */}
                    {selected === opt.id && answered && (
                      <div
                        style={{
                          marginTop: '6px',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          background: opt.correct
                            ? 'rgba(90,154,90,0.10)'
                            : 'rgba(200,80,80,0.08)',
                          border: `1px solid ${opt.correct ? 'rgba(90,154,90,0.25)' : 'rgba(200,80,80,0.20)'}`,
                        }}
                      >
                        <p style={{
                          fontFamily: 'var(--font-body)',
                          fontSize: '13px',
                          lineHeight: 1.65,
                          color: opt.correct ? '#A8D4A8' : 'rgba(230,130,130,0.90)',
                          margin: 0,
                        }}>
                          {opt.correct
                            ? (opt as Extract<typeof opt, { correct: true }>).rightWhy
                            : (opt as Extract<typeof opt, { correct: false }>).wrongWhy}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Continue — only when correct */}
            {answered && isCorrect && (
              <button
                onClick={advance}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 700,
                  fontSize: '15px',
                  color: '#111D11',
                  background: '#D1A945',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '14px',
                  cursor: 'pointer',
                }}
              >
                Continue →
              </button>
            )}

            {/* Hint — wrong answer */}
            {answered && !isCorrect && (
              <p style={{ fontFamily: 'var(--font-body)', fontSize: '13px', color: 'rgba(230,237,217,0.35)', marginTop: '12px', textAlign: 'center' }}>
                Not quite. Try again to move forward.
              </p>
            )}
          </>
        )}

      </div>
    </div>
  )
}
