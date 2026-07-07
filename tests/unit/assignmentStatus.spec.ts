import { test, expect } from '@playwright/test'
import { overdueMissing, overdueJournals, attentionFlags } from '../../lib/dashboard/assignmentStatus'

const student = () => ({
  uid: 'u1', name: 'Alice', completedLessons: [],
  currentUnit: 1, currentLesson: 1, xp: 0, level: 1, lastActive: null,
}) as any

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

// ---- Journal-assignment overdue parity (D6 for journals) ----

const journalAssignment = (over: Record<string, unknown> = {}) => ({
  id: 'j1', type: 'journal', lessonIds: [], scope: 'class', studentUids: [],
  dueDate: '2020-01-01', // well past
  journal: { questions: ['Reflect'], minWords: 0, minSeconds: 0 },
  submissions: {},
  ...over,
}) as any

test('overdueJournals: past-due journal with no submission is overdue', () => {
  expect(overdueJournals(student(), [journalAssignment()])).toEqual(['j1'])
})

test('overdueJournals: journal with a complete submission is not overdue', () => {
  const a = journalAssignment({ submissions: { u1: { status: 'complete', submittedAt: '2020-01-02' } } })
  expect(overdueJournals(student(), [a])).toEqual([])
})

test('overdueJournals: in_progress submission past due is still overdue', () => {
  const a = journalAssignment({ submissions: { u1: { status: 'in_progress', submittedAt: null } } })
  expect(overdueJournals(student(), [a])).toEqual(['j1'])
})

test('overdueJournals: future-due journal is never overdue', () => {
  expect(overdueJournals(student(), [journalAssignment({ dueDate: '2099-01-01' })])).toEqual([])
})

test('overdueJournals: journal scoped to other students is ignored', () => {
  const a = journalAssignment({ scope: 'students', studentUids: ['u2'] })
  expect(overdueJournals(student(), [a])).toEqual([])
})

test('attentionFlags: overdue journals count toward needs-attention alongside overdue lessons', () => {
  const lesson = {
    id: 'a1', type: 'lesson', lessonIds: ['unit1lesson1'], scope: 'class', studentUids: [],
    dueDate: '2020-01-01', submissions: { u1: { status: 'in_progress', submittedAt: null, completedLessonIds: [] } },
  } as any
  // one overdue lesson + one overdue journal → "2 overdue"
  expect(attentionFlags(student(), [lesson, journalAssignment()])).toEqual([{ type: 'overdue', label: '2 overdue' }])
})

test('attentionFlags: a lone overdue journal raises a flag (previously ignored)', () => {
  expect(attentionFlags(student(), [journalAssignment()])).toEqual([{ type: 'overdue', label: '1 overdue' }])
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
