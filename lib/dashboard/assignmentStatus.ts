// Pure assignment-status helpers — NO firebase import so this is trivially
// unit-testable. Types are imported type-only from useDashboard so nothing
// firebase-related is pulled in at runtime.
import type { Student, Assignment } from '@/app/dashboard/useDashboard'

export type Flag = { type: 'overdue'; label: string }

// Lessons a student still owes on assignments whose due date has passed.
export function overdueMissing(s: Student, assignments: Assignment[]): string[] {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in the viewer's local tz
  const missing = new Set<string>()
  for (const a of assignments) {
    if (!a.dueDate || a.dueDate >= today) continue                 // no deadline, or not past yet
    const applies = a.scope === 'class' || a.studentUids.includes(s.uid)
    if (!applies) continue
    // D6: a lesson counts as done only if completed WHILE assigned (submission record).
    const doneWhileAssigned = new Set(a.submissions?.[s.uid]?.completedLessonIds ?? [])
    a.lessonIds.forEach((id) => { if (!doneWhileAssigned.has(id)) missing.add(id) })
  }
  return Array.from(missing)
}

// Journal assignments a student still owes past their due date. Journals carry no
// lessonIds, so overdueMissing can't see them; completion is the per-student
// submission record reaching status 'complete' (D6, mirrored for journals).
export function overdueJournals(s: Student, assignments: Assignment[]): string[] {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in the viewer's local tz
  const out: string[] = []
  for (const a of assignments) {
    if ((a.type ?? 'lesson') !== 'journal') continue
    if (!a.dueDate || a.dueDate >= today) continue                 // no deadline, or not past yet
    const applies = a.scope === 'class' || a.studentUids.includes(s.uid)
    if (!applies) continue
    if (a.submissions?.[s.uid]?.status === 'complete') continue    // submitted while assigned
    out.push(a.id)
  }
  return out
}

// Challenge assignments a student still owes past their due date. Like journals,
// challenges carry no lessonIds, so overdueMissing can't see them; completion is
// the per-student submission record reaching status 'complete' (mirrors the
// student-side challenge-overdue logic in StudentHome).
export function overdueChallenges(s: Student, assignments: Assignment[]): string[] {
  const today = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD in the viewer's local tz
  const out: string[] = []
  for (const a of assignments) {
    if ((a.type ?? 'lesson') !== 'challenge') continue
    if (!a.dueDate || a.dueDate >= today) continue                 // no deadline, or not past yet
    const applies = a.scope === 'class' || a.studentUids.includes(s.uid)
    if (!applies) continue
    if (a.submissions?.[s.uid]?.status === 'complete') continue    // submitted while assigned
    out.push(a.id)
  }
  return out
}

// Needs attention = has assignment lessons, journals, OR challenges past deadline that aren't done.
export function attentionFlags(s: Student, assignments: Assignment[]): Flag[] {
  const count =
    overdueMissing(s, assignments).length +
    overdueJournals(s, assignments).length +
    overdueChallenges(s, assignments).length
  return count > 0
    ? [{ type: 'overdue', label: `${count} overdue` }]
    : []
}
