// Pure assignment-status helpers — NO firebase import so this is trivially
// unit-testable. Types are imported type-only from useDashboard so nothing
// firebase-related is pulled in at runtime.
import type { Student, Assignment } from '@/app/dashboard/useDashboard'

export type Flag = { type: 'overdue'; label: string }

// Lessons a student still owes on assignments whose due date has passed.
export function overdueMissing(s: Student, assignments: Assignment[]): string[] {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD, local-ish
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

// Needs attention = has assignment lessons past deadline that aren't done.
export function attentionFlags(s: Student, assignments: Assignment[]): Flag[] {
  const missing = overdueMissing(s, assignments)
  return missing.length > 0
    ? [{ type: 'overdue', label: `${missing.length} overdue` }]
    : []
}
