'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { TOTAL_LESSONS } from '@/lib/curriculum/catalog'
import type { LessonControls, ClassPacing } from '@/lib/curriculum/controls'

export interface Student {
  uid: string
  name: string
  completedLessons: string[]
  currentUnit: number
  currentLesson: number
  xp: number
  level: number
  lastActive: string | null // ISO
}
export interface Assignment {
  id: string
  lessonIds: string[]
  scope: 'class' | 'students'
  studentUids: string[]
  dueDate: string | null
  title?: string | null
  controls?: Partial<LessonControls>
  type?: 'lesson' | 'journal'
  journal?: { questions: string[]; minWords: number; minSeconds: number }
  submissions?: Record<
    string,
    {
      status: 'complete' | 'in_progress'
      submittedAt: string | null
      // Journal submissions carry word/time metrics; lesson submissions carry the
      // set of lesson ids completed while this assignment was active.
      wordCount?: number
      secondsSpent?: number
      completedLessonIds?: string[]
    }
  >
}
export interface ClassData {
  id: string
  name: string
  joinCode: string | null
  grade: number[]
  archived: boolean
  assignments: Assignment[]
  students: Student[]
  pacing?: ClassPacing | null
  lessonControls?: LessonControls | null
  teacherId?: string
  teacherIds?: string[]
}

// Shared loader: guards the route (redirects non-teachers) and fetches all classes.
export function useDashboard() {
  const { user, role, loading, signOut } = useAuth()
  const router = useRouter()
  const [data, setData] = useState<ClassData[] | null>(null)
  const [err, setErr] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  const isTeacher = role === 'teacher' || role === 'admin'
  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    if (loading) return
    if (!user || !isTeacher) { router.replace('/login'); return }
    ;(async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/dashboard/overview', { headers: { Authorization: `Bearer ${token}` } })
        if (!res.ok) throw new Error(await res.text())
        const json = await res.json()
        setData(json.classes)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load')
      }
    })()
  }, [loading, user, isTeacher, router, reloadKey])

  return { data, err, loading, user, signOut, reload }
}

// Helper: authenticated fetch for the class-management API. Returns parsed JSON.
export async function apiCall(
  user: { getIdToken: () => Promise<string> },
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE',
  body?: unknown,
) {
  const token = await user.getIdToken()
  const res = await fetch(path, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new Error((await res.text()) || `Request failed (${res.status})`)
  return res.json()
}

// ---- shared helpers ----
export const daysSince = (iso: string | null): number | null => {
  if (!iso) return null
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
}
export const pctComplete = (s: Student) => Math.round((s.completedLessons.length / TOTAL_LESSONS) * 100)

export function median(nums: number[]): number {
  if (nums.length === 0) return 0
  const a = [...nums].sort((x, y) => x - y)
  const mid = Math.floor(a.length / 2)
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2
}

export type Flag = { type: 'overdue'; label: string }

// Lessons a student still owes on assignments whose due date has passed.
export function overdueMissing(s: Student, assignments: Assignment[]): string[] {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD, local-ish
  const done = new Set(s.completedLessons)
  const missing = new Set<string>()
  for (const a of assignments) {
    if (!a.dueDate || a.dueDate >= today) continue                 // no deadline, or not past yet
    const applies = a.scope === 'class' || a.studentUids.includes(s.uid)
    if (!applies) continue
    a.lessonIds.forEach((id) => { if (!done.has(id)) missing.add(id) })
  }
  return Array.from(missing)
}

// Needs attention = has assignment lessons past deadline that aren't done.
export function attentionFlags(s: Student, assignments: Assignment[]): Flag[] {
  const missing = overdueMissing(s, assignments)
  return missing.length > 0
    ? [{ type: 'overdue', label: `${missing.length} overdue` }]
    : []
}
