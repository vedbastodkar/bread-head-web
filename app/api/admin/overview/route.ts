import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/firebase/verifyAdmin'
import { enforce } from '@/lib/rateLimit'
import { overview } from '@/lib/admin/overview'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/overview — platform-wide counts from BigQuery (never Firestore).
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforce(req, { prefix: 'admin-overview', uid: admin.uid, limit: 60, windowMs: 15 * 60_000 })
  if (limited) return limited
  try {
    return NextResponse.json(await overview())
  } catch (e) {
    console.error('[admin/overview]', e)
    return NextResponse.json({ error: 'BigQuery query failed' }, { status: 502 })
  }
}
