'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { TOTAL_LESSONS } from '@/lib/curriculum/catalog'
import type { StudentData } from './useStudent'
import { AppPrompt } from '@/app/components/AppPrompt'

interface ShellUser { email?: string | null }

// Student dashboard frame — same right-quarter bubble layout as the teacher shell.
export function StudentShell({
  children, data, user, signOut,
}: {
  children: React.ReactNode
  data: StudentData
  user: ShellUser | null
  signOut: () => Promise<void>
}) {
  const router = useRouter()
  const pathname = usePathname()
  const done = data.completedLessons.length
  const pct = Math.round((done / TOTAL_LESSONS) * 100)
  const navItem = (href: string, label: string) => {
    const on = pathname === href
    return (
      <Link href={href} className={`block px-3 py-2 rounded-xl text-sm transition ${on ? 'bg-brandGreen text-white' : 'text-textTitle/75 hover:bg-bgSage'}`}>
        {label}
      </Link>
    )
  }

  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 order-2">{children}</div>

        <aside className="w-full lg:w-72 shrink-0 order-1">
          <div className="lg:sticky lg:top-28 bg-white rounded-3xl shadow-sm p-5">
            <div className="text-xs text-textTitle/50">Signed in</div>
            <div className="text-sm text-textTitle font-medium truncate mb-4">{data.name}</div>

            <div className="text-[11px] font-semibold tracking-wider text-textTitle/40 uppercase mb-2">My progress</div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-textTitle/70">Lessons</span>
              <span className="text-textTitle font-medium">{done} / {TOTAL_LESSONS}</span>
            </div>
            <div className="h-2 rounded-full bg-bgSage overflow-hidden mb-1">
              <div className="h-full bg-brandGreen" style={{ width: `${pct}%` }} />
            </div>
            <div className="text-xs text-textTitle/50 mb-5">{pct}% complete</div>

            <div className="text-[11px] font-semibold tracking-wider text-textTitle/40 uppercase mb-1">Menu</div>
            <nav className="space-y-0.5 mb-5">
              {navItem('/dashboard', 'Dashboard')}
              {navItem('/mylessons', 'Lessons')}
              {navItem('/myjournal', 'Journal')}
              {navItem('/mybudget', 'My Budget')}
              {navItem('/grades', 'Grades')}
              {navItem('/account', 'Account')}
            </nav>

            <button
              onClick={async () => { await signOut(); router.replace('/login') }}
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70 hover:bg-bgSage"
            >
              Sign out
            </button>
          </div>
        </aside>
      </div>

      <AppPrompt />
    </main>
  )
}

export function StudentLoading({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto">{children}</div>
    </main>
  )
}

// Loading skeleton mirroring the student shell layout.
export function StudentSkeleton() {
  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        <div className="flex-1 min-w-0 order-2 animate-pulse space-y-4">
          <div className="h-8 w-48 rounded-lg bg-white/70" />
          <div className="grid grid-cols-3 gap-3">
            <div className="h-20 rounded-2xl bg-white/70" />
            <div className="h-20 rounded-2xl bg-white/70" />
            <div className="h-20 rounded-2xl bg-white/70" />
          </div>
          <div className="h-28 rounded-2xl bg-white/70" />
        </div>
        <aside className="w-full lg:w-72 shrink-0 order-1">
          <div className="lg:sticky lg:top-28 bg-white rounded-3xl shadow-sm p-5 animate-pulse space-y-3">
            <div className="h-4 w-28 rounded bg-bgSage" />
            <div className="h-2 rounded-full bg-bgSage" />
            <div className="h-8 rounded-xl bg-bgSage" />
            <div className="h-8 rounded-xl bg-bgSage" />
          </div>
        </aside>
      </div>
    </main>
  )
}

// Friendly, actionable error state with a retry.
export function StudentError({ message, onRetry }: { message?: string; onRetry?: () => void }) {
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
