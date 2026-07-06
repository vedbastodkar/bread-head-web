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

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-textTitle">My Journal</h1>
        <button onClick={startNew} className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm">+ New entry</button>
      </div>

      <p className="text-sm text-textTitle/55 mb-6 max-w-xl">
        Your journal is private. Only you can read what you write here — your teacher can never see the words,
        even for assigned prompts.
      </p>

      {err && <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-red-600 mb-4">{err}</div>}

      <h2 className="text-xs font-semibold tracking-wider text-textTitle/40 uppercase mb-2">Past entries</h2>
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/40">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-textTitle/50">
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
                <div className="text-xs text-textTitle/45">
                  {e.lastModified ? e.lastModified.toLocaleDateString() : 'Draft'} · {e.wordCount} words
                </div>
              </div>
              <span className="text-textTitle/30 text-sm shrink-0">Edit ›</span>
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
        />
      )}
    </StudentShell>
  )
}

// Full-screen editor with a live word count and an active-time timer that pauses
// when the tab is hidden. Writes the entry doc on save (content stays private).
function JournalEditor({
  entry, onClose, onSaved, saveEntry,
}: {
  entry: JournalEntry
  onClose: () => void
  onSaved: () => void
  saveEntry: (e: JournalEntry) => Promise<void>
}) {
  const [body, setBody] = useState(entry.body)
  const [seconds, setSeconds] = useState(entry.secondsSpent)
  const [busy, setBusy] = useState(false)
  const activeRef = useRef(true)

  useEffect(() => {
    const onVis = () => { activeRef.current = document.visibilityState === 'visible' }
    document.addEventListener('visibilitychange', onVis)
    const id = setInterval(() => { if (activeRef.current) setSeconds((s) => s + 1) }, 1000)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const words = countWords(body)

  async function save() {
    setBusy(true)
    try {
      await saveEntry({ ...entry, body, wordCount: words, secondsSpent: seconds })
      onSaved()
    } catch { /* surfaced via reload */ setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        {entry.questions && entry.questions.length > 0 && (
          <div className="bg-bgSage rounded-2xl p-4 mb-4">
            <div className="text-xs uppercase tracking-wider text-textTitle/40 mb-2">Prompt</div>
            <ul className="space-y-1 text-sm text-textTitle/80">
              {entry.questions.map((q, i) => <li key={i}>• {q}</li>)}
            </ul>
          </div>
        )}
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write freely…"
          className="w-full h-64 rounded-2xl border border-textTitle/15 p-4 text-sm text-textTitle outline-none focus:border-brandGreen resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-textTitle/45">{words} words · {Math.floor(seconds / 60)}m {seconds % 60}s</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
            <button onClick={save} disabled={busy} className="px-5 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
