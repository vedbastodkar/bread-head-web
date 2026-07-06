'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function StudentUnitRedirect() {
  const p = useParams<{ unit: string }>()
  const router = useRouter()
  useEffect(() => { router.replace(`/dashboard/unit/${p.unit}`) }, [p, router])
  return <div className="min-h-screen bg-bgSage" />
}
