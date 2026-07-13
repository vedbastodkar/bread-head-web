import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { adminAuth } from '@/lib/firebase/admin'
import { enforce } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const TO = ['breadhead.org@gmail.com']

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function reportHtml(fields: { lessonId: string; slide: number; text: string; reporter: string }) {
  const { lessonId, slide, text, reporter } = fields
  const rows: [string, string][] = [
    ['Lesson', escHtml(lessonId)],
    ['Slide', String(slide)],
    ['Reporter', escHtml(reporter)],
  ]
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><title>Problem Report</title></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,0.06);">
        <tr><td style="background:#1A2E1A;padding:28px 36px;">
          <p style="margin:0;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(230,237,217,0.55);">Bread Head</p>
          <p style="margin:6px 0 0;font-size:20px;font-weight:700;color:#E6EDD9;">Lesson Problem Report</p>
        </td></tr>
        <tr><td style="padding:32px 36px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(26,46,26,0.1);border-radius:8px;overflow:hidden;margin-bottom:24px;">
            ${rows.map(([label, value], i) => `
            <tr style="background:${i % 2 === 0 ? '#fafaf8' : '#ffffff'};">
              <td style="padding:12px 16px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);width:100px;white-space:nowrap;">${label}</td>
              <td style="padding:12px 16px;font-size:14px;color:#1A2E1A;">${value}</td>
            </tr>`).join('')}
          </table>
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:rgba(26,46,26,0.45);">What looked wrong</p>
          <div style="background:#f5f5f0;border-radius:8px;padding:16px;font-size:14px;color:#1A2E1A;line-height:1.7;white-space:pre-wrap;">${escHtml(text)}</div>
        </td></tr>
        <tr><td style="padding:20px 36px;border-top:1px solid rgba(26,46,26,0.07);">
          <p style="margin:0;font-size:12px;color:rgba(26,46,26,0.35);">Bread Head · bread-head.org · Submitted from the in-lesson report button.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// POST /api/report  { lessonId, slide, text }  — a signed-in student/teacher flags a slide.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  // Per-user rate limit — this route sends email via Resend, so cap report spam.
  const limited = enforce(req, { prefix: 'report', uid: u.uid, limit: 10, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const lessonId = String(body.lessonId ?? '').slice(0, 64) || 'unknown'
  const slide = Number.isFinite(Number(body.slide)) ? Number(body.slide) : 0
  const text = String(body.text ?? '').trim().slice(0, 2000)
  if (!text) return NextResponse.json({ ok: false, error: 'Message required' }, { status: 400 })

  let reporter = u.uid
  try {
    const rec = await adminAuth.getUser(u.uid)
    reporter = rec.email ?? rec.displayName ?? u.uid
  } catch { /* fall back to uid */ }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    // The Resend SDK returns API failures in `error` rather than throwing —
    // check it explicitly so a bad key / unverified domain isn't a silent 200.
    const { error } = await resend.emails.send({
      from: 'Bread Head <noreply@bread-head.org>',
      to: TO,
      ...(reporter.includes('@') ? { replyTo: reporter } : {}),
      subject: `⚠️ Problem report · ${lessonId} · slide ${slide}`,
      html: reportHtml({ lessonId, slide, text, reporter }),
    })
    if (error) {
      console.error('Report email error:', error)
      return NextResponse.json({ ok: false, error: 'Could not send the report. Please try again shortly.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Report email exception:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
