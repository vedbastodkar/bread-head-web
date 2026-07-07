// Pure helper — no firebase import → unit-testable. A lesson assignment is binary:
// completing the lesson fulfills it. Content/answers are never involved.
export interface LessonSubmissionMeta {
  lessonId: string
  status: 'complete'
}

export function buildLessonSubmission(input: { lessonId: unknown }): LessonSubmissionMeta {
  const lessonId = typeof input.lessonId === 'string' ? input.lessonId : ''
  return { lessonId, status: 'complete' }
}
