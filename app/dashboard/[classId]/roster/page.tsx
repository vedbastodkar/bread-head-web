'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDashboard, daysSince, type Student } from '../../useDashboard'
import { DashboardShell, DashboardLoading, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { JoinInfo } from '../../parts'
import { MoveStudentModal } from '../../MoveStudentModal'
import { RemoveStudentButton } from '../../RemoveStudentButton'

export default function RosterPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const [movingStudent, setMovingStudent] = useState<Student | null>(null)

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />
  const cls = data!.find((c) => c.id === classId)
  if (!cls) return <DashboardLoading><p className="text-textTitle/70">Class not found.</p></DashboardLoading>

  const otherClasses = data!.filter((c) => c.id !== cls.id && !c.archived)

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
            <tr className="text-left text-textTitle/70 border-b border-textTitle/10">
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
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => setMovingStudent(s)} className="text-xs text-textTitle/70 hover:text-textTitle underline">Move</button>
                      <RemoveStudentButton classId={cls.id} student={s} user={user} onRemoved={reload} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-textTitle/70 mt-3">
        Students join with the class code above. Use <span className="font-medium">Print handout</span> for a page you can hand out or project.
      </p>

      {movingStudent && (
        <MoveStudentModal
          student={movingStudent}
          fromClassId={cls.id}
          destinations={otherClasses.map((c) => ({ id: c.id, name: c.name }))}
          user={user}
          onClose={() => setMovingStudent(null)}
          onMoved={reload}
        />
      )}
    </DashboardShell>
  )
}
