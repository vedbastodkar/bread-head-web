'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDashboard } from '../../useDashboard'
import { DashboardLoading, DashboardSkeleton, DashboardError } from '../../DashboardShell'

// Print-optimized class handout: students self-register and join with the code.
// Uses Tailwind `print:` variants to strip the on-screen chrome when printing.
export default function HandoutPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading } = useDashboard()

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />
  const cls = data!.find((c) => c.id === classId)
  if (!cls) return <DashboardLoading><p className="text-textTitle/70">Class not found.</p></DashboardLoading>

  return (
    <main className="min-h-screen bg-bgSage print:bg-white">
      {/* On-screen toolbar — hidden when printing */}
      <div className="print:hidden max-w-2xl mx-auto flex items-center justify-between px-6 pt-8">
        <Link href={`/dashboard/${cls.id}/roster`} className="text-sm text-textTitle/70 hover:text-textTitle">← Back to roster</Link>
        <button
          onClick={() => window.print()}
          className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm"
        >
          Print
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 print:py-0">
        <div className="bg-white rounded-3xl shadow-sm print:shadow-none print:rounded-none p-10 text-center">
          <p className="text-xs font-semibold tracking-[0.13em] uppercase text-brandGreen mb-2">Bread Head · Join your class</p>
          <h1 className="font-display text-3xl text-textTitle mb-1">{cls.name}</h1>
          <p className="text-textTitle/70 text-sm mb-8">Free financial-literacy lessons for your class.</p>

          {cls.joinCode ? (
            <div className="mb-8">
              <div className="text-xs uppercase tracking-wider text-textTitle/70 mb-2">Class code</div>
              <div className="font-display text-6xl tracking-[0.2em] text-textTitle">{cls.joinCode}</div>
            </div>
          ) : (
            <p className="text-sm text-red-600 mb-8">This class has no join code yet.</p>
          )}

          <div className="text-left max-w-sm mx-auto">
            <div className="text-xs uppercase tracking-wider text-textTitle/70 mb-3">How to join</div>
            <ol className="space-y-3 text-sm text-textTitle/80">
              <li className="flex gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-bgSage flex items-center justify-center text-xs">1</span> Go to <span className="font-medium">bread-head.org/login</span></li>
              <li className="flex gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-bgSage flex items-center justify-center text-xs">2</span> Choose <span className="font-medium">Student</span> and create your account.</li>
              <li className="flex gap-3"><span className="w-6 h-6 shrink-0 rounded-full bg-bgSage flex items-center justify-center text-xs">3</span> Enter the class code <span className="font-medium">{cls.joinCode ?? '------'}</span> to join.</li>
            </ol>
          </div>

          {cls.students.length > 0 && (
            <div className="text-left mt-10 pt-6 border-t border-textTitle/10">
              <div className="text-xs uppercase tracking-wider text-textTitle/70 mb-2">Already joined ({cls.students.length})</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-textTitle/70">
                {cls.students.map((s) => <span key={s.uid}>{s.name}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
