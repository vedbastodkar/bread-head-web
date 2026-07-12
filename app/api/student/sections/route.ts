import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/student/sections — the classes this student has joined.
export async function GET(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'sections', uid: u.uid, limit: 300, windowMs: 15 * 60_000 })
  if (limited) return limited

  const userDoc = await adminDb.collection('users').doc(u.uid).get()
  const classIds: string[] = (userDoc.get('profile.classIds') as string[]) ?? []

  const sections = []
  for (const cid of classIds) {
    const cls = await adminDb.collection('classes').doc(cid).get()
    if (!cls.exists) continue
    let teacherName = 'Teacher'
    const teacherId = cls.get('teacherId') as string | undefined
    if (teacherId) {
      const t = await adminDb.collection('users').doc(teacherId).get()
      teacherName = (t.get('profile.name') as string) ?? teacherName
    }
    sections.push({
      id: cid,
      name: cls.get('name') ?? cid,
      course: 'Personal Finance',
      teacherName,
      joinCode: cls.get('joinCode') ?? null,
      archived: cls.get('archived') === true,
    })
  }
  return NextResponse.json({ sections })
}
