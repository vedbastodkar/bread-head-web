import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

// Server-only: uses the Admin SDK, so it reads student docs directly (bypasses client rules).
// Security is enforced here: verify the caller's Firebase ID token + require a teacher/admin role
// claim, and only return classes the caller owns.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 401 })

  let decoded
  try {
    decoded = await adminAuth.verifyIdToken(token)
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }
  if (decoded.role !== 'teacher' && decoded.role !== 'admin') {
    return NextResponse.json({ error: 'Not a teacher account' }, { status: 403 })
  }

  const classesSnap = await adminDb.collection('classes').where('teacherId', '==', decoded.uid).get()

  const classes = await Promise.all(
    classesSnap.docs.map(async (cls) => {
      const rosterSnap = await cls.ref.collection('roster').get()
      const assignSnap = await cls.ref.collection('assignments').get()
      const assignments = assignSnap.docs.map((a) => {
        const ua = a.get('updatedAt')
        return {
          id: a.id,
          lessonIds: (a.get('lessonIds') ?? []) as string[],
          scope: (a.get('scope') ?? 'class') as 'class' | 'students',
          studentUids: (a.get('studentUids') ?? []) as string[],
          dueDate: (a.get('dueDate') ?? null) as string | null,
          title: (a.get('title') ?? null) as string | null,
          controls: (a.get('controls') ?? undefined) as Record<string, unknown> | undefined,
          updatedAt:
            ua && typeof ua.toDate === 'function' ? ua.toDate().toISOString() : null,
        }
      })
      const students = await Promise.all(
        rosterSnap.docs.map(async (r) => {
          const uid = r.get('studentUid') as string
          const uDoc = await adminDb.collection('users').doc(uid).get()
          const d = uDoc.data() ?? {}
          const lp = (d.lessonProgress ?? {}) as any
          const gp = (d.gamificationProgress ?? {}) as any
          const updatedAt = d.profile?.updatedAt
          const lastActive =
            updatedAt && typeof updatedAt.toDate === 'function'
              ? updatedAt.toDate().toISOString()
              : null
          return {
            uid,
            name: d.profile?.name ?? r.get('displayName') ?? 'Student',
            completedLessons: (lp.completedLessons ?? []) as string[],
            currentUnit: lp.currentUnit ?? 1,
            currentLesson: lp.currentLesson ?? 1,
            xp: gp.xp ?? 0,
            level: gp.level ?? 1,
            lastActive, // ISO string or null
          }
        })
      )
      students.sort((a, b) => b.completedLessons.length - a.completedLessons.length)
      return {
        id: cls.id,
        name: cls.get('name') ?? cls.id,
        joinCode: cls.get('joinCode') ?? null,
        grade: (cls.get('grade') ?? []) as number[],
        archived: cls.get('archived') === true,
        pacing: (cls.get('pacing') ?? null) as unknown,
        lessonControls: (cls.get('lessonControls') ?? null) as unknown,
        teacherId: (cls.get('teacherId') ?? null) as string | null,
        teacherIds: (cls.get('teacherIds') ?? null) as string[] | null,
        assignments,
        students,
      }
    })
  )

  return NextResponse.json({ classes })
}
