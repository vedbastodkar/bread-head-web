// The sponsor report: ONE function `(sponsorId, dateRange)` (CROSS-REPO §3 item 7). Pulls three
// row sets from BigQuery and hands them to the pure, tested shaper in ./sponsorReportShape.
import { runQuery, view } from '@/lib/bigquery'
import { shapeSponsorReport, type SponsorReport, type ReportWindow, type UserRow, type EventRow, type CompletionRow } from './sponsorReportShape'

export type { SponsorReport, ReportWindow }

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function parseWindow(from: unknown, to: unknown): ReportWindow | null {
  if (typeof from !== 'string' || typeof to !== 'string' || !DATE_RE.test(from) || !DATE_RE.test(to)) return null
  if (Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to)) || from > to) return null
  return { from, to }
}

export async function sponsorReport(sponsorId: string, window: ReportWindow): Promise<SponsorReport> {
  // Inclusive window in UTC: [from 00:00, to 23:59:59.999].
  const params = { sponsorId, fromTs: `${window.from}T00:00:00Z`, toTs: `${window.to}T23:59:59.999Z` }
  const [users, events, completions] = await Promise.all([
    runQuery<UserRow>(
      `SELECT uid, role, attribution_source, attribution_verified, attribution_sponsor_id
       FROM ${view('v_users')}`,
    ),
    runQuery<EventRow>(
      `SELECT uid, platform, COUNT(*) AS n
       FROM ${view('v_events')}
       WHERE server_ts BETWEEN TIMESTAMP(@fromTs) AND TIMESTAMP(@toTs)
       GROUP BY uid, platform`,
      params,
    ),
    runQuery<CompletionRow>(
      `SELECT uid, platform, score
       FROM ${view('v_lesson_progress')}
       WHERE completed_at BETWEEN TIMESTAMP(@fromTs) AND TIMESTAMP(@toTs)`,
      params,
    ),
  ])
  return shapeSponsorReport(sponsorId, window, {
    users,
    events: events.map((e) => ({ ...e, n: Number(e.n) })),
    completions: completions.map((c) => ({ ...c, score: c.score == null ? null : Number(c.score) })),
  })
}
