'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

// Legacy route — forwards to the embedded player at /mylessons/[unit]/[lesson]
// (which gates access). Kept so external /learn/... links keep working.
export default function LearnRedirect() {
  const p = useParams<{ unit: string; lesson: string }>()
  const router = useRouter()
  useEffect(() => {
    router.replace(`/mylessons/${p.unit}/${p.lesson}`)
  }, [p, router])
  return <div className="min-h-screen bg-bgSage" />
}
