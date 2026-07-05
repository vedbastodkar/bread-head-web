import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Any teacher on the class (owner or co-teacher).
async function memberClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  if (!doc.exists) return null
  const ids: string[] = doc.get('teacherIds') ?? (doc.get('teacherId') ? [doc.get('teacherId')] : [])
  return ids.includes(uid) ? doc : null
}

// The class owner only (co-teachers excluded).
async function ownsClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  if (!doc.exists) return null
  return doc.get('teacherId') === uid ? doc : null
}

// PATCH /api/classes/[classId]  { name?, grade?, archived? }
export async function PATCH(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!(await memberClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (Array.isArray(body.grade)) updates.grade = body.grade
  if (typeof body.archived === 'boolean') updates.archived = body.archived

  if ('pacing' in body) {
    const p = body.pacing
    if (p && typeof p === 'object' && typeof p.enabled === 'boolean'
        && Number.isInteger(p.throughUnit) && Number.isInteger(p.throughLesson)) {
      updates.pacing = { enabled: p.enabled, throughUnit: p.throughUnit, throughLesson: p.throughLesson }
    } else {
      return NextResponse.json({ error: 'Invalid pacing' }, { status: 400 })
    }
  }
  if ('lessonControls' in body) {
    const c = body.lessonControls
    if (c && typeof c === 'object') {
      updates.lessonControls = {
        lockUntilCorrect: !!c.lockUntilCorrect,
        noSkipAhead: !!c.noSkipAhead,
        minSecondsPerSlide: typeof c.minSecondsPerSlide === 'number' && c.minSecondsPerSlide >= 0
          ? Math.min(600, Math.round(c.minSecondsPerSlide)) : 0,
      }
    } else {
      return NextResponse.json({ error: 'Invalid lessonControls' }, { status: 400 })
    }
  }

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
