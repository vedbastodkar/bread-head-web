import { test, expect } from '@playwright/test'
import { buildLessonSubmission } from '../../lib/curriculum/lessonSubmission'

test('buildLessonSubmission returns lessonId + complete status', () => {
  expect(buildLessonSubmission({ lessonId: 'unit2lesson3' })).toEqual({
    lessonId: 'unit2lesson3', status: 'complete',
  })
})

test('buildLessonSubmission coerces non-string lessonId to empty', () => {
  expect(buildLessonSubmission({ lessonId: 42 })).toEqual({ lessonId: '', status: 'complete' })
})
