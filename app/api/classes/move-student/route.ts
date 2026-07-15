import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/classes/move-student  { studentUid, fromClassId, toClassId }
// Teacher must own BOTH classes. Moves roster row + updates student.profile.classIds.
export async function POST(req: NextRequest) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'move-student', uid: teacher.uid, limit: 60, windowMs: 15 * 60_000 })
  if (limited) return limited

  const { studentUid, fromClassId, toClassId } = await req.json().catch(() => ({}))
  if (!studentUid || !fromClassId || !toClassId)
    return NextResponse.json({ error: 'studentUid, fromClassId, toClassId required' }, { status: 400 })
  if (fromClassId === toClassId)
    return NextResponse.json({ error: 'Same class' }, { status: 400 })

  const [fromDoc, toDoc] = await Promise.all([
    adminDb.collection('classes').doc(fromClassId).get(),
    adminDb.collection('classes').doc(toClassId).get(),
  ])
  if (!fromDoc.exists || !toDoc.exists) return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  const isMember = (doc: typeof fromDoc) => {
    const ids: string[] = doc.get('teacherIds') ?? (doc.get('teacherId') ? [doc.get('teacherId')] : [])
    return ids.includes(teacher.uid)
  }
  if (!isMember(fromDoc) || !isMember(toDoc))
    return NextResponse.json({ error: 'Not your class' }, { status: 403 })

  const fromRoster = fromDoc.ref.collection('roster').doc(studentUid)
  const rosterSnap = await fromRoster.get()
  // Guard: only move a student who is actually in the source class. Without this,
  // an arbitrary uid would be *added* to the destination (with a placeholder name)
  // rather than moved — an unvetted enrollment masquerading as a move.
  if (!rosterSnap.exists) return NextResponse.json({ error: 'Student not in source class' }, { status: 404 })
  const displayName = rosterSnap.get('displayName') ?? 'Student'
  const toRoster = toDoc.ref.collection('roster').doc(studentUid)
  const userRef = adminDb.collection('users').doc(studentUid)

  // Atomic move: roster delete + roster add + classIds update all commit together
  // or not at all. classIds can't use arrayRemove+arrayUnion in one write (two
  // transforms on the same field conflict), so we read the current array inside
  // the transaction and write the computed result — no partial-move inconsistency.
  await adminDb.runTransaction(async (tx) => {
    const userSnap = await tx.get(userRef)
    const current: string[] = userSnap.get('profile.classIds') ?? []
    const nextIds = Array.from(new Set(current.filter((c) => c !== fromClassId).concat(toClassId)))
    tx.delete(fromRoster)
    tx.set(toRoster, { studentUid, displayName, joinedAt: FieldValue.serverTimestamp(), status: 'active' })
    tx.update(userRef, { 'profile.classIds': nextIds })
  })
  return NextResponse.json({ ok: true })
}
