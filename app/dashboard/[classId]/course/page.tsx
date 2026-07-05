'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useDashboard, apiCall, type Student } from '../../useDashboard'
import { DashboardShell, DashboardLoading } from '../../DashboardShell'
import { CATALOG, unitLessonIds, unitName } from '@/lib/curriculum/catalog'
import { isLessonMigrated, lessonName, lessonSummary, lessonObjectives } from '@/lib/curriculum/lessons'
import { setLessonTarget } from '@/lib/lessonNav'

export default function CoursePage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [openUnits, setOpenUnits] = useState<Set<number>>(new Set([1]))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scope, setScope] = useState<'class' | 'students'>('class')
  const [targets, setTargets] = useState<Set<string>>(new Set())
  const [due, setDue] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ unit: number; lesson: number } | null>(null)

  const cls = data?.find((c) => c.id === classId)
  const toggleUnitOpen = (unit: number) =>
    setOpenUnits((prev) => { const n = new Set(prev); n.has(unit) ? n.delete(unit) : n.add(unit); return n })

  // ---- range / drag multi-select over the flat lesson order ----
  const allIds = useMemo(() => CATALOG.flatMap((u) => unitLessonIds(u.unit)), [])
  const idIndex = useMemo(() => {
    const m = new Map<string, number>()
    allIds.forEach((id, i) => m.set(id, i))
    return m
  }, [allIds])
  const anchorRef = useRef<string | null>(null)
  const dragRef = useRef<{ start: string; base: Set<string>; moved: boolean } | null>(null)

  useEffect(() => {
    function onUp() {
      const d = dragRef.current
      if (d && !d.moved) {
        // no drag movement → treat as a plain click toggle
        setSelected((prev) => { const n = new Set(prev); n.has(d.start) ? n.delete(d.start) : n.add(d.start); return n })
      }
      dragRef.current = null
    }
    window.addEventListener('mouseup', onUp)
    return () => window.removeEventListener('mouseup', onUp)
  }, [])

  function rangeIds(a: string, b: string): string[] {
    const ia = idIndex.get(a), ib = idIndex.get(b)
    if (ia == null || ib == null) return []
    const [lo, hi] = ia <= ib ? [ia, ib] : [ib, ia]
    return allIds.slice(lo, hi + 1)
  }
  function onLessonDown(e: React.MouseEvent, id: string) {
    if (e.shiftKey && anchorRef.current) {           // shift → add contiguous range (either direction)
      e.preventDefault()
      const r = rangeIds(anchorRef.current, id)
      setSelected((prev) => { const n = new Set(prev); r.forEach((x) => n.add(x)); return n })
      return
    }
    if (e.metaKey || e.ctrlKey) {                     // cmd/ctrl → toggle single (add or unselect)
      e.preventDefault()
      setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
      anchorRef.current = id
      return
    }
    dragRef.current = { start: id, base: new Set(selected), moved: false }  // begin drag-select
    anchorRef.current = id
  }
  function onLessonEnter(id: string) {
    const d = dragRef.current
    if (!d) return
    d.moved = true
    const n = new Set(d.base)
    rangeIds(d.start, id).forEach((x) => n.add(x))
    setSelected(n)
  }

  const toggleUnitAll = (unit: number) => {
    const ids = unitLessonIds(unit)
    setSelected((prev) => {
      const n = new Set(prev)
      const allOn = ids.every((i) => n.has(i))
      ids.forEach((i) => (allOn ? n.delete(i) : n.add(i)))
      return n
    })
  }
  const toggleTarget = (uid: string) =>
    setTargets((prev) => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n })

  if (loading || (!data && !err)) return <DashboardLoading><p className="text-textTitle/60">Loading…</p></DashboardLoading>
  if (err) return <DashboardLoading><p className="text-red-600">{err}</p></DashboardLoading>
  if (!cls) return <DashboardLoading><p className="text-textTitle/60">Class not found.</p></DashboardLoading>

  async function assign() {
    if (!user) return
    if (selected.size === 0) { alert('Select at least one lesson.'); return }
    if (scope === 'students' && targets.size === 0) { alert('Pick at least one student.'); return }
    setBusy(true)
    try {
      await apiCall(user, `/api/classes/${classId}/assign`, 'POST', {
        lessonIds: Array.from(selected),
        scope,
        studentUids: scope === 'students' ? Array.from(targets) : [],
        dueDate: due || null,
      })
      setSelected(new Set()); setTargets(new Set()); setDue('')
      reload()
    } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  async function removeAssignment(id: string) {
    if (!user) return
    try { await apiCall(user, `/api/classes/${classId}/assign?id=${id}`, 'DELETE'); reload() }
    catch (e: any) { alert(e?.message) }
  }

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Course</h1>
      <p className="text-textTitle/60 text-sm mb-6">Browse the curriculum and assign lessons to the class or specific students.</p>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* curriculum browser */}
        <div className="lg:col-span-2 space-y-2">
          {CATALOG.map((u) => {
            const ids = unitLessonIds(u.unit)
            const chosen = ids.filter((i) => selected.has(i)).length
            const open = openUnits.has(u.unit)
            return (
              <div key={u.unit} className="bg-white rounded-2xl shadow-sm">
                <button onClick={() => toggleUnitOpen(u.unit)} className="w-full flex items-center justify-between p-4 text-left">
                  <span className="font-medium text-textTitle"><span className="text-textTitle/40 mr-2">U{u.unit}</span>{u.name}</span>
                  <span className="text-xs text-textTitle/50">{chosen > 0 ? `${chosen} selected` : `${u.lessonCount} lessons`} {open ? '▾' : '▸'}</span>
                </button>
                {open && (
                  <div className="px-4 pb-4">
                    <button onClick={() => toggleUnitAll(u.unit)} className="text-xs text-brandGreen hover:underline mb-2">Select all in unit</button>
                    <div className="space-y-1.5 select-none">
                      {ids.map((id, i) => {
                        const on = selected.has(id)
                        return (
                          <div
                            key={id}
                            onMouseDown={(e) => onLessonDown(e, id)}
                            onMouseEnter={() => onLessonEnter(id)}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer ${on ? 'bg-brandGreen/10 ring-1 ring-brandGreen/30' : 'bg-bgSage/50 hover:bg-bgSage'}`}
                          >
                            <input type="checkbox" checked={on} readOnly className="pointer-events-none" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm text-textTitle">Lesson {i + 1}: {lessonName(u.unit, i + 1) ?? ''}</div>
                              {lessonSummary(u.unit, i + 1) && (
                                <div className="text-xs text-textTitle/45 truncate">{lessonSummary(u.unit, i + 1)}</div>
                              )}
                            </div>
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => { e.stopPropagation(); setPreview({ unit: u.unit, lesson: i + 1 }) }}
                              className="text-xs text-brandGreen hover:underline shrink-0"
                            >
                              Preview
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* assign panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5 lg:sticky lg:top-28">
            <div className="text-sm font-medium text-textTitle mb-1">Assign {selected.size > 0 && <span className="text-textTitle/50">· {selected.size} lesson{selected.size > 1 ? 's' : ''}</span>}</div>
            <div className="flex gap-2 my-3">
              {(['class', 'students'] as const).map((s) => (
                <button key={s} onClick={() => setScope(s)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${scope === s ? 'bg-brandGreen text-white' : 'bg-bgSage text-textTitle/70'}`}>
                  {s === 'class' ? 'Whole class' : 'Individuals'}
                </button>
              ))}
            </div>
            {scope === 'students' && (
              <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
                {cls.students.map((s: Student) => (
                  <label key={s.uid} className="flex items-center gap-2 text-sm text-textTitle/80">
                    <input type="checkbox" checked={targets.has(s.uid)} onChange={() => toggleTarget(s.uid)} />
                    {s.name}
                  </label>
                ))}
              </div>
            )}
            <label className="block text-sm text-textTitle/70 mb-1">Due date (optional)</label>
            <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3" />
            <button onClick={assign} disabled={busy}
              className="w-full px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {busy ? 'Assigning…' : 'Assign'}
            </button>
          </div>

          {/* existing assignments */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-sm font-medium text-textTitle mb-2">Assigned</div>
            {cls.assignments.length === 0 ? (
              <p className="text-xs text-textTitle/50">Nothing assigned yet.</p>
            ) : (
              <div className="space-y-2">
                {cls.assignments.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-2 text-xs border-b border-textTitle/5 pb-2 last:border-0">
                    <div>
                      <div className="text-textTitle">{a.lessonIds.length} lesson{a.lessonIds.length > 1 ? 's' : ''} · {a.scope === 'class' ? 'Whole class' : `${a.studentUids.length} student${a.studentUids.length > 1 ? 's' : ''}`}</div>
                      {a.dueDate && <div className="text-textTitle/50">Due {a.dueDate}</div>}
                    </div>
                    <button onClick={() => removeAssignment(a.id)} className="text-red-600 hover:underline shrink-0">Remove</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lesson preview — STUB (real slide player pending content migration) */}
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setPreview(null)}>
          <div className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs text-textTitle/50 mb-1">{unitName(preview.unit)}</div>
            <h2 className="font-display text-2xl text-textTitle mb-4">Unit {preview.unit} · Lesson {preview.lesson}</h2>

            <div className="bg-bgSage rounded-2xl p-5 mb-5">
              <div className="text-xs uppercase tracking-wider text-textTitle/40 mb-1">Overview</div>
              <p className="text-sm text-textTitle/70">
                {lessonSummary(preview.unit, preview.lesson) ?? 'No summary available.'}
              </p>
              {lessonObjectives(preview.unit, preview.lesson).length > 0 && (
                <>
                  <div className="text-xs uppercase tracking-wider text-textTitle/40 mt-4 mb-1">Objectives</div>
                  <ul className="space-y-1">
                    {lessonObjectives(preview.unit, preview.lesson).map((o, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-textTitle/70"><span className="text-brandGreen mt-0.5">◆</span>{o}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            {isLessonMigrated(preview.unit, preview.lesson) ? (
              <Link
                href="/lesson"
                onClick={() => setLessonTarget(preview.unit, preview.lesson)}
                className="block w-full text-center px-4 py-3 rounded-xl bg-brandGreen text-white text-sm mb-2"
              >
                ▶ Walk through the lesson
              </Link>
            ) : (
              <>
                <button
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-brandGreen/40 text-white text-sm cursor-not-allowed mb-2"
                  title="Not migrated yet"
                >
                  ▶ Walk through the lesson (coming soon)
                </button>
                <p className="text-[11px] text-textTitle/40 text-center mb-4">
                  This lesson isn’t migrated to the web yet.
                </p>
              </>
            )}

            <button onClick={() => setPreview(null)} className="w-full px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70 hover:bg-bgSage">
              Close
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
