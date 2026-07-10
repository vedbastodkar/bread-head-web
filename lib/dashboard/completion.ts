import type { Assignment, Student } from '@/app/dashboard/useDashboard'

// Lesson completion: how many target students finished ALL of the assignment's lessons.
export function lessonCompletion(a: Assignment, students: Student[]): { done: number; total: number } {
  const roster = students
  const targetStudents = a.scope === 'class' ? roster : roster.filter((s) => (a.studentUids ?? []).includes(s.uid))
  const total = a.scope === 'class' ? roster.length : (a.studentUids ?? []).length
  const done = targetStudents.filter((s) =>
    a.lessonIds.every((id) => (a.submissions?.[s.uid]?.completedLessonIds ?? []).includes(id)),
  ).length
  return { done, total }
}

// Status completion (journal + challenge): target students whose submission status is 'complete'.
export function statusCompletion(a: Assignment, students: Student[]): { done: number; total: number } {
  const roster = students
  const total = a.scope === 'class' ? roster.length : (a.studentUids ?? []).length
  const targetStudents = a.scope === 'class' ? roster : roster.filter((s) => (a.studentUids ?? []).includes(s.uid))
  const done = targetStudents.filter((s) => a.submissions?.[s.uid]?.status === 'complete').length
  return { done, total }
}

export function completionFor(a: Assignment, students: Student[]): { done: number; total: number } {
  const type = a.type ?? 'lesson'
  if (type === 'journal' || type === 'challenge') return statusCompletion(a, students)
  return lessonCompletion(a, students)
}
