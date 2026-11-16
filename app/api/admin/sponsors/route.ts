import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAdmin } from '@/lib/firebase/verifyAdmin'
import { enforce } from '@/lib/rateLimit'
import { loadSponsorItems, SPONSORS_DOC } from '@/lib/sponsors/server'
import { isValidSponsorId, sortedSponsors } from '@/lib/sponsors/shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/sponsors — every partner in public/sponsors.items (active and inactive).
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json({ sponsors: sortedSponsors(await loadSponsorItems(), false) })
}

// PUT /api/admin/sponsors  { id, displayName, active, sortOrder } — upsert ONE partner.
// There is deliberately no delete: deactivating hides a partner from new pickers while every
// student already attributed to it keeps resolving (spec §2). Only the Admin SDK can write
// public/sponsors — clients have read-only access under the rules.
export async function PUT(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforce(req, { prefix: 'admin-sponsors', uid: admin.uid, limit: 60, windowMs: 15 * 60_000 })
  if (limited) return limited

  const body = await req.json().catch(() => ({}))
  const id = typeof body.id === 'string' ? body.id.trim().toLowerCase() : ''
  if (!isValidSponsorId(id)) {
    return NextResponse.json({ error: 'id must be 2–40 chars of a-z, 0-9, "-" and not a reserved word (classroom, self)' }, { status: 400 })
  }
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim().slice(0, 80) : ''
  if (!displayName) return NextResponse.json({ error: 'displayName required' }, { status: 400 })
  const active = body.active === true
  const sortOrder = Number.isInteger(body.sortOrder) ? (body.sortOrder as number) : 0

  await adminDb.doc(SPONSORS_DOC).set({ items: { [id]: { displayName, active, sortOrder } } }, { merge: true })
  return NextResponse.json({ ok: true, sponsor: { id, displayName, active, sortOrder } })
}
