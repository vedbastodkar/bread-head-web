'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { setLessonTarget } from '@/lib/lessonNav'

// Legacy route — forwards to the generic /lesson (which gates access).
export default function LearnRedirect() {
  const p = useParams<{ unit: string; lesson: string }>()
  const router = useRouter()
  useEffect(() => {
    setLessonTarget(Number(p.unit), Number(p.lesson))
    router.replace('/lesson')
  }, [p, router])
  return <div className="min-h-screen bg-bgSage" />
}
