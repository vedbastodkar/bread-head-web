import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const TO = ['breadhead.org@gmail.com']

function subscribeHtml(email: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Early Access Signup</title>
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
              <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#E6EDD9;">New Early Access Signup</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">
              <p style="margin:0 0 20px;font-size:15px;color:#1A2E1A;line-height:1.6;">
                Someone just signed up for early access on the homepage.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(26,46,26,0.1);border-radius:8px;overflow:hidden;">
                <tr style="background:#fafaf8;">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);width:100px;">Email</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1A2E1A;">${email}</td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="background:#1A2E1A;border-radius:100px;padding:12px 24px;">
                    <a href="mailto:${email}" style="color:#E6EDD9;font-size:14px;font-weight:600;text-decoration:none;">Reply to them →</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid rgba(26,46,26,0.07);">
              <p style="margin:0;font-size:12px;color:rgba(26,46,26,0.35);">Bread Head · bread-head.org · Submitted via the homepage early access form.</p>
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
  const rl = rateLimit(`subscribe:${clientIp(req)}`)
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Try again shortly.' }, { status: 429 })
  }

  let data: any
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }
  const { email } = data ?? {}

  const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!emailOk) {
    return NextResponse.json({ ok: false, error: 'Please provide a valid email.' }, { status: 400 })
  }
  const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : '')
  const clippedEmail = clip(email, 200)

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: 'Bread Head <noreply@bread-head.org>',
      to: TO,
      replyTo: clippedEmail,
      subject: `Early access signup — ${clippedEmail}`,
      html: subscribeHtml(clippedEmail),
    })
    if (error) {
      console.error('Subscribe email error:', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Subscribe email exception:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
