import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'
import { rateLimit, clientIp } from '@/lib/rateLimit'

// Server-only: sets the `role: 'teacher'` custom claim, which only the Admin SDK can do.
// Called by the login page (Task 8) right after a brand-new Firebase account is created,
// to self-register that account as a teacher. Guarded (doc-and-claim based) so an account
// that already has a role (teacher/admin/student) — whether recorded as a custom claim or
// only as `profile.role` on the Firestore user doc — can never be re-flipped through this
// route. Students in particular never get a custom claim, only a Firestore doc field, so
// the claim alone is not sufficient to block them.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  // Rate limit account promotion by IP — this endpoint grants a teacher role claim,
  // so it's an abuse target (mass teacher-account creation). 5/15min per IP; raise if
  // legitimate teachers sign up en masse from one school NAT. In-memory (per-instance,
  // resets on cold start) — use a shared store (Redis/Upstash) for multi-instance.
  const rl = rateLimit(`register-teacher:${clientIp(req)}`, { limit: 5, windowMs: 15 * 60_000 })
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: 'Too many requests. Try again shortly.', retryAfter: rl.retryAfterSec },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
    )
  }

  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(token)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }

  const uid = decoded.uid

  // Guard: only a brand-new account with no existing role (claim or doc) may self-register
  // as teacher. Reads the existing user doc because students only ever get `profile.role`
  // on their Firestore doc, never a custom claim.
  const existing = await adminDb.doc(`users/${uid}`).get()
  const existingRole = existing.exists ? (existing.get('profile.role') as string | undefined) : undefined
  if (
    decoded.role === 'teacher' || decoded.role === 'admin' || decoded.role === 'student' ||
    existingRole === 'teacher' || existingRole === 'admin' || existingRole === 'student'
  ) {
    return NextResponse.json({ ok: false, error: 'Account already has a role.' }, { status: 409 })
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    // body is optional
  }
  const name = typeof body?.name === 'string' ? body.name.slice(0, 100).trim() : ''

  await adminAuth.setCustomUserClaims(uid, { role: 'teacher' })
  await adminDb.doc(`users/${uid}`).set(
    {
      profile: {
        uid,
        email: decoded.email ?? '',
        name: name || decoded.email || 'Teacher',
        role: 'teacher',
        isTeacher: true,
        provider: 'email',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        classIds: [],
      },
    },
    { merge: true }
  )

  return NextResponse.json({ ok: true })
}
