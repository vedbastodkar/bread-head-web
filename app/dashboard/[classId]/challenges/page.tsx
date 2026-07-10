'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useDashboard, type Student, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardLoading, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { getLibraryChallenge } from '@/lib/challenges/library'
import { resolveBoxDollars, type Allocation, type CriterionResult } from '@/lib/challenges/challenge'

// Teacher challenge review: unlike journals, challenge submissions are fake
// money — there is no privacy reason to withhold them, so the teacher sees
// the full allocation and criteria checklist per student. This page is
// read-only in the MVP (no score override / feedback editor — Phase 2).
export default function TeacherChallengesPage() {
  const { classId } = useParams<{ classId: string }>()
  const { data, err, loading, user, signOut, reload } = useDashboard()

  const cls = data?.find((c) => c.id === classId)

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />
  if (!cls) return <DashboardLoading><p className="text-textTitle/60">Class not found.</p></DashboardLoading>

  const challengeAssignments = cls.assignments.filter((a) => a.type === 'challenge')

  return (
    <DashboardShell data={data!} activeClassId={cls.id} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Challenges</h1>
      <p className="text-textTitle/60 text-sm mb-6">
        Budget Challenges use fake money, so results are fully visible here — allocations, criteria, and reflections.
      </p>

      {challengeAssignments.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-5 text-sm text-textTitle/50">
          No Budget Challenges have been assigned to this class yet.
        </div>
      ) : (
        <div className="space-y-6">
          {challengeAssignments.map((a) => (
            <ChallengeCard key={a.id} classId={cls.id} assignment={a} roster={cls.students} />
          ))}
        </div>
      )}
    </DashboardShell>
  )
}

// Roster subset an assignment targets, mirroring the journal page's scope logic.
function targetStudents(roster: Student[], a: Assignment): Student[] {
  return a.scope === 'class' ? roster : roster.filter((s) => (a.studentUids ?? []).includes(s.uid))
}

function ChallengeCard({ classId, assignment, roster }: { classId: string; assignment: Assignment; roster: Student[] }) {
  const ch = assignment.challengeId ? getLibraryChallenge(assignment.challengeId) : null
  const title = ch?.title || assignment.title || 'Budget Challenge'
  const students = targetStudents(roster, assignment)
  const done = students.filter((s) => assignment.submissions?.[s.uid]?.status === 'complete').length

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h2 className="font-display italic text-xl text-textTitle truncate">{title}</h2>
          <p className="text-xs text-textTitle/45 mt-0.5">
            {assignment.scope === 'class' ? 'Whole class' : `${(assignment.studentUids ?? []).length} student${(assignment.studentUids ?? []).length > 1 ? 's' : ''}`}
            {' · '}{done}/{students.length} complete
            {assignment.dueDate && <> · Due {assignment.dueDate}</>}
          </p>
        </div>
      </div>
      {ch?.prompt && <p className="text-xs text-textTitle/55 mt-2">{ch.prompt}</p>}

      <div className="mt-3 divide-y divide-textTitle/5">
        {students.map((s) => (
          <StudentRow key={s.uid} classId={classId} assignmentId={assignment.id} student={s} ch={ch} sub={assignment.submissions?.[s.uid]} />
        ))}
        {students.length === 0 && <p className="text-xs text-textTitle/40 py-3">No students targeted by this assignment.</p>}
      </div>
    </div>
  )
}

// ---- full submission doc shape (read-only mirror of /api/challenge/submit's write) ----
interface FullSubmission {
  allocation: Allocation
  score: number
  allPassed: boolean
  perCriterion: CriterionResult[]
  status: 'complete' | 'in_progress'
  reflection?: string
  teacherFeedback?: string
}

function StudentRow({
  classId, assignmentId, student, ch, sub,
}: {
  classId: string
  assignmentId: string
  student: Student
  ch: ReturnType<typeof getLibraryChallenge>
  sub?: { status: 'complete' | 'in_progress'; score?: number; allPassed?: boolean }
}) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<FullSubmission | null | 'loading'>(null)

  function toggle() {
    const next = !open
    setOpen(next)
    if (next && sub && detail === null) {
      setDetail('loading')
      ;(async () => {
        try {
          const snap = await getDoc(doc(db, 'classes', classId, 'assignments', assignmentId, 'submissions', student.uid))
          setDetail(snap.exists() ? (snap.data() as FullSubmission) : null)
        } catch {
          setDetail(null)
        }
      })()
    }
  }

  const status = !sub ? 'Not started' : sub.status === 'complete' ? 'Complete' : 'In progress'
  const statusStyle =
    status === 'Complete' ? 'bg-brandGreen/15 text-brandGreen'
      : status === 'In progress' ? 'bg-accentGold/20 text-[#9c7d1f]'
      : 'bg-textTitle/10 text-textTitle/50'

  const total = ch?.criteria.length ?? (typeof detail === 'object' && detail ? detail.perCriterion.length : undefined)
  const scoreLabel =
    sub && typeof sub.score === 'number' && total
      ? `${Math.round(sub.score * total)}/${total} criteria`
      : sub && typeof sub.score === 'number'
        ? `${Math.round(sub.score * 100)}%`
        : null

  const income = ch?.monthly?.income ?? 0
  const canExpand = !!sub

  return (
    <div className="py-2.5 text-sm">
      <button
        onClick={toggle}
        disabled={!canExpand}
        className="w-full flex items-center justify-between gap-3 text-left disabled:cursor-default"
      >
        <div className="min-w-0 flex items-center gap-2">
          {canExpand && <span className="text-textTitle/40 text-xs shrink-0">{open ? '▾' : '▸'}</span>}
          <span className="text-textTitle truncate">{student.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scoreLabel && <span className="text-xs text-textTitle/50">{scoreLabel}</span>}
          <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusStyle}`}>{status}</span>
        </div>
      </button>

      {open && sub && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-bgSage">
          {detail === 'loading' && <p className="text-xs text-textTitle/40">Loading submission…</p>}
          {detail === null && (
            <p className="text-xs text-textTitle/40">Couldn&apos;t load this submission.</p>
          )}
          {detail && typeof detail === 'object' && (
            <>
              {detail.allocation.boxes.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-textTitle/40 mb-1">Allocation</p>
                  <ul className="space-y-1">
                    {detail.allocation.boxes.map((box) => (
                      <li key={box.id} className="flex items-center justify-between text-[13px] text-textTitle/75">
                        <span>{box.name} <span className="text-textTitle/40">· {box.role}</span></span>
                        <span className="font-medium">${resolveBoxDollars(box, income).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.perCriterion.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-textTitle/40 mb-1">Criteria</p>
                  <ul className="flex flex-col gap-1">
                    {detail.perCriterion.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px]">
                        <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                        <span className={c.passed ? 'text-textTitle' : 'text-textTitle/60'}>{c.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.reflection && (
                <div className="mb-3 bg-bgSage/60 rounded-xl p-3 text-[13px] text-textTitle/80">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-textTitle/40 mb-1">Student reflection</p>
                  {detail.reflection}
                </div>
              )}

              {detail.teacherFeedback && (
                <div className="mb-1 bg-brandGreen/10 rounded-xl p-3 text-[13px] text-textTitle/80">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-brandGreen mb-1">Teacher feedback</p>
                  {detail.teacherFeedback}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
