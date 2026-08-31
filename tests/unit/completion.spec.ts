import { test, expect } from '@playwright/test'
import { completionFor } from '../../lib/dashboard/completion'
import type { Assignment, Student } from '../../app/dashboard/useDashboard'

const student = (uid: string, completed: string[] = []): Student => ({
  uid, name: uid, completedLessons: completed, currentUnit: 1, currentLesson: 1, xp: 0, level: 1, lastActive: null,
})

test('completionFor: class-scope lesson completion when all lessonIds done', () => {
  const a = { id: 'a', type: 'lesson', lessonIds: ['u1l1', 'u1l2'], scope: 'class', studentUids: [], dueDate: null,
    submissions: { s1: { status: 'in_progress', submittedAt: null, completedLessonIds: ['u1l1', 'u1l2'] } } } as Assignment
  expect(completionFor(a, [student('s1'), student('s2')])).toEqual({ done: 1, total: 2 })
})

test('completionFor: journal completion by status complete over targeted students only', () => {
  const a = { id: 'a', type: 'journal', lessonIds: [], scope: 'students', studentUids: ['s1'], dueDate: null,
    journal: { questions: ['q'], minWords: 0, minSeconds: 0 },
    submissions: { s1: { status: 'complete', submittedAt: null } } } as Assignment
  expect(completionFor(a, [student('s1'), student('s2')])).toEqual({ done: 1, total: 1 })
})

test('completionFor: total counts only targeted students still on the roster (moved-away student excluded)', () => {
  // scope students [s1,s2,s3], but s2 was moved off the class → roster is [s1,s3].
  // total must reflect the current roster-targeted set (2), not the raw studentUids length (3),
  // so a fully-done assignment reads 2/2 not a permanently stuck 2/3.
  const a = { id: 'a', type: 'lesson', lessonIds: ['u1l1'], scope: 'students', studentUids: ['s1', 's2', 's3'], dueDate: null,
    submissions: {
      s1: { status: 'in_progress', submittedAt: null, completedLessonIds: ['u1l1'] },
      s3: { status: 'in_progress', submittedAt: null, completedLessonIds: ['u1l1'] },
    } } as Assignment
  expect(completionFor(a, [student('s1'), student('s3')])).toEqual({ done: 2, total: 2 })
})
