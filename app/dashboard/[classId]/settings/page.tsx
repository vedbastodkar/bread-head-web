'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDashboard, apiCall } from '../../useDashboard'
import { DashboardShell, DashboardLoading } from '../../DashboardShell'

const GRADES = [6, 7, 8, 9, 10, 11, 12]

export default function ClassSettings() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const router = useRouter()
  const [name, setName] = useState('')
  const [grade, setGrade] = useState<number[]>([])
  const [busy, setBusy] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const cls = data?.find((c) => c.id === classId)
  useEffect(() => {
    if (cls && !loaded) { setName(cls.name); setGrade(cls.grade ?? []); setLoaded(true) }
  }, [cls, loaded])

  if (loading || (!data && !err)) return <DashboardLoading><p className="text-textTitle/60">Loading…</p></DashboardLoading>
  if (err) return <DashboardLoading><p className="text-red-600">{err}</p></DashboardLoading>
  if (!cls) return <DashboardLoading><p className="text-textTitle/60">Class not found.</p></DashboardLoading>

  const save = async () => {
    if (!user) return
    setBusy(true)
    try { await apiCall(user, `/api/classes/${classId}`, 'PATCH', { name, grade }); reload(); router.push(`/dashboard/${classId}`) }
    catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }
  const toggleArchive = async () => {
    if (!user) return
    setBusy(true)
    try { await apiCall(user, `/api/classes/${classId}`, 'PATCH', { archived: !cls.archived }); reload(); router.push('/dashboard') }
    catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }
  const del = async () => {
    if (!user || !window.confirm('Delete this class? Student accounts are not deleted, only the class + roster.')) return
    setBusy(true)
    try { await apiCall(user, `/api/classes/${classId}`, 'DELETE'); reload(); router.push('/dashboard') }
    catch (e: any) { alert(e?.message) } finally { setBusy(false) }
  }

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <Link href={`/dashboard/${classId}`} className="text-sm text-textTitle/50 hover:text-textTitle">← {cls.name}</Link>
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

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 max-w-xl flex items-center justify-between">
        <div>
          <div className="text-sm text-textTitle">{cls.archived ? 'Unarchive class' : 'Archive class'}</div>
          <div className="text-xs text-textTitle/50">Archived classes are hidden from the Teaching list.</div>
        </div>
        <button onClick={toggleArchive} disabled={busy} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-bgSage">
          {cls.archived ? 'Unarchive' : 'Archive'}
        </button>
      </div>

      <div className="mt-6 max-w-xl">
        <button onClick={del} disabled={busy} className="text-sm text-red-600 hover:underline">Delete class</button>
      </div>
    </DashboardShell>
  )
}
