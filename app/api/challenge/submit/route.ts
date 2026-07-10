import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { getLibraryChallenge } from '@/lib/challenges/library'
import { buildChallengeSubmission, type Allocation, type AllocationBox, type BoxRole } from '@/lib/challenges/challenge'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const ROLES: BoxRole[] = ['need', 'want', 'save']

// Coerce/validate one client-reported allocation box. A box with a missing or
// malformed field (bad role, non-numeric targetValue, etc.) is dropped rather
// than passed through — buildChallengeSubmission does not itself validate
// per-box fields, so an unsanitized box here would inject NaN into the
// server-recomputed, teacher-visible score.
function sanitizeBox(raw: unknown): AllocationBox | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || !r.id) return null
  if (typeof r.name !== 'string') return null
  if (typeof r.role !== 'string' || !ROLES.includes(r.role as BoxRole)) return null
  if (r.targetMode !== 'fixed' && r.targetMode !== 'percent') return null
  if (typeof r.targetValue !== 'number' || !Number.isFinite(r.targetValue) || r.targetValue < 0) return null
  const mandatoryId = typeof r.mandatoryId === 'string' ? r.mandatoryId : undefined
  return {
    id: r.id,
    name: r.name,
    role: r.role as BoxRole,
    targetMode: r.targetMode,
    targetValue: r.targetValue,
    ...(mandatoryId ? { mandatoryId } : {}),
  }
}

// POST /api/challenge/submit
// { classId, assignmentId, allocation: { boxes }, reflection }
// Recomputes score/allPassed/perCriterion server-side from the sanitized
// allocation — any client-sent score is ignored. Gated on the caller having
// joined the target class (mirrors journal/submit's roster join-gate).
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const classId = String(body.classId ?? '')
  const assignmentId = String(body.assignmentId ?? '')
  if (!classId || !assignmentId)
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  const rawBoxes: unknown[] = Array.isArray(body?.allocation?.boxes) ? body.allocation.boxes : []
  const boxes = rawBoxes
    .map(sanitizeBox)
    .filter((b: AllocationBox | null): b is AllocationBox => b !== null)
  const allocation: Allocation = { boxes }

  // Join gate: caller must be rostered on the class.
  const rosterDoc = await adminDb.collection('classes').doc(classId).collection('roster').doc(u.uid).get()
  if (!rosterDoc.exists) return NextResponse.json({ ok: false, error: 'Not in class' }, { status: 403 })

  const aDoc = await adminDb.collection('classes').doc(classId).collection('assignments').doc(assignmentId).get()
  if (!aDoc.exists || aDoc.get('type') !== 'challenge')
    return NextResponse.json({ ok: false, error: 'Not a challenge assignment' }, { status: 400 })

  const challengeId = String(aDoc.get('challengeId') ?? '')
  const ch = challengeId.startsWith('lib:') ? getLibraryChallenge(challengeId) : null // custom: challenges are Phase 2
  if (!ch) return NextResponse.json({ ok: false, error: 'Unknown challenge' }, { status: 400 })

  // Server-authoritative: score/allPassed/perCriterion are always recomputed here.
  const meta = buildChallengeSubmission({ allocation, reflection: body.reflection }, ch)

  await adminDb
    .collection('classes').doc(classId)
    .collection('assignments').doc(assignmentId)
    .collection('submissions').doc(u.uid)
    .set({ ...meta, submittedAt: FieldValue.serverTimestamp() }, { merge: true })

  return NextResponse.json({
    ok: true,
    score: meta.score,
    allPassed: meta.allPassed,
    perCriterion: meta.perCriterion,
    status: meta.status,
  })
}
