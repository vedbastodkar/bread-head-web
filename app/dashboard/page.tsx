'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { TeacherHome } from './TeacherHome'
import { StudentHome } from './StudentHome'

// Single dashboard URL — renders the teacher or student view based on role.
export default function Dashboard() {
  const { user, role, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) router.replace('/login')
  }, [loading, user, router])

  if (loading || !user) {
    return (
      <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
        <div className="max-w-6xl mx-auto animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-white/70" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-24 rounded-2xl bg-white/70" />
            <div className="h-24 rounded-2xl bg-white/70" />
            <div className="h-24 rounded-2xl bg-white/70" />
          </div>
          <div className="h-40 rounded-2xl bg-white/70" />
        </div>
      </main>
    )
  }

  const isTeacher = role === 'teacher' || role === 'admin'
  return isTeacher ? <TeacherHome /> : <StudentHome />
}
