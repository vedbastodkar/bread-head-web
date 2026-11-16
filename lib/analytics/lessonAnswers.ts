// Graded-answer capture for the lesson player. Pure and unit-tested; mirrors the iOS
// `LessonLogic.SlideAnswerRecord` / `recordAnswerAttempt` / score computation exactly so a
// lesson scores the same on both platforms (data-contract.md §5).

/** `kind` values from the contract (§4). Only slides with a defined correct answer emit one. */
export type AnswerKind = 'multipleChoice' | 'trueOrFalse' | 'matchConcept' | 'chooseThePath'

export interface SlideAnswerRecord {
  slideIndex: number
  kind: AnswerKind
  /** Latches true once the slide has been answered correctly. */
  isCorrect: boolean
  attempts: number
  wrongAttempts: number
  /** ms epoch of the latest attempt. */
  answeredAt: number
}

export type AnswerRecords = Map<number, SlideAnswerRecord>

/**
 * Record one evaluated attempt. Safe to call on every attempt — counts accumulate and
 * `isCorrect` latches true. Returns the updated record (the map is mutated in place).
 */
export function recordAttempt(
  records: AnswerRecords,
  slideIndex: number,
  kind: AnswerKind,
  isCorrect: boolean,
  now: number = Date.now(),
): SlideAnswerRecord {
  const r = records.get(slideIndex) ?? { slideIndex, kind, isCorrect: false, attempts: 0, wrongAttempts: 0, answeredAt: now }
  r.attempts += 1
  if (isCorrect) r.isCorrect = true
  else r.wrongAttempts += 1
  r.answeredAt = now
  records.set(slideIndex, r)
  return r
}

/** Records sorted by slide index — the `answers[]` array written to lessonProgress. */
export function sortedRecords(records: AnswerRecords): SlideAnswerRecord[] {
  return Array.from(records.values()).sort((a, b) => a.slideIndex - b.slideIndex)
}

/**
 * Percent of graded slides answered correctly with zero wrong attempts (clean first try).
 * `null` when the lesson has no graded slides, so an ungraded lesson is never recorded as 0.
 */
export function scoreOf(records: AnswerRecords | SlideAnswerRecord[]): number | null {
  const list = Array.isArray(records) ? records : Array.from(records.values())
  if (list.length === 0) return null
  const clean = list.filter((r) => r.isCorrect && r.wrongAttempts === 0).length
  return Math.round((clean / list.length) * 100)
}
