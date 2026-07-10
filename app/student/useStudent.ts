'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'
import {
  LESSON_ORDER,
  DEFAULT_CONTROLS,
  resolvePacingFrontier,
  resolveControls,
  assignedLessonIdSet,
  type LessonControls,
  type ClassLite,
  type ClassPacing,
  type AssignmentLite,
} from '@/lib/curriculum/controls'

export interface StudentAssignment {
  id: string
  classId: string
  lessonIds: string[]
  dueDate: string | null
  scope: 'class' | 'students'
  studentUids: string[]
  controls?: Partial<LessonControls>
  title?: string | null
  type?: 'lesson' | 'journal' | 'challenge'
  journal?: { questions: string[]; minWords: number; minSeconds: number }
  challengeId?: string
}
export interface Gamification {
  xp: number
  lifetimeXP: number
  level: number
}
export interface StudentData {
  name: string
  completedLessons: string[]
  currentUnit: number
  currentLesson: number
  assignments: StudentAssignment[]
  gamification: Gamification
}

// Best-effort load of the student's classes (pacing + controls + assignments).
// Class-doc reads need the rostered-student rule; if it isn't deployed yet the
// try/catch degrades to unlimited pacing / default controls.
export async function fetchStudentClasses(classIds: string[]): Promise<ClassLite[]> {
  const out: ClassLite[] = []
  for (const cid of classIds) {
    let pacing: ClassPacing | null = null
    let lessonControls: LessonControls | null = null
    const assignments: AssignmentLite[] = []
    try {
      const cdoc = await getDoc(doc(db, 'classes', cid))
      const cd = (cdoc.data() ?? {}) as any
      pacing = cd.pacing ?? null
      lessonControls = cd.lessonControls ?? null
    } catch { /* rules may block class-doc read until deployed */ }
    try {
      const asnap = await getDocs(collection(db, 'classes', cid, 'assignments'))
      asnap.forEach((a) => {
        const ad = a.data() as any
        assignments.push({
          id: a.id,
          classId: cid,
          dueDate: ad.dueDate ?? null,
          lessonIds: ad.lessonIds ?? [],
          scope: ad.scope === 'students' ? 'students' : 'class',
          studentUids: ad.studentUids ?? [],
          controls: ad.controls ?? undefined,
          title: ad.title ?? null,
          type: ad.type === 'journal' ? 'journal' : ad.type === 'challenge' ? 'challenge' : 'lesson',
          journal: ad.journal ?? undefined,
          challengeId: ad.challengeId ?? undefined,
        })
      })
    } catch { /* rules may block assignment reads until deployed */ }
    out.push({ pacing, lessonControls, assignments })
  }
  return out
}

// Reads the signed-in student's own users/{uid} doc (owner-readable by rules).
export function useStudent() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<StudentData | null>(null)
  const [classes, setClasses] = useState<ClassLite[]>([])
  const [err, setErr] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    ;(async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid))
        const d = (snap.data() ?? {}) as any
        const lp = d.lessonProgress ?? {}
        const gp = d.gamificationProgress ?? {}
        const classIds: string[] = d.profile?.classIds ?? []

        const classesLite = await fetchStudentClasses(classIds)
        setClasses(classesLite)

        // Applicable assignments for the "currently assigned" UI.
        const assignments: StudentAssignment[] = []
        classIds.forEach((cid, i) => {
          classesLite[i].assignments.forEach((a, j) => {
            const applies = a.scope === 'class' || a.studentUids.includes(user.uid)
            if (applies) assignments.push({
              id: a.id ?? `${cid}:${j}`,
              classId: cid,
              lessonIds: a.lessonIds,
              dueDate: a.dueDate ?? null,
              scope: a.scope,
              studentUids: a.studentUids,
              controls: a.controls,
              title: a.title,
              type: a.type ?? 'lesson',
              journal: a.journal,
              challengeId: a.challengeId,
            })
          })
        })

        setData({
          name: d.profile?.name ?? user.email ?? 'Student',
          completedLessons: lp.completedLessons ?? [],
          currentUnit: lp.currentUnit ?? 1,
          currentLesson: lp.currentLesson ?? 1,
          assignments,
          gamification: {
            xp: gp.xp ?? 0,
            lifetimeXP: gp.lifetimeXP ?? gp.xp ?? 0,
            level: gp.level ?? 1,
          },
        })
      } catch (e: any) {
        setErr(e?.message || 'Failed to load')
      }
    })()
  }, [loading, user, router, reloadKey])

  const pacingFrontier = resolvePacingFrontier(classes)
  const assignedLessonIds = user ? assignedLessonIdSet(classes, user.uid) : new Set<string>()
  const controlsForLesson = (id: string): LessonControls =>
    user ? resolveControls(id, user.uid, classes) : { ...DEFAULT_CONTROLS }

  return {
    data, err, loading, user, signOut,
    pacingFrontier, controlsForLesson, assignedLessonIds,
    reload: () => setReloadKey((k) => k + 1),
  }
}

// ---- linear progression (mirrors iOS: sequential unlock) ----
export { LESSON_ORDER }

// Pure curriculum logic now lives in controls.ts (firebase-free → unit-testable).
export { lessonState, nextLesson } from '@/lib/curriculum/controls'
export type { LessonState } from '@/lib/curriculum/controls'
