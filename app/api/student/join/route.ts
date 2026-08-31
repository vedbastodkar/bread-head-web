import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/student/join  { joinCode } — enroll the student in a class by its code.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'join', uid: u.uid, limit: 20, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const code = (body.joinCode ?? '').toString().trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Enter a section code' }, { status: 400 })

  const q = await adminDb.collection('classes').where('joinCode', '==', code).limit(1).get()
  if (q.empty) return NextResponse.json({ error: 'No section found with that code' }, { status: 404 })

  const cls = q.docs[0]
  const cid = cls.id
  const teacherId = cls.get('teacherId') as string | undefined
  const teacherIds: string[] = cls.get('teacherIds') ?? (teacherId ? [teacherId] : [])
  const userRef = adminDb.collection('users').doc(u.uid)
  const name = ((await userRef.get()).get('profile.name') as string) ?? 'Student'

  await cls.ref.collection('roster').doc(u.uid).set(
    { studentUid: u.uid, displayName: name, joinedAt: FieldValue.serverTimestamp(), status: 'active' },
    { merge: true },
  )
  await userRef.update({
    'profile.classIds': FieldValue.arrayUnion(cid),
    ...(teacherIds.length ? { 'profile.teacherIds': FieldValue.arrayUnion(...teacherIds) } : {}),
  })

  return NextResponse.json({ ok: true, id: cid, name: cls.get('name') ?? cid })
}
