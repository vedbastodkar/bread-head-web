'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ClassData } from './useDashboard'

// Persistent class switcher (Code.org-style, top-left).
export function SectionSwitcher({ classes, currentId }: { classes: ClassData[]; currentId: string }) {
  const router = useRouter()
  const active = classes.filter((c) => !c.archived)
  return (
    <select
      value={currentId}
      onChange={(e) => router.push(`/dashboard/${e.target.value}`)}
      className="text-sm px-3 py-2 rounded-xl border border-textTitle/15 bg-white text-textTitle"
    >
      {active.map((c) => (
        <option key={c.id} value={c.id}>{c.name}</option>
      ))}
    </select>
  )
}

// Join code + link with copy buttons.
export function JoinInfo({ joinCode }: { joinCode: string | null }) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  if (!joinCode) return null
  const link = typeof window !== 'undefined' ? `${window.location.origin}/join/${joinCode}` : `/join/${joinCode}`
  const copy = (what: 'code' | 'link', value: string) => {
    navigator.clipboard?.writeText(value)
    setCopied(what)
    setTimeout(() => setCopied(null), 1500)
  }
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-textTitle/65">Join code</span>
      <button
        onClick={() => copy('code', joinCode)}
        className="font-medium text-textTitle bg-bgSage px-2 py-1 rounded-lg hover:bg-bgSage/70"
        title="Copy code"
      >
        {copied === 'code' ? 'Copied!' : joinCode}
      </button>
      <button
        onClick={() => copy('link', link)}
        className="text-textTitle/65 underline hover:text-textTitle"
        title={link}
      >
        {copied === 'link' ? 'Copied!' : 'Copy link'}
      </button>
    </div>
  )
}
