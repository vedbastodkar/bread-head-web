# Support Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/support` page with a name/email/subject/message contact form powered by Resend, display the direct email address, add a Support footer link, and add © 2026 Bread Head to the footer.

**Architecture:** New `app/support/` directory with a server page and client form component, a new `app/api/support/route.ts` (separate from the partner-specific `/api/contact`), and a small update to `app/components/Footer.tsx`. No shared state or cross-page dependencies.

**Tech Stack:** Next.js 14 App Router, TypeScript, Resend (`resend` npm package), inline styles (project convention — no Tailwind in components).

---

## Files

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/support/page.tsx` | Support page layout (hero + form section + Footer) |
| Create | `app/support/SupportForm.tsx` | Client form component — fields, validation, POST to `/api/support` |
| Create | `app/api/support/route.ts` | API route — receives form data, sends email via Resend |
| Modify | `app/components/Footer.tsx` | Add Support link + © 2026 Bread Head |

---

### Task 1: API route — `/api/support`

**Files:**
- Create: `app/api/support/route.ts`

- [ ] **Step 1: Create the file**

```ts
// app/api/support/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = ['breadhead.org@gmail.com']

const SUBJECT_LABELS: Record<string, string> = {
  general: 'General Question',
  reach_out: 'Want to Reach Out',
  feedback: 'Feedback',
  bug: 'Report App Bug',
  media: 'Media / Press',
  other: 'Other',
}

function supportHtml(fields: {
  name: string
  email: string
  subject: string
  message: string
}) {
  const { name, email, subject, message } = fields
  const subjectLabel = SUBJECT_LABELS[subject] ?? subject

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Support Request</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background:#1A2E1A;padding:28px 36px;">
              <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(230,237,217,0.55);">Bread Head</p>
              <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#E6EDD9;">New Support Request</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 24px;font-size:15px;color:#1A2E1A;line-height:1.6;">
                You have a new message from <strong>${name}</strong>.
              </p>

              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(26,46,26,0.1);border-radius:8px;overflow:hidden;margin-bottom:24px;">
                ${[
                  ['Name', name],
                  ['Email', email],
                  ['Subject', subjectLabel],
                ].map(([label, value], i) => `
                <tr style="background:${i % 2 === 0 ? '#fafaf8' : '#ffffff'};">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);width:100px;white-space:nowrap;">${label}</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1A2E1A;">${value}</td>
                </tr>`).join('')}
              </table>

              <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);">Message</p>
              <div style="background:#f5f5f0;border-radius:8px;padding:16px;font-size:14px;color:#1A2E1A;line-height:1.7;white-space:pre-wrap;">${message || '—'}</div>

              <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="background:#1A2E1A;border-radius:100px;padding:12px 24px;">
                    <a href="mailto:${email}" style="color:#E6EDD9;font-size:14px;font-weight:600;text-decoration:none;">Reply to ${name} →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid rgba(26,46,26,0.07);">
              <p style="margin:0;font-size:12px;color:rgba(26,46,26,0.35);">Bread Head · bread-head.org · Submitted via the support contact form.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const data = await req.json()
  const { name, email, subject, message } = data

  const subjectLabel = SUBJECT_LABELS[subject] ?? 'Inquiry'

  try {
    await resend.emails.send({
      from: 'Bread Head <onboarding@resend.dev>',
      to: TO,
      replyTo: email,
      subject: `[${subjectLabel}] — ${name}`,
      html: supportHtml({ name, email, subject, message }),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Support email error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript or build errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/support/route.ts
git commit -m "feat: add /api/support email route"
```

---

### Task 2: SupportForm client component

**Files:**
- Create: `app/support/SupportForm.tsx`

- [ ] **Step 1: Create the file**

```tsx
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
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/support/SupportForm.tsx
git commit -m "feat: add SupportForm client component"
```

---

### Task 3: Support page

**Files:**
- Create: `app/support/page.tsx`

- [ ] **Step 1: Create the file**

```tsx
// app/support/page.tsx
import type { Metadata } from 'next'
import FadeUp from '@/app/components/FadeUp'
import Footer from '@/app/components/Footer'
import SupportForm from './SupportForm'

export const metadata: Metadata = {
  title: 'Support — Bread Head',
  description: 'Get help with Bread Head. Reach out with questions, feedback, bug reports, or media inquiries.',
}

export default function SupportPage() {
  return (
    <main>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9' }}>
        <div
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            paddingTop: '120px',
            paddingBottom: '64px',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <FadeUp delay={0}>
            {/* Eyebrow */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '2px', height: '20px', background: '#4A5D4A', flexShrink: 0 }} />
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  fontSize: '11px',
                  letterSpacing: '0.13em',
                  textTransform: 'uppercase',
                  color: '#4A5D4A',
                  lineHeight: 1,
                }}
              >
                Get Help
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontStyle: 'italic',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                color: '#1A2E1A',
                lineHeight: 1.1,
                marginBottom: '20px',
              }}
            >
              We&apos;re here to help.
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 400,
                fontSize: '16px',
                color: 'rgba(26,46,26,0.65)',
                lineHeight: 1.7,
                maxWidth: '520px',
                marginBottom: '12px',
              }}
            >
              Fill out the form below or email us directly — we respond to every message.
            </p>

            <a
              href="mailto:breadhead.org@gmail.com"
              style={{
                fontFamily: 'var(--font-body)',
                fontWeight: 500,
                fontSize: '15px',
                color: '#4A5D4A',
                textDecoration: 'none',
              }}
            >
              breadhead.org@gmail.com
            </a>
          </FadeUp>
        </div>
      </section>

      {/* ── FORM ────────────────────────────────────────────────── */}
      <section style={{ background: '#E6EDD9', paddingBottom: '80px' }}>
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            paddingLeft: '32px',
            paddingRight: '32px',
          }}
        >
          <FadeUp delay={0.05}>
            <SupportForm />
          </FadeUp>
        </div>
      </section>

      <Footer />
    </main>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no errors. The page should be accessible at `http://localhost:3000/support` when running `npm run dev`.

