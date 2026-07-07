'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useDashboard, apiCall, type Student, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardLoading, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { PROMPT_CATEGORIES, PROMPT_TEMPLATES, type PromptTemplate } from '@/lib/journal/prompts'

// Teacher journal authoring: add journal prompts and assign them to the class or
// specific students. Teachers only ever see submission METADATA (counts/status) —
// never entry content — so this page composes prompts and lists completion, nothing more.
export default function TeacherJournalPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()

  const [title, setTitle] = useState('')
  const [questions, setQuestions] = useState<string[]>([''])
  const [minWords, setMinWords] = useState(0)
  const [minSeconds, setMinSeconds] = useState(0)
  const [scope, setScope] = useState<'class' | 'students'>('class')
  const [targets, setTargets] = useState<Set<string>>(new Set())
  const [due, setDue] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [showLibrary, setShowLibrary] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)

  const cls = data?.find((c) => c.id === classId)

  // If the loaded class changes out from under us, reset the composer.
  useEffect(() => { resetComposer() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [classId])

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />
  if (!cls) return <DashboardLoading><p className="text-textTitle/60">Class not found.</p></DashboardLoading>

  const journalAssignments = cls.assignments.filter((a) => a.type === 'journal')

  function resetComposer() {
    setTitle(''); setQuestions(['']); setMinWords(0); setMinSeconds(0)
    setScope('class'); setTargets(new Set()); setDue(''); setEditingId(null)
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
  const toggleExpanded = (id: string) =>
    setExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  function startEdit(a: Assignment) {
    setEditingId(a.id)
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
    if (!user) return
    const qs = questions.map((q) => q.trim()).filter(Boolean)
    if (qs.length === 0) { alert('Add at least one prompt question.'); return }
    if (scope === 'students' && targets.size === 0) { alert('Pick at least one student.'); return }

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
      if (editingId) await apiCall(user, `/api/classes/${classId}/assign?id=${editingId}`, 'PATCH', payload)
      else await apiCall(user, `/api/classes/${classId}/assign`, 'POST', payload)
      resetComposer()
      reload()
    } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  async function removeAssignment(id: string) {
    if (!user) return
    if (!confirm('Remove this journal prompt?')) return
    try {
      await apiCall(user, `/api/classes/${classId}/assign?id=${id}`, 'DELETE')
      if (editingId === id) resetComposer()
      reload()
    } catch (e: any) { alert(e?.message) }
  }

  // Completion = target students whose submission status is 'complete'.
  function journalCompletion(a: Assignment): { done: number; total: number } {
    const roster = cls!.students
    const total = a.scope === 'class' ? roster.length : (a.studentUids ?? []).length
    const targetStudents = a.scope === 'class' ? roster : roster.filter((s) => (a.studentUids ?? []).includes(s.uid))
    const done = targetStudents.filter((s) => a.submissions?.[s.uid]?.status === 'complete').length
    return { done, total }
  }

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Journal</h1>
      <p className="text-textTitle/60 text-sm mb-6">
        Write journal prompts and assign them. Student responses stay private — you only see whether they wrote and how much.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="bg-white rounded-2xl shadow-sm p-5 lg:sticky lg:top-28 self-start">
          <div className="text-sm font-medium text-textTitle mb-3">
            {editingId ? 'Edit prompt' : 'New journal prompt'}
          </div>

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
          {scope === 'students' && (
            <div className="max-h-40 overflow-y-auto mb-3 space-y-1">
              {cls.students.map((s: Student) => (
                <label key={s.uid} className="flex items-center gap-2 text-sm text-textTitle/80">
                  <input type="checkbox" checked={targets.has(s.uid)} onChange={() => toggleTarget(s.uid)} />
                  {s.name}
                </label>
              ))}
              {cls.students.length === 0 && <p className="text-xs text-textTitle/40">No students in this class yet.</p>}
            </div>
          )}

          <label className="block text-sm text-textTitle/70 mb-1">Due date (optional)</label>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-4" />

          <div className="flex gap-2">
            <button onClick={submit} disabled={busy}
              className="flex-1 px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Assign prompt'}
            </button>
            {editingId && (
              <button onClick={resetComposer} className="px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
            )}
          </div>
        </div>

        {/* Assigned journal prompts */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="text-sm font-medium text-textTitle mb-2">Assigned prompts</div>
          {journalAssignments.length === 0 ? (
            <p className="text-xs text-textTitle/50">No journal prompts yet. Write one on the left.</p>
          ) : (
            <div className="space-y-3">
              {journalAssignments.map((a) => {
                const { done, total } = journalCompletion(a)
                const isOpen = expanded.has(a.id)
                const qCount = a.journal?.questions.length ?? 0
                return (
                  <div key={a.id} className="text-xs border-b border-textTitle/5 pb-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <button onClick={() => toggleExpanded(a.id)} className="text-left flex-1 min-w-0">
                        <div className="text-textTitle font-medium truncate">
                          {a.title || `Journal · ${qCount} question${qCount > 1 ? 's' : ''}`} <span className="text-textTitle/40">{isOpen ? '▾' : '▸'}</span>
                        </div>
                        <div className="text-textTitle/50">
                          {a.scope === 'class' ? 'Whole class' : `${(a.studentUids ?? []).length} student${(a.studentUids ?? []).length > 1 ? 's' : ''}`}
                          {' · '}{done}/{total} done
                          {a.dueDate && <> · Due {a.dueDate}</>}
                          {a.journal && (a.journal.minWords > 0 || a.journal.minSeconds > 0) && (
                            <> · min {a.journal.minWords}w{a.journal.minSeconds ? ` · ${a.journal.minSeconds}s` : ''}</>
                          )}
                        </div>
                      </button>
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => startEdit(a)} className="text-brandGreen hover:underline">Edit</button>
                        <button onClick={() => removeAssignment(a.id)} className="text-red-600 hover:underline">Remove</button>
                      </div>
                    </div>
                    {isOpen && (
                      <ul className="mt-2 pl-1 space-y-0.5 text-textTitle/60">
                        {(a.journal?.questions ?? []).map((q, i) => <li key={i}>• {q}</li>)}
                        <li className="text-textTitle/40 mt-1">Responses are private to each student.</li>
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
