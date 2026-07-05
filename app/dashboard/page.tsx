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

  if (loading || !user) return <main className="min-h-screen bg-bgSage" />

  const isTeacher = role === 'teacher' || role === 'admin'
  return isTeacher ? <TeacherHome /> : <StudentHome />
}
