'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDashboard, pctComplete, daysSince } from '../../useDashboard'
import { DashboardShell, DashboardLoading, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { CATALOG, TOTAL_LESSONS, unitName, unitLessonIds } from '@/lib/curriculum/catalog'

export default function StudentDetail() {
  const { classId, studentUid } = useParams<{ classId: string; studentUid: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  const cls = data!.find((c) => c.id === classId)
  const s = cls?.students.find((x) => x.uid === studentUid)
  if (!cls || !s) return <DashboardLoading><p className="text-textTitle/60">Student not found.</p></DashboardLoading>

  const doneSet = new Set(s.completedLessons)
  const d = daysSince(s.lastActive)

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <Link href={`/dashboard/${cls.id}`} className="text-sm text-textTitle/50 hover:text-textTitle">← {cls.name}</Link>
      <h1 className="font-display text-3xl text-textTitle mt-1 mb-1">{s.name}</h1>
      <p className="text-textTitle/60 text-sm mb-6">
        {s.completedLessons.length} / {TOTAL_LESSONS} lessons · {pctComplete(s)}% ·
        {' '}currently on U{s.currentUnit}·L{s.currentLesson} — {unitName(s.currentUnit)} ·
        {' '}last active {d === null ? '—' : d === 0 ? 'today' : `${d}d ago`}
        <span className="text-textTitle/30"> · {s.xp.toLocaleString()} XP · L{s.level}</span>
      </p>

      {/* Per-unit, per-lesson drill-down */}
      <div className="space-y-3">
        {CATALOG.map((u) => {
          const ids = unitLessonIds(u.unit)
          const done = ids.filter((id) => doneSet.has(id)).length
          const isCurrentUnit = u.unit === s.currentUnit
          return (
            <div key={u.unit} className="bg-white rounded-2xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-textTitle">
                  <span className="text-textTitle/40 mr-2">U{u.unit}</span>{u.name}
                </div>
                <div className="text-xs text-textTitle/50">{done}/{u.lessonCount}</div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ids.map((id, i) => {
                  const lessonNo = i + 1
                  const complete = doneSet.has(id)
                  const isCurrent = isCurrentUnit && lessonNo === s.currentLesson
                  const bg = complete ? '#4A5D4A' : isCurrent ? '#D1A945' : '#E6EDD9'
                  const fg = complete || isCurrent ? '#fff' : 'rgba(26,46,26,0.45)'
                  return (
                    <div
                      key={id}
                      title={`Lesson ${lessonNo}${complete ? ' — complete' : isCurrent ? ' — current' : ''}`}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-medium"
                      style={{ backgroundColor: bg, color: fg }}
                    >
                      {lessonNo}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex items-center gap-3 mt-5 text-xs text-textTitle/50">
        <span className="w-4 h-4 rounded" style={{ background: '#4A5D4A' }} /><span>Complete</span>
        <span className="w-4 h-4 rounded" style={{ background: '#D1A945' }} /><span>Current</span>
        <span className="w-4 h-4 rounded" style={{ background: '#E6EDD9' }} /><span>Not started</span>
      </div>
    </DashboardShell>
  )
}
