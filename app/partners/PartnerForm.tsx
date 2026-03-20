'use client'

// TODO: replace with Formspree endpoint — https://formspree.io/f/YOUR_ID

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

export default function PartnerForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // TODO: wire up Formspree:
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
    <div className="card-border" style={{ background: '#FFFFFF', borderRadius: '16px', padding: '40px' }}>
      <form onSubmit={handleSubmit} noValidate>

        {/* Row 1: First + Last */}
        <div className="partners-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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
        <div className="partners-form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
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

        {/* Row 3: Partner type — custom chevron */}
        <div style={{ marginBottom: '20px', position: 'relative' }}>
          <label htmlFor="partnerType" style={labelStyle}>Partner type *</label>
          <div style={{ position: 'relative' }}>
            <select
              id="partnerType" name="partnerType" required
              style={{ ...inputStyle, appearance: 'none', paddingRight: '40px', cursor: 'pointer' }}
              onFocus={onFocus} onBlur={onBlur}
            >
              <option value="">Select one…</option>
              <option value="individual">Individual Student</option>
              <option value="school">School / District</option>
              <option value="youth">Youth Organization</option>
              <option value="corporate">Corporate / Foundation</option>
              <option value="other">Other</option>
            </select>
            {/* Chevron */}
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

        {/* Row 4: Student reach (optional) */}
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="reach" style={labelStyle}>
            How many students would you reach?{' '}
            <span style={{ fontWeight: 400, color: 'rgba(26,46,26,0.4)' }}>(optional)</span>
          </label>
          <input id="reach" name="reach" type="text"
            placeholder="e.g. 500 students across 3 schools"
            style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
        </div>

        {/* Row 5: Message */}
        <div style={{ marginBottom: '0' }}>
          <label htmlFor="message" style={labelStyle}>Tell us about your program or organization</label>
          <textarea id="message" name="message" rows={5}
            placeholder="What you do, who you serve, and what you're hoping Bread Head can help with."
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
            ✓ Message sent. We&apos;ll be in touch within 2 business days.
          </p>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="partners-submit-btn"
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
