import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// The class doc if `uid` is its owner, else null. Co-teacher management is owner-only.
async function ownerClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  if (!doc.exists) return null
  return doc.get('teacherId') === uid ? doc : null
}

async function teacherList(ids: string[], ownerId: string) {
  return Promise.all(
    ids.map(async (uid) => {
      let name = 'Teacher'
      let email: string | null = null
      try {
        const u = await adminAuth.getUser(uid)
        name = u.displayName ?? name
        email = u.email ?? null
      } catch { /* deleted user — leave defaults */ }
      return { uid, name, email, isOwner: uid === ownerId }
    }),
  )
}

// GET — list the teachers on this class (owner + co-teachers). Any member may read.
export async function GET(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'coteacher-list', uid: teacher.uid, limit: 300, windowMs: 15 * 60_000 })
  if (limited) return limited

  const doc = await adminDb.collection('classes').doc(params.classId).get()
  if (!doc.exists) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const ownerId = doc.get('teacherId') as string
  const ids: string[] = doc.get('teacherIds') ?? (ownerId ? [ownerId] : [])
  if (!ids.includes(teacher.uid)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ teachers: await teacherList(ids, ownerId) })
}

// POST { email } — add a co-teacher by email (owner only).
export async function POST(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = enforce(req, { prefix: 'coteacher-add', uid: teacher.uid, limit: 30, windowMs: 15 * 60_000 })
  if (limited) return limited

  const cls = await ownerClass(teacher.uid, params.classId)
  if (!cls) return NextResponse.json({ error: 'Only the class owner can manage co-teachers' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const email = (body.email ?? '').toString().trim().toLowerCase()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  let target
  try {
    target = await adminAuth.getUserByEmail(email)
  } catch {
    return NextResponse.json({ error: 'No account found for that email' }, { status: 404 })
  }
  const role = target.customClaims?.role
  if (role !== 'teacher' && role !== 'admin')
    return NextResponse.json({ error: 'That account is not a teacher account' }, { status: 400 })
  if (target.uid === teacher.uid)
    return NextResponse.json({ error: 'You are already on this class' }, { status: 400 })

  // Ensure the owner is present, then add the co-teacher.
  await cls.ref.update({ teacherIds: FieldValue.arrayUnion(teacher.uid, target.uid) })
  return NextResponse.json({ ok: true, teacher: { uid: target.uid, name: target.displayName ?? 'Teacher', email: target.email ?? null, isOwner: false } })
}

// DELETE ?uid= — remove a co-teacher (owner only; the owner can't be removed).
export async function DELETE(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = enforce(req, { prefix: 'coteacher-remove', uid: teacher.uid, limit: 30, windowMs: 15 * 60_000 })
  if (limited) return limited

  const cls = await ownerClass(teacher.uid, params.classId)
  if (!cls) return NextResponse.json({ error: 'Only the class owner can manage co-teachers' }, { status: 403 })

  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })
  if (uid === teacher.uid) return NextResponse.json({ error: 'The owner cannot be removed' }, { status: 400 })

  await cls.ref.update({ teacherIds: FieldValue.arrayRemove(uid) })
  return NextResponse.json({ ok: true })
}
