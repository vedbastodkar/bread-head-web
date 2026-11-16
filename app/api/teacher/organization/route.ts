import { NextRequest, NextResponse } from 'next/server'
import { verifyTeacher } from '@/lib/firebase/verifyTeacher'
import { enforce } from '@/lib/rateLimit'
import { getTeacherSponsorId, loadSponsorItems, setTeacherSponsorId, sponsorIdForOrgCode } from '@/lib/sponsors/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/teacher/organization — the sponsoring partner this teacher belongs to (or null).
export async function GET(req: NextRequest) {
  const t = await verifyTeacher(req)
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const items = await loadSponsorItems()
  const sponsorId = await getTeacherSponsorId(t.uid, items)
  return NextResponse.json({ sponsorId, displayName: sponsorId ? items[sponsorId].displayName : null })
}

// POST /api/teacher/organization  { code } — join a partner with the organization code the
// admin issued. Every class this teacher owns then counts toward that partner for students who
// join from now on; students already verified keep the partner they were verified for.
export async function POST(req: NextRequest) {
  const t = await verifyTeacher(req)
  if (!t) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  // Codes are guessable only by brute force — keep the attempt budget small.
  const limited = enforce(req, { prefix: 'org-code', uid: t.uid, limit: 10, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const items = await loadSponsorItems()
  const sponsorId = await sponsorIdForOrgCode(body.code, items)
  if (!sponsorId) return NextResponse.json({ error: 'That organization code isn’t valid. Check it with Bread Head.' }, { status: 404 })
  await setTeacherSponsorId(t.uid, sponsorId, 'code')
  return NextResponse.json({ ok: true, sponsorId, displayName: items[sponsorId].displayName })
}
