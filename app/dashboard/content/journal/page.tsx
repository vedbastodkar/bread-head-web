'use client'
import { useMemo, useState } from 'react'
import { useDashboard, apiCall, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { AssignedGroups } from '../AssignedGroups'
import { groupAssignments, type AssignedTarget } from '@/lib/dashboard/contentGrouping'
import { PROMPT_CATEGORIES, PROMPT_TEMPLATES, type PromptTemplate } from '@/lib/journal/prompts'
import { ClassTargetPicker } from '../ClassTargetPicker'
import { fanoutAssign, type ClassTarget } from '@/lib/dashboard/assignFanout'
import { useToast } from '../../ToastProvider'

// General, class-agnostic Journal page. Teachers only ever see submission
// METADATA (counts/status) — never entry content — so this page composes
// prompts and lists completion, nothing more.
export default function JournalContentPage() {
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const { notify, confirm } = useToast()

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [minWords, setMinWords] = useState(0)
  const [minSeconds, setMinSeconds] = useState(0)
  const [targets, setTargets] = useState<ClassTarget[]>([])
  const [editing, setEditing] = useState<AssignedTarget | null>(null)
  const [busy, setBusy] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)
  const activeClasses = useMemo(() => (data ?? []).filter((c) => !c.archived), [data])

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))
  // Mirrors contentIdentity's normalization: trimmed, joined questions.
  const sameQuestions = (a: string[], b: string[]) =>
    a.map((q) => q.trim()).join('␟') === b.map((q) => q.trim()).join('␟')

  function resetComposer() {
    setTitle(''); setQuestions(['']); setMinWords(0); setMinSeconds(0)
    setTargets([]); setEditing(null)
    setShowLibrary(false); setOpenCat(null)
  }

  // Fill the whole form from a ready-made Bread Head prompt set (confirm if it would clobber work).
  async function applyTemplate(t: PromptTemplate) {
    const hasContent = questions.some((q) => q.trim())
    if (hasContent && !(await confirm({ message: `Replace the current questions with the “${t.name}” template?` }))) return
    setQuestions(t.questions.slice())
  }

  // Insert one library prompt as a question row — reuse a trailing empty row if present.
  function insertPrompt(text: string) {
    setQuestions((qs) => {
      const lastEmpty = qs.length > 0 && qs[qs.length - 1].trim() === ''
      return lastEmpty ? [...qs.slice(0, -1), text] : [...qs, text]
    })
  }

  function startEditFromTarget(t: AssignedTarget) {
    const a = t.assignment
    setEditing(t)
    setTitle(a.title ?? '')
    setQuestions(a.journal?.questions?.length ? a.journal.questions : [''])
    setMinWords(a.journal?.minWords ?? 0)
    setMinSeconds(a.journal?.minSeconds ?? 0)
    setTargets([{
      classId: t.classId,
      className: t.className,
      dueDate: a.dueDate ?? null,
      studentUids: a.scope === 'students' ? (a.studentUids ?? []) : null,
    }])
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!user) return
    const qs = questions.map((q) => q.trim()).filter(Boolean)
    if (qs.length === 0) { notify('Add at least one prompt question.', 'error'); return }
    if (targets.length === 0) { notify('Pick at least one class.', 'error'); return }
    const emptyStudentsTarget = targets.find((t) => Array.isArray(t.studentUids) && t.studentUids.length === 0)
    if (emptyStudentsTarget) {
      notify(`Pick at least one student for ${emptyStudentsTarget.className}, or turn off "Choose specific students".`, 'error')
      return
    }

    const basePayload = {
      type: 'journal',
      journal: { questions: qs, minWords, minSeconds },
      title: title.trim() || null,
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
        notify('Journal updated.', 'success')
      } else {
        if (targets.some((t) => t.dueDate && t.dueDate < today) && !(await confirm({ message: 'One or more due dates are in the past. Assign anyway?' }))) return
        const dup = targets.some((t) => {
          const targetCls = activeClasses.find((c) => c.id === t.classId)
          const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
          return (targetCls?.assignments ?? []).some((a) =>
            a.type === 'journal' &&
            a.scope === (useStudents ? 'students' : 'class') &&
            sameQuestions(a.journal?.questions ?? [], qs) &&
            (!useStudents || sameSet(a.studentUids ?? [], t.studentUids ?? [])),
          )
        })
        if (dup && !(await confirm({ message: 'An identical journal is already assigned in at least one selected class. Assign anyway?' }))) return

        const results = await fanoutAssign((cid, body) => apiCall(user, `/api/classes/${cid}/assign`, 'POST', body), basePayload, targets)
        const failed = results.filter((r) => !r.ok)
        if (failed.length === 0) {
          resetComposer()
          notify(`Assigned to ${results.length} ${results.length === 1 ? 'class' : 'classes'}.`, 'success')
        } else {
          // Keep only the classes that failed, so a retry doesn't re-assign the ones that succeeded.
          setTargets((prev) => prev.filter((t) => failed.some((f) => f.classId === t.classId)))
          notify(`Assigned to ${results.length - failed.length} of ${results.length} classes. ` + failed.map((f) => `${f.className}: ${f.error}`).join('; '), 'error')
        }
        reload()
      }
    } catch { notify('Something went wrong. Please try again.', 'error') } finally { setBusy(false) }
  }

  async function removeFromTarget(t: AssignedTarget) {
    if (!user) return
    if (!(await confirm({ message: 'Remove this journal prompt?', confirmLabel: 'Remove', destructive: true }))) return
    try {
      await apiCall(user, `/api/classes/${t.classId}/assign?id=${t.assignment.id}`, 'DELETE')
      if (editing?.assignment.id === t.assignment.id) resetComposer()
      reload()
      notify('Journal removed.', 'success')
    } catch { notify('Could not remove the journal. Please try again.', 'error') }
  }

  const groups = groupAssignments(
    data!,
    'journal',
    (a: Assignment) => a.title || `Journal · ${a.journal?.questions.length ?? 0} question${(a.journal?.questions.length ?? 0) > 1 ? 's' : ''}`,
  )

  return (
    <DashboardShell data={data!} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Journal</h1>
      <p className="text-textTitle/70 text-sm mb-6">
        Write journal prompts and assign them. Student responses stay private. You only see whether they wrote and how much.
      </p>

      <div className="mb-6">
        <AssignedGroups groups={groups} emptyLabel="Nothing assigned yet." onEdit={startEditFromTarget} onRemove={removeFromTarget} />
      </div>

      {/* Composer */}
      <div className="bg-white rounded-2xl shadow-sm p-5">
        <div className="text-sm font-medium text-textTitle mb-3">
          {editing ? 'Edit prompt' : 'New journal prompt'}
        </div>

        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3"
        />

        <div className="rounded-xl bg-bgSage/60 p-3 mb-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-textTitle/70">Prompt questions</div>
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
                  className="px-2 text-textTitle/70 hover:text-red-600" aria-label="Remove question">×</button>
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
                    {cat.name} <span className="text-textTitle/70">{openCat === cat.id ? '▾' : '▸'}</span>
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
                className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-center" />
            </label>
            <label className="flex items-center gap-2 text-sm text-textTitle/80">Min seconds
              <input type="number" min={0} max={7200} value={minSeconds}
                onChange={(e) => setMinSeconds(Math.max(0, Number(e.target.value) || 0))}
                className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-center" />
            </label>
          </div>
        </div>

        <div className="mb-4">
          <ClassTargetPicker
            classes={editing ? activeClasses.filter((c) => c.id === targets[0]?.classId) : activeClasses}
            value={targets}
            onChange={setTargets}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={submit} disabled={busy || targets.length === 0}
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
