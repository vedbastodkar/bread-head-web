// Pure journal helpers — NO firebase import so this is trivially unit-testable.
// The privacy-critical function here is buildSubmission: it returns ONLY metadata,
// never entry content, and is what the teacher-readable submission doc is built from.

export interface JournalConfig {
  questions: string[]
  minWords: number
  minSeconds: number
}

export interface SubmissionMeta {
  wordCount: number
  secondsSpent: number
  status: 'complete' | 'in_progress'
}

export function countWords(body: string): number {
  const t = body.trim()
  return t ? t.split(/\s+/).filter(Boolean).length : 0
}

export function journalStatus(
  wordCount: number,
  secondsSpent: number,
  minWords = 0,
  minSeconds = 0,
): 'complete' | 'in_progress' {
  return wordCount >= minWords && secondsSpent >= minSeconds ? 'complete' : 'in_progress'
}

// Uppercase UUID to match the iOS doc-id convention (categories/budget use uppercase UUIDs).
export function newEntryId(): string {
  const uuid =
    (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Date.now() + Math.floor(Math.random() * 1e9)) % 16
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        }))
  return uuid.toUpperCase()
}

// Validate a teacher's journal-assignment config. Returns null when unusable
// (no non-empty questions), mirroring sanitizeControls in the assign route.
export function sanitizeJournalConfig(raw: unknown): JournalConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const questions = Array.isArray(r.questions)
    ? r.questions.filter((q): q is string => typeof q === 'string' && q.trim().length > 0).map((q) => q.trim())
    : []
  if (questions.length === 0) return null
  const minWords = typeof r.minWords === 'number' && r.minWords > 0 ? Math.min(5000, Math.round(r.minWords)) : 0
  const minSeconds = typeof r.minSeconds === 'number' && r.minSeconds > 0 ? Math.min(7200, Math.round(r.minSeconds)) : 0
  return { questions, minWords, minSeconds }
}

// Build the teacher-visible submission record from client-reported counts.
// CRITICAL: returns ONLY {wordCount, secondsSpent, status}. Any extra fields on
// `input` (e.g. body) are ignored — content never enters a teacher-readable doc.
export function buildSubmission(
  input: { wordCount: unknown; secondsSpent: unknown },
  config: { minWords?: number; minSeconds?: number },
): SubmissionMeta {
  const wordCount = Number.isFinite(Number(input.wordCount)) ? Math.max(0, Math.round(Number(input.wordCount))) : 0
  const secondsSpent = Number.isFinite(Number(input.secondsSpent)) ? Math.max(0, Math.round(Number(input.secondsSpent))) : 0
  return { wordCount, secondsSpent, status: journalStatus(wordCount, secondsSpent, config.minWords ?? 0, config.minSeconds ?? 0) }
}
