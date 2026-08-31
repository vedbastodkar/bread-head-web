import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'
import { sanitizeJournalConfig } from '@/lib/journal/journal'
import { isKnownLessonId } from '@/lib/curriculum/controls'
import { getLibraryChallenge } from '@/lib/challenges/library'
import { validateChallenge } from '@/lib/challenges/challenge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function ownsClass(uid: string, classId: string) {
  const doc = await adminDb.collection('classes').doc(classId).get()
  if (!doc.exists) return null
  const ids: string[] = doc.get('teacherIds') ?? (doc.get('teacherId') ? [doc.get('teacherId')] : [])
  return ids.includes(uid) ? doc : null
}

// Reject any studentUids that aren't on the class roster (typo'd/stale selections
// would otherwise create assignments no one can ever see). Returns an error
// message, or null when the selection is clean.
async function invalidStudents(classId: string, studentUids: string[]): Promise<string | null> {
  if (studentUids.length === 0) return null
  const snap = await adminDb.collection('classes').doc(classId).collection('roster').get()
  const roster = new Set(snap.docs.map((d) => d.get('studentUid') as string).filter(Boolean))
  return studentUids.some((u) => !roster.has(u))
    ? 'One or more selected students are not on this class roster'
    : null
}

// Reject assignment lessonIds that aren't in the shipped curriculum. Returns an
// error message naming the first offender, or null when all ids are known.
function unknownLessonError(lessonIds: string[]): string | null {
  const bad = lessonIds.find((id) => !isKnownLessonId(id))
  return bad ? `Unknown lesson id: ${bad}` : null
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

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'assign', uid: teacher.uid, limit: 100, windowMs: 15 * 60_000 })
  if (limited) return limited

  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const type = body.type === 'journal' ? 'journal' : body.type === 'challenge' ? 'challenge' : 'lesson'

  if (type === 'challenge') {
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
    const ch = challengeId.startsWith('lib:') ? getLibraryChallenge(challengeId) : null
    if (!ch) return NextResponse.json({ error: 'Unknown or unsupported challengeId' }, { status: 400 })
    const v = validateChallenge(ch)
    if (!v.ok) return NextResponse.json({ error: `Challenge is not solvable: ${v.error}` }, { status: 400 })
    const scope = body.scope === 'students' ? 'students' : 'class'
    const studentUids: string[] = scope === 'students' && Array.isArray(body.studentUids)
      ? body.studentUids.filter((x: unknown) => typeof x === 'string') : []
    if (scope === 'students' && studentUids.length === 0)
      return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })
    const badStudents = await invalidStudents(params.classId, studentUids)
    if (badStudents) return NextResponse.json({ error: badStudents }, { status: 400 })
    const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
    const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
      type: 'challenge', challengeId, lessonIds: [], scope, studentUids, dueDate, title: title ?? ch.title,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id, type: 'challenge', challengeId, scope, studentUids, dueDate, title: title ?? ch.title })
  }

  if (type === 'journal') {
    const journal = sanitizeJournalConfig(body.journal)
    if (!journal) return NextResponse.json({ error: 'Add at least one prompt question' }, { status: 400 })
    const scope = body.scope === 'students' ? 'students' : 'class'
    const studentUids: string[] = scope === 'students' && Array.isArray(body.studentUids)
      ? body.studentUids.filter((x: unknown) => typeof x === 'string') : []
    if (scope === 'students' && studentUids.length === 0)
      return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })
    const badStudents = await invalidStudents(params.classId, studentUids)
    if (badStudents) return NextResponse.json({ error: badStudents }, { status: 400 })
    const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
    const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
      type: 'journal', journal, lessonIds: [], scope, studentUids, dueDate, title,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id, type: 'journal', journal, scope, studentUids, dueDate, title })
  }

  const lessonIds: string[] = Array.isArray(body.lessonIds) ? body.lessonIds.filter((x: unknown) => typeof x === 'string') : []
  if (lessonIds.length === 0) return NextResponse.json({ error: 'Select at least one lesson' }, { status: 400 })
  const unknownLesson = unknownLessonError(lessonIds)
  if (unknownLesson) return NextResponse.json({ error: unknownLesson }, { status: 400 })
  const scope = body.scope === 'students' ? 'students' : 'class'
  const studentUids: string[] = scope === 'students' && Array.isArray(body.studentUids)
    ? body.studentUids.filter((x: unknown) => typeof x === 'string') : []
  if (scope === 'students' && studentUids.length === 0)
    return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })
  const badStudents = await invalidStudents(params.classId, studentUids)
  if (badStudents) return NextResponse.json({ error: badStudents }, { status: 400 })
  const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
  const controls = sanitizeControls(body.controls)

  const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
    type: 'lesson', lessonIds, scope, studentUids, dueDate, title,
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

  const limited = enforce(req, { prefix: 'assign-edit', uid: teacher.uid, limit: 100, windowMs: 15 * 60_000 })
  if (limited) return limited

  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() }

  if (Array.isArray(body.lessonIds)) {
    const ids = body.lessonIds.filter((x: unknown) => typeof x === 'string')
    if (ids.length === 0) return NextResponse.json({ error: 'Select at least one lesson' }, { status: 400 })
    const unknownLesson = unknownLessonError(ids)
    if (unknownLesson) return NextResponse.json({ error: unknownLesson }, { status: 400 })
    updates.lessonIds = ids
  }
  if (body.scope === 'class' || body.scope === 'students') updates.scope = body.scope
  if (Array.isArray(body.studentUids)) {
    const uids = body.studentUids.filter((x: unknown) => typeof x === 'string')
    const badStudents = await invalidStudents(params.classId, uids)
    if (badStudents) return NextResponse.json({ error: badStudents }, { status: 400 })
    updates.studentUids = uids
  }
  if ('dueDate' in body)
    updates.dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
  if ('title' in body)
    updates.title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
  if ('controls' in body) {
    const c = sanitizeControls(body.controls)
    updates.controls = c ?? FieldValue.delete()
  }
  if ('challengeId' in body) {
    const challengeId = typeof body.challengeId === 'string' ? body.challengeId : ''
    const ch = challengeId.startsWith('lib:') ? getLibraryChallenge(challengeId) : null
    if (!ch) return NextResponse.json({ error: 'Unknown or unsupported challengeId' }, { status: 400 })
    const v = validateChallenge(ch)
    if (!v.ok) return NextResponse.json({ error: `Challenge is not solvable: ${v.error}` }, { status: 400 })
    updates.challengeId = challengeId
  }
  if ('journal' in body) {
    const journal = sanitizeJournalConfig(body.journal)
    if (!journal) return NextResponse.json({ error: 'Add at least one prompt question' }, { status: 400 })
    updates.journal = journal
  }

  const ref = adminDb.collection('classes').doc(params.classId).collection('assignments').doc(id)
  const snap = await ref.get()
  if (!snap.exists) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })

  // Guard: never leave the assignment scope='students' with an empty target list.
  // Fields update independently here, so compute the EFFECTIVE post-update values
  // (incoming update ?? stored) and reject an empty individual scope — mirroring the
  // POST checks. Otherwise the assignment would be visible to nobody (assignmentAppliesTo
  // → always false) and report 0/0 completion.
  const effScope = (updates.scope ?? snap.get('scope')) as string | undefined
  const effUids = ('studentUids' in updates ? updates.studentUids : snap.get('studentUids')) as string[] | undefined
  if (effScope === 'students' && (!Array.isArray(effUids) || effUids.length === 0))
    return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })

  await ref.update(updates)
  return NextResponse.json({ ok: true })
}

// DELETE /api/classes/[classId]/assign?id=<assignmentId>
export async function DELETE(req: NextRequest, { params }: { params: { classId: string } }) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit — mirror POST/PATCH so every authed handler is throttled.
  const limited = enforce(req, { prefix: 'assign', uid: teacher.uid, limit: 100, windowMs: 15 * 60_000 })
  if (limited) return limited

  if (!(await ownsClass(teacher.uid, params.classId)))
    return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const ref = adminDb.collection('classes').doc(params.classId).collection('assignments').doc(id)
  if (!(await ref.get()).exists) return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
  await ref.delete()
  return NextResponse.json({ ok: true })
}
