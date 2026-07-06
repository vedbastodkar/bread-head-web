import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ownsClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  if (!doc.exists) return null
  const ids: string[] = doc.get('teacherIds') ?? (doc.get('teacherId') ? [doc.get('teacherId')] : [])
  return ids.includes(uid) ? doc : null
}

// Keep only the known control fields, coerced to the right types. Returns
// undefined when nothing valid was provided (so we don't store an empty map).
function sanitizeControls(raw: unknown): Record<string, boolean | number> | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const r = raw as Record<string, unknown>
  const out: Record<string, boolean | number> = {}
  if (typeof r.lockUntilCorrect === 'boolean') out.lockUntilCorrect = r.lockUntilCorrect
  if (typeof r.noSkipAhead === 'boolean') out.noSkipAhead = r.noSkipAhead
  if (typeof r.minSecondsPerSlide === 'number' && r.minSecondsPerSlide >= 0)
    out.minSecondsPerSlide = Math.min(600, Math.round(r.minSecondsPerSlide))
  return Object.keys(out).length > 0 ? out : undefined
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
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
  const controls = sanitizeControls(body.controls)

  const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
    lessonIds, scope, studentUids, dueDate, title,
    ...(controls ? { controls } : {}),
    createdAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ id: ref.id, lessonIds, scope, studentUids, dueDate, title, controls })
}

// PATCH /api/classes/[classId]/assign?id=<assignmentId>
// Edit an existing assignment. Any of lessonIds/scope/studentUids/dueDate/title/controls.
export async function PATCH(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

  if (Array.isArray(body.lessonIds)) {
    const ids = body.lessonIds.filter((x: unknown) => typeof x === 'string')
    if (ids.length === 0) return NextResponse.json({ error: 'Select at least one lesson' }, { status: 400 })
    updates.lessonIds = ids
  }
  if (body.scope === 'class' || body.scope === 'students') updates.scope = body.scope
  if (Array.isArray(body.studentUids))
    updates.studentUids = body.studentUids.filter((x: unknown) => typeof x === 'string')
  if ('dueDate' in body)
    updates.dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
  if ('title' in body)
    updates.title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
  if ('controls' in body) {
    const c = sanitizeControls(body.controls)
    updates.controls = c ?? FieldValue.delete()
  }

  const ref = adminDb.collection('classes').doc(params.classId).collection('assignments').doc(id)
  if (!(await ref.get()).exists) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  await ref.update(updates)
  return NextResponse.json({ ok: true })
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
