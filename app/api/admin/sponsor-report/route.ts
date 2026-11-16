import { NextRequest, NextResponse } from 'next/server'
import { verifyAdmin } from '@/lib/firebase/verifyAdmin'
import { enforce } from '@/lib/rateLimit'
import { sponsorReport, parseWindow } from '@/lib/admin/sponsorReport'
import { sponsorReportToCsv } from '@/lib/admin/sponsorReportShape'
import { isValidSponsorId } from '@/lib/sponsors/shared'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET /api/admin/sponsor-report?sponsorId=&from=YYYY-MM-DD&to=YYYY-MM-DD[&format=csv]
export async function GET(req: NextRequest) {
  const admin = await verifyAdmin(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const limited = enforce(req, { prefix: 'admin-report', uid: admin.uid, limit: 60, windowMs: 15 * 60_000 })
  if (limited) return limited

  const sp = req.nextUrl.searchParams
  const sponsorId = sp.get('sponsorId') ?? ''
  if (!isValidSponsorId(sponsorId)) return NextResponse.json({ error: 'Invalid sponsorId' }, { status: 400 })
  const window = parseWindow(sp.get('from'), sp.get('to'))
  if (!window) return NextResponse.json({ error: 'from/to must be YYYY-MM-DD with from <= to' }, { status: 400 })

  try {
    const report = await sponsorReport(sponsorId, window)
    if (sp.get('format') === 'csv') {
      return new NextResponse(sponsorReportToCsv(report), {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="sponsor-report-${sponsorId}-${window.from}-${window.to}.csv"`,
        },
      })
    }
    return NextResponse.json(report)
  } catch (e) {
    console.error('[admin/sponsor-report]', e)
    return NextResponse.json({ error: 'BigQuery query failed' }, { status: 502 })
  }
}
