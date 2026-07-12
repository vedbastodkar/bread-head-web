import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/classes/[classId]/remove-student  { studentUid }
// Teacher must own the class. Unlinks the student from the class only —
// deletes the roster doc and drops classId from the student's profile.
// Does NOT touch the student's account.
export async function POST(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const classId = params.classId
  const { studentUid } = await req.json().catch(() => ({}))
  if (!studentUid) return NextResponse.json({ error: 'studentUid required' }, { status: 400 })

  const classDoc = await adminDb.collection('classes').doc(classId).get()
  if (!classDoc.exists) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  const teacherIds: string[] = classDoc.get('teacherIds') ?? (classDoc.get('teacherId') ? [classDoc.get('teacherId')] : [])
  if (!teacherIds.includes(teacher.uid))
    return NextResponse.json({ error: 'Not your class' }, { status: 403 })

  const rosterRef = classDoc.ref.collection('roster').doc(studentUid)
  const rosterSnap = await rosterRef.get()
  // Guard: only remove a student who is actually in this class.
  if (!rosterSnap.exists) return NextResponse.json({ error: 'Student not in class' }, { status: 404 })

  const batch = adminDb.batch()
  batch.delete(rosterRef)
  batch.update(adminDb.collection('users').doc(studentUid), {
    'profile.classIds': FieldValue.arrayRemove(classId),
  })
  await batch.commit()

  return NextResponse.json({ ok: true })
}
