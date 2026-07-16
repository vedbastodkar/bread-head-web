'use client'
import Link from 'next/link'
import { useStudent } from '@/app/student/useStudent'
import { StudentShell, StudentSkeleton, StudentError } from '@/app/student/StudentShell'
import { CATALOG, unitLessonIds } from '@/lib/curriculum/catalog'
import { unitObjectives } from '@/lib/curriculum/lessons'

export default function CourseOverview() {
  const { data, err, loading, user, signOut } = useStudent()

  if (loading || (!data && !err)) return <StudentSkeleton />
  if (err) return <StudentError message={err} />

  const completed = new Set(data!.completedLessons)

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <Link href="/dashboard" className="text-sm text-textTitle/65 hover:text-textTitle">← Dashboard</Link>
      <h1 className="font-display text-3xl text-textTitle mt-1 mb-2">Personal Finance</h1>
      <p className="text-textTitle/65 mb-8 max-w-2xl">
        The complete Bread Head course — real money skills for teens, across ten units from budgeting to investing to taxes.
      </p>

      <div className="space-y-4">
        {CATALOG.map((u) => {
          const ids = unitLessonIds(u.unit)
          const doneCount = ids.filter((id) => completed.has(id)).length
          const pct = Math.round((doneCount / u.lessonCount) * 100)
          return (
            <div key={u.unit} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="max-w-xl">
                  <div className="font-display text-xl text-textTitle mb-1">Unit {u.unit} — {u.name}</div>
                  <p className="text-textTitle/65 text-sm">{u.description}</p>
                  {(() => {
                    const objs = unitObjectives(u.unit).slice(0, 3)
                    return objs.length > 0 ? (
                      <p className="text-xs text-textTitle/65 mt-2">You’ll learn: {objs.join(' · ')}</p>
                    ) : null
                  })()}
                </div>
                <Link href={`/mylessons/${u.unit}`} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-bgSage shrink-0">Go to Unit</Link>
              </div>
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-2 rounded-full bg-bgSage overflow-hidden max-w-xs">
                  <div className="h-full bg-brandGreen" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-xs text-textTitle/65">{doneCount}/{u.lessonCount} lessons</span>
              </div>
            </div>
          )
        })}
      </div>
    </StudentShell>
  )
}
