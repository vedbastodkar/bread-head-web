'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDashboard } from '../../useDashboard'

export default function ParentLetter() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading } = useDashboard()

  if (loading || (!data && !err)) return <main className="min-h-screen bg-white p-10"><p>Loading…</p></main>
  const cls = data?.find((c) => c.id === classId)
  if (!cls) return <main className="min-h-screen bg-white p-10"><p>Class not found.</p></main>

  const link = typeof window !== 'undefined' ? `${window.location.origin}/join/${cls.joinCode}` : `/join/${cls.joinCode}`

  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* toolbar (hidden when printing) */}
        <div className="flex items-center justify-between mb-4 print:hidden">
          <Link href={`/dashboard/${classId}`} className="text-sm text-textTitle/50 hover:text-textTitle">← {cls.name}</Link>
          <button onClick={() => window.print()} className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm">Print / Save PDF</button>
        </div>

        {/* letter */}
        <div className="bg-white rounded-2xl shadow-sm p-10 leading-relaxed text-textTitle print:shadow-none print:rounded-none">
          <img src="/assets/logo_w_text.png" alt="Bread Head" width={160} className="mb-8" />
          <h1 className="font-display text-2xl mb-6">Welcome to Bread Head</h1>
          <p className="mb-4">Dear Parent or Guardian,</p>
          <p className="mb-4">
            Your student is joining <strong>{cls.name}</strong> on Bread Head, a financial-literacy program that
            teaches teens real money skills — budgeting, saving, credit, and more — through short interactive lessons.
          </p>
          <p className="mb-4">To get your student set up, have them join the class:</p>
          <div className="bg-bgSage rounded-xl p-5 my-6 text-center">
            <div className="text-sm text-textTitle/60">Join code</div>
            <div className="font-display text-3xl tracking-wide my-1">{cls.joinCode ?? '—'}</div>
            <div className="text-sm text-textTitle/60 mt-2">or visit</div>
            <div className="font-medium">{link}</div>
          </div>
          <p className="mb-4">
            Bread Head keeps student data minimal and is designed for classroom use. If you have any questions,
            please reach out to your student's teacher.
          </p>
          <p className="mt-8">Thank you,<br />The Bread Head Team</p>
        </div>
      </div>
    </main>
  )
}
