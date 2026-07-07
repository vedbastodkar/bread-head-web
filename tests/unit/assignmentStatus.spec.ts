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

test('overdueMissing: "today" is evaluated in local time, not UTC', () => {
  // Regression: used new Date().toISOString() (UTC) so Americas users after ~5-8pm
  // local saw due-today assignments flagged overdue a day early. Must use local date.
  const localYMD = (d: Date) => d.toLocaleDateString('en-CA') // YYYY-MM-DD, local tz
  const today = localYMD(new Date())
  const y = new Date(); y.setDate(y.getDate() - 1)
  const yesterday = localYMD(y)
  const student = {
    uid: 'u1', name: 'Alice', completedLessons: [],
    currentUnit: 1, currentLesson: 1, xp: 0, level: 1, lastActive: null,
  } as any
  const mk = (dueDate: string) => ({
    id: 'a1', lessonIds: ['unit1lesson1'], scope: 'class', studentUids: [], dueDate,
    submissions: {},
  } as any)

  expect(overdueMissing(student, [mk(today)])).toEqual([])                    // due today → not overdue
  expect(overdueMissing(student, [mk(yesterday)])).toEqual(['unit1lesson1'])  // due yesterday → overdue
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
