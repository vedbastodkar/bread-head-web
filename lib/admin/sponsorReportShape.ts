// Pure shaping of the sponsor report (spec 2026-08-30-sponsor-attribution.md §6). The SQL lives
// in ./sponsorReport.ts; everything here takes plain rows so it can be unit-tested.
//
// Three rules from the spec, enforced here and nowhere else:
//   1. Self-reported and verified counts are two separate numbers, never blended.
//   2. The denominator is stated: total students, and how many named no source at all.
//   3. Any breakdown cell under SUPPRESSION_THRESHOLD students is withheld.

export const SUPPRESSION_THRESHOLD = 10

export interface UserRow {
  uid: string
  role: string | null
  attribution_source: string | null
  attribution_verified: boolean | null
  attribution_sponsor_id: string | null
}
export interface EventRow { uid: string; platform: string | null; n: number }
export interface CompletionRow { uid: string; platform: string | null; score: number | null }

export interface ReportWindow { from: string; to: string } // ISO dates, inclusive

/** A count that may be withheld. `value` is null exactly when `suppressed` is true. */
export interface Cell { value: number | null; suppressed: boolean }

export interface Cohort {
  /** Headline count — the number the sponsor is owed. Not a breakdown, so never suppressed. */
  students: number
  /** Students with at least one logged action inside the window. */
  activeInWindow: Cell
  /** Students who completed at least one lesson inside the window. */
  completedALesson: Cell
  /** Total lesson completions inside the window (withheld when the contributing students < threshold). */
  lessonsCompleted: Cell
  /** Mean lesson score (%) across graded completions in the window (withheld the same way). */
  averageScore: Cell
  /** Students per platform (from their window activity). */
  byPlatform: { platform: string; students: Cell }[]
}

export interface SponsorReport {
  sponsorId: string
  window: ReportWindow
  generatedAt: string
  suppressionThreshold: number
  denominator: {
    totalStudents: number
    withThisSponsor: number     // self-reported ∪ verified (distinct)
    withAnotherSource: number
    withNoSource: number
    statement: string
  }
  selfReported: Cohort
  verified: Cohort
  notes: string[]
}

export function cell(count: number, contributingStudents: number = count): Cell {
  return contributingStudents < SUPPRESSION_THRESHOLD ? { value: null, suppressed: true } : { value: count, suppressed: false }
}

function isStudent(u: UserRow): boolean {
  return u.role !== 'teacher' && u.role !== 'admin'
}

function buildCohort(uids: Set<string>, events: EventRow[], completions: CompletionRow[]): Cohort {
  const active = new Set<string>()
  const byPlatform = new Map<string, Set<string>>()
  for (const e of events) {
    if (!uids.has(e.uid)) continue
    active.add(e.uid)
    const p = e.platform ?? 'unknown'
    if (!byPlatform.has(p)) byPlatform.set(p, new Set())
    byPlatform.get(p)!.add(e.uid)
  }
  const completers = new Set<string>()
  let lessons = 0
  const scores: number[] = []
  const scorers = new Set<string>()
  for (const c of completions) {
    if (!uids.has(c.uid)) continue
    completers.add(c.uid)
    lessons += 1
    if (typeof c.score === 'number' && Number.isFinite(c.score)) { scores.push(c.score); scorers.add(c.uid) }
    const p = c.platform ?? 'unknown'
    if (!byPlatform.has(p)) byPlatform.set(p, new Set())
    byPlatform.get(p)!.add(c.uid)
  }
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  return {
    students: uids.size,
    activeInWindow: cell(active.size),
    completedALesson: cell(completers.size),
    lessonsCompleted: cell(lessons, completers.size),
    averageScore: avg === null ? { value: null, suppressed: scorers.size < SUPPRESSION_THRESHOLD } : cell(avg, scorers.size),
    byPlatform: Array.from(byPlatform.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([platform, set]) => ({ platform, students: cell(set.size) })),
  }
}

export function shapeSponsorReport(
  sponsorId: string,
  window: ReportWindow,
  rows: { users: UserRow[]; events: EventRow[]; completions: CompletionRow[] },
  now: Date = new Date(),
): SponsorReport {
  const students = rows.users.filter(isStudent)
  const selfReported = new Set(students.filter((u) => u.attribution_source === sponsorId).map((u) => u.uid))
  const verified = new Set(students.filter((u) => u.attribution_verified === true && u.attribution_sponsor_id === sponsorId).map((u) => u.uid))
  const withThis = new Set(Array.from(selfReported).concat(Array.from(verified)))
  const withNoSource = students.filter((u) => !u.attribution_source && !(u.attribution_verified && u.attribution_sponsor_id)).length
  const withAnother = students.length - withThis.size - withNoSource

  const denominator = {
    totalStudents: students.length,
    withThisSponsor: withThis.size,
    withAnotherSource: withAnother,
    withNoSource,
    statement:
      `${selfReported.size} students identified this program as their source and ${verified.size} were verified through a sponsored class ` +
      `(${withThis.size} distinct), out of ${students.length} students in total; ${withNoSource} students did not identify any source.`,
  }

  return {
    sponsorId,
    window,
    generatedAt: now.toISOString(),
    suppressionThreshold: SUPPRESSION_THRESHOLD,
    denominator,
    selfReported: buildCohort(selfReported, rows.events, rows.completions),
    verified: buildCohort(verified, rows.events, rows.completions),
    notes: [
      'Self-reported and verified counts are reported separately and are never combined.',
      `Any breakdown cell covering fewer than ${SUPPRESSION_THRESHOLD} students is withheld.`,
      'Self-reported = the student chose this partner in the onboarding question. Verified = the student redeemed a join code for a class linked to this partner.',
      'Activity and lesson figures cover only the reporting window; cohort sizes are as of the report date.',
    ],
  }
}

/** Flat CSV of the report (one row per metric) for handing to a partner. */
export function sponsorReportToCsv(r: SponsorReport): string {
  const v = (c: Cell) => (c.suppressed ? 'withheld (<' + r.suppressionThreshold + ')' : String(c.value))
  const lines: string[][] = [
    ['sponsorId', r.sponsorId],
    ['window_from', r.window.from],
    ['window_to', r.window.to],
    ['generated_at', r.generatedAt],
    ['total_students', String(r.denominator.totalStudents)],
    ['students_with_no_source', String(r.denominator.withNoSource)],
    ['students_with_another_source', String(r.denominator.withAnotherSource)],
  ]
  for (const [label, c] of [['self_reported', r.selfReported], ['verified', r.verified]] as const) {
    lines.push([`${label}_students`, String(c.students)])
    lines.push([`${label}_active_in_window`, v(c.activeInWindow)])
    lines.push([`${label}_completed_a_lesson`, v(c.completedALesson)])
    lines.push([`${label}_lessons_completed`, v(c.lessonsCompleted)])
    lines.push([`${label}_average_score`, v(c.averageScore)])
    for (const p of c.byPlatform) lines.push([`${label}_students_${p.platform}`, v(p.students)])
  }
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)
  return ['metric,value', ...lines.map((l) => l.map(esc).join(','))].join('\n') + '\n'
}
