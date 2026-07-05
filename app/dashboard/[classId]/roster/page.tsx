'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDashboard, apiCall, daysSince, type Student } from '../../useDashboard'
import { DashboardShell, DashboardLoading } from '../../DashboardShell'
import { JoinInfo } from '../../parts'

export default function RosterPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()

  if (loading || (!data && !err)) return <DashboardLoading><p className="text-textTitle/60">Loading…</p></DashboardLoading>
  if (err) return <DashboardLoading><p className="text-red-600">{err}</p></DashboardLoading>
  const cls = data!.find((c) => c.id === classId)
  if (!cls) return <DashboardLoading><p className="text-textTitle/60">Class not found.</p></DashboardLoading>

  async function move(s: Student) {
    if (!user) return
    const others = data!.filter((c) => c.id !== cls!.id && !c.archived)
    if (others.length === 0) { alert('No other class to move to.'); return }
    const choice = window.prompt(`Move ${s.name} to:\n` + others.map((c, i) => `${i + 1}. ${c.name}`).join('\n'))
    const idx = Number(choice) - 1
    if (Number.isNaN(idx) || idx < 0 || idx >= others.length) return
    try { await apiCall(user, '/api/classes/move-student', 'POST', { studentUid: s.uid, fromClassId: cls!.id, toClassId: others[idx].id }); reload() }
    catch (e: any) { alert(e?.message) }
  }

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-3xl text-textTitle">Roster</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href={`/dashboard/${cls.id}/handout`}
            className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70 hover:bg-bgSage"
          >
            Print handout
          </Link>
          <JoinInfo joinCode={cls.joinCode} />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-textTitle/50 border-b border-textTitle/10">
              <th className="py-3 px-4 font-medium">Student</th>
              <th className="py-3 px-4 font-medium">Lessons done</th>
              <th className="py-3 px-4 font-medium">Last active</th>
              <th className="py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {cls.students.map((s) => {
              const d = daysSince(s.lastActive)
              return (
                <tr key={s.uid} className="border-b border-textTitle/5 last:border-0 hover:bg-bgSage/40">
                  <td className="py-3 px-4">
                    <Link href={`/dashboard/${cls.id}/${s.uid}`} className="text-textTitle font-medium hover:underline">{s.name}</Link>
                  </td>
                  <td className="py-3 px-4 text-textTitle/70">{s.completedLessons.length}</td>
                  <td className="py-3 px-4 text-textTitle/70">{d === null ? '—' : d === 0 ? 'today' : `${d}d ago`}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => move(s)} className="text-xs text-textTitle/40 hover:text-textTitle underline">Move</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-textTitle/50 mt-3">
        Students join with the class code above. Use <span className="font-medium">Print handout</span> for a page you can hand out or project.
      </p>
    </DashboardShell>
  )
}
