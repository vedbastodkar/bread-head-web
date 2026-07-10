'use client'
import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useStudent, type StudentAssignment } from '@/app/student/useStudent'
import { StudentShell, StudentSkeleton, StudentError } from '@/app/student/StudentShell'
import { getLibraryChallenge } from '@/lib/challenges/library'
import { lessonName } from '@/lib/curriculum/lessons'

// ---- submission doc shape (read-only mirror of the server-authoritative fields
// written by /api/challenge/submit, /api/journal/submit, /api/lesson/submit) ----
interface CriterionResult { kind: string; passed: boolean; detail: string }
interface FirestoreTimestampLike { toDate: () => Date }
interface SubmissionDoc {
  status?: 'complete' | 'in_progress'
  perCriterion?: CriterionResult[]
  teacherFeedback?: string
  submittedAt?: FirestoreTimestampLike | null
}

interface GradeRow {
  key: string
  type: string
  title: string
  dueDate: string | null
  submission: SubmissionDoc | null
}

// Best-effort title, mirroring the fallback chain StudentHome.tsx uses for
// challenges — a lesson's title comes from its first lessonId when the
// assignment itself carries none.
function titleFor(a: StudentAssignment): string {
  if (a.type === 'challenge') {
    return a.title || (a.challengeId && getLibraryChallenge(a.challengeId)?.title) || 'Budget Challenge'
  }
  if (a.type === 'journal') return a.title || 'Journal'
  if (a.type === 'lesson' || a.type === undefined) {
    if (a.title) return a.title
    const first = a.lessonIds[0]
    const m = first?.match(/^unit(\d+)lesson(\d+)$/)
    if (m) return lessonName(Number(m[1]), Number(m[2])) ?? 'Lesson'
    return 'Lesson'
  }
  return a.title || 'Assignment'
}

function statusLabel(sub: SubmissionDoc | null): 'Complete' | 'In progress' | 'Not started' {
  if (!sub) return 'Not started'
  return sub.status === 'complete' ? 'Complete' : 'In progress'
}

function submittedLabel(sub: SubmissionDoc | null): string | null {
  const ts = sub?.submittedAt
  if (!ts || typeof ts.toDate !== 'function') return null
  try {
    return ts.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  } catch {
    return null
  }
}

export default function GradesPage() {
  const { data, err, loading, user, signOut } = useStudent()
  const [rows, setRows] = useState<GradeRow[] | null>(null)

  useEffect(() => {
    if (!data || !user) return
    let cancelled = false
    ;(async () => {
      const out: GradeRow[] = []
      for (const a of data.assignments) {
        let submission: SubmissionDoc | null = null
        try {
          const snap = await getDoc(doc(db, 'classes', a.classId, 'assignments', a.id, 'submissions', user.uid))
          submission = snap.exists() ? (snap.data() as SubmissionDoc) : null
        } catch {
          // No submission yet, or the read was blocked — render as "not started"
          // rather than crashing the whole page over one class's assignment.
          submission = null
        }
        out.push({
          key: `${a.classId}:${a.id}`,
          type: a.type ?? 'lesson',
          title: titleFor(a),
          dueDate: a.dueDate,
          submission,
        })
      }
      if (!cancelled) setRows(out)
    })()
    return () => { cancelled = true }
  }, [data, user])

  if (loading || (!data && !err)) return <StudentSkeleton />
  if (err) return <StudentError message={err} />

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <h1 className="font-display text-3xl text-textTitle mb-6">Grades</h1>

      {rows === null ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/50 animate-pulse">Loading your grades…</div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/50">No graded work yet.</div>
      ) : (
        <div className="flex flex-col gap-4">
          {rows.map((r) => <GradeCard key={r.key} row={r} />)}
        </div>
      )}
    </StudentShell>
  )
}

function GradeCard({ row }: { row: GradeRow }) {
  const sub = row.submission
  const status = statusLabel(sub)
  const submitted = submittedLabel(sub)
  const isChallenge = row.type === 'challenge'
  const perCriterion = sub?.perCriterion ?? []
  const passedCount = perCriterion.filter((c) => c.passed).length

  const statusStyle =
    status === 'Complete' ? 'bg-brandGreen/15 text-brandGreen'
      : status === 'In progress' ? 'bg-accentGold/20 text-[#9c7d1f]'
      : 'bg-textTitle/10 text-textTitle/50'

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-display italic text-xl text-textTitle truncate">{row.title}</h2>
          <p className="text-xs text-textTitle/45 mt-0.5 capitalize">{row.type}</p>
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-full shrink-0 ${statusStyle}`}>
          {status}
        </span>
      </div>

      {isChallenge && sub && perCriterion.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-semibold text-textTitle">{passedCount} / {perCriterion.length} criteria</p>
          <ul className="flex flex-col gap-1.5 mt-2">
            {perCriterion.map((c, i) => (
              <li key={i} className="flex items-center gap-2 text-[13.5px]">
                <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                <span className={c.passed ? 'text-textTitle' : 'text-textTitle/60'}>{c.detail}</span>
              </li>
            ))}
          </ul>
          {sub.teacherFeedback && (
            <div className="mt-3 bg-bgSage/60 rounded-xl p-3 text-[13.5px] text-textTitle/80">
              <p className="text-[10.5px] font-bold uppercase tracking-wide text-brandGreen mb-1">Teacher feedback</p>
              {sub.teacherFeedback}
            </div>
          )}
        </div>
      )}

      {submitted && <p className="text-xs text-textTitle/45 mt-3">Submitted {submitted}</p>}
      {!submitted && row.dueDate && status !== 'Complete' && (
        <p className="text-xs text-textTitle/45 mt-3">Due {row.dueDate}</p>
      )}
    </div>
  )
}
