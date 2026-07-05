'use client'
import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc, arrayUnion } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'
import { getLesson } from '@/lib/curriculum/lessons'
import { CATALOG } from '@/lib/curriculum/catalog'
import { lessonState, nextLesson } from '@/app/student/useStudent'
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

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    ;(async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      const d = (snap.data() ?? {}) as any
      const done = new Set<string>(d.lessonProgress?.completedLessons ?? [])
      const slideMap = d.lessonSlide ?? {}

      let t: Target | null = null
      try {
        const raw = sessionStorage.getItem('bh_lesson')
        if (raw) t = JSON.parse(raw)
        sessionStorage.removeItem('bh_lesson')
      } catch { /* noop */ }
      if (!t) t = nextLesson(done)

      if (!isTeacher && t) {
        const id = `unit${t.unit}lesson${t.lesson}`
        if (lessonState(id, done) === 'locked') t = nextLesson(done)
      }
      const id = `unit${t!.unit}lesson${t!.lesson}`
      setInitialSlide(done.has(id) ? 0 : (slideMap[id] ?? 0)) // resume unless already completed
      setTarget(t)
    })()
  }, [loading, user, isTeacher, router])

  const lessonId = target ? `unit${target.unit}lesson${target.lesson}` : ''

  const saveSlide = useCallback((i: number) => {
    if (!user || isTeacher || !lessonId) return
    setDoc(doc(db, 'users', user.uid), { lessonSlide: { [lessonId]: i } }, { merge: true }).catch(() => {})
  }, [user, isTeacher, lessonId])

  const handleComplete = useCallback(async () => {
    if (!user || isTeacher || !target) return
    try {
      await setDoc(doc(db, 'users', user.uid), {
        lessonProgress: { completedLessons: arrayUnion(lessonId), currentUnit: target.unit, currentLesson: target.lesson },
        profile: { updatedAt: new Date() },
      }, { merge: true })
    } catch { /* noop */ }
  }, [user, isTeacher, target, lessonId])

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

  const next = nextAfter(target.unit, target.lesson)
  const goNext = next ? () => { setInitialSlide(0); setTarget(next) } : undefined

  return (
    <LessonPlayer
      key={lessonId}
      lesson={lesson}
      initialSlide={initialSlide}
      onSlideChange={saveSlide}
      onComplete={handleComplete}
      onNext={goNext}
      onExit={() => router.push('/dashboard')}
    />
  )
}
