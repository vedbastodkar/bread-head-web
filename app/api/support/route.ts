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
