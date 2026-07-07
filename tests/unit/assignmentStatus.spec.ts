import { test, expect } from '@playwright/test'
import { overdueMissing } from '../../lib/dashboard/assignmentStatus'

test('overdueMissing: lesson missing from submissions.completedLessonIds counts as overdue, even if present in completedLessons (D6)', () => {
  const student = {
    uid: 'u1',
    name: 'Alice',
    completedLessons: ['unit1lesson1'], // completed at some point, but NOT while this assignment was active
    currentUnit: 1,
    currentLesson: 2,
    xp: 0,
    level: 1,
    lastActive: null,
  } as any
  const assignment = {
    id: 'a1',
    lessonIds: ['unit1lesson1'],
    scope: 'class',
    studentUids: [],
    dueDate: '2020-01-01', // well past
    submissions: {
      u1: { status: 'in_progress', submittedAt: null, completedLessonIds: [] },
    },
  } as any

  expect(overdueMissing(student, [assignment])).toEqual(['unit1lesson1'])
})

test('overdueMissing: lesson present in submissions.completedLessonIds is not overdue', () => {
  const student = {
    uid: 'u1',
    name: 'Alice',
    completedLessons: ['unit1lesson1'],
    currentUnit: 1,
    currentLesson: 2,
    xp: 0,
    level: 1,
    lastActive: null,
  } as any
  const assignment = {
    id: 'a1',
    lessonIds: ['unit1lesson1'],
    scope: 'class',
    studentUids: [],
    dueDate: '2020-01-01',
    submissions: {
      u1: { status: 'complete', submittedAt: '2020-01-01', completedLessonIds: ['unit1lesson1'] },
    },
  } as any

  expect(overdueMissing(student, [assignment])).toEqual([])
})

test('overdueMissing: assignment with future dueDate is never overdue', () => {
  const student = {
    uid: 'u1',
    name: 'Alice',
    completedLessons: [],
    currentUnit: 1,
    currentLesson: 1,
    xp: 0,
    level: 1,
    lastActive: null,
  } as any
  const assignment = {
    id: 'a1',
    lessonIds: ['unit1lesson1'],
    scope: 'class',
    studentUids: [],
    dueDate: '2099-01-01', // far future
    submissions: {},
  } as any

  expect(overdueMissing(student, [assignment])).toEqual([])
})

test('overdueMissing: scope "students" assignment not applicable to student is ignored', () => {
  const student = {
    uid: 'u1',
    name: 'Alice',
    completedLessons: [],
    currentUnit: 1,
    currentLesson: 1,
    xp: 0,
    level: 1,
    lastActive: null,
  } as any
  const assignment = {
    id: 'a1',
    lessonIds: ['unit1lesson1'],
    scope: 'students',
    studentUids: ['u2', 'u3'], // does not include u1
    dueDate: '2020-01-01',
    submissions: {},
  } as any

  expect(overdueMissing(student, [assignment])).toEqual([])
})
