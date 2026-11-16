import { test, expect } from '@playwright/test'
import { shapeSponsorReport, sponsorReportToCsv, cell, SUPPRESSION_THRESHOLD, type UserRow } from '../../lib/admin/sponsorReportShape'

const user = (uid: string, p: Partial<UserRow> = {}): UserRow => ({
  uid, role: null, attribution_source: null, attribution_verified: null, attribution_sponsor_id: null, ...p,
})
const win = { from: '2026-06-01', to: '2026-08-31' }

test('cell: withheld below the threshold, shown at or above it', () => {
  expect(cell(9)).toEqual({ value: null, suppressed: true })
  expect(cell(10)).toEqual({ value: 10, suppressed: false })
  expect(cell(500, 3)).toEqual({ value: null, suppressed: true }) // few contributing students → withheld
  expect(SUPPRESSION_THRESHOLD).toBe(10)
})

test('self-reported and verified are separate; denominator stated; teachers excluded', () => {
  const users: UserRow[] = [
    ...Array.from({ length: 12 }, (_, i) => user(`s${i}`, { attribution_source: 'acme-cu' })),           // self-reported
    ...Array.from({ length: 11 }, (_, i) => user(`v${i}`, { attribution_source: 'classroom', attribution_verified: true, attribution_sponsor_id: 'acme-cu' })), // verified
    user('both', { attribution_source: 'acme-cu', attribution_verified: true, attribution_sponsor_id: 'acme-cu' }), // in both, counted once in the denominator
    user('other', { attribution_source: 'first-national' }),
    user('blank1'), user('blank2'),
    user('t', { role: 'teacher', attribution_source: 'acme-cu' }),                                            // ignored
  ]
  const r = shapeSponsorReport('acme-cu', win, { users, events: [], completions: [] }, new Date('2026-09-10T00:00:00Z'))
  expect(r.selfReported.students).toBe(13)
  expect(r.verified.students).toBe(12)
  expect(r.denominator).toMatchObject({ totalStudents: 27, withThisSponsor: 24, withAnotherSource: 1, withNoSource: 2 })
  expect(r.denominator.statement).toContain('13 students identified this program')
  expect(r.denominator.statement).toContain('12 were verified')
  expect(r.denominator.statement).toContain('2 students did not identify any source')
  // no activity → every breakdown is a small cell → withheld
  expect(r.selfReported.activeInWindow).toEqual({ value: null, suppressed: true })
  expect(r.verified.lessonsCompleted).toEqual({ value: null, suppressed: true })
})

test('window activity: counts, platform breakdown, average score, and small-cell suppression', () => {
  const users = Array.from({ length: 15 }, (_, i) => user(`s${i}`, { attribution_source: 'acme-cu' }))
  const events = Array.from({ length: 12 }, (_, i) => ({ uid: `s${i}`, platform: i < 10 ? 'ios' : 'web', n: 5 }))
  events.push({ uid: 'stranger', platform: 'web', n: 1 }) // not in cohort → ignored
  const completions = [
    ...Array.from({ length: 10 }, (_, i) => ({ uid: `s${i}`, platform: 'ios', score: 80 })),
    { uid: 's0', platform: 'ios', score: 100 },            // second lesson by the same student
    { uid: 's11', platform: 'web', score: null },          // ungraded lesson
  ]
  const r = shapeSponsorReport('acme-cu', win, { users, events, completions })
  const c = r.selfReported
  expect(c.students).toBe(15)
  expect(c.activeInWindow).toEqual({ value: 12, suppressed: false })
  expect(c.completedALesson).toEqual({ value: 11, suppressed: false })
  expect(c.lessonsCompleted).toEqual({ value: 12, suppressed: false })
  expect(c.averageScore).toEqual({ value: 82, suppressed: false })   // (80×10 + 100) / 11 → 81.8 → 82
  expect(c.byPlatform).toEqual([
    { platform: 'ios', students: { value: 10, suppressed: false } },
    { platform: 'web', students: { value: null, suppressed: true } }, // 3 web students → withheld
  ])
  // the verified cohort is empty
  expect(r.verified.students).toBe(0)
  expect(r.verified.byPlatform).toEqual([])
})

test('csv: one metric per row, withheld cells labelled', () => {
  const users = Array.from({ length: 3 }, (_, i) => user(`s${i}`, { attribution_source: 'acme-cu' }))
  const csv = sponsorReportToCsv(shapeSponsorReport('acme-cu', win, { users, events: [], completions: [] }))
  expect(csv.split('\n')[0]).toBe('metric,value')
  expect(csv).toContain('self_reported_students,3')
  expect(csv).toContain('self_reported_active_in_window,withheld (<10)')
  expect(csv).toContain('verified_students,0')
})
