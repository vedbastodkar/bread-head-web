'use client'
import Link from 'next/link'
import { useDashboard, apiCall, pctComplete, attentionFlags, type ClassData } from '../useDashboard'
import { DashboardShell, DashboardSkeleton, DashboardError } from '../DashboardShell'
import { useToast } from '../ToastProvider'

// Canvas-style "All Courses" — every class, current and past/archived, in one list.
export default function AllCourses() {
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const { notify } = useToast()

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  const current = data!.filter((c) => !c.archived)
  const past = data!.filter((c) => c.archived)

  async function setArchived(id: string, archived: boolean) {
    if (!user) return
    try { await apiCall(user, `/api/classes/${id}`, 'PATCH', { archived }); reload(); notify(archived ? 'Class archived.' : 'Class unarchived.', 'success') }
    catch { notify('Could not update the class — please try again.', 'error') }
  }

  return (
    <DashboardShell data={data!} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">All Classes</h1>
      <p className="text-textTitle/65 text-sm mb-8">Every class you teach, current and archived.</p>

      <Section title="Current">
        {current.length === 0 && <Empty>No current classes.</Empty>}
        {current.map((c) => (
          <Row key={c.id} cls={c} action={
            <button onClick={() => setArchived(c.id, true)} className="text-xs text-textTitle/65 hover:text-textTitle">Archive</button>
          } />
        ))}
      </Section>

      <Section title="Past / Archived">
        {past.length === 0 && <Empty>No archived classes.</Empty>}
        {past.map((c) => (
          <Row key={c.id} cls={c} muted action={
            <button onClick={() => setArchived(c.id, false)} className="text-xs text-brandGreen hover:underline">Unarchive</button>
          } />
        ))}
      </Section>
    </DashboardShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="text-xs font-semibold tracking-wider text-textTitle/65 uppercase mb-2">{title}</h2>
      <div className="bg-white rounded-2xl shadow-sm divide-y divide-textTitle/5">{children}</div>
    </section>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="px-5 py-4 text-sm text-textTitle/65">{children}</div>
}

function Row({ cls, action, muted }: { cls: ClassData; action: React.ReactNode; muted?: boolean }) {
  const students = cls.students.length
  const avg = students ? Math.round(cls.students.reduce((a, s) => a + pctComplete(s), 0) / students) : 0
  const needHelp = cls.students.filter((s) => attentionFlags(s, cls.assignments).length > 0).length
  return (
    <div className={`flex items-center gap-4 px-5 py-4 ${muted ? 'opacity-70' : ''}`}>
      <div className="flex-1 min-w-0">
        <Link href={`/dashboard/${cls.id}`} className="font-medium text-textTitle hover:underline">{cls.name}</Link>
        <div className="text-xs text-textTitle/65 mt-0.5">
          {students} student{students !== 1 ? 's' : ''}
          {cls.joinCode && <> · Join {cls.joinCode}</>}
          {cls.grade?.length > 0 && <> · Grade {cls.grade.join(', ')}</>}
        </div>
      </div>
      <div className="hidden sm:block text-sm text-textTitle/65 w-24 text-right">{avg}% avg</div>
      <div className="hidden sm:block text-sm w-28 text-right">
        {needHelp > 0 ? <span className="text-red-600">{needHelp} need help</span> : <span className="text-textTitle/65">on track</span>}
      </div>
      <div className="w-20 text-right">{action}</div>
    </div>
  )
}
