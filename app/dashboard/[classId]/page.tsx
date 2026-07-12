'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import {
  useDashboard, apiCall, pctComplete, attentionFlags, daysSince, type Student,
} from '../useDashboard'
import { JoinInfo } from '../parts'
import { DashboardShell, DashboardLoading, DashboardSkeleton, DashboardError } from '../DashboardShell'
import { CATALOG, TOTAL_LESSONS, unitName, completedByUnit } from '@/lib/curriculum/catalog'
import { LIBRARY, getLibraryChallenge } from '@/lib/challenges/library'
import { MoveStudentModal } from '../MoveStudentModal'
import { RemoveStudentButton } from '../RemoveStudentButton'

type SortKey = 'name' | 'done' | 'active'

export default function ClassDetail() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [sort, setSort] = useState<SortKey>('done')
  const [unitFilter, setUnitFilter] = useState<number | 'all'>('all')
  const [movingStudent, setMovingStudent] = useState<Student | null>(null)

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

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
  const otherClasses = data!.filter((c) => c.id !== cls.id && !c.archived)

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

      {/* Quick assign */}
      <QuickAssign classId={cls.id} user={user} reload={reload} />

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
                      <div className="flex items-center justify-end gap-3">
                        <button onClick={() => setMovingStudent(s)} className="text-xs text-textTitle/40 hover:text-textTitle underline">Move</button>
                        <RemoveStudentButton classId={cls.id} student={s} user={user} onRemoved={reload} />
                      </div>
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

      {movingStudent && (
        <MoveStudentModal
          student={movingStudent}
          fromClassId={cls.id}
          destinations={otherClasses.map((c) => ({ id: c.id, name: c.name }))}
          user={user}
          onClose={() => setMovingStudent(null)}
          onMoved={reload}
        />
      )}
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

type QuickType = 'lesson' | 'journal' | 'challenge'

// Compact, single-class shortcut to assign without leaving the class page.
// Lesson selection is heavy, so it links out to the general Lessons page;
// Journal authoring is minimal here (title + one-question-per-line), with a
// link to the general Journal page for a fully authored prompt. Challenge is
// a straight library pick, since the library is small and finite.
function QuickAssign({
  classId, user, reload,
}: {
  classId: string
  user: { getIdToken: () => Promise<string> } | null
  reload: () => void
}) {
  const today = new Date().toISOString().slice(0, 10)
  const [type, setType] = useState<QuickType>('challenge')
  const [challengeId, setChallengeId] = useState<string>(LIBRARY[0]?.id ?? '')
  const [journalTitle, setJournalTitle] = useState('')
  const [journalQuestions, setJournalQuestions] = useState('')
  const [title, setTitle] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [busy, setBusy] = useState(false)

  function resetForm() {
    setChallengeId(LIBRARY[0]?.id ?? '')
    setJournalTitle(''); setJournalQuestions('')
    setTitle(''); setDueDate('')
  }

  async function assign() {
    if (!user) return
    if (dueDate && dueDate < today && !confirm('This due date is in the past — assign anyway?')) return

    let payload: Record<string, unknown>
    if (type === 'challenge') {
      if (!challengeId) { alert('Pick a Budget Challenge.'); return }
      payload = { type: 'challenge', challengeId, title: title.trim() || null }
    } else {
      const questions = journalQuestions.split('\n').map((q) => q.trim()).filter(Boolean)
      if (questions.length === 0) { alert('Add at least one question (one per line).'); return }
      payload = { type: 'journal', journal: { questions, minWords: 0, minSeconds: 0 }, title: journalTitle.trim() || null }
    }
    payload.scope = 'class'
    payload.studentUids = []
    payload.dueDate = dueDate || null

    setBusy(true)
    try {
      await apiCall(user, `/api/classes/${classId}/assign`, 'POST', payload)
      resetForm()
      reload()
    } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  return (
    <section className="mb-8">
      <h2 className="font-medium text-textTitle/80 mb-3">Quick assign</h2>
      <div className="bg-white rounded-2xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          {(['challenge', 'journal', 'lesson'] as QuickType[]).map((t) => (
            <button key={t} onClick={() => setType(t)}
              className={`px-2.5 py-1 rounded-lg text-sm capitalize ${type === t ? 'bg-brandGreen text-white' : 'text-textTitle/60 hover:bg-bgSage/60'}`}>
              {t}
            </button>
          ))}
        </div>

        {type === 'challenge' && (
          <div className="space-y-2 mb-3">
            <select
              value={challengeId}
              onChange={(e) => setChallengeId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-textTitle/15 text-sm"
            >
              {LIBRARY.map((c) => (<option key={c.id} value={c.id}>{c.title}</option>))}
            </select>
            {getLibraryChallenge(challengeId) && (
              <p className="text-xs text-textTitle/60">{getLibraryChallenge(challengeId)!.prompt}</p>
            )}
            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm"
            />
          </div>
        )}

        {type === 'journal' && (
          <div className="space-y-2 mb-3">
            <input
              type="text" value={journalTitle} onChange={(e) => setJournalTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm"
            />
            <textarea
              value={journalQuestions} onChange={(e) => setJournalQuestions(e.target.value)}
              placeholder="One question per line"
              rows={3}
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm"
            />
            <Link href="/dashboard/content/journal" className="text-xs text-brandGreen hover:underline inline-block">
              Author a detailed prompt →
            </Link>
          </div>
        )}

        {type === 'lesson' && (
          <div className="mb-3">
            <p className="text-sm text-textTitle/60 mb-2">Lesson selection lives on the general Lessons page.</p>
            <Link href="/dashboard/content/lessons" className="text-xs text-brandGreen hover:underline inline-block">
              Assign lessons →
            </Link>
          </div>
        )}

        {type !== 'lesson' && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <label className="flex items-center gap-2 text-sm text-textTitle/70">
              Due
              <input
                type="date" min={today} value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="px-2 py-1 rounded-lg border border-textTitle/15 text-sm"
              />
            </label>
            <button onClick={assign} disabled={busy}
              className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {busy ? 'Assigning…' : 'Assign to this class'}
            </button>
          </div>
        )}
      </div>
    </section>
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
