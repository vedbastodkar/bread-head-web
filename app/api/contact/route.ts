import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = ['breadhead.org@gmail.com', 'vedbastodkar@gmail.com']

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const data = await req.json()
  const { firstName, lastName, email, org, partnerType, reach, message } = data

  try {
    await resend.emails.send({
      from: 'Bread Head <onboarding@resend.dev>',
      to: TO,
      replyTo: email,
      subject: `Partner inquiry from ${firstName} ${lastName} — ${org}`,
      text: [
        `Name: ${firstName} ${lastName}`,
        `Email: ${email}`,
        `Organization: ${org}`,
        `Partner type: ${partnerType}`,
        `Student reach: ${reach || 'Not specified'}`,
        ``,
        `Message:`,
        message,
      ].join('\n'),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Contact email error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
