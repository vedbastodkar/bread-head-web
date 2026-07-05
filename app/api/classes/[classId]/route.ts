import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ownsClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  if (!doc.exists) return null
  if (doc.get('teacherId') !== uid) return null
  return doc
}

// PATCH /api/classes/[classId]  { name?, grade?, archived? }
export async function PATCH(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (Array.isArray(body.grade)) updates.grade = body.grade
  if (typeof body.archived === 'boolean') updates.archived = body.archived
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  await adminDb.collection('classes').doc(params.classId).update(updates)
  return NextResponse.json({ ok: true, updates })
}

// DELETE /api/classes/[classId]  — removes the class + its roster (student accounts untouched)
export async function DELETE(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const cls = await ownsClass(teacher.uid, params.classId)
  if (!cls) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const ref = adminDb.collection('classes').doc(params.classId)
  const roster = await ref.collection('roster').get()
  const batch = adminDb.batch()
  roster.docs.forEach((d) => batch.delete(d.ref))
  batch.delete(ref)
  await batch.commit()
  return NextResponse.json({ ok: true })
}
