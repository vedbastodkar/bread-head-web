// app/support/SupportForm.tsx
'use client'

import { useState } from 'react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#FFFFFF',
  border: '0.5px solid rgba(26,46,26,0.15)',
  borderRadius: '10px',
  padding: '12px 16px',
  fontFamily: 'var(--font-body)',
  fontWeight: 400,
  fontSize: '16px',
  color: '#1A2E1A',
  boxSizing: 'border-box',
  outline: 'none',
  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  fontSize: '13px',
  color: '#1A2E1A',
  marginBottom: '8px',
}

type FieldEl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

function onFocus(e: React.FocusEvent<FieldEl>) {
  e.currentTarget.style.borderColor = '#4A5D4A'
  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(74,93,74,0.12)'
}
function onBlur(e: React.FocusEvent<FieldEl>) {
  e.currentTarget.style.borderColor = 'rgba(26,46,26,0.15)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function SupportForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const form = e.currentTarget
    const data = Object.fromEntries(new FormData(form))
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
    } catch {}
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div className="card-border" style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px' }}>
      <form onSubmit={handleSubmit} noValidate>

        {/* Name */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="name" style={labelStyle}>Name *</label>
          <input
            id="name" name="name" type="text" required autoComplete="name"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur}
          />
        </div>

        {/* Email */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="email" style={labelStyle}>Email *</label>
          <input
            id="email" name="email" type="email" required autoComplete="email"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur}
          />
        </div>

        {/* Subject dropdown */}
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <label htmlFor="subject" style={labelStyle}>Subject *</label>
          <div style={{ position: 'relative' }}>
            <select
              id="subject" name="subject" required
              style={{ ...inputStyle, appearance: 'none', paddingRight: '40px', cursor: 'pointer' }}
              onFocus={onFocus} onBlur={onBlur}
            >
              <option value="">Select one…</option>
              <option value="general">General Question</option>
              <option value="reach_out">Want to Reach Out</option>
              <option value="feedback">Feedback</option>
              <option value="bug">Report App Bug</option>
              <option value="media">Media / Press</option>
              <option value="other">Other</option>
            </select>
            <span
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: 'rgba(26,46,26,0.4)',
                fontSize: '11px',
              }}
            >
              ▾
            </span>
          </div>
        </div>

        {/* Message */}
        <div style={{ marginBottom: '0' }}>
          <label htmlFor="message" style={labelStyle}>
            Message{' '}
            <span style={{ fontWeight: 400, color: 'rgba(26,46,26,0.4)' }}>(optional)</span>
          </label>
          <textarea
            id="message" name="message" rows={5}
            placeholder="How can we help?"
            style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
            onFocus={onFocus} onBlur={onBlur}
          />
        </div>

        {/* Submit / success */}
        {submitted ? (
          <p
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '14px',
              color: '#4A5D4A',
              textAlign: 'center',
              padding: '16px 0',
              margin: '24px 0 0',
            }}
          >
            ✓ Message sent. We&apos;ll get back to you soon.
          </p>
        ) : (
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: '#4A5D4A',
              color: '#E6EDD9',
              border: 'none',
              borderRadius: '100px',
              padding: '16px',
              fontFamily: 'var(--font-body)',
              fontWeight: 700,
              fontSize: '16px',
              cursor: loading ? 'default' : 'pointer',
              marginTop: '24px',
              transition: 'opacity 0.15s ease',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Sending…' : 'Send message →'}
          </button>
        )}
      </form>
    </div>
  )
}
