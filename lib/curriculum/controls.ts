// Class-level lesson pacing + in-lesson controls, and the pure resolvers that
// combine a class default with per-assignment overrides.
//
// No React/client imports — safe to use from server routes and client code.
// See docs/superpowers/specs/2026-07-05-teacher-tools-design.md.

import { CATALOG, unitLessonIds } from './catalog'

// In-lesson enforcement knobs. Applied by the web LessonPlayer.
export interface LessonControls {
  lockUntilCorrect: boolean // quiz slides only unlock Next on a correct answer (with retry)
  minSecondsPerSlide: number // dwell time before Next enables (0 = off)
  noSkipAhead: boolean // disable progress-dot jumping; strictly sequential
}

export const DEFAULT_CONTROLS: LessonControls = {
  lockUntilCorrect: false,
  minSecondsPerSlide: 0,
  noSkipAhead: false,
}

// Class-level release frontier. Absent/disabled = fully unlocked.
export interface ClassPacing {
  enabled: boolean
  throughUnit: number
  throughLesson: number
}

// Minimal per-assignment shape the resolvers need.
export interface AssignmentLite {
  lessonIds: string[]
  scope: 'class' | 'students'
  studentUids: string[]
  controls?: Partial<LessonControls>
}

// Minimal per-class shape the resolvers need.
export interface ClassLite {
  teacherId?: string
  teacherIds?: string[]
  pacing?: ClassPacing | null
  lessonControls?: LessonControls | null
  assignments: AssignmentLite[]
}

// Canonical lesson ordering — mirrors LessonLogic sequential unlock.
export const LESSON_ORDER: string[] = CATALOG.flatMap((u) => unitLessonIds(u.unit))

// All teachers on a class, tolerant of the pre-co-teacher shape (only teacherId).
export function classTeacherIds(c: { teacherId?: string; teacherIds?: string[] }): string[] {
  if (c.teacherIds && c.teacherIds.length > 0) return c.teacherIds
  return c.teacherId ? [c.teacherId] : []
}

// Combine two control sets, keeping the MOST RESTRICTIVE of each field.
export function mergeControls(a: LessonControls, b: Partial<LessonControls>): LessonControls {
  return {
    lockUntilCorrect: a.lockUntilCorrect || !!b.lockUntilCorrect,
    minSecondsPerSlide: Math.max(a.minSecondsPerSlide, b.minSecondsPerSlide ?? 0),
    noSkipAhead: a.noSkipAhead || !!b.noSkipAhead,
  }
}

// Index in LESSON_ORDER of the last unlocked lesson for a class.
// Infinity when pacing is absent/disabled (fully unlocked). A frontier that
// points at an unknown lesson id also falls back to Infinity (fail-open).
export function pacingFrontierIndex(pacing: ClassPacing | null | undefined): number {
  if (!pacing || !pacing.enabled) return Infinity
  const id = `unit${pacing.throughUnit}lesson${pacing.throughLesson}`
  const idx = LESSON_ORDER.indexOf(id)
  return idx < 0 ? Infinity : idx
}

// Most permissive frontier across all the student's classes.
export function resolvePacingFrontier(classes: ClassLite[]): number {
  if (classes.length === 0) return Infinity
  return classes.reduce((max, c) => Math.max(max, pacingFrontierIndex(c.pacing)), 0)
}

// True when an assignment targets this student.
function assignmentApplies(a: AssignmentLite, studentUid: string): boolean {
  return a.scope === 'class' || a.studentUids.includes(studentUid)
}

// Effective controls for a lesson + student: class default, tightened by any
// applicable assignment overrides, then combined across classes (most restrictive).
export function resolveControls(
  lessonId: string,
  studentUid: string,
  classes: ClassLite[],
): LessonControls {
  if (classes.length === 0) return { ...DEFAULT_CONTROLS }

  let acc: LessonControls | null = null
  for (const c of classes) {
    let perClass: LessonControls = c.lessonControls
      ? mergeControls({ ...DEFAULT_CONTROLS }, c.lessonControls)
      : { ...DEFAULT_CONTROLS }
    for (const a of c.assignments) {
      if (!a.controls) continue
      if (!a.lessonIds.includes(lessonId)) continue
      if (!assignmentApplies(a, studentUid)) continue
      perClass = mergeControls(perClass, a.controls)
    }
    acc = acc ? mergeControls(acc, perClass) : perClass
  }
  return acc ?? { ...DEFAULT_CONTROLS }
}
