'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useDashboard, pctComplete, attentionFlags } from './useDashboard'
import { DashboardShell, DashboardSkeleton, DashboardError } from './DashboardShell'
import { JoinInfo } from './parts'

export function TeacherHome() {
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [showArchived, setShowArchived] = useState(false)

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  const active = data!.filter((c) => !c.archived)
  const cards = data!.filter((c) => (showArchived ? c.archived : !c.archived))

  const allStudents = active.flatMap((c) => c.students)
  const totalStudents = allStudents.length
  const avgProgress = totalStudents
    ? Math.round(allStudents.reduce((a, s) => a + pctComplete(s), 0) / totalStudents)
    : 0

  const flagged = active.flatMap((c) =>
    c.students
      .map((s) => ({ s, cls: c, flags: attentionFlags(s, c.assignments) }))
      .filter((x) => x.flags.length > 0),
  )

  return (
    <DashboardShell data={data!} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">All Classes</h1>
      <p className="text-textTitle/65 text-sm mb-6">Everything across your classes at a glance.</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <AggStat label="Classes" value={String(active.length)} />
        <AggStat label="Students" value={String(totalStudents)} />
        <AggStat label="Avg progress" value={`${avgProgress}%`} />
        <AggStat label="Need attention" value={String(flagged.length)} highlight={flagged.length > 0} />
      </div>

      {flagged.length > 0 && (
        <section className="mb-10">
          <h2 className="font-medium text-textTitle/80 mb-3">Needs attention · all classes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {flagged.map(({ s, cls, flags }) => (
              <Link key={`${cls.id}-${s.uid}`} href={`/dashboard/${cls.id}/${s.uid}`}
                className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition">
                <div className="font-medium text-textTitle">{s.name}</div>
                <div className="text-xs text-textTitle/65 mb-2">{cls.name}</div>
                <div className="flex flex-wrap gap-1.5">
                  {flags.map((f) => (
                    <span key={f.type} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">{f.label}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 mb-4 text-sm">
        {(['active', 'archived'] as const).map((k) => {
          const on = (k === 'archived') === showArchived
          return (
            <button key={k} onClick={() => setShowArchived(k === 'archived')}
              className={`px-3 py-1 rounded-lg ${on ? 'bg-brandGreen text-white' : 'text-textTitle/65 hover:bg-white'}`}>
              {k === 'active' ? 'Teaching' : 'Archived'}
            </button>
          )
        })}
      </div>

      {cards.length === 0 && (
        <p className="text-textTitle/65">{showArchived ? 'No archived classes.' : 'No classes yet — use “New class”.'}</p>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {cards.map((cls) => {
          const needHelp = cls.students.filter((s) => attentionFlags(s, cls.assignments).length > 0).length
          const avgPct = cls.students.length
            ? Math.round(cls.students.reduce((a, s) => a + pctComplete(s), 0) / cls.students.length)
            : 0
          return (
            <div key={cls.id} className="bg-white rounded-2xl shadow-sm p-6">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/dashboard/${cls.id}`} className="font-display text-xl text-textTitle hover:underline">{cls.name}</Link>
                <JoinInfo joinCode={cls.joinCode} />
              </div>
              <Link href={`/dashboard/${cls.id}`} className="flex items-center gap-6 mt-5 text-sm">
                <Stat label="Students" value={String(cls.students.length)} />
                <Stat label="Avg progress" value={`${avgPct}%`} />
                <Stat label="Need attention" value={String(needHelp)} highlight={needHelp > 0} />
              </Link>
            </div>
          )
        })}
      </div>
    </DashboardShell>
  )
}

function AggStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <div className={`font-display text-3xl ${highlight ? 'text-red-600' : 'text-textTitle'}`}>{value}</div>
      <div className="text-textTitle/65 text-xs mt-1">{label}</div>
    </div>
  )
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className={`font-display text-2xl ${highlight ? 'text-red-600' : 'text-textTitle'}`}>{value}</div>
      <div className="text-textTitle/65 text-xs">{label}</div>
    </div>
  )
}
