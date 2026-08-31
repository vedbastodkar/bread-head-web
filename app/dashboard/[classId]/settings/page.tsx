'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDashboard, apiCall } from '../../useDashboard'
import { DashboardShell, DashboardLoading, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { useToast } from '../../ToastProvider'

const GRADES = [6, 7, 8, 9, 10, 11, 12]

export default function ClassSettings() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const { notify, confirm } = useToast()
  const router = useRouter()
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [teachers, setTeachers] = useState<{ uid: string; name: string; email: string | null; isOwner: boolean }[]>([])
  const [coEmail, setCoEmail] = useState('')
  const [coBusy, setCoBusy] = useState(false)

  const cls = data?.find((c) => c.id === classId)
  const isOwner = !!user && cls?.teacherId === user.uid
  useEffect(() => {
    if (cls && !loaded) { setName(cls.name); setGrade(cls.grade ?? []); setLoaded(true) }
  }, [cls, loaded])

  useEffect(() => {
    if (!user || !classId) return
    ;(async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch(`/api/classes/${classId}/co-teachers`, { headers: { Authorization: `Bearer ${token}` } })
        if (res.ok) setTeachers((await res.json()).teachers)
      } catch { /* noop */ }
    })()
  }, [user, classId])

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />
  if (!cls) return <DashboardLoading><p className="text-textTitle/70">Class not found.</p></DashboardLoading>

  const save = async () => {
    if (!user) return
    setBusy(true)
    try { await apiCall(user, `/api/classes/${classId}`, 'PATCH', { name, grade }); reload(); notify('Class saved.', 'success'); router.push(`/dashboard/${classId}`) }
    catch { notify('Could not save the class. Please try again.', 'error') } finally { setBusy(false) }
  }
  const toggleArchive = async () => {
    if (!user) return
    setBusy(true)
    try { await apiCall(user, `/api/classes/${classId}`, 'PATCH', { archived: !cls.archived }); reload(); notify(cls.archived ? 'Class unarchived.' : 'Class archived.', 'success'); router.push('/dashboard') }
    catch { notify('Could not update the class. Please try again.', 'error') } finally { setBusy(false) }
  }
  const del = async () => {
    if (!user || !(await confirm({ title: 'Delete class', message: 'Delete this class? Student accounts are not deleted, only the class + roster.', confirmLabel: 'Delete', destructive: true }))) return
    setBusy(true)
    try { await apiCall(user, `/api/classes/${classId}`, 'DELETE'); reload(); notify('Class deleted.', 'success'); router.push('/dashboard') }
    catch { notify('Could not delete the class. Please try again.', 'error') } finally { setBusy(false) }
  }
  const addCoTeacher = async () => {
    if (!user || !coEmail.trim()) return
    setCoBusy(true)
    try {
      const res = await apiCall(user, `/api/classes/${classId}/co-teachers`, 'POST', { email: coEmail.trim() })
      setTeachers((prev) => [...prev, res.teacher])
      setCoEmail(''); reload(); notify('Co-teacher added.', 'success')
    } catch (e: any) { notify(e?.message || 'Could not add co-teacher. Check the email.', 'error') } finally { setCoBusy(false) }
  }
  const removeCoTeacher = async (uid: string) => {
    if (!user || !(await confirm({ message: 'Remove this co-teacher?', confirmLabel: 'Remove', destructive: true }))) return
    setCoBusy(true)
    try {
      await apiCall(user, `/api/classes/${classId}/co-teachers?uid=${uid}`, 'DELETE')
      setTeachers((prev) => prev.filter((t) => t.uid !== uid)); reload(); notify('Co-teacher removed.', 'success')
    } catch { notify('Could not remove the co-teacher. Please try again.', 'error') } finally { setCoBusy(false) }
  }

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <Link href={`/dashboard/${classId}`} className="text-sm text-textTitle/70 hover:text-textTitle">← {cls.name}</Link>
      <h1 className="font-display text-3xl text-textTitle mt-1 mb-6">Class settings</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 space-y-6 max-w-xl">
        <label className="block">
          <span className="block text-sm text-textTitle/70 mb-1">Class name</span>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-textTitle/15 focus:border-brandGreen outline-none"
          />
        </label>

        <div>
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

        <button onClick={save} disabled={busy} className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      {/* Co-teachers */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 max-w-xl">
        <div className="text-sm font-medium text-textTitle mb-1">Co-teachers</div>
        <p className="text-xs text-textTitle/70 mb-4">
          {isOwner ? 'Add another teacher by email so they can view and manage this class.' : 'Only the class owner can add or remove co-teachers.'}
        </p>

        <div className="space-y-2 mb-4">
          {teachers.map((t) => (
            <div key={t.uid} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <span className="text-textTitle">{t.name}</span>
                {t.email && <span className="text-textTitle/70"> · {t.email}</span>}
                {t.isOwner && <span className="ml-2 inline-block px-1.5 py-0.5 rounded bg-bgSage text-[10px] text-textTitle/70">Owner</span>}
              </div>
              {isOwner && !t.isOwner && (
                <button onClick={() => removeCoTeacher(t.uid)} disabled={coBusy} className="text-xs text-red-600 hover:underline shrink-0">Remove</button>
              )}
            </div>
          ))}
          {teachers.length === 0 && <p className="text-xs text-textTitle/70">No teachers listed yet.</p>}
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <input
              type="email" value={coEmail} onChange={(e) => setCoEmail(e.target.value)}
              placeholder="teacher@email.com"
              className="flex-1 px-3 py-2 rounded-xl border border-textTitle/15 text-sm outline-none focus:border-brandGreen"
            />
            <button onClick={addCoTeacher} disabled={coBusy || !coEmail.trim()}
              className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {coBusy ? 'Adding…' : 'Add'}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 max-w-xl flex items-center justify-between">
        <div>
          <div className="text-sm text-textTitle">{cls.archived ? 'Unarchive class' : 'Archive class'}</div>
          <div className="text-xs text-textTitle/70">Archived classes are hidden from the Teaching list.</div>
        </div>
        <button onClick={toggleArchive} disabled={busy} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-bgSage">
          {cls.archived ? 'Unarchive' : 'Archive'}
        </button>
      </div>

      {isOwner && (
        <div className="mt-6 max-w-xl">
          <button onClick={del} disabled={busy} className="text-sm text-red-600 hover:underline">Delete class</button>
        </div>
      )}
    </DashboardShell>
  )
}
