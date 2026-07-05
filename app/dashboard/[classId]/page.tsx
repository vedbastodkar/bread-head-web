'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  useDashboard, apiCall, pctComplete, attentionFlags, daysSince, type Student,
} from '../useDashboard'
import { JoinInfo } from '../parts'
import { DashboardShell, DashboardLoading } from '../DashboardShell'
import { CATALOG, TOTAL_LESSONS, unitName, completedByUnit } from '@/lib/curriculum/catalog'

type SortKey = 'name' | 'done' | 'active'

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [sort, setSort] = useState<SortKey>('done')
  const [unitFilter, setUnitFilter] = useState<number | 'all'>('all')

  if (loading || (!data && !err)) return <DashboardLoading><p className="text-textTitle/60">Loading…</p></DashboardLoading>
  if (err) return <DashboardLoading><p className="text-red-600">{err}</p></DashboardLoading>

  const cls = data!.find((c) => c.id === classId)
  if (!cls) return <DashboardLoading><p className="text-textTitle/60">Class not found.</p></DashboardLoading>

  const needAttention = cls.students
    .map((s) => ({ s, flags: attentionFlags(s, cls.assignments) }))
    .filter((x) => x.flags.length > 0)

  const sorted = [...cls.students].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name)
    if (sort === 'active') return (daysSince(a.lastActive) ?? 1e9) - (daysSince(b.lastActive) ?? 1e9)
    return b.completedLessons.length - a.completedLessons.length
  })

  const units = unitFilter === 'all' ? CATALOG : CATALOG.filter((u) => u.unit === unitFilter)

  async function moveStudent(s: Student) {
    if (!user) return
    const others = data!.filter((c) => c.id !== cls!.id && !c.archived)
    if (others.length === 0) { alert('No other class to move to. Create one first.'); return }
    const choice = window.prompt(
      `Move ${s.name} to which class?\n` + others.map((c, i) => `${i + 1}. ${c.name}`).join('\n'),
    )
    const idx = Number(choice) - 1
    if (Number.isNaN(idx) || idx < 0 || idx >= others.length) return
    try {
      await apiCall(user, '/api/classes/move-student', 'POST', {
        studentUid: s.uid, fromClassId: cls!.id, toClassId: others[idx].id,
      })
      reload()
    } catch (e: any) { alert(e?.message) }
  }

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-3xl text-textTitle">{cls.name}</h1>
        <div className="flex items-center gap-3">
          <JoinInfo joinCode={cls.joinCode} />
          <button
            onClick={() => exportCsv(cls.name, cls.students)}
            className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-white"
          >↓ CSV</button>
        </div>
      </div>

      {/* Needs attention */}
      <section className="mb-8">
        <h2 className="font-medium text-textTitle/80 mb-3">
          Needs attention {needAttention.length > 0 && <span className="text-red-600">· {needAttention.length}</span>}
        </h2>
        {needAttention.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/50">Everyone's on track — no students flagged.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {needAttention.map(({ s, flags }) => (
              <Link key={s.uid} href={`/dashboard/${cls.id}/${s.uid}`} className="bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition">
                <div className="font-medium text-textTitle">{s.name}</div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {flags.map((f) => (
                    <span key={f.type} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">{f.label}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Roster table */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-3 text-sm">
          <span className="text-textTitle/50">Sort</span>
          {(['done', 'name', 'active'] as SortKey[]).map((k) => (
            <button key={k} onClick={() => setSort(k)}
              className={`px-2.5 py-1 rounded-lg ${sort === k ? 'bg-brandGreen text-white' : 'text-textTitle/60 hover:bg-white'}`}>
              {k === 'done' ? 'Progress' : k === 'name' ? 'Name' : 'Last active'}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-textTitle/50 border-b border-textTitle/10">
                <th className="py-3 px-4 font-medium">Student</th>
                <th className="py-3 px-4 font-medium">Lessons</th>
                <th className="py-3 px-4 font-medium">Progress</th>
                <th className="py-3 px-4 font-medium">Currently on</th>
                <th className="py-3 px-4 font-medium">Last active</th>
                <th className="py-3 px-4 font-medium text-right text-textTitle/30">XP</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s) => {
                const done = s.completedLessons.length
                const pct = pctComplete(s)
                const d = daysSince(s.lastActive)
                return (
                  <tr key={s.uid} className="border-b border-textTitle/5 last:border-0 hover:bg-bgSage/40">
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/${cls.id}/${s.uid}`} className="text-textTitle font-medium hover:underline">{s.name}</Link>
                    </td>
                    <td className="py-3 px-4 text-textTitle/70">{done} / {TOTAL_LESSONS}</td>
                    <td className="py-3 px-4 w-40">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-bgSage overflow-hidden">
                          <div className="h-full bg-brandGreen" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-textTitle/50 text-xs w-9 text-right">{pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-textTitle/70">U{s.currentUnit}·L{s.currentLesson}<span className="text-textTitle/40"> — {unitName(s.currentUnit)}</span></td>
                    <td className="py-3 px-4 text-textTitle/70">{d === null ? '—' : d === 0 ? 'today' : `${d}d ago`}</td>
                    <td className="py-3 px-4 text-right text-textTitle/30">{s.xp.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => moveStudent(s)} className="text-xs text-textTitle/40 hover:text-textTitle underline">Move</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-medium text-textTitle/80">Unit completion</h2>
          <select value={String(unitFilter)} onChange={(e) => setUnitFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="text-sm px-2 py-1 rounded-lg border border-textTitle/15 bg-white text-textTitle/70">
            <option value="all">All units</option>
            {CATALOG.map((u) => <option key={u.unit} value={u.unit}>U{u.unit} — {u.name}</option>)}
          </select>
        </div>
        <Heatmap students={sorted} classId={cls.id} units={units} />
      </section>
    </DashboardShell>
  )
}

function Heatmap({ students, classId, units }: { students: Student[]; classId: string; units: typeof CATALOG }) {
  return (
    <div className="overflow-x-auto bg-white rounded-2xl shadow-sm p-4">
      <table className="text-xs border-separate" style={{ borderSpacing: '3px' }}>
        <thead>
          <tr>
            <th></th>
            {units.map((u) => (<th key={u.unit} className="text-textTitle/40 font-normal w-7" title={u.name}>U{u.unit}</th>))}
          </tr>
        </thead>
        <tbody>
          {students.map((s) => {
            const byUnit = completedByUnit(s.completedLessons)
            return (
              <tr key={s.uid}>
                <td className="pr-3 whitespace-nowrap">
                  <Link href={`/dashboard/${classId}/${s.uid}`} className="text-textTitle/70 hover:underline">{s.name}</Link>
                </td>
                {units.map((u) => {
                  const done = Math.min(byUnit[u.unit] ?? 0, u.lessonCount)
                  const frac = done / u.lessonCount
                  const bg = frac === 0 ? '#E6EDD9' : frac >= 1 ? '#4A5D4A' : frac >= 0.5 ? '#7C9070' : '#B9C9A8'
                  return (<td key={u.unit}><div className="w-7 h-7 rounded-md" style={{ backgroundColor: bg }} title={`${u.name}: ${done}/${u.lessonCount}`} /></td>)
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex items-center gap-3 mt-4 text-xs text-textTitle/50">
        <span>Not started</span>
        {['#E6EDD9', '#B9C9A8', '#7C9070', '#4A5D4A'].map((c) => (<span key={c} className="w-4 h-4 rounded" style={{ background: c }} />))}
        <span>Complete</span>
      </div>
    </div>
  )
}

function exportCsv(className: string, students: Student[]) {
  const header = ['Student', 'LessonsCompleted', 'TotalLessons', 'PercentComplete', 'CurrentUnit', 'CurrentLesson', 'XP', 'Level', 'LastActive']
  const rows = students.map((s) => [s.name, s.completedLessons.length, TOTAL_LESSONS, pctComplete(s), s.currentUnit, s.currentLesson, s.xp, s.level, s.lastActive ?? ''])
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = `${className.replace(/[^\w]+/g, '_')}_progress.csv`; a.click()
  URL.revokeObjectURL(url)
}
