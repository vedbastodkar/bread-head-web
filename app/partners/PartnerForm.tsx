'use client'

// TODO: replace with Formspree endpoint — https://formspree.io/f/YOUR_ID
// Until wired up, submit button shows success state only (no real send).

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

function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = '#4A5D4A'
  e.currentTarget.style.boxShadow = '0 0 0 2px rgba(74,93,74,0.15)'
}
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = 'rgba(26,46,26,0.15)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function PartnerForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // TODO: replace with real Formspree fetch:
    // const res = await fetch('https://formspree.io/f/YOUR_ID', {
    //   method: 'POST',
    //   body: new FormData(e.currentTarget),
    //   headers: { Accept: 'application/json' },
    // })
    await new Promise((r) => setTimeout(r, 600))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <div
      className="card-border"
      style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px' }}
    >
      <form onSubmit={handleSubmit} noValidate>

        {/* Row 1: First + Last */}
        <div
          className="partners-form-row"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}
        >
          <div>
            <label htmlFor="firstName" style={labelStyle}>First name *</label>
            <input id="firstName" name="firstName" type="text" required autoComplete="given-name"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label htmlFor="lastName" style={labelStyle}>Last name *</label>
            <input id="lastName" name="lastName" type="text" required autoComplete="family-name"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        {/* Row 2: Email + Org */}
        <div
          className="partners-form-row"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' }}
        >
          <div>
            <label htmlFor="email" style={labelStyle}>Email *</label>
            <input id="email" name="email" type="email" required autoComplete="email"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
          <div>
            <label htmlFor="org" style={labelStyle}>Organization name *</label>
            <input id="org" name="org" type="text" required autoComplete="organization"
              style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
          </div>
        </div>

        {/* Row 3: Partner type */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="partnerType" style={labelStyle}>Partner type *</label>
          <select id="partnerType" name="partnerType" required
            style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
            onFocus={onFocus} onBlur={onBlur}
          >
            <option value="">Select one…</option>
            <option value="school">School / District</option>
            <option value="youth">Youth Organization</option>
            <option value="corporate">Corporate / Foundation</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Row 4: Reach (optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="reach" style={labelStyle}>
            How many students would you reach?
            <span style={{ fontWeight: 400, color: 'rgba(26,46,26,0.4)', marginLeft: '4px' }}>(optional)</span>
          </label>
          <input id="reach" name="reach" type="text"
            placeholder="e.g. 500 students across 3 schools"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>

        {/* Row 5: Message */}
        <div>
          <label htmlFor="message" style={labelStyle}>Tell us about your program or organization</label>
          <textarea id="message" name="message" rows={5}
            placeholder="What you do, who you serve, and what you're hoping Bread Head can help with."
            style={{ ...inputStyle, minHeight: '140px', resize: 'vertical' }}
            onFocus={onFocus} onBlur={onBlur}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || submitted}
          style={{
            width: '100%',
            background: submitted ? 'rgba(74,93,74,0.10)' : '#4A5D4A',
            color: submitted ? '#4A5D4A' : '#E6EDD9',
            border: 'none',
            borderRadius: '100px',
            padding: '16px',
            fontFamily: 'var(--font-body)',
            fontWeight: 600,
            fontSize: '16px',
            cursor: submitted || loading ? 'default' : 'pointer',
            marginTop: '24px',
            transition: 'opacity 0.2s ease, background 0.3s ease',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => { if (!loading && !submitted) (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
          onMouseLeave={(e) => { if (!loading && !submitted) (e.currentTarget as HTMLElement).style.opacity = '1' }}
        >
          {loading ? 'Sending…' : submitted ? '✓ Message sent' : 'Send message →'}
        </button>

        {submitted && (
          <p style={{
            fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: '14px',
            color: '#4A5D4A', textAlign: 'center', marginTop: '12px', marginBottom: 0,
          }}>
            ✓ Message sent. We&apos;ll be in touch within 2 business days.
          </p>
        )}
      </form>
    </div>
  )
}
