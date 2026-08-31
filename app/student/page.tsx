'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Consolidated into the role-based /dashboard.
export default function StudentRedirect() {
  const router = useRouter()
  useEffect(() => { router.replace('/dashboard') }, [router])
  return <div className="min-h-screen bg-bgSage" />
}
