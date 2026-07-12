import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

// Server-only: sets the `role: 'teacher'` custom claim, which only the Admin SDK can do.
// Called by the login page (Task 8) right after a brand-new Firebase account is created,
// to self-register that account as a teacher. Guarded so an account that already has a
// role (teacher/admin/student) can never be re-flipped through this route.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(token)
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid token' }, { status: 401 })
  }

  // Guard: only a brand-new account with no existing role may self-register as teacher.
  if (decoded.role === 'teacher' || decoded.role === 'admin' || decoded.role === 'student') {
    return NextResponse.json({ ok: false, error: 'Account already has a role.' }, { status: 409 })
  }

  const uid = decoded.uid
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
