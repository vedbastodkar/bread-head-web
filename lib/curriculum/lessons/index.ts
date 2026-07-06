import type { Lesson } from '../slideTypes'
import generated from './generated.json'

// All lessons transcoded from the SwiftUI curriculum (scripts/transcode_lessons.py).
const LESSONS_ARR = generated as unknown as Lesson[]
const LESSONS: Record<string, Lesson> = {}
for (const l of LESSONS_ARR) LESSONS[l.id] = l

export function getLesson(unit: number, lesson: number): Lesson | null {
  return LESSONS[`unit${unit}lesson${lesson}`] ?? null
}

export function getLessonById(id: string): Lesson | null {
  return LESSONS[id] ?? null
}

export function isLessonMigrated(unit: number, lesson: number): boolean {
  return `unit${unit}lesson${lesson}` in LESSONS
}

export function lessonName(unit: number, lesson: number): string | null {
  return LESSONS[`unit${unit}lesson${lesson}`]?.name ?? null
}

export function lessonSummary(unit: number, lesson: number): string | null {
  return LESSONS[`unit${unit}lesson${lesson}`]?.description ?? null
}

export function lessonObjectives(unit: number, lesson: number): string[] {
  return LESSONS[`unit${unit}lesson${lesson}`]?.objectives ?? []
}

// Aggregated, de-duplicated objectives across every lesson in a unit.
export function unitObjectives(unit: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (let l = 1; ; l++) {
    const les = LESSONS[`unit${unit}lesson${l}`]
    if (!les) break
    for (const o of les.objectives ?? []) {
      const k = o.trim().toLowerCase()
      if (!seen.has(k)) { seen.add(k); out.push(o) }
    }
  }
  return out
}

