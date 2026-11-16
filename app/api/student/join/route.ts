import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'
import { getTeacherSponsorId } from '@/lib/sponsors/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/student/join  { joinCode } — enroll the student in a class by its code.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Per-user rate limit (see lib/rateLimit.ts).
  const limited = enforce(req, { prefix: 'join', uid: u.uid, limit: 20, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const code = (body.joinCode ?? '').toString().trim().toUpperCase()
  if (!code) return NextResponse.json({ error: 'Enter a section code' }, { status: 400 })

  const q = await adminDb.collection('classes').where('joinCode', '==', code).limit(1).get()
  if (q.empty) return NextResponse.json({ error: 'No section found with that code' }, { status: 404 })

  const cls = q.docs[0]
  const cid = cls.id
  const teacherId = cls.get('teacherId') as string | undefined
  const teacherIds: string[] = cls.get('teacherIds') ?? (teacherId ? [teacherId] : [])
  const userRef = adminDb.collection('users').doc(u.uid)
  const userSnap = await userRef.get()
  const name = (userSnap.get('profile.name') as string) ?? 'Student'


  // Sponsor attribution (spec 2026-08-30 §3/§5): redeeming a join code is the ONLY path that
  // produces verified attribution, and these three fields are server-only — the rules reject
  // any client write that changes them, so they must be set here with the Admin SDK.
  // `sponsorId` is the organization of the class's owning teacher (server-only
  // `teacherOrgs/{uid}`, set by an admin-issued organization code — never a field on the
  // class doc, which teachers can write from the browser). The first verified sponsor wins if
  // a student later joins a class from a different sponsor (multi-class rule, §5).
  const sponsorId = teacherId ? await getTeacherSponsorId(teacherId) : null
  const existingSponsorId = userSnap.get('profile.attribution.sponsorId') as string | undefined
  const setSponsor = !!sponsorId && !existingSponsorId
  // classId names the class the attribution came from. Once a sponsor is locked in, the
  // classId that produced it is locked too — otherwise a later join to a class from another
  // partner would leave classId and sponsorId pointing at different institutions.
  const setClassId = setSponsor || !existingSponsorId

  // Roster row + student doc commit together, so a failure never leaves a rostered student
  // without class membership. `set` + merge (nested maps, not dotted keys) rather than
  // `update`: a brand-new account whose users/{uid} doc has not been written yet (iOS first
  // launch, a failed sign-up write) must still be able to join.
  const batch = adminDb.batch()
  batch.set(
    cls.ref.collection('roster').doc(u.uid),
    { studentUid: u.uid, displayName: name, joinedAt: FieldValue.serverTimestamp(), status: 'active' },
    { merge: true },
  )
  batch.set(userRef, {
    profile: {
      classIds: FieldValue.arrayUnion(cid),
      ...(teacherIds.length ? { teacherIds: FieldValue.arrayUnion(...teacherIds) } : {}),
      attribution: {
        verified: true,
        ...(setClassId ? { classId: cid } : {}),
        ...(setSponsor ? { sponsorId } : {}),
      },
    },
  }, { merge: true })
  await batch.commit()

  return NextResponse.json({
    ok: true, id: cid, name: cls.get('name') ?? cid,
    attribution: { verified: true, classId: setClassId ? cid : (userSnap.get('profile.attribution.classId') ?? null), sponsorId: existingSponsorId ?? sponsorId },
  })
}
