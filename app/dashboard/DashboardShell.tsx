'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { apiCall, attentionFlags, type ClassData } from './useDashboard'

interface ShellUser { getIdToken: () => Promise<string>; email?: string | null }

// Persistent dashboard frame: main content on the left, a rounded "bubble"
// nav panel occupying the right quarter.
export function DashboardShell({
  children, data, activeClassId, user, signOut, reload,
}: {
  children: React.ReactNode
  data: ClassData[]
  activeClassId?: string
  user: ShellUser | null
  signOut: () => Promise<void>
  reload: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [creating, setCreating] = useState(false)

  const active = data.filter((c) => !c.archived)
  const current = activeClassId ? data.find((c) => c.id === activeClassId) : undefined
  const needs = current
    ? current.students.filter((s) => attentionFlags(s, current.assignments).length > 0).length
    : 0

  async function newClass() {
    const name = window.prompt('Class name (e.g. "Period 3 — Personal Finance")')
    if (!name?.trim() || !user) return
    setCreating(true)
    try {
      const c = await apiCall(user, '/api/classes', 'POST', { name: name.trim() })
      reload()
      router.push(`/dashboard/${c.id}`)
    } catch (e: any) { alert(e?.message) } finally { setCreating(false) }
  }

  const navItem = (href: string, label: string, icon: React.ReactNode) => {
    const on = pathname === href
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
          on ? 'bg-brandGreen text-white' : 'text-textTitle/75 hover:bg-bgSage'
        }`}
      >
        <span className={on ? 'text-white' : 'text-textTitle/40'}>{icon}</span>
        {label}
      </Link>
    )
  }
  const Group = ({ title }: { title: string }) => (
    <div className="text-[11px] font-semibold tracking-wider text-textTitle/40 uppercase px-3 mt-4 mb-1">{title}</div>
  )

  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* main content — right three-quarters */}
        <div className="flex-1 min-w-0 order-2">{children}</div>

        {/* sidebar bubble — left quarter */}
        <aside className="w-full lg:w-72 shrink-0 order-1">
          <div className="lg:sticky lg:top-28 bg-white rounded-3xl shadow-sm p-4">
            <div className="px-2 pb-2">
              <div className="text-xs text-textTitle/50">Signed in</div>
              <div className="text-sm text-textTitle font-medium truncate">{user?.email}</div>
            </div>

            <Group title="Class sections" />
            <div className="space-y-0.5">
              {active.map((c) => {
                const on = c.id === activeClassId
                return (
                  <Link
                    key={c.id}
                    href={`/dashboard/${c.id}`}
                    className={`block px-3 py-2 rounded-xl text-sm truncate transition ${
                      on ? 'bg-brandGreen text-white' : 'text-textTitle/75 hover:bg-bgSage'
                    }`}
                    title={c.name}
                  >
                    {c.name}
                  </Link>
                )
              })}
              {active.length === 0 && <p className="px-3 py-2 text-xs text-textTitle/40">No active classes</p>}
            </div>

            {current && (
              <>
                <Group title="Content" />
                {navItem(`/dashboard/${current.id}/course`, 'Lessons', <IconBook />)}
                {navItem(`/dashboard/${current.id}/journal`, 'Journal', <IconPencil />)}

                <Group title="Performance" />
                {navItem(`/dashboard/${current.id}`, 'Progress', <IconChart />)}
                {needs > 0 && (
                  <Link
                    href={`/dashboard/${current.id}`}
                    className="flex items-center gap-2 mt-1 bg-red-50 text-red-700 rounded-xl px-3 py-2 text-xs hover:bg-red-100"
                  >
                    {needs} need attention
                  </Link>
                )}

                <Group title="Classroom" />
                {navItem(`/dashboard/${current.id}/roster`, 'Roster', <IconUsers />)}
                {navItem(`/dashboard/${current.id}/settings`, 'Settings', <IconGear />)}
                {navItem(`/dashboard/${current.id}/parent-letter`, 'Parent letter', <IconMail />)}
              </>
            )}

            <div className="border-t border-textTitle/10 mt-4 pt-3 space-y-2">
              <Link href="/account"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
                  pathname === '/account' ? 'bg-brandGreen text-white' : 'text-textTitle/75 hover:bg-bgSage'
                }`}>
                <span className={pathname === '/account' ? 'text-white' : 'text-textTitle/40'}><IconGear /></span>
                Account
              </Link>
              <Link href="/dashboard/courses"
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm transition ${
                  pathname === '/dashboard/courses' ? 'bg-brandGreen text-white' : 'text-textTitle/75 hover:bg-bgSage'
                }`}>
                <span className={pathname === '/dashboard/courses' ? 'text-white' : 'text-textTitle/40'}><IconGrid /></span>
                All classes
              </Link>
              <button onClick={newClass} disabled={creating}
                className="w-full px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">+ New class</button>
              <button onClick={async () => { await signOut(); router.replace('/login') }}
                className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70 hover:bg-bgSage">Sign out</button>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

// ---- tiny inline icons (16px) ----
const I = (p: React.SVGProps<SVGSVGElement>) => ({ width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, ...p })
const IconGrid = () => <svg {...I({})}><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
const IconBook = () => <svg {...I({})}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
const IconChart = () => <svg {...I({})}><path d="M3 3v18h18" /><path d="M7 15l4-4 3 3 5-6" /></svg>
const IconUsers = () => <svg {...I({})}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /></svg>
const IconGear = () => <svg {...I({})}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.82 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15H4a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 6 9.4a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 11 4.6V4a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 2.6 1.31 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 2z" /></svg>
const IconMail = () => <svg {...I({})}><rect x="2" y="4" width="20" height="16" rx="2" /><path d="m22 7-10 5L2 7" /></svg>
const IconPencil = () => <svg {...I({})}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>

// Minimal centered frame for one-off messages (e.g. "not found").
export function DashboardLoading({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">{children}</div>
    </main>
  )
}

// Loading skeleton that mirrors the shell layout (content + sidebar bubble).
export function DashboardSkeleton() {
  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 order-2 animate-pulse space-y-4">
          <div className="h-8 w-56 rounded-lg bg-white/70" />
          <div className="h-24 rounded-2xl bg-white/70" />
          <div className="grid md:grid-cols-2 gap-4">
            <div className="h-40 rounded-2xl bg-white/70" />
            <div className="h-40 rounded-2xl bg-white/70" />
          </div>
        </div>
        <aside className="w-full lg:w-72 shrink-0 order-1">
          <div className="lg:sticky lg:top-28 bg-white rounded-3xl shadow-sm p-4 animate-pulse space-y-2">
            <div className="h-4 w-32 rounded bg-bgSage" />
            <div className="h-8 rounded-xl bg-bgSage" />
            <div className="h-8 rounded-xl bg-bgSage" />
            <div className="h-8 rounded-xl bg-bgSage" />
          </div>
        </aside>
      </div>
    </main>
  )
}

// Friendly, actionable error state with a retry.
export function DashboardError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-md mx-auto bg-white rounded-3xl shadow-sm p-8 text-center mt-10">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 text-xl">!</div>
        <h1 className="font-display text-xl text-textTitle mb-1">Couldn&apos;t load this</h1>
        <p className="text-sm text-textTitle/55 mb-5 break-words">{message || 'Something went wrong. Please try again.'}</p>
        <button
          onClick={() => (onRetry ? onRetry() : window.location.reload())}
          className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm"
        >
          Try again
        </button>
      </div>
    </main>
  )
}
