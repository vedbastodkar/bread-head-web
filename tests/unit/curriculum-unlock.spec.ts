import { test, expect } from '@playwright/test'
import {
  lessonState,
  nextLesson,
  assignedLessonIdSet,
  advancesFrontier,
  type ClassLite,
} from '../../lib/curriculum/controls'

test('lessonState: completed lesson is done', () => {
  expect(lessonState('unit1lesson1', new Set(['unit1lesson1']))).toBe('done')
})

test('lessonState: linear frontier is open, beyond is locked', () => {
  const done = new Set(['unit1lesson1'])
  expect(lessonState('unit1lesson2', done)).toBe('open')   // next in line
  expect(lessonState('unit1lesson3', done)).toBe('locked') // two ahead
})

test('lessonState: assigned lesson is open even when far out of order', () => {
  const done = new Set(['unit1lesson1'])
  const assigned = new Set(['unit6lesson2'])
  // Without assignment it would be locked; with it, open.
  expect(lessonState('unit6lesson2', done)).toBe('locked')
  expect(lessonState('unit6lesson2', done, Infinity, assigned)).toBe('open')
})

test('lessonState: assignment overrides pacing frontier (D5)', () => {
  const done = new Set<string>()
  const pacing = 1 // frontier index 1 → most lessons locked
  const assigned = new Set(['unit6lesson2'])
  expect(lessonState('unit6lesson2', done, pacing)).toBe('locked')
  expect(lessonState('unit6lesson2', done, pacing, assigned)).toBe('open')
})

test('lessonState: completed takes priority over assigned', () => {
  const done = new Set(['unit6lesson2'])
  const assigned = new Set(['unit6lesson2'])
  expect(lessonState('unit6lesson2', done, Infinity, assigned)).toBe('done')
})

test('nextLesson: returns first not-completed, ignores out-of-order completions', () => {
  // Completing an out-of-order assigned lesson must NOT advance the personal frontier.
  const done = new Set(['unit1lesson1', 'unit6lesson2'])
  expect(nextLesson(done)).toEqual({ unit: 1, lesson: 2 })
})

test('assignedLessonIdSet: unions applicable lesson assignments only', () => {
  const classes: ClassLite[] = [{
    pacing: null, lessonControls: null,
    assignments: [
      { type: 'lesson', lessonIds: ['unit2lesson3'], scope: 'class', studentUids: [] },
      { type: 'lesson', lessonIds: ['unit6lesson2'], scope: 'students', studentUids: ['me'] },
      { type: 'lesson', lessonIds: ['unit9lesson1'], scope: 'students', studentUids: ['other'] },
      { type: 'journal', lessonIds: [], scope: 'class', studentUids: [] },
    ],
  }]
  const set = assignedLessonIdSet(classes, 'me')
  expect([...set].sort()).toEqual(['unit2lesson3', 'unit6lesson2'])
})

test('advancesFrontier: lesson AT the frontier advances', () => {
  const done = new Set(['unit1lesson1', 'unit1lesson2'])
  expect(advancesFrontier('unit1lesson3', done)).toBe(true)
})

test('advancesFrontier: replaying an already-completed lesson does NOT advance (regression)', () => {
  const done = new Set(['unit1lesson1', 'unit1lesson2'])
  expect(advancesFrontier('unit1lesson1', done)).toBe(false)
})

test('advancesFrontier: out-of-order/assigned lesson beyond the frontier does NOT advance', () => {
  const done = new Set(['unit1lesson1'])
  expect(advancesFrontier('unit6lesson2', done)).toBe(false)
})

test('advancesFrontier: unknown lesson id does NOT advance', () => {
  const done = new Set(['unit1lesson1'])
  expect(advancesFrontier('not-a-real-lesson', done)).toBe(false)
})

test('advancesFrontier: sequential completion keeps advancing (streak sanity)', () => {
  const done = new Set(['unit1lesson1', 'unit1lesson2'])
  // Completing the frontier lesson (unit1lesson3) advances...
  expect(advancesFrontier('unit1lesson3', done)).toBe(true)
  const next = new Set(done)
  next.add('unit1lesson3')
  // ...and the lesson immediately after is now the new frontier, so it advances too.
  expect(advancesFrontier('unit1lesson4', next)).toBe(true)
})
