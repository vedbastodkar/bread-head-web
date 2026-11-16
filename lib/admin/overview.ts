// Admin portal overview — whole-platform counts from the BigQuery views. Server only.
import { runQuery, view, tsValue } from '@/lib/bigquery'

export interface Overview {
  generatedAt: string
  users: { students: number; teachers: number; withSource: number; verified: number; bySource: { source: string; n: number }[] }
  events: { last30d: { platform: string; events: number; students: number }[]; total: number; firstAt: string | null; lastAt: string | null }
  lessons: { byPlatform: { platform: string; completions: number; students: number; avgScore: number | null }[]; last30d: number }
  dailyActive: { day: string; students: number }[]
}

const p = (v: unknown) => (v == null ? 'unknown' : String(v))
const n = (v: unknown) => Number(v ?? 0)

export async function overview(): Promise<Overview> {
  const [userTotals, bySource, ev30, evTotals, lessons, lessons30, daily] = await Promise.all([
    runQuery(`SELECT
        COUNTIF(role IS DISTINCT FROM 'teacher' AND role IS DISTINCT FROM 'admin') AS students,
        COUNTIF(role = 'teacher') AS teachers,
        COUNTIF(attribution_source IS NOT NULL) AS with_source,
        COUNTIF(attribution_verified) AS verified
      FROM ${view('v_users')}`),
    runQuery(`SELECT attribution_source AS source, COUNT(*) AS n FROM ${view('v_users')}
      WHERE attribution_source IS NOT NULL GROUP BY 1 ORDER BY 2 DESC`),
    runQuery(`SELECT platform, COUNT(*) AS events, COUNT(DISTINCT uid) AS students FROM ${view('v_events')}
      WHERE server_ts > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY) GROUP BY 1 ORDER BY 1`),
    runQuery(`SELECT COUNT(*) AS total, MIN(server_ts) AS first_at, MAX(server_ts) AS last_at FROM ${view('v_events')}`),
    runQuery(`SELECT platform, COUNT(*) AS completions, COUNT(DISTINCT uid) AS students, AVG(score) AS avg_score
      FROM ${view('v_lesson_progress')} GROUP BY 1 ORDER BY 1`),
    runQuery(`SELECT COUNT(*) AS n FROM ${view('v_lesson_progress')}
      WHERE completed_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`),
    runQuery(`SELECT DATE(server_ts) AS day, COUNT(DISTINCT uid) AS students FROM ${view('v_events')}
      WHERE server_ts > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY) GROUP BY 1 ORDER BY 1`),
  ])
  const u = userTotals[0] ?? {}
  const t = evTotals[0] ?? {}
  return {
    generatedAt: new Date().toISOString(),
    users: {
      students: n(u.students), teachers: n(u.teachers), withSource: n(u.with_source), verified: n(u.verified),
      bySource: bySource.map((r) => ({ source: String(r.source), n: n(r.n) })),
    },
    events: {
      last30d: ev30.map((r) => ({ platform: p(r.platform), events: n(r.events), students: n(r.students) })),
      total: n(t.total), firstAt: tsValue(t.first_at), lastAt: tsValue(t.last_at),
    },
    lessons: {
      byPlatform: lessons.map((r) => ({
        platform: p(r.platform), completions: n(r.completions), students: n(r.students),
        avgScore: r.avg_score == null ? null : Math.round(Number(r.avg_score)),
      })),
      last30d: n(lessons30[0]?.n),
    },
    dailyActive: daily.map((r) => ({ day: tsValue(r.day) ?? '', students: n(r.students) })),
  }
}
