import { test, expect } from '@playwright/test'
import {
  countWords,
  journalStatus,
  sanitizeJournalConfig,
  buildSubmission,
  newEntryId,
} from '../../lib/journal/journal'

test('countWords handles empty, whitespace, and multi-space', () => {
  expect(countWords('')).toBe(0)
  expect(countWords('   ')).toBe(0)
  expect(countWords('one')).toBe(1)
  expect(countWords('  two   words  ')).toBe(2)
  expect(countWords('line one\nline two')).toBe(4)
})

test('journalStatus is complete only when both minimums are met', () => {
  expect(journalStatus(10, 60, 10, 60)).toBe('complete')   // exactly at both
  expect(journalStatus(9, 60, 10, 60)).toBe('in_progress') // one word short
  expect(journalStatus(10, 59, 10, 60)).toBe('in_progress') // one second short
  expect(journalStatus(0, 0, 0, 0)).toBe('complete')       // no minimums
  expect(journalStatus(5, 5)).toBe('complete')             // defaults (0/0)
})

test('sanitizeJournalConfig requires at least one non-empty question', () => {
  expect(sanitizeJournalConfig(null)).toBeNull()
  expect(sanitizeJournalConfig({ questions: [] })).toBeNull()
  expect(sanitizeJournalConfig({ questions: ['   ', ''] })).toBeNull()
  expect(sanitizeJournalConfig({ questions: [' Ask this? ', 5] })).toEqual({
    questions: ['Ask this?'],
    minWords: 0,
    minSeconds: 0,
  })
  expect(sanitizeJournalConfig({ questions: ['Q'], minWords: 50, minSeconds: 120 })).toEqual({
    questions: ['Q'],
    minWords: 50,
    minSeconds: 120,
  })
  // negative/garbage minimums coerce to 0
  expect(sanitizeJournalConfig({ questions: ['Q'], minWords: -3, minSeconds: 'x' })).toEqual({
    questions: ['Q'],
    minWords: 0,
    minSeconds: 0,
  })
})

test('buildSubmission returns ONLY metadata fields and never leaks content', () => {
  const out = buildSubmission(
    { wordCount: 42, secondsSpent: 130, body: 'SECRET DIARY TEXT', questions: ['x'] } as any,
    { minWords: 40, minSeconds: 120 },
  )
  expect(Object.keys(out).sort()).toEqual(['secondsSpent', 'status', 'wordCount'])
  expect(out).toEqual({ wordCount: 42, secondsSpent: 130, status: 'complete' })
  expect(JSON.stringify(out)).not.toContain('SECRET')
})

test('buildSubmission coerces bad counts to 0 and rounds', () => {
  expect(buildSubmission({ wordCount: 'nope', secondsSpent: -5 }, {})).toEqual({
    wordCount: 0,
    secondsSpent: 0,
    status: 'complete',
  })
  expect(buildSubmission({ wordCount: 3.7, secondsSpent: 9.2 }, { minWords: 4 })).toEqual({
    wordCount: 4,
    secondsSpent: 9,
    status: 'complete',
  })
})

test('newEntryId is an uppercase UUID, unique per call', () => {
  const a = newEntryId()
  const b = newEntryId()
  expect(a).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)
  expect(a).not.toBe(b)
})
