'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'
import { CATALOG, unitLessonIds } from '@/lib/curriculum/catalog'
import type { LessonControls } from '@/lib/curriculum/controls'

export interface StudentAssignment {
  id: string
  lessonIds: string[]
  dueDate: string | null
  scope: 'class' | 'students'
  studentUids: string[]
  controls?: Partial<LessonControls>
}
export interface StudentData {
  name: string
  completedLessons: string[]
  currentUnit: number
  currentLesson: number
  assignments: StudentAssignment[]
}

// Reads the signed-in student's own users/{uid} doc (owner-readable by rules).
export function useStudent() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<StudentData | null>(null)
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

        // assignments across the student's classes (best-effort — needs rules to allow read)
        const classIds: string[] = d.profile?.classIds ?? []
        const assignments: StudentAssignment[] = []
        for (const cid of classIds) {
          try {
            const asnap = await getDocs(collection(db, 'classes', cid, 'assignments'))
            asnap.forEach((a) => {
              const ad = a.data() as any
              const applies = ad.scope === 'class' || (ad.studentUids ?? []).includes(user.uid)
              if (applies) assignments.push({
                id: a.id,
                lessonIds: ad.lessonIds ?? [],
                dueDate: ad.dueDate ?? null,
                scope: ad.scope === 'students' ? 'students' : 'class',
                studentUids: ad.studentUids ?? [],
                controls: ad.controls ?? undefined,
              })
            })
          } catch { /* rules may block assignment reads until deployed */ }
        }

        setData({
          name: d.profile?.name ?? user.email ?? 'Student',
          completedLessons: lp.completedLessons ?? [],
          currentUnit: lp.currentUnit ?? 1,
          currentLesson: lp.currentLesson ?? 1,
          assignments,
        })
      } catch (e: any) {
        setErr(e?.message || 'Failed to load')
      }
    })()
  }, [loading, user, router, reloadKey])

  return { data, err, loading, user, signOut, reload: () => setReloadKey((k) => k + 1) }
}

// ---- linear progression (mirrors iOS: sequential unlock) ----
export const LESSON_ORDER: string[] = CATALOG.flatMap((u) => unitLessonIds(u.unit))

export type LessonState = 'done' | 'open' | 'locked'

export function lessonState(id: string, completed: Set<string>): LessonState {
  if (completed.has(id)) return 'done'
  const frontier = LESSON_ORDER.findIndex((x) => !completed.has(x)) // first not-completed
  const idx = LESSON_ORDER.indexOf(id)
  return idx <= frontier ? 'open' : 'locked'
}

// where to "continue" — first not-completed lesson
export function nextLesson(completed: Set<string>): { unit: number; lesson: number } {
  const frontier = LESSON_ORDER.find((x) => !completed.has(x)) ?? LESSON_ORDER[LESSON_ORDER.length - 1]
  const m = frontier.match(/^unit(\d+)lesson(\d+)$/)
  return m ? { unit: Number(m[1]), lesson: Number(m[2]) } : { unit: 1, lesson: 1 }
}
