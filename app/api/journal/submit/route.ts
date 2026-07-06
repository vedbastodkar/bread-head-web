import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { buildSubmission } from '@/lib/journal/journal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/journal/submit
// { classId, assignmentId, entryId, wordCount, secondsSpent }
// Writes ONLY metadata to the teacher-readable submissions doc. Never receives or
// persists entry content. Gated on the caller having joined the target class.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const classId = String(body.classId ?? '')
  const assignmentId = String(body.assignmentId ?? '')
  const entryId = String(body.entryId ?? '')
  if (!classId || !assignmentId || !entryId)
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  // Join gate: caller must be rostered on the class (never-joined ⇒ no metadata ever).
  const rosterDoc = await adminDb.collection('classes').doc(classId).collection('roster').doc(u.uid).get()
  if (!rosterDoc.exists) return NextResponse.json({ ok: false, error: 'Not in class' }, { status: 403 })

  // Recompute status server-side from the assignment's minimums (don't trust client status).
  const aDoc = await adminDb.collection('classes').doc(classId).collection('assignments').doc(assignmentId).get()
  if (!aDoc.exists || aDoc.get('type') !== 'journal')
    return NextResponse.json({ ok: false, error: 'Assignment not found' }, { status: 404 })
  const cfg = (aDoc.get('journal') ?? {}) as { minWords?: number; minSeconds?: number }

  const meta = buildSubmission(
    { wordCount: body.wordCount, secondsSpent: body.secondsSpent },
    { minWords: cfg.minWords ?? 0, minSeconds: cfg.minSeconds ?? 0 },
  )

  await adminDb
    .collection('classes').doc(classId)
    .collection('assignments').doc(assignmentId)
    .collection('submissions').doc(u.uid)
    .set({ ...meta, entryId, submittedAt: FieldValue.serverTimestamp() }, { merge: true })

  return NextResponse.json({ ok: true, status: meta.status })
}