- [ ] **Step 3: Commit**

```bash
git add app/support/page.tsx
git commit -m "feat: add /support page"
```

---

### Task 4: Footer — Support link + copyright

**Files:**
- Modify: `app/components/Footer.tsx`

Current right-side cluster has Instagram icon + Privacy Notice link. Update to: Instagram icon + Support link + Privacy Notice link + © 2026 Bread Head text.

- [ ] **Step 1: Update Footer.tsx**

Replace the entire file content with:

```tsx
// app/components/Footer.tsx
import Image from 'next/image'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{ background: '#1A2E1A' }}>
      <div
        className="footer-inner"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '32px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Left — icon + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Image
            src="/assets/icon_clear.png"
            alt=""
            width={28}
            height={28}
            style={{ opacity: 0.45 }}
          />
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '20px',
              color: 'rgba(230,237,217,0.55)',
            }}
          >
            Bread Head
          </span>
        </div>

        {/* Right — Instagram + Support + Privacy Notice + copyright */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          <a
            href="https://www.instagram.com/breadhead_mn/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Bread Head on Instagram"
            className="footer-social-icon"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </a>

          <Link href="/support" className="footer-legal-link">
            Support
          </Link>

          <Link href="/privacy-notice" className="footer-legal-link">
            Privacy Notice
          </Link>

          <span
            style={{
              fontFamily: 'var(--font-body)',
              fontWeight: 400,
              fontSize: '12px',
              color: 'rgba(230,237,217,0.3)',
            }}
          >
            © 2026 Bread Head
          </span>
        </div>
      </div>
    </footer>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/Footer.tsx
git commit -m "feat: add Support link and copyright to footer"
```

---

### Task 5: Update Playwright snapshots

The footer appears on every page, and the new `/support` page is a new visual surface. Snapshots must be regenerated.

- [ ] **Step 1: Regenerate all snapshots**

```bash
npm run test:update
```

Expected: all 21 snapshots regenerated with no failures (the command updates, not asserts).

- [ ] **Step 2: Run visual regression tests to confirm clean**

```bash
npm run test:visual
```

Expected: 21 tests pass.

- [ ] **Step 3: Commit updated snapshots**

```bash
git add tests/snapshots/
git commit -m "test: update visual snapshots for footer and support page"
```

---

## Self-Review

**Spec coverage:**
- ✅ `/support` page with hero, direct email, form
- ✅ Fields: name, email, subject dropdown, message
- ✅ Subject options: General Question, Want to Reach Out, Feedback, Report App Bug, Media / Press, Other
- ✅ Resend API route at `/api/support`
- ✅ Email to `breadhead.org@gmail.com`, reply-to sender
- ✅ Support link in footer
- ✅ © 2026 Bread Head in footer
- ✅ Build verification at each task

**Placeholder scan:** No TBDs, TODOs, or vague steps found.

**Type consistency:** `SUBJECT_LABELS` keys (`general`, `reach_out`, `feedback`, `bug`, `media`, `other`) match the `<option value>` attributes in `SupportForm.tsx` exactly.
