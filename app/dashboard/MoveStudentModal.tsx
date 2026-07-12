'use client'
import { useState } from 'react'
import { apiCall } from './useDashboard'

// Shared "move student to another class" picker, used by both the class
// detail page and the roster page. Replaces the old window.prompt flow with
// a proper modal: a <select> of destination classes, Confirm/Cancel, and
// inline error text (no alert()).
export function MoveStudentModal({
  student, fromClassId, destinations, user, onClose, onMoved,
}: {
  student: { uid: string; name: string }
  fromClassId: string
  destinations: { id: string; name: string }[]
  user: { getIdToken: () => Promise<string> } | null
  onClose: () => void
  onMoved: () => void
}) {
  const [toClassId, setToClassId] = useState(destinations[0]?.id ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function confirm() {
    if (!user || !toClassId) return
    setBusy(true)
    setError('')
    try {
      await apiCall(user, '/api/classes/move-student', 'POST', {
        studentUid: student.uid, fromClassId, toClassId,
      })
      onMoved()
      onClose()
    } catch (e: any) {
      setError(e?.message || 'Failed to move student.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl text-textTitle mb-1">Move student</h3>
        <p className="text-sm text-textTitle/60 mb-4">Move <span className="font-medium text-textTitle">{student.name}</span> to another class.</p>

        {destinations.length === 0 ? (
          <p className="text-sm text-textTitle/60 mb-4">No other class to move to. Create one first.</p>
        ) : (
          <select
            value={toClassId}
            onChange={(e) => setToClassId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-textTitle/15 text-sm mb-4"
          >
            {destinations.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
        )}

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
          <button
            onClick={confirm}
            disabled={busy || destinations.length === 0 || !toClassId}
            className="px-5 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60"
          >
            {busy ? 'Moving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
