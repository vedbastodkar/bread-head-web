'use client'
import { useState } from 'react'
import { apiCall } from './useDashboard'

const GRADES = [6, 7, 8, 9, 10, 11, 12]

// "New class" modal: captures name + grade(s) in one step, then creates the
// class and hands the caller its id to navigate to. Replaces the old
// window.prompt flow (name only, no grade — teachers had to visit Settings
// afterward to set it).
export function CreateClassModal({
  user, onClose, onCreated,
}: {
  user: { getIdToken: () => Promise<string> } | null
  onClose: () => void
  onCreated: (classId: string) => void
}) {
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function create() {
    if (!user || !name.trim()) return
    setBusy(true)
    setError('')
    try {
      const c = await apiCall(user, '/api/classes', 'POST', { name: name.trim(), grade })
      onCreated(c.id)
    } catch (e: any) {
      setError(e?.message || 'Failed to create class.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl text-textTitle mb-1">New class</h3>
        <p className="text-sm text-textTitle/70 mb-4">Give your class a name and pick the grade(s) it serves.</p>

        <label className="block mb-4">
          <span className="block text-sm text-textTitle/70 mb-1">Class name</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. "Period 3: Personal Finance"'
            className="w-full px-4 py-2.5 rounded-xl border border-textTitle/15 focus:border-brandGreen outline-none text-sm"
          />
        </label>

        <div className="mb-4">
          <span className="block text-sm text-textTitle/70 mb-2">Grade (choose all that apply)</span>
          <div className="flex flex-wrap gap-2">
            {GRADES.map((g) => {
              const on = grade.includes(g)
              return (
                <button
                  key={g}
                  onClick={() => setGrade(on ? grade.filter((x) => x !== g) : [...grade, g])}
                  className={`w-10 h-10 rounded-full text-sm ${on ? 'bg-brandGreen text-white' : 'border border-textTitle/15 text-textTitle/70'}`}
                >
                  {g}
                </button>
              )
            })}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
          <button
            onClick={create}
            disabled={busy || !name.trim()}
            className="px-5 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60"
          >
            {busy ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
