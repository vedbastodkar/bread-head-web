'use client'
import { useEffect, useRef, useState } from 'react'
import { useStudent } from '@/app/student/useStudent'
import { StudentShell, StudentSkeleton, StudentError } from '@/app/student/StudentShell'
import { useJournal, type JournalEntry } from './useJournal'
import { countWords, newEntryId } from '@/lib/journal/journal'

export default function JournalPage() {
  const { data, err: studentErr, loading: studentLoading, user, signOut } = useStudent()
  const { entries, loading, err, saveEntry, reload } = useJournal()
  const [editing, setEditing] = useState<JournalEntry | null>(null)

  if (studentLoading || (!data && !studentErr)) return <StudentSkeleton />
  if (studentErr) return <StudentError message={studentErr} />

  const startNew = () =>
    setEditing({ id: newEntryId(), body: '', teacherAssigned: false, wordCount: 0, secondsSpent: 0 })

  const today = new Date().toISOString().slice(0, 10)
  const journalAssignments = (data?.assignments ?? []).filter((a) => a.type === 'journal')

  // Find the student's existing entry for an assignment, or start a fresh linked one.
  const openAssigned = (a: NonNullable<typeof data>['assignments'][number]) => {
    const existing = entries.find((e) => e.assignmentId === a.id)
    if (existing) { setEditing(existing); return }
    setEditing({
      id: newEntryId(),
      body: '',
      teacherAssigned: true,
      assignmentId: a.id,
      classId: a.classId,
      questions: a.journal?.questions ?? [],
      wordCount: 0,
      secondsSpent: 0,
    })
  }

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-textTitle">My Journal</h1>
        <button onClick={startNew} className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm">+ New entry</button>
      </div>

      <p className="text-sm text-textTitle/65 mb-6 max-w-xl">
        Your journal is private. Only you can read what you write here — your teacher can never see the words,
        even for assigned prompts.
      </p>

      {err && <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-red-600 mb-4">{err}</div>}

      {journalAssignments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold tracking-wider text-textTitle/65 uppercase mb-2">Assigned prompts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {journalAssignments.map((a) => {
              const entry = entries.find((e) => e.assignmentId === a.id)
              const overdue = !!a.dueDate && a.dueDate < today && !entry
              return (
                <button key={a.id} onClick={() => openAssigned(a)}
                  className={`text-left bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition border-l-4 ${overdue ? 'border-red-500' : 'border-accentGold'}`}>
                  <div className="text-sm font-medium text-textTitle truncate">{a.title || 'Journal prompt'}</div>
                  <div className="text-xs text-textTitle/65 mt-0.5 line-clamp-2">{a.journal?.questions[0]}</div>
                  <div className="text-xs mt-1 flex gap-2">
                    {entry ? <span className="text-brandGreen">Started · {entry.wordCount} words</span> : <span className="text-textTitle/65">Not started</span>}
                    {a.dueDate && <span className={overdue ? 'text-red-600' : 'text-textTitle/65'}>{overdue ? 'Overdue' : 'Due'} {a.dueDate}</span>}
                    {a.journal && (a.journal.minWords > 0 || a.journal.minSeconds > 0) && (
                      <span className="text-textTitle/65">min {a.journal.minWords}w{a.journal.minSeconds ? ` · ${a.journal.minSeconds}s` : ''}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}

      <h2 className="text-xs font-semibold tracking-wider text-textTitle/65 uppercase mb-2">Past entries</h2>
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/65">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-textTitle/65">
          Nothing yet. Tap “New entry” to start writing.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => setEditing(e)}
              className="w-full text-left bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm text-textTitle truncate">
                  {e.teacherAssigned && <span className="text-accentGold mr-1">●</span>}
                  {e.body.trim().slice(0, 80) || 'Untitled entry'}
                </div>
                <div className="text-xs text-textTitle/65">
                  {e.lastModified ? e.lastModified.toLocaleDateString() : 'Draft'} · {e.wordCount} words
                </div>
              </div>
              <span className="text-textTitle/65 text-sm shrink-0">Edit ›</span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <JournalEditor
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
          saveEntry={saveEntry}
          user={user}
        />
      )}
    </StudentShell>
  )
}

// Full-screen editor with a live word count and an active-time timer that pauses
// when the tab is hidden. Writes the entry doc on save (content stays private).
function JournalEditor({
  entry, onClose, onSaved, saveEntry, user,
}: {
  entry: JournalEntry
  onClose: () => void
  onSaved: () => void
  saveEntry: (e: JournalEntry) => Promise<void>
  user: { getIdToken: () => Promise<string> } | null
}) {
  // A prompt with questions gets one answer box per question (Google-Form style);
  // a free-write gets a single box. Answers are combined into `body` on save so
  // word count, previews, and teacher metadata stay unchanged.
  const questions = entry.questions ?? []
  const hasQuestions = questions.length > 0
  const [answers, setAnswers] = useState<string[]>(() => {
    if (!hasQuestions) return []
    if (entry.answers && entry.answers.length === questions.length) return entry.answers
    const blanks = questions.map(() => '')
    if (entry.body) blanks[0] = entry.body // legacy: entries saved before per-question boxes
    return blanks
  })
  const [body, setBody] = useState(entry.body)
  const [seconds, setSeconds] = useState(entry.secondsSpent)
  const [busy, setBusy] = useState(false)
  const [saveErr, setSaveErr] = useState('')
  const activeRef = useRef(true)

  useEffect(() => {
    const onVis = () => { activeRef.current = document.visibilityState === 'visible' }
    document.addEventListener('visibilitychange', onVis)
    const id = setInterval(() => { if (activeRef.current) setSeconds((s) => s + 1) }, 1000)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const combined = hasQuestions ? answers.join('\n\n') : body
  const words = countWords(combined)

  async function save() {
    setBusy(true)
    setSaveErr('')
    try {
      await saveEntry({
        ...entry,
        body: combined,
        answers: hasQuestions ? answers : undefined,
        wordCount: words,
        secondsSpent: seconds,
      })
      if (entry.teacherAssigned && entry.assignmentId && entry.classId && user) {
        try {
          const token = await user.getIdToken()
          await fetch('/api/journal/submit', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classId: entry.classId,
              assignmentId: entry.assignmentId,
              entryId: entry.id,
              wordCount: words,
              secondsSpent: seconds,
            }),
          })
        } catch { /* metadata is best-effort; content is already saved */ }
      }
      onSaved()
    } catch (e: any) {
      setSaveErr(e?.message || 'Could not save. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        {hasQuestions ? (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {questions.map((q, i) => (
              <div key={i}>
                <label className="block text-sm font-medium text-textTitle/85 mb-1.5">{q}</label>
                <textarea
                  autoFocus={i === 0}
                  value={answers[i] ?? ''}
                  onChange={(e) => setAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))}
                  placeholder="Your answer…"
                  className="w-full h-28 rounded-2xl border border-textTitle/15 p-3 text-sm text-textTitle outline-none focus:border-brandGreen resize-none"
                />
              </div>
            ))}
          </div>
        ) : (
          <textarea
            autoFocus
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write freely…"
            className="w-full h-64 rounded-2xl border border-textTitle/15 p-4 text-sm text-textTitle outline-none focus:border-brandGreen resize-none"
          />
        )}
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-textTitle/65">{words} words · {Math.floor(seconds / 60)}m {seconds % 60}s</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
            <button onClick={save} disabled={busy} className="px-5 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
        {saveErr && <p className="text-xs text-red-600 mt-2">{saveErr}</p>}
      </div>
    </div>
  )
}
