'use client'
import { useState } from 'react'
import { apiCall } from './useDashboard'
import { useToast } from './ToastProvider'

// Small text/danger-styled action, mirroring the Move button. Confirms via the
// in-app confirm modal (destructive-but-reversible: unlinks from the class only,
// the student's account and progress are untouched), posts to the
// remove-student route, and shows inline error text on failure.
export function RemoveStudentButton({
  classId, student, user, onRemoved,
}: {
  classId: string
  student: { uid: string; name: string }
  user: { getIdToken: () => Promise<string> } | null
  onRemoved: () => void
}) {
  const { confirm } = useToast()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function remove() {
    if (!user) return
    if (!(await confirm({ message: `Remove ${student.name} from this class? Their account and progress are kept. They just leave this class.`, confirmLabel: 'Remove', destructive: true }))) return
    setBusy(true)
    setError('')
    try {
      await apiCall(user, `/api/classes/${classId}/remove-student`, 'POST', { studentUid: student.uid })
      onRemoved()
    } catch (e: any) {
      setError(e?.message || 'Failed to remove student.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="inline-flex flex-col items-end">
      <button onClick={remove} disabled={busy} className="text-xs text-red-600/70 hover:text-red-600 underline disabled:opacity-60">
        {busy ? 'Removing…' : 'Remove'}
      </button>
      {error && <span className="text-[11px] text-red-600 mt-0.5">{error}</span>}
    </span>
  )
}
