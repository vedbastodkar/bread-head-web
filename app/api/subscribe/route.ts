import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = ['breadhead.org@gmail.com', 'vedbastodkar@gmail.com']

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { email } = await req.json()

  try {
    await resend.emails.send({
      from: 'Bread Head <onboarding@resend.dev>',
      to: TO,
      subject: `New early access signup: ${email}`,
      text: `${email} signed up for early access via the homepage.`,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Subscribe email error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
