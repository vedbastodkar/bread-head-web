'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useDashboard, apiCall, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { AssignedGroups } from '../AssignedGroups'
import { groupAssignments, type AssignedTarget } from '@/lib/dashboard/contentGrouping'
import { CATALOG, unitLessonIds, unitName, parseLessonId } from '@/lib/curriculum/catalog'
import { isLessonMigrated, lessonName, lessonSummary, lessonObjectives } from '@/lib/curriculum/lessons'
import { setLessonTarget } from '@/lib/lessonNav'
import { DEFAULT_CONTROLS, type LessonControls } from '@/lib/curriculum/controls'
import { ClassTargetPicker } from '../ClassTargetPicker'
import { fanoutAssign, type ClassTarget } from '@/lib/dashboard/assignFanout'

// General, class-agnostic Lessons page. Replaces the per-class course page's
// assign flow: browse the curriculum once, then assign lesson sets to any
// one class at a time (Phase 1 — multi-class fan-out is a later task).
export default function LessonsContentPage() {
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [openUnits, setOpenUnits] = useState<Set<number>>(new Set([1]))
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [targets, setTargets] = useState<ClassTarget[]>([])
  const [title, setTitle] = useState('')
  const [overrideControls, setOverrideControls] = useState(false)
  const [controls, setControls] = useState<LessonControls>(DEFAULT_CONTROLS)
  const [editing, setEditing] = useState<AssignedTarget | null>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ unit: number; lesson: number } | null>(null)
  const [classId, setClassId] = useState<string>('')

  // Class-level pacing + default in-lesson controls, scoped to whichever class
  // is currently selected in the composer below.
  const [pacingEnabled, setPacingEnabled] = useState(false)
  const [throughUnit, setThroughUnit] = useState(1)
  const [throughLesson, setThroughLesson] = useState(1)
  const [classControls, setClassControls] = useState<LessonControls>(DEFAULT_CONTROLS)
  const [savingSettings, setSavingSettings] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const activeClasses = useMemo(() => (data ?? []).filter((c) => !c.archived), [data])
  const cls = activeClasses.find((c) => c.id === classId)

  useEffect(() => {
    if (!classId && activeClasses.length > 0) setClassId(activeClasses[0].id)
  }, [activeClasses, classId])

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
    if (e.shiftKey && anchorRef.current) {
      e.preventDefault()
      const r = rangeIds(anchorRef.current, id)
      setSelected((prev) => { const n = new Set(prev); r.forEach((x) => n.add(x)); return n })
      return
    }
    if (e.metaKey || e.ctrlKey) {
      e.preventDefault()
      setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
      anchorRef.current = id
      return
    }
    dragRef.current = { start: id, base: new Set(selected), moved: false }
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
  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

  function resetComposer() {
    setSelected(new Set()); setTargets([]); setTitle('')
    setOverrideControls(false); setControls(DEFAULT_CONTROLS); setEditing(null)
  }

  function startEditFromTarget(t: AssignedTarget) {
    const a = t.assignment
    setEditing(t)
    setSelected(new Set(a.lessonIds))
    setTargets([{
      classId: t.classId,
      className: t.className,
      dueDate: a.dueDate ?? null,
      studentUids: a.scope === 'students' ? (a.studentUids ?? []) : null,
    }])
    setTitle(a.title ?? '')
    const hasControls = a.controls && Object.keys(a.controls).length > 0
    setOverrideControls(!!hasControls)
    setControls({ ...DEFAULT_CONTROLS, ...(a.controls ?? {}) })
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!user) return
    if (selected.size === 0) { alert('Select at least one lesson.'); return }
    if (targets.length === 0) { alert('Pick at least one class.'); return }
    const emptyStudentsTarget = targets.find((t) => Array.isArray(t.studentUids) && t.studentUids.length === 0)
    if (emptyStudentsTarget) {
      alert(`Pick at least one student for ${emptyStudentsTarget.className}, or turn off "Choose specific students".`)
      return
    }

    const basePayload = {
      type: 'lesson',
      lessonIds: Array.from(selected),
      title: title.trim() || null,
      controls: overrideControls ? controls : null,
    }

    setBusy(true)
    try {
      if (editing) {
        const t = targets[0]
        const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
        const payload = {
          ...basePayload,
          scope: useStudents ? 'students' : 'class',
          studentUids: useStudents ? t.studentUids : [],
          dueDate: t.dueDate,
        }
        await apiCall(user, `/api/classes/${t.classId}/assign?id=${editing.assignment.id}`, 'PATCH', payload)
        resetComposer()
        reload()
      } else {
        if (targets.some((t) => t.dueDate && t.dueDate < today) && !confirm('One or more due dates are in the past — assign anyway?')) return
        const dup = targets.some((t) => {
          const targetCls = activeClasses.find((c) => c.id === t.classId)
          const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
          return (targetCls?.assignments ?? []).some((a) =>
            (!a.type || a.type === 'lesson') &&
            a.scope === (useStudents ? 'students' : 'class') &&
            sameSet(a.lessonIds, Array.from(selected)) &&
            (!useStudents || sameSet(a.studentUids ?? [], t.studentUids ?? [])),
          )
        })
        if (dup && !confirm('An identical assignment already exists in at least one selected class. Add anyway?')) return

        const results = await fanoutAssign((cid, body) => apiCall(user, `/api/classes/${cid}/assign`, 'POST', body), basePayload, targets)
        const failed = results.filter((r) => !r.ok)
        if (failed.length === 0) {
          resetComposer()
        } else {
          // Keep only the classes that failed, so a retry doesn't re-assign the ones that succeeded.
          setTargets((prev) => prev.filter((t) => failed.some((f) => f.classId === t.classId)))
          alert(`Assigned to ${results.length - failed.length} of ${results.length} classes — ` + failed.map((f) => `${f.className}: ${f.error}`).join('; '))
        }
        reload()
      }
    } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  async function removeFromTarget(t: AssignedTarget) {
    if (!user) return
    if (!confirm('Remove this assignment?')) return
    try {
      await apiCall(user, `/api/classes/${t.classId}/assign?id=${t.assignment.id}`, 'DELETE')
      if (editing?.assignment.id === t.assignment.id) resetComposer()
      reload()
    } catch (e: any) { alert(e?.message) }
  }

  async function saveSettings() {
    if (!user || !classId) return
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

  const groups = groupAssignments(data!, 'lesson', (a: Assignment) => `${a.lessonIds.length} lesson${a.lessonIds.length > 1 ? 's' : ''}`)

  return (
    <DashboardShell data={data!} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Lessons</h1>
      <p className="text-textTitle/60 text-sm mb-6">Browse the curriculum and assign lessons to a class or specific students.</p>

      <div className="mb-6">
        <AssignedGroups groups={groups} emptyLabel="Nothing assigned yet." onEdit={startEditFromTarget} onRemove={removeFromTarget} />
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
              {editing ? 'Edit assignment' : 'Assign'} {selected.size > 0 && <span className="text-textTitle/50">· {selected.size} lesson{selected.size > 1 ? 's' : ''}</span>}
            </div>

            <input
              type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3"
            />

            <div className="mb-3">
              <ClassTargetPicker
                classes={editing ? activeClasses.filter((c) => c.id === targets[0]?.classId) : activeClasses}
                value={targets}
                onChange={setTargets}
              />
            </div>

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
                    className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-center" />
                </label>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={submit} disabled={busy || targets.length === 0}
                className="flex-1 px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Assign'}
              </button>
              {editing && (
                <button onClick={resetComposer} className="px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pacing & controls — per-class settings, independent of the assign composer (kept at the bottom) */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mt-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-sm font-medium text-textTitle mb-1">Pacing &amp; controls</div>
            <p className="text-xs text-textTitle/50 max-w-md">Release the curriculum gradually and set default in-lesson rules for a class. Assignments can override these per lesson or per student.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-textTitle/15 text-sm"
            >
              {activeClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              {activeClasses.length === 0 && <option value="">No active classes</option>}
            </select>
            <button onClick={saveSettings} disabled={savingSettings || !classId}
              className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {savingSettings ? 'Saving…' : 'Save settings'}
            </button>
          </div>
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
                className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-center" />
            </label>
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
