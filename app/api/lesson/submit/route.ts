import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { buildLessonSubmission } from '@/lib/curriculum/lessonSubmission'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/lesson/submit  { classId, assignmentId, lessonId }
// Records that the caller completed an assigned lesson. Metadata only.
// Join-gated; assignment must be a lesson assignment that includes lessonId.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const classId = String(body.classId ?? '')
  const assignmentId = String(body.assignmentId ?? '')
  const lessonId = String(body.lessonId ?? '')
  if (!classId || !assignmentId || !lessonId)
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const rosterDoc = await adminDb.collection('classes').doc(classId).collection('roster').doc(u.uid).get()
  if (!rosterDoc.exists) return NextResponse.json({ ok: false, error: 'Not in class' }, { status: 403 })

  const aDoc = await adminDb.collection('classes').doc(classId).collection('assignments').doc(assignmentId).get()
  if (!aDoc.exists || aDoc.get('type') !== 'lesson')
    return NextResponse.json({ ok: false, error: 'Assignment not found' }, { status: 404 })
  const lessonIds: string[] = aDoc.get('lessonIds') ?? []
  if (!lessonIds.includes(lessonId))
    return NextResponse.json({ ok: false, error: 'Lesson not in assignment' }, { status: 400 })

  const meta = buildLessonSubmission({ lessonId })
  await adminDb
    .collection('classes').doc(classId)
    .collection('assignments').doc(assignmentId)
    .collection('submissions').doc(u.uid)
    .set({ ...meta, submittedAt: FieldValue.serverTimestamp() }, { merge: true })

  return NextResponse.json({ ok: true })
}
