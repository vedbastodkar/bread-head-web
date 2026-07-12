import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher, makeJoinCode } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/classes  { name, grade?: number[] }  -> create a class owned by the teacher
export async function POST(req: NextRequest) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'class-create', uid: teacher.uid, limit: 30, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const name = (body.name ?? '').toString().trim()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  const grade: number[] = Array.isArray(body.grade) ? body.grade : []

  // unique-ish join code (retry a couple times on collision)
  let joinCode = makeJoinCode()
  for (let i = 0; i < 3; i++) {
    const clash = await adminDb.collection('classes').where('joinCode', '==', joinCode).limit(1).get()
    if (clash.empty) break
    joinCode = makeJoinCode()
  }

  const ref = await adminDb.collection('classes').add({
    name, teacherId: teacher.uid, teacherIds: [teacher.uid], grade, joinCode,
    archived: false, createdAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ id: ref.id, name, joinCode, grade, archived: false })
}
