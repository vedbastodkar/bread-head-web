import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/firebase/verifyAdmin'
import { enforce } from '@/lib/rateLimit'
import { loadOrgCodes, loadSponsorItems, rotateOrgCode } from '@/lib/sponsors/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/org-codes — the live teacher organization code per partner id.
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ codes: await loadOrgCodes() })
}

// POST /api/admin/org-codes  { sponsorId } — generate a partner's code, replacing any existing
// one (the old code stops working; teachers who already used it stay affiliated).
export async function POST(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforce(req, { prefix: 'admin-org-codes', uid: admin.uid, limit: 60, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const sponsorId = typeof body.sponsorId === 'string' ? body.sponsorId : ''
  if (!(sponsorId in await loadSponsorItems())) return NextResponse.json({ error: 'Unknown sponsor' }, { status: 400 })
  return NextResponse.json({ ok: true, sponsorId, code: await rotateOrgCode(sponsorId) })
}
