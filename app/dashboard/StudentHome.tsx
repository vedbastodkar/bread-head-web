'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useStudent, nextLesson } from '@/app/student/useStudent'
import { StudentShell, StudentLoading } from '@/app/student/StudentShell'
import { CATALOG, TOTAL_LESSONS, unitLessonIds, unitName } from '@/lib/curriculum/catalog'
import { lessonName, getLesson } from '@/lib/curriculum/lessons'
import { setLessonTarget } from '@/lib/lessonNav'

export function StudentHome() {
  const { data, err, loading, user, signOut } = useStudent()

  if (loading || (!data && !err)) return <StudentLoading><p className="text-textTitle/60">Loading…</p></StudentLoading>
  if (err) return <StudentLoading><p className="text-red-600">{err}</p></StudentLoading>

  const completed = new Set(data!.completedLessons)
  const cont = nextLesson(completed)
  const started = completed.size > 0
  const today = new Date().toISOString().slice(0, 10)

  const assignedTodo = data!.assignments
    .flatMap((a) => a.lessonIds
      .filter((id) => !completed.has(id))
      .map((id) => ({ id, dueDate: a.dueDate, overdue: !!a.dueDate && a.dueDate < today })))
  const seen = new Set<string>()
  const assigned = assignedTodo.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)))

  const u = CATALOG.find((c) => c.unit === cont.unit)!
  const unitIds = unitLessonIds(u.unit)
  const unitDone = unitIds.filter((id) => completed.has(id)).length
  const unitPct = Math.round((unitDone / u.lessonCount) * 100)
  const lname = lessonName(cont.unit, cont.lesson) ?? `Lesson ${cont.lesson}`
  const slideCount = getLesson(cont.unit, cont.lesson)?.slides.length ?? 0

  const parseId = (id: string) => {
    const m = id.match(/^unit(\d+)lesson(\d+)$/); return m ? { unit: +m[1], lesson: +m[2] } : { unit: 1, lesson: 1 }
  }

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <h1 className="font-display text-3xl text-textTitle mb-6">My Dashboard</h1>

      {/* Progress at a glance */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <StatTile label="Level" value={data!.gamification.level} accent />
        <StatTile label="XP" value={data!.gamification.xp.toLocaleString()} />
        <StatTile label="Lessons done" value={`${completed.size} / ${TOTAL_LESSONS}`} />
      </div>

      {/* Currently assigned */}
      <section className="mb-6">
        <h2 className="text-xs font-semibold tracking-wider text-textTitle/40 uppercase mb-2">
          Currently assigned to me {assigned.length > 0 && <span className="text-red-600">· {assigned.length}</span>}
        </h2>
        {assigned.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/50">Nothing assigned right now. You’re all caught up.</div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assigned.map((a) => {
              const p = parseId(a.id)
              return (
                <Link key={a.id} href="/lesson" onClick={() => setLessonTarget(p.unit, p.lesson)}
                  className={`bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition border-l-4 ${a.overdue ? 'border-red-500' : 'border-accentGold'}`}>
                  <div className="text-sm font-medium text-textTitle truncate">{lessonName(p.unit, p.lesson) ?? `Lesson ${p.lesson}`}</div>
                  <div className="text-xs text-textTitle/50">{unitName(p.unit)}</div>
                  {a.dueDate && <div className={`text-xs mt-1 ${a.overdue ? 'text-red-600' : 'text-textTitle/50'}`}>{a.overdue ? 'Overdue' : 'Due'} {a.dueDate}</div>}
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Course card */}
      <div className="rounded-2xl shadow-sm overflow-hidden bg-white mb-4">
        <div className="bg-brandGreen text-white px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-display text-2xl">Personal Finance</div>
            <div className="text-white/80 text-sm">Know your dough — the full course</div>
          </div>
          <Link href="/dashboard/course" className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm">View course</Link>
        </div>
        <div className="px-6 py-3 flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-bgSage overflow-hidden">
            <div className="h-full bg-brandGreen" style={{ width: `${Math.round((completed.size / TOTAL_LESSONS) * 100)}%` }} />
          </div>
          <span className="text-xs text-textTitle/50">{completed.size} / {TOTAL_LESSONS} lessons</span>
        </div>
      </div>

      {/* Current unit | current lesson */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="text-xs uppercase tracking-wider text-textTitle/40 mb-2">Current unit</div>
          <div className="font-display text-xl text-textTitle mb-1">Unit {u.unit} — {u.name}</div>
          <p className="text-textTitle/60 text-sm mb-4">{u.description}</p>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 rounded-full bg-bgSage overflow-hidden">
              <div className="h-full bg-brandGreen" style={{ width: `${unitPct}%` }} />
            </div>
            <span className="text-xs text-textTitle/50">{unitDone}/{u.lessonCount}</span>
          </div>
          <Link href={`/dashboard/unit/${u.unit}`} className="mt-auto self-start px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-bgSage">Go to Unit</Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col">
          <div className="text-xs uppercase tracking-wider text-textTitle/40 mb-2">Current lesson</div>
          <div className="font-display text-xl text-textTitle mb-1">Lesson {cont.lesson}: {lname}</div>
          <p className="text-textTitle/60 text-sm mb-4">
            {unitName(cont.unit)} · {slideCount} slide{slideCount !== 1 ? 's' : ''}. {started ? 'Pick up where you left off.' : 'Your first lesson — let’s go.'}
          </p>
          <Link href="/lesson" onClick={() => setLessonTarget(cont.unit, cont.lesson)} className="mt-auto self-start px-6 py-2.5 rounded-xl bg-brandGreen text-white text-sm">
            {started ? 'Continue' : 'Start'}
          </Link>
        </div>
      </div>

      <SectionsPanel user={user} />
    </StudentShell>
  )
}

function StatTile({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 text-center">
      <div className={`font-display text-3xl mb-1 ${accent ? 'text-accentGold' : 'text-textTitle'}`}>{value}</div>
      <div className="text-xs uppercase tracking-wider text-textTitle/40">{label}</div>
    </div>
  )
}

interface Section { id: string; name: string; course: string; teacherName: string; joinCode: string | null; archived: boolean }

function SectionsPanel({ user }: { user: { getIdToken: () => Promise<string> } | null }) {
  const [sections, setSections] = useState<Section[] | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')

  async function load() {
    if (!user) return
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/student/sections', { headers: { Authorization: `Bearer ${token}` } })
      setSections(res.ok ? (await res.json()).sections : [])
    } catch { setSections([]) }
  }
  useEffect(() => { load() }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  async function join(e: React.FormEvent) {
    e.preventDefault()
    if (!user || !code.trim()) return
    setBusy(true); setMsg('')
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/student/join', {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ joinCode: code.trim() }),
      })
      const j = await res.json()
      if (!res.ok) setMsg(j.error || 'Could not join')
      else { setMsg(`Joined ${j.name}.`); setCode(''); load() }
    } catch { setMsg('Could not join') } finally { setBusy(false) }
  }

  const activeSections = (sections ?? []).filter((s) => !s.archived)

  return (
    <div className="mt-10 space-y-8">
      <section>
        <h2 className="font-display text-2xl text-textTitle mb-3">Join a section</h2>
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="max-w-sm">
            <div className="font-medium text-textTitle mb-1">Join a section</div>
            <p className="text-sm text-textTitle/60">Join your teacher’s section by entering their section code.</p>
          </div>
          <form onSubmit={join} className="flex items-center gap-2">
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Section Code (ABCDEF)"
              className="px-4 py-2.5 rounded-xl border border-textTitle/15 text-sm w-56 focus:border-brandGreen outline-none uppercase" />
            <button type="submit" disabled={busy || !code.trim()} className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-50">
              {busy ? 'Joining…' : 'Join section'}
            </button>
          </form>
        </div>
        {msg && <p className="text-sm text-textTitle/60 mt-2">{msg}</p>}
      </section>

      <section>
        <h2 className="font-display text-2xl text-textTitle mb-1">Classroom Sections</h2>
        <p className="text-sm text-textTitle/60 mb-4 max-w-2xl">Sections you have joined. Your teacher can see your course progress and reset your password if you forget it.</p>
        {sections === null ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/40">Loading…</div>
        ) : activeSections.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/50">You haven’t joined a section yet. Enter your teacher’s code above.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-textTitle/50 border-b border-textTitle/10 bg-bgSage/40">
                  <th className="py-3 px-4 font-medium">Section</th>
                  <th className="py-3 px-4 font-medium">Course</th>
                  <th className="py-3 px-4 font-medium">Teacher</th>
                  <th className="py-3 px-4 font-medium">Section Code</th>
                </tr>
              </thead>
              <tbody>
                {activeSections.map((s) => (
                  <tr key={s.id} className="border-b border-textTitle/5 last:border-0">
                    <td className="py-3 px-4 text-textTitle">{s.name}</td>
                    <td className="py-3 px-4 text-textTitle/70">{s.course}</td>
                    <td className="py-3 px-4 text-textTitle/70">{s.teacherName}</td>
                    <td className="py-3 px-4 text-textTitle/70">{s.joinCode ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
