import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ownsClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  return doc.exists && doc.get('teacherId') === uid ? doc : null
}

// POST /api/classes/[classId]/assign
// { lessonIds: string[], scope: 'class'|'students', studentUids?: string[], dueDate?: string|null }
export async function POST(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const lessonIds: string[] = Array.isArray(body.lessonIds) ? body.lessonIds.filter((x: unknown) => typeof x === 'string') : []
  if (lessonIds.length === 0) return NextResponse.json({ error: 'Select at least one lesson' }, { status: 400 })
  const scope = body.scope === 'students' ? 'students' : 'class'
  const studentUids: string[] = scope === 'students' && Array.isArray(body.studentUids) ? body.studentUids : []
  if (scope === 'students' && studentUids.length === 0)
    return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })
  const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null

  const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
    lessonIds, scope, studentUids, dueDate,
    createdAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ id: ref.id, lessonIds, scope, studentUids, dueDate })
}

// DELETE /api/classes/[classId]/assign?id=<assignmentId>
export async function DELETE(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  await adminDb.collection('classes').doc(params.classId).collection('assignments').doc(id).delete()
  return NextResponse.json({ ok: true })
}
