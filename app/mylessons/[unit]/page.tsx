'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useStudent, lessonState } from '@/app/student/useStudent'
import { StudentShell, StudentLoading, StudentSkeleton, StudentError } from '@/app/student/StudentShell'
import { CATALOG, unitLessonIds } from '@/lib/curriculum/catalog'
import { lessonName, lessonSummary, unitObjectives } from '@/lib/curriculum/lessons'

export default function UnitPage() {
  const { unit: unitParam } = useParams<{ unit: string }>()
  const unit = Number(unitParam)
  const { data, err, loading, user, signOut, pacingFrontier, assignedLessonIds } = useStudent()
  const router = useRouter()
  const [open, setOpen] = useState(true)

  if (loading || (!data && !err)) return <StudentSkeleton />
  if (err) return <StudentError message={err} />

  const u = CATALOG.find((c) => c.unit === unit)
  if (!u) return <StudentLoading><p className="text-textTitle/70">Unit not found.</p></StudentLoading>

  const completed = new Set(data!.completedLessons)
  const ids = unitLessonIds(u.unit)
  const doneCount = ids.filter((id) => completed.has(id)).length

  const firstOpen = ids.find((id) => lessonState(id, completed, pacingFrontier, assignedLessonIds) === 'open')
  const contLesson = firstOpen ? Number(firstOpen.match(/lesson(\d+)$/)![1]) : 1

  function go(lesson: number) {
    router.push(`/mylessons/${u!.unit}/${lesson}`)
  }

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <Link href="/mylessons" className="text-sm text-textTitle/70 hover:text-textTitle">← Personal Finance</Link>
      <h1 className="font-display text-3xl text-textTitle mt-1 mb-2">Unit {u.unit} — {u.name}</h1>
      <p className="text-textTitle/70 mb-5 max-w-2xl">{u.description}</p>

      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => go(contLesson)} className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm">
          {doneCount === 0 ? 'Start' : doneCount === ids.length ? 'Review' : 'Continue'}
        </button>
        <span className="text-sm text-textTitle/70">{doneCount}/{u.lessonCount} lessons complete</span>
      </div>

      {/* What you'll learn — aggregated unit objectives (from the Swift curriculum) */}
      {(() => {
        const objs = unitObjectives(u.unit).slice(0, 8)
        if (objs.length === 0) return null
        return (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
            <div className="text-xs uppercase tracking-wider text-textTitle/70 mb-3">What you’ll learn</div>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
              {objs.map((o, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-textTitle/80">
                  <span className="text-brandGreen mt-0.5">◆</span>{o}
                </li>
              ))}
            </ul>
          </div>
        )
      })()}

      <div className="rounded-2xl overflow-hidden shadow-sm">
        <button onClick={() => setOpen(!open)} className="w-full bg-textTitle text-white px-6 py-4 flex items-center gap-2 text-left">
          <span className="text-white/70">{open ? '▾' : '▸'}</span>
          <span className="font-medium">Content</span>
        </button>
        {open && (
          <div className="bg-bgSage/40 p-3 space-y-2">
            {ids.map((id, i) => {
              const state = lessonState(id, completed, pacingFrontier, assignedLessonIds)
              const lessonNo = i + 1
              const name = lessonName(u.unit, lessonNo) ?? `Lesson ${lessonNo}`
              const locked = state === 'locked'
              const inner = (
                <div className={`flex items-center gap-4 bg-white rounded-xl px-5 py-4 ${locked ? 'opacity-60' : 'hover:shadow-sm'}`}>
                  <StateBadge state={state} n={lessonNo} />
                  <div className="flex-1 min-w-0">
                    <div className="text-textTitle font-medium">Lesson {lessonNo}: {name}</div>
                    {lessonSummary(u.unit, lessonNo) && (
                      <div className="text-xs text-textTitle/70 mt-0.5">{lessonSummary(u.unit, lessonNo)}</div>
                    )}
                    <div className="text-[11px] text-textTitle/70 mt-0.5">
                      {state === 'done' ? 'Completed' : state === 'open' ? (doneCount === 0 && i === 0 ? 'Start here' : 'Ready') : 'Locked'}
                    </div>
                  </div>
                  {!locked && <span className="text-sm text-brandGreen shrink-0">{state === 'done' ? 'Review' : 'Open'} →</span>}
                  {locked && <span className="text-textTitle/70 shrink-0"><LockIcon /></span>}
                </div>
              )
              return locked
                ? <div key={id} title="Complete earlier lessons to unlock">{inner}</div>
                : <button key={id} onClick={() => go(lessonNo)} className="block w-full text-left">{inner}</button>
            })}
          </div>
        )}
      </div>
    </StudentShell>
  )
}

function StateBadge({ state, n }: { state: 'done' | 'open' | 'locked'; n: number }) {
  if (state === 'done') return <span className="w-8 h-8 rounded-full bg-brandGreen text-white flex items-center justify-center text-sm shrink-0">✓</span>
  if (state === 'open') return <span className="w-8 h-8 rounded-full bg-white ring-2 ring-brandGreen text-textTitle flex items-center justify-center text-sm shrink-0">{n}</span>
  return <span className="w-8 h-8 rounded-full bg-bgSage text-textTitle/70 flex items-center justify-center shrink-0"><LockIcon /></span>
}
function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
