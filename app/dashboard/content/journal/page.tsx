'use client'
import { useEffect, useMemo, useState } from 'react'
import { useDashboard, apiCall, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { AssignedGroups } from '../AssignedGroups'
import { groupAssignments, type AssignedTarget } from '@/lib/dashboard/contentGrouping'
import { PROMPT_CATEGORIES, PROMPT_TEMPLATES, type PromptTemplate } from '@/lib/journal/prompts'

// General, class-agnostic Journal page. Teachers only ever see submission
// METADATA (counts/status) — never entry content — so this page composes
// prompts and lists completion, nothing more.
export default function JournalContentPage() {
  const { data, err, loading, user, signOut, reload } = useDashboard()

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [minWords, setMinWords] = useState(0)
  const [minSeconds, setMinSeconds] = useState(0)
  const [scope, setScope] = useState<'class' | 'students'>('class')
  const [targets, setTargets] = useState<Set<string>>(new Set())
  const [due, setDue] = useState('')
  const [editing, setEditing] = useState<AssignedTarget | null>(null)
  const [busy, setBusy] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [classId, setClassId] = useState<string>('')

  const today = new Date().toISOString().slice(0, 10)
  const activeClasses = useMemo(() => (data ?? []).filter((c) => !c.archived), [data])
  const cls = activeClasses.find((c) => c.id === classId)

  useEffect(() => {
    if (!classId && activeClasses.length > 0) setClassId(activeClasses[0].id)
  }, [activeClasses, classId])

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  function resetComposer() {
    setTitle(''); setQuestions(['']); setMinWords(0); setMinSeconds(0)
    setScope('class'); setTargets(new Set()); setDue(''); setEditing(null)
    setShowLibrary(false); setOpenCat(null)
  }

  // Fill the whole form from a ready-made Bread Head prompt set (confirm if it would clobber work).
  function applyTemplate(t: PromptTemplate) {
    const hasContent = questions.some((q) => q.trim())
    if (hasContent && !confirm(`Replace the current questions with the “${t.name}” template?`)) return
    setQuestions(t.questions.slice())
  }

  // Insert one library prompt as a question row — reuse a trailing empty row if present.
  function insertPrompt(text: string) {
    setQuestions((qs) => {
      const lastEmpty = qs.length > 0 && qs[qs.length - 1].trim() === ''
      return lastEmpty ? [...qs.slice(0, -1), text] : [...qs, text]
    })
  }

  const toggleTarget = (uid: string) =>
    setTargets((prev) => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n })

  function startEditFromTarget(t: AssignedTarget) {
    const a = t.assignment
    setEditing(t)
    setClassId(t.classId)
    setTitle(a.title ?? '')
    setQuestions(a.journal?.questions?.length ? a.journal.questions : [''])
    setMinWords(a.journal?.minWords ?? 0)
    setMinSeconds(a.journal?.minSeconds ?? 0)
    setScope(a.scope)
    setTargets(new Set(a.studentUids ?? []))
    setDue(a.dueDate ?? '')
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!user || !classId) return
    const qs = questions.map((q) => q.trim()).filter(Boolean)
    if (qs.length === 0) { alert('Add at least one prompt question.'); return }
    if (scope === 'students' && targets.size === 0) { alert('Pick at least one student.'); return }

    if (!editing && due && due < today && !confirm('That due date is in the past — assign anyway?')) return

    const payload = {
      type: 'journal',
      journal: { questions: qs, minWords, minSeconds },
      scope,
      studentUids: scope === 'students' ? Array.from(targets) : [],
      dueDate: due || null,
      title: title.trim() || null,
    }
    setBusy(true)
    try {
      if (editing) await apiCall(user, `/api/classes/${classId}/assign?id=${editing.assignment.id}`, 'PATCH', payload)
      else await apiCall(user, `/api/classes/${classId}/assign`, 'POST', payload)
      resetComposer()
      reload()
    } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  async function removeFromTarget(t: AssignedTarget) {
    if (!user) return
    if (!confirm('Remove this journal prompt?')) return
    try {
      await apiCall(user, `/api/classes/${t.classId}/assign?id=${t.assignment.id}`, 'DELETE')
      if (editing?.assignment.id === t.assignment.id) resetComposer()
      reload()
    } catch (e: any) { alert(e?.message) }
  }

  const groups = groupAssignments(
    data!,
    'journal',
    (a: Assignment) => a.title || `Journal · ${a.journal?.questions.length ?? 0} question${(a.journal?.questions.length ?? 0) > 1 ? 's' : ''}`,
  )

  return (
    <DashboardShell data={data!} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Journal</h1>
      <p className="text-textTitle/60 text-sm mb-6">
        Write journal prompts and assign them. Student responses stay private — you only see whether they wrote and how much.
      </p>

      <div className="mb-6">
        <AssignedGroups groups={groups} emptyLabel="Nothing assigned yet." onEdit={startEditFromTarget} onRemove={removeFromTarget} />
      </div>

      {/* Composer */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="text-sm font-medium text-textTitle mb-3">
          {editing ? 'Edit prompt' : 'New journal prompt'}
        </div>

        <label className="block text-sm text-textTitle/70 mb-1">Class</label>
        <select
          value={classId}
          onChange={(e) => setClassId(e.target.value)}
          disabled={!!editing}
          className={`w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3 ${editing ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          {activeClasses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          {activeClasses.length === 0 && <option value="">No active classes</option>}
        </select>

        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3"
        />

        <div className="rounded-xl bg-bgSage/60 p-3 mb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-textTitle/40">Prompt questions</div>
            <select
              value=""
              onChange={(e) => { const t = PROMPT_TEMPLATES.find((x) => x.id === e.target.value); if (t) applyTemplate(t) }}
              className="text-xs px-2 py-1 rounded-lg border border-textTitle/15 bg-white text-textTitle/70"
            >
              <option value="">Start from a template…</option>
              {PROMPT_TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {questions.map((q, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text" value={q}
                onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? e.target.value : x)))}
                placeholder={`Question ${i + 1}`}
                className="flex-1 px-3 py-2 rounded-lg border border-textTitle/15 text-sm"
              />
              {questions.length > 1 && (
                <button onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                  className="px-2 text-textTitle/40 hover:text-red-600" aria-label="Remove question">×</button>
              )}
            </div>
          ))}
          <div className="flex items-center gap-4">
            <button onClick={() => setQuestions((qs) => [...qs, ''])} className="text-xs text-brandGreen hover:underline">+ Add question</button>
            <button onClick={() => setShowLibrary((v) => !v)} className="text-xs text-brandGreen hover:underline">
              {showLibrary ? 'Hide' : 'Browse'} Bread Head prompts
            </button>
          </div>

          {showLibrary && (
            <div className="rounded-lg bg-white border border-textTitle/10 p-2 max-h-56 overflow-y-auto space-y-0.5">
              {PROMPT_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                    className="w-full flex items-center justify-between text-left text-xs font-medium text-textTitle/80 px-2 py-1.5 rounded hover:bg-bgSage"
                  >
                    {cat.name} <span className="text-textTitle/40">{openCat === cat.id ? '▾' : '▸'}</span>
                  </button>
                  {openCat === cat.id && (
                    <div className="pl-2 pb-1 space-y-1.5">
                      {cat.prompts.map((p, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-textTitle/70">
                          <button onClick={() => insertPrompt(p)} className="shrink-0 mt-0.5 text-brandGreen hover:underline">Insert</button>
                          <span>{p}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <label className="flex items-center gap-2 text-sm text-textTitle/80">Min words
              <input type="number" min={0} max={5000} value={minWords}
                onChange={(e) => setMinWords(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-right" />
            </label>
            <label className="flex items-center gap-2 text-sm text-textTitle/80">Min seconds
              <input type="number" min={0} max={7200} value={minSeconds}
                onChange={(e) => setMinSeconds(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-right" />
            </label>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          {(['class', 'students'] as const).map((s) => (
            <button key={s} onClick={() => setScope(s)}
              className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${scope === s ? 'bg-brandGreen text-white' : 'bg-bgSage text-textTitle/70'}`}>
              {s === 'class' ? 'Whole class' : 'Individuals'}
            </button>
          ))}
        </div>
        {scope === 'students' && cls && (
          <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
            {cls.students.map((s) => (
              <label key={s.uid} className="flex items-center gap-2 text-sm text-textTitle/80">
                <input type="checkbox" checked={targets.has(s.uid)} onChange={() => toggleTarget(s.uid)} />
                {s.name}
              </label>
            ))}
            {cls.students.length === 0 && <p className="text-xs text-textTitle/40">No students in this class yet.</p>}
          </div>
        )}

        <label className="block text-sm text-textTitle/70 mb-1">Due date (optional)</label>
        <input type="date" value={due} min={today} onChange={(e) => setDue(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-4" />

        <div className="flex gap-2">
          <button onClick={submit} disabled={busy || !classId}
            className="flex-1 px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Assign prompt'}
          </button>
          {editing && (
            <button onClick={resetComposer} className="px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
