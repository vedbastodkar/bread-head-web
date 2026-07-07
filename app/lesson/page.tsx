'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'
import { getLesson } from '@/lib/curriculum/lessons'
import { CATALOG } from '@/lib/curriculum/catalog'
import { lessonState, nextLesson, fetchStudentClasses } from '@/app/student/useStudent'
import {
  resolvePacingFrontier,
  resolveControls,
  assignedLessonIdSet,
  LESSON_ORDER,
  DEFAULT_CONTROLS,
  type LessonControls,
  type ClassLite,
} from '@/lib/curriculum/controls'
import { LessonPlayer } from '@/components/lesson/LessonPlayer'

type Target = { unit: number; lesson: number }

function nextAfter(unit: number, lesson: number): Target | null {
  const u = CATALOG.find((c) => c.unit === unit)
  if (u && lesson < u.lessonCount) return { unit, lesson: lesson + 1 }
  if (unit < CATALOG.length) return { unit: unit + 1, lesson: 1 }
  return null
}

export default function LessonPage() {
  const { user, role, loading } = useAuth()
  const router = useRouter()
  const isTeacher = role === 'teacher' || role === 'admin'

  const [target, setTarget] = useState<Target | null>(null)
  const [initialSlide, setInitialSlide] = useState(0)
  const [classes, setClasses] = useState<ClassLite[]>([])
  const [controls, setControls] = useState<LessonControls>(DEFAULT_CONTROLS)
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    ;(async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      const d = (snap.data() ?? {}) as any
      const done = new Set<string>(d.lessonProgress?.completedLessons ?? [])
      const slideMap = d.lessonSlide ?? {}

      // Teachers preview without pacing/controls; students load their classes.
      const classIds: string[] = d.profile?.classIds ?? []
      const classesLite = isTeacher ? [] : await fetchStudentClasses(classIds)
      setClasses(classesLite)
      const frontier = resolvePacingFrontier(classesLite)
      const assigned = user ? assignedLessonIdSet(classesLite, user.uid) : new Set<string>()
      setCompletedSet(done) // for handleComplete (Task 3)

      let t: Target | null = null
      try {
        const raw = sessionStorage.getItem('bh_lesson')
        if (raw) t = JSON.parse(raw)
        sessionStorage.removeItem('bh_lesson')
      } catch { /* noop */ }
      if (!t) t = nextLesson(done)

      if (!isTeacher && t) {
        const id = `unit${t.unit}lesson${t.lesson}`
        if (lessonState(id, done, frontier, assigned) === 'locked') t = nextLesson(done)
        // Still locked (e.g. caught up to the release frontier) → clamp to the
        // last released lesson so we never drop a student into a locked lesson.
        const idx = LESSON_ORDER.indexOf(`unit${t!.unit}lesson${t!.lesson}`)
        if (idx > frontier && frontier >= 0 && frontier < LESSON_ORDER.length && !assigned.has(LESSON_ORDER[idx])) {
          const m = LESSON_ORDER[frontier].match(/^unit(\d+)lesson(\d+)$/)
          if (m) t = { unit: Number(m[1]), lesson: Number(m[2]) }
        }
      }
      const id = `unit${t!.unit}lesson${t!.lesson}`
      setInitialSlide(done.has(id) ? 0 : (slideMap[id] ?? 0)) // resume unless already completed
      setTarget(t)
    })()
  }, [loading, user, isTeacher, router])

  const lessonId = target ? `unit${target.unit}lesson${target.lesson}` : ''

  // Re-resolve controls whenever the target lesson (or loaded classes) changes.
  useEffect(() => {
    if (!lessonId || !user || isTeacher) { setControls(DEFAULT_CONTROLS); return }
    setControls(resolveControls(lessonId, user.uid, classes))
  }, [lessonId, user, isTeacher, classes])

  const saveSlide = useCallback((i: number) => {
    if (!user || isTeacher || !lessonId) return
    setDoc(doc(db, 'users', user.uid), { lessonSlide: { [lessonId]: i } }, { merge: true }).catch(() => {})
  }, [user, isTeacher, lessonId])

  const handleReport = useCallback(async (info: { lessonId: string; slide: number; text: string }) => {
    if (!user) throw new Error('Not signed in')
    const token = await user.getIdToken()
    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(info),
    })
    if (!res.ok) throw new Error('Report failed')
  }, [user])

  const handleComplete = useCallback(async () => {
    if (!user || isTeacher || !target) return
    // Only advance the personal frontier when this lesson is on the student's own
    // linear track. An out-of-order assigned lesson must NOT move currentUnit/
    // currentLesson — that pointer drives cross-app (iOS) unlock (design D3).
    const idx = LESSON_ORDER.indexOf(lessonId)
    const linearFrontier = LESSON_ORDER.findIndex((x) => !completedSet.has(x))
    const onTrack = idx >= 0 && idx <= linearFrontier
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lessonProgress: onTrack
          ? { completedLessons: arrayUnion(lessonId), currentUnit: target.unit, currentLesson: target.lesson }
          : { completedLessons: arrayUnion(lessonId) },
        profile: { updatedAt: new Date() },
      }, { merge: true })
      setCompletedSet((prev) => { const n = new Set(prev); n.add(lessonId); return n })
    } catch { /* noop */ }

    // Notify any lesson assignment this lesson belongs to (assigned layer, D6).
    // Best-effort: never blocks or throws out of handleComplete.
    for (const c of classes) {
      for (const a of c.assignments) {
        if ((a.type ?? 'lesson') !== 'lesson') continue
        if (!a.lessonIds?.includes(lessonId)) continue
        if (!(a.scope === 'class' || a.studentUids?.includes(user.uid))) continue
        try {
          await fetch('/api/lesson/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
            body: JSON.stringify({ classId: a.classId, assignmentId: a.id, lessonId }),
          })
        } catch { /* noop */ }
      }
    }
  }, [user, isTeacher, target, lessonId, completedSet, classes])

  if (loading || !target) return <div className="min-h-screen bg-bgSage" />

  const lesson = getLesson(target.unit, target.lesson)
  if (!lesson) {
    return (
      <main className="min-h-screen bg-bgSage flex flex-col items-center justify-center px-6 text-center">
        <p className="text-textTitle/60 mb-6">This lesson isn’t available.</p>
        <button onClick={() => router.push('/dashboard')} className="px-5 py-2.5 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Back to dashboard</button>
      </main>
    )
  }

  const frontier = resolvePacingFrontier(classes)
  const next = nextAfter(target.unit, target.lesson)
  const nextAllowed = next
    ? LESSON_ORDER.indexOf(`unit${next.unit}lesson${next.lesson}`) <= frontier
    : false
  const goNext = next && (isTeacher || nextAllowed)
    ? () => { setInitialSlide(0); setTarget(next) }
    : undefined

  return (
    <LessonPlayer
      key={lessonId}
      lesson={lesson}
      initialSlide={initialSlide}
      controls={controls}
      onSlideChange={saveSlide}
      onComplete={handleComplete}
      onReport={handleReport}
      onNext={goNext}
      onExit={() => router.push('/dashboard')}
    />
  )
}
