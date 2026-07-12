'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentCourseRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/mylessons') }, [router])
  return <div className="min-h-screen bg-bgSage" />
}
