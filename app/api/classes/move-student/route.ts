import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/classes/move-student  { studentUid, fromClassId, toClassId }
// Teacher must own BOTH classes. Moves roster row + updates student.profile.classIds.
export async function POST(req: NextRequest) {
  const teacher = await verifyTeacher(req)
  if (!teacher) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const batch = adminDb.batch()
  batch.delete(fromRoster)
  batch.set(toDoc.ref.collection('roster').doc(studentUid), {
    studentUid, displayName, joinedAt: FieldValue.serverTimestamp(), status: 'active',
  })
  batch.update(adminDb.collection('users').doc(studentUid), {
    'profile.classIds': FieldValue.arrayRemove(fromClassId),
  })
  await batch.commit()
  // arrayUnion in a second step (can't remove+add same field key in one update)
  await adminDb.collection('users').doc(studentUid).update({
    'profile.classIds': FieldValue.arrayUnion(toClassId),
  })
  return NextResponse.json({ ok: true })
}
