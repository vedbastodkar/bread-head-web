import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdmin } from '@/lib/firebase/verifyAdmin'
import { enforce } from '@/lib/rateLimit'
import { loadSponsorItems, loadTeacherSponsorIds, setTeacherSponsorId } from '@/lib/sponsors/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/teachers — every teacher account with the partner it belongs to (or null).
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [snap, orgs] = await Promise.all([
    adminDb.collection('users').where('profile.role', '==', 'teacher').get(),
    loadTeacherSponsorIds(),
  ])
  const teachers = snap.docs
    .map((d) => ({
      uid: d.id,
      name: (d.get('profile.name') as string | undefined) ?? '',
      email: (d.get('profile.email') as string | undefined) ?? '',
      sponsorId: orgs[d.id] ?? null,
    }))
    .sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email))
  return NextResponse.json({ teachers })
}

// PUT /api/admin/teachers  { uid, sponsorId: string | null } — set or clear a teacher's
// partner directly, without an organization code.
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforce(req, { prefix: 'admin-teachers', uid: admin.uid, limit: 60, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const uid = typeof body.uid === 'string' ? body.uid : ''
  const sponsorId = body.sponsorId === null || body.sponsorId === '' ? null : body.sponsorId
  if (!uid) return NextResponse.json({ error: 'uid required' }, { status: 400 })
  if (sponsorId !== null && !(typeof sponsorId === 'string' && sponsorId in await loadSponsorItems())) {
    return NextResponse.json({ error: 'Unknown sponsor' }, { status: 400 })
  }
  const user = await adminDb.doc(`users/${uid}`).get()
  if (user.get('profile.role') !== 'teacher') return NextResponse.json({ error: 'Not a teacher account' }, { status: 400 })
  await setTeacherSponsorId(uid, sponsorId, 'admin')
  return NextResponse.json({ ok: true, uid, sponsorId })
}
