import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { rateLimit, clientIp } from '@/lib/rateLimit'

const TO = ['ved@bread-head.org']

const PARTNER_TYPE_LABELS: Record<string, string> = {
  question: 'General Question',
  individual: 'Individual Student',
  school: 'School / District',
  youth: 'Youth Organization',
  corporate: 'Corporate / Foundation',
  other: 'Other',
}

const SUBJECT_PREFIX: Record<string, string> = {
  question: 'General question',
  individual: 'Partner inquiry [Individual]',
  school: 'Partner inquiry [School / District]',
  youth: 'Partner inquiry [Youth Org]',
  corporate: 'Partner inquiry [Corporate / Foundation]',
  other: 'Inquiry',
}

// Escape user-supplied values before interpolating them into the notification
// email HTML — otherwise a submitter can inject markup/links into the inbox.
function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function contactHtml(fields: {
  firstName: string
  lastName: string
  email: string
  org: string
  partnerType: string
  reach: string
  message: string
}) {
  const raw = fields
  const firstName = escHtml(raw.firstName)
  const lastName = escHtml(raw.lastName)
  const email = escHtml(raw.email)
  const org = escHtml(raw.org)
  const reach = escHtml(raw.reach)
  const message = escHtml(raw.message)
  const typeLabel = escHtml(PARTNER_TYPE_LABELS[raw.partnerType] ?? raw.partnerType)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Partner Inquiry</title>
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
              <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#E6EDD9;">New Partner Inquiry</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px;">

              <p style="margin:0 0 24px;font-size:15px;color:#1A2E1A;line-height:1.6;">
                You have a new inquiry from <strong>${firstName} ${lastName}</strong> at <strong>${org}</strong>.
              </p>

              <!-- Detail rows -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(26,46,26,0.1);border-radius:8px;overflow:hidden;margin-bottom:24px;">
                ${[
                  ['Name', `${firstName} ${lastName}`],
                  ['Email', email],
                  ['Organization', org],
                  ['Partner Type', typeLabel],
                  ['Student Reach', reach || 'Not specified'],
                ].map(([label, value], i) => `
                <tr style="background:${i % 2 === 0 ? '#fafaf8' : '#ffffff'};">
                  <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);width:140px;white-space:nowrap;">${label}</td>
                  <td style="padding:12px 16px;font-size:14px;color:#1A2E1A;">${value}</td>
                </tr>`).join('')}
              </table>

              <!-- Message -->
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);">Message</p>
              <div style="background:#f5f5f0;border-radius:8px;padding:16px;font-size:14px;color:#1A2E1A;line-height:1.7;white-space:pre-wrap;">${message || 'None'}</div>

              <!-- Reply CTA -->
              <table cellpadding="0" cellspacing="0" style="margin-top:28px;">
                <tr>
                  <td style="background:#1A2E1A;border-radius:100px;padding:12px 24px;">
                    <a href="mailto:${email}" style="color:#E6EDD9;font-size:14px;font-weight:600;text-decoration:none;">Reply to ${firstName} →</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid rgba(26,46,26,0.07);">
              <p style="margin:0;font-size:12px;color:rgba(26,46,26,0.35);">Bread Head · bread-head.org · This message was submitted via the partner contact form.</p>
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
  const rl = rateLimit(`contact:${clientIp(req)}`)
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: 'Too many requests. Try again shortly.' }, { status: 429 })
  }

  let data: any
  try {
    data = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }
  const { firstName, lastName, email, org, partnerType, reach, message } = data ?? {}

  const emailOk = typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (!firstName || !lastName || !emailOk) {
    return NextResponse.json({ ok: false, error: 'Please provide your name and a valid email.' }, { status: 400 })
  }
  const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.slice(0, n) : '')

  const clippedFirstName = clip(firstName, 100)
  const clippedLastName = clip(lastName, 100)
  const clippedOrg = clip(org, 150)
  const clippedMessage = clip(message, 5000)
  const clippedReach = clip(reach, 100)

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const { error } = await resend.emails.send({
      from: 'Bread Head <noreply@bread-head.org>',
      to: TO,
      replyTo: email,
      subject: `${SUBJECT_PREFIX[partnerType] ?? 'Inquiry'} from ${clippedFirstName} ${clippedLastName}${clippedOrg ? ` (${clippedOrg})` : ''}`,
      html: contactHtml({
        firstName: clippedFirstName,
        lastName: clippedLastName,
        email,
        org: clippedOrg,
        partnerType,
        reach: clippedReach,
        message: clippedMessage,
      }),
    })
    if (error) {
      console.error('Contact email error:', error)
      return NextResponse.json({ ok: false, error: 'Could not send your message. Please try again shortly.' }, { status: 502 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact email exception:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
