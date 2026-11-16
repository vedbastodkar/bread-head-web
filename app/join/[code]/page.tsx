'use client'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { JOIN_CODE_KEY } from '@/lib/joinLink'

// /join/CODE — the link teachers copy and the parent letter prints. Remembers the code for
// this tab and hands off to /dashboard (which sends signed-out visitors through /login
// first); the student home pre-fills the "join a section" box from it.
export default function JoinLink() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  useEffect(() => {
    const clean = (code ?? '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6)
    try { if (clean) window.sessionStorage.setItem(JOIN_CODE_KEY, clean) } catch { /* private mode */ }
    router.replace('/dashboard')
  }, [code, router])
  return <main className="min-h-screen bg-bgSage" />
}
