import { test, expect } from '@playwright/test'
import { recordAttempt, scoreOf, sortedRecords, type AnswerRecords } from '../../lib/analytics/lessonAnswers'

test('recordAttempt: first attempt creates the record; correct latches, wrong counts', () => {
  const m: AnswerRecords = new Map()
  const r1 = recordAttempt(m, 3, 'multipleChoice', false, 100)
  expect(r1).toEqual({ slideIndex: 3, kind: 'multipleChoice', isCorrect: false, attempts: 1, wrongAttempts: 1, answeredAt: 100 })
  const r2 = recordAttempt(m, 3, 'multipleChoice', true, 200)
  expect(r2).toEqual({ slideIndex: 3, kind: 'multipleChoice', isCorrect: true, attempts: 2, wrongAttempts: 1, answeredAt: 200 })
  // A later wrong attempt never un-latches isCorrect.
  const r3 = recordAttempt(m, 3, 'multipleChoice', false, 300)
  expect(r3.isCorrect).toBe(true)
  expect(r3.attempts).toBe(3)
  expect(r3.wrongAttempts).toBe(2)
  expect(m.size).toBe(1)
})

test('scoreOf: null with no graded slides (never 0)', () => {
  expect(scoreOf(new Map())).toBeNull()
  expect(scoreOf([])).toBeNull()
})

test('scoreOf: percent of clean first-try slides, rounded like iOS', () => {
  const m: AnswerRecords = new Map()
  recordAttempt(m, 1, 'trueOrFalse', true)              // clean
  recordAttempt(m, 2, 'multipleChoice', false)
  recordAttempt(m, 2, 'multipleChoice', true)           // correct but not clean
  recordAttempt(m, 4, 'matchConcept', true)             // clean
  expect(scoreOf(m)).toBe(67)                           // 2/3 → 66.67 → 67
  recordAttempt(m, 5, 'matchConcept', false)            // never corrected
  expect(scoreOf(m)).toBe(50)
})

test('sortedRecords: ordered by slide index', () => {
  const m: AnswerRecords = new Map()
  recordAttempt(m, 9, 'trueOrFalse', true)
  recordAttempt(m, 2, 'trueOrFalse', true)
  recordAttempt(m, 5, 'trueOrFalse', true)
  expect(sortedRecords(m).map((r) => r.slideIndex)).toEqual([2, 5, 9])
})
