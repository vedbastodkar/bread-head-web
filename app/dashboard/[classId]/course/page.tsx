'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useDashboard, apiCall, type Student, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardLoading } from '../../DashboardShell'
import { CATALOG, unitLessonIds, unitName, parseLessonId } from '@/lib/curriculum/catalog'
import { isLessonMigrated, lessonName, lessonSummary, lessonObjectives } from '@/lib/curriculum/lessons'
import { setLessonTarget } from '@/lib/lessonNav'
import { DEFAULT_CONTROLS, type LessonControls } from '@/lib/curriculum/controls'

export default function CoursePage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [openUnits, setOpenUnits] = useState<Set<number>>(new Set([1]))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [scope, setScope] = useState<'class' | 'students'>('class')
  const [targets, setTargets] = useState<Set<string>>(new Set())
  const [due, setDue] = useState('')
  const [title, setTitle] = useState('')
  const [overrideControls, setOverrideControls] = useState(false)
  const [controls, setControls] = useState<LessonControls>(DEFAULT_CONTROLS)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ unit: number; lesson: number } | null>(null)

  // Class-level pacing + default in-lesson controls (seeded from the loaded class).
  const [pacingEnabled, setPacingEnabled] = useState(false)
  const [throughUnit, setThroughUnit] = useState(1)
  const [throughLesson, setThroughLesson] = useState(1)
  const [classControls, setClassControls] = useState<LessonControls>(DEFAULT_CONTROLS)
  const [savingSettings, setSavingSettings] = useState(false)

  const cls = data?.find((c) => c.id === classId)

  useEffect(() => {
    if (!cls) return
    setPacingEnabled(cls.pacing?.enabled ?? false)
    setThroughUnit(cls.pacing?.throughUnit ?? 1)
    setThroughLesson(cls.pacing?.throughLesson ?? 1)
    setClassControls(cls.lessonControls ?? DEFAULT_CONTROLS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cls?.id])
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

  const sameSet = (a: string[], b: Set<string>) => a.length === b.size && a.every((x) => b.has(x))

  function resetComposer() {
    setSelected(new Set()); setTargets(new Set()); setDue(''); setTitle('')
    setScope('class'); setOverrideControls(false); setControls(DEFAULT_CONTROLS); setEditingId(null)
  }

  function startEdit(a: Assignment) {
    setEditingId(a.id)
    setSelected(new Set(a.lessonIds))
    setScope(a.scope)
    setTargets(new Set(a.studentUids ?? []))
    setDue(a.dueDate ?? '')
    setTitle(a.title ?? '')
    const hasControls = a.controls && Object.keys(a.controls).length > 0
    setOverrideControls(!!hasControls)
    setControls({ ...DEFAULT_CONTROLS, ...(a.controls ?? {}) })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!user) return
    if (selected.size === 0) { alert('Select at least one lesson.'); return }
    if (scope === 'students' && targets.size === 0) { alert('Pick at least one student.'); return }

    // Duplicate guard (create only): warn on an identical lessons+scope+targets assignment.
    if (!editingId) {
      const dup = (cls?.assignments ?? []).some((a) =>
        a.scope === scope &&
        sameSet(a.lessonIds, selected) &&
        (scope === 'class' || sameSet(a.studentUids ?? [], targets)),
      )
      if (dup && !confirm('An identical assignment already exists. Add another anyway?')) return
    }

    const payload = {
      lessonIds: Array.from(selected),
      scope,
      studentUids: scope === 'students' ? Array.from(targets) : [],
      dueDate: due || null,
      title: title.trim() || null,
      controls: overrideControls ? controls : null,
    }
    setBusy(true)
    try {
      if (editingId) await apiCall(user, `/api/classes/${classId}/assign?id=${editingId}`, 'PATCH', payload)
      else await apiCall(user, `/api/classes/${classId}/assign`, 'POST', payload)
      resetComposer()
      reload()
    } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  async function removeAssignment(id: string) {
    if (!user) return
    if (!confirm('Remove this assignment?')) return
    try { await apiCall(user, `/api/classes/${classId}/assign?id=${id}`, 'DELETE'); if (editingId === id) resetComposer(); reload() }
    catch (e: any) { alert(e?.message) }
  }

  // Completion for an assignment: how many target students finished ALL its lessons.
  function completion(a: Assignment): { done: number; total: number } {
    const roster = cls!.students
    const targetStudents = a.scope === 'class' ? roster : roster.filter((s) => (a.studentUids ?? []).includes(s.uid))
    const total = a.scope === 'class' ? roster.length : (a.studentUids ?? []).length
    const done = targetStudents.filter((s) => a.lessonIds.every((id) => s.completedLessons.includes(id))).length
    return { done, total }
  }

  const toggleExpanded = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  async function saveSettings() {
    if (!user) return
    setSavingSettings(true)
    try {
      await apiCall(user, `/api/classes/${classId}`, 'PATCH', {
        pacing: { enabled: pacingEnabled, throughUnit, throughLesson },
        lessonControls: classControls,
      })
      reload()
    } catch (e: any) { alert(e?.message) } finally { setSavingSettings(false) }
  }

  const throughUnitLessonCount = CATALOG.find((u) => u.unit === throughUnit)?.lessonCount ?? 1

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Course</h1>
      <p className="text-textTitle/60 text-sm mb-6">Browse the curriculum and assign lessons to the class or specific students.</p>

      {/* Pacing & controls */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-medium text-textTitle mb-1">Pacing &amp; controls</div>
            <p className="text-xs text-textTitle/50 max-w-md">Release the curriculum gradually and set default in-lesson rules for this class. Assignments can override these per lesson or per student.</p>
          </div>
          <button onClick={saveSettings} disabled={savingSettings}
            className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
            {savingSettings ? 'Saving…' : 'Save settings'}
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-4">
          {/* Release frontier */}
          <div>
            <label className="flex items-center gap-2 text-sm text-textTitle/80 mb-2">
              <input type="checkbox" checked={pacingEnabled} onChange={(e) => setPacingEnabled(e.target.checked)} />
              Enable pacing (lock lessons past a point)
            </label>
            {pacingEnabled && (
              <div className="flex items-center gap-2 text-sm text-textTitle/70">
                <span>Unlock through</span>
                <select value={throughUnit}
                  onChange={(e) => { const u = Number(e.target.value); setThroughUnit(u); setThroughLesson(1) }}
                  className="px-2 py-1 rounded-lg border border-textTitle/15">
                  {CATALOG.map((u) => <option key={u.unit} value={u.unit}>U{u.unit}</option>)}
                </select>
                <span>·</span>
                <select value={throughLesson} onChange={(e) => setThroughLesson(Number(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-textTitle/15">
                  {Array.from({ length: throughUnitLessonCount }, (_, i) => i + 1).map((l) => <option key={l} value={l}>L{l}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Default in-lesson controls */}
          <div className="space-y-2 text-sm text-textTitle/80">
            <div className="text-xs uppercase tracking-wider text-textTitle/40">Default lesson controls</div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={classControls.lockUntilCorrect}
                onChange={(e) => setClassControls((c) => ({ ...c, lockUntilCorrect: e.target.checked }))} />
              Lock until correct answer
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={classControls.noSkipAhead}
                onChange={(e) => setClassControls((c) => ({ ...c, noSkipAhead: e.target.checked }))} />
              No skipping ahead
            </label>
            <label className="flex items-center justify-between gap-2 max-w-[220px]">
              <span>Min seconds / slide</span>
              <input type="number" min={0} max={600} value={classControls.minSecondsPerSlide}
                onChange={(e) => setClassControls((c) => ({ ...c, minSecondsPerSlide: Math.max(0, Number(e.target.value) || 0) }))}
                className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-right" />
            </label>
          </div>
        </div>
      </div>

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
            <div className="text-sm font-medium text-textTitle mb-1">
              {editingId ? 'Edit assignment' : 'Assign'} {selected.size > 0 && <span className="text-textTitle/50">· {selected.size} lesson{selected.size > 1 ? 's' : ''}</span>}
            </div>

            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3 mt-2"
            />

            <div className="flex gap-2 mb-3">
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

            {/* Per-assignment control override */}
            <label className="flex items-center gap-2 text-sm text-textTitle/80 mb-2">
              <input type="checkbox" checked={overrideControls} onChange={(e) => setOverrideControls(e.target.checked)} />
              Custom lesson controls for this assignment
            </label>
            {overrideControls && (
              <div className="rounded-xl bg-bgSage/60 p-3 mb-3 space-y-2 text-sm text-textTitle/80">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={controls.lockUntilCorrect}
                    onChange={(e) => setControls((c) => ({ ...c, lockUntilCorrect: e.target.checked }))} />
                  Lock until correct answer
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={controls.noSkipAhead}
                    onChange={(e) => setControls((c) => ({ ...c, noSkipAhead: e.target.checked }))} />
                  No skipping ahead
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span>Min seconds / slide</span>
                  <input type="number" min={0} max={600} value={controls.minSecondsPerSlide}
                    onChange={(e) => setControls((c) => ({ ...c, minSecondsPerSlide: Math.max(0, Number(e.target.value) || 0) }))}
                    className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-right" />
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={submit} disabled={busy}
                className="flex-1 px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Assign'}
              </button>
              {editingId && (
                <button onClick={resetComposer} className="px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* existing assignments */}
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="text-sm font-medium text-textTitle mb-2">Assigned</div>
            {cls.assignments.length === 0 ? (
              <p className="text-xs text-textTitle/50">Nothing assigned yet.</p>
            ) : (
              <div className="space-y-3">
                {cls.assignments.map((a) => {
                  const { done, total } = completion(a)
                  const isOpen = expanded.has(a.id)
                  const hasControls = a.controls && Object.keys(a.controls).length > 0
                  return (
                    <div key={a.id} className="text-xs border-b border-textTitle/5 pb-3 last:border-0">
                      <div className="flex items-start justify-between gap-2">
                        <button onClick={() => toggleExpanded(a.id)} className="text-left flex-1 min-w-0">
                          <div className="text-textTitle font-medium truncate">
                            {a.title || `${a.lessonIds.length} lesson${a.lessonIds.length > 1 ? 's' : ''}`} <span className="text-textTitle/40">{isOpen ? '▾' : '▸'}</span>
                          </div>
                          <div className="text-textTitle/50">
                            {a.scope === 'class' ? 'Whole class' : `${(a.studentUids ?? []).length} student${(a.studentUids ?? []).length > 1 ? 's' : ''}`}
                            {' · '}{done}/{total} done
                            {a.dueDate && <> · Due {a.dueDate}</>}
                            {hasControls && <span className="ml-1 inline-block px-1.5 py-0.5 rounded bg-accentGold/20 text-[10px] text-textTitle/70">controls</span>}
                          </div>
                        </button>
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => startEdit(a)} className="text-brandGreen hover:underline">Edit</button>
                          <button onClick={() => removeAssignment(a.id)} className="text-red-600 hover:underline">Remove</button>
                        </div>
                      </div>
                      {isOpen && (
                        <ul className="mt-2 pl-1 space-y-0.5 text-textTitle/60">
                          {a.lessonIds.map((id) => {
                            const p = parseLessonId(id)
                            return <li key={id}>• {p ? (lessonName(p.unit, p.lesson) ?? `Unit ${p.unit} · Lesson ${p.lesson}`) : id}</li>
                          })}
                        </ul>
                      )}
                    </div>
                  )
                })}
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
