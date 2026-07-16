'use client'
import { useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useDashboard, apiCall, type Student, type Assignment } from '../../useDashboard'
import { DashboardShell, DashboardSkeleton, DashboardError } from '../../DashboardShell'
import { AssignedGroups } from '../AssignedGroups'
import { groupAssignments, type AssignedTarget } from '@/lib/dashboard/contentGrouping'
import { LIBRARY, getLibraryChallenge } from '@/lib/challenges/library'
import { resolveBoxDollars, type Allocation, type CriterionResult } from '@/lib/challenges/challenge'
import { ClassTargetPicker } from '../ClassTargetPicker'
import { fanoutAssign, type ClassTarget } from '@/lib/dashboard/assignFanout'
import { useToast } from '../../ToastProvider'

// General, class-agnostic Challenges page. Unlike journals, challenge
// submissions are fake money — there is no privacy reason to withhold them,
// so the teacher sees the full allocation and criteria checklist per student.
// This page is read-only for review (no score override / feedback editor —
// Phase 2), but adds a composer to assign a Budget Challenge to a class.
export default function ChallengesContentPage() {
  const { data, err, loading, user, signOut, reload } = useDashboard()
  const { notify, confirm } = useToast()

  const [challengeId, setChallengeId] = useState<string>(LIBRARY[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [targets, setTargets] = useState<ClassTarget[]>([])
  const [editing, setEditing] = useState<AssignedTarget | null>(null)
  const [busy, setBusy] = useState(false)

  const today = new Date().toISOString().slice(0, 10)
  const activeClasses = useMemo(() => (data ?? []).filter((c) => !c.archived), [data])

  if (loading || (!data && !err)) return <DashboardSkeleton />
  if (err) return <DashboardError message={err} />

  const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

  function resetComposer() {
    setChallengeId(LIBRARY[0]?.id ?? ''); setTitle('')
    setTargets([]); setEditing(null)
  }

  function startEditFromTarget(t: AssignedTarget) {
    const a = t.assignment
    setEditing(t)
    setChallengeId(a.challengeId ? a.challengeId : (LIBRARY[0]?.id ?? ''))
    setTitle(a.title ?? '')
    setTargets([{
      classId: t.classId,
      className: t.className,
      dueDate: a.dueDate ?? null,
      studentUids: a.scope === 'students' ? (a.studentUids ?? []) : null,
    }])
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function submit() {
    if (!user) return
    if (!challengeId) { notify('Pick a Budget Challenge.', 'error'); return }
    if (targets.length === 0) { notify('Pick at least one class.', 'error'); return }
    const emptyStudentsTarget = targets.find((t) => Array.isArray(t.studentUids) && t.studentUids.length === 0)
    if (emptyStudentsTarget) {
      notify(`Pick at least one student for ${emptyStudentsTarget.className}, or turn off "Choose specific students".`, 'error')
      return
    }

    const basePayload = {
      type: 'challenge',
      challengeId,
      title: title.trim() || null,
    }

    setBusy(true)
    try {
      if (editing) {
        const t = targets[0]
        const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
        const payload = {
          ...basePayload,
          scope: useStudents ? 'students' : 'class',
          studentUids: useStudents ? t.studentUids : [],
          dueDate: t.dueDate,
        }
        await apiCall(user, `/api/classes/${t.classId}/assign?id=${editing.assignment.id}`, 'PATCH', payload)
        resetComposer()
        reload()
        notify('Budget Challenge updated.', 'success')
      } else {
        if (targets.some((t) => t.dueDate && t.dueDate < today) && !(await confirm({ message: 'One or more due dates are in the past — assign anyway?' }))) return
        const dup = targets.some((t) => {
          const targetCls = activeClasses.find((c) => c.id === t.classId)
          const useStudents = Array.isArray(t.studentUids) && t.studentUids.length > 0
          return (targetCls?.assignments ?? []).some((a) =>
            a.type === 'challenge' &&
            a.challengeId === challengeId &&
            a.scope === (useStudents ? 'students' : 'class') &&
            (!useStudents || sameSet(a.studentUids ?? [], t.studentUids ?? [])),
          )
        })
        if (dup && !(await confirm({ message: 'An identical Budget Challenge is already assigned in at least one selected class. Add anyway?' }))) return

        const results = await fanoutAssign((cid, body) => apiCall(user, `/api/classes/${cid}/assign`, 'POST', body), basePayload, targets)
        const failed = results.filter((r) => !r.ok)
        if (failed.length === 0) {
          resetComposer()
          notify(`Assigned to ${results.length} ${results.length === 1 ? 'class' : 'classes'}.`, 'success')
        } else {
          // Keep only the classes that failed, so a retry doesn't re-assign the ones that succeeded.
          setTargets((prev) => prev.filter((t) => failed.some((f) => f.classId === t.classId)))
          notify(`Assigned to ${results.length - failed.length} of ${results.length} classes — ` + failed.map((f) => `${f.className}: ${f.error}`).join('; '), 'error')
        }
        reload()
      }
    } catch { notify('Something went wrong — please try again.', 'error') } finally { setBusy(false) }
  }

  async function removeFromTarget(t: AssignedTarget) {
    if (!user) return
    if (!(await confirm({ message: 'Remove this Budget Challenge?', confirmLabel: 'Remove', destructive: true }))) return
    try {
      await apiCall(user, `/api/classes/${t.classId}/assign?id=${t.assignment.id}`, 'DELETE')
      if (editing?.assignment.id === t.assignment.id) resetComposer()
      reload()
      notify('Budget Challenge removed.', 'success')
    } catch { notify('Could not remove the challenge — please try again.', 'error') }
  }

  const groups = groupAssignments(
    data!,
    'challenge',
    (a: Assignment) => getLibraryChallenge(a.challengeId ?? '')?.title || a.title || 'Budget Challenge',
  )

  // Review section: every challenge assignment across all classes, newest-ish grouping by class.
  const challengeAssignmentsByClass = (data ?? [])
    .map((c) => ({ cls: c, assignments: c.assignments.filter((a) => a.type === 'challenge') }))
    .filter((x) => x.assignments.length > 0)

  return (
    <DashboardShell data={data!} user={user} signOut={signOut} reload={reload}>
      <h1 className="font-display text-3xl text-textTitle mb-1">Challenges</h1>
      <p className="text-textTitle/70 text-sm mb-6">
        Budget Challenges use fake money, so results are fully visible here — allocations, criteria, and reflections.
      </p>

      <div className="mb-6">
        <AssignedGroups groups={groups} emptyLabel="Nothing assigned yet." onEdit={startEditFromTarget} onRemove={removeFromTarget} />
      </div>

      {/* Composer */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
        <div className="text-sm font-medium text-textTitle mb-3">
          {editing ? 'Edit assignment' : 'Assign a Budget Challenge'}
        </div>

        <div className="rounded-xl bg-bgSage/60 p-3 mb-3 space-y-2">
          <div className="text-xs uppercase tracking-wider text-textTitle/70">Budget Challenge</div>
          <select
            value={challengeId}
            onChange={(e) => setChallengeId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-textTitle/15 text-sm"
          >
            {LIBRARY.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
          {getLibraryChallenge(challengeId) && (
            <p className="text-xs text-textTitle/70">{getLibraryChallenge(challengeId)!.prompt}</p>
          )}
        </div>

        <input
          type="text" value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full px-3 py-2 rounded-xl border border-textTitle/15 text-sm mb-3"
        />

        <div className="mb-4">
          <ClassTargetPicker
            classes={editing ? activeClasses.filter((c) => c.id === targets[0]?.classId) : activeClasses}
            value={targets}
            onChange={setTargets}
          />
        </div>

        <div className="flex gap-2">
          <button onClick={submit} disabled={busy || targets.length === 0}
            className="flex-1 px-3 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Assign'}
          </button>
          {editing && (
            <button onClick={resetComposer} className="px-3 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
          )}
        </div>
      </div>

      {/* Review — per-student allocation + criteria, grouped by class */}
      {challengeAssignmentsByClass.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-5 text-sm text-textTitle/70">
          No Budget Challenges have been assigned yet.
        </div>
      ) : (
        <div className="space-y-8">
          {challengeAssignmentsByClass.map(({ cls: c, assignments }) => (
            <div key={c.id}>
              <div className="text-xs uppercase tracking-wider text-textTitle/70 mb-2">{c.name}</div>
              <div className="space-y-6">
                {assignments.map((a) => (
                  <ChallengeCard key={a.id} classId={c.id} assignment={a} roster={c.students} />
                ))}
              </div>
            </div>
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
          <p className="text-xs text-textTitle/70 mt-0.5">
            {assignment.scope === 'class' ? 'Whole class' : `${(assignment.studentUids ?? []).length} student${(assignment.studentUids ?? []).length > 1 ? 's' : ''}`}
            {' · '}{done}/{students.length} complete
            {assignment.dueDate && <> · Due {assignment.dueDate}</>}
          </p>
        </div>
      </div>
      {ch?.prompt && <p className="text-xs text-textTitle/70 mt-2">{ch.prompt}</p>}

      <div className="mt-3 divide-y divide-textTitle/5">
        {students.map((s) => (
          <StudentRow key={s.uid} classId={classId} assignmentId={assignment.id} student={s} ch={ch} sub={assignment.submissions?.[s.uid]} />
        ))}
        {students.length === 0 && <p className="text-xs text-textTitle/70 py-3">No students targeted by this assignment.</p>}
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
      : 'bg-textTitle/10 text-textTitle/70'

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
          {canExpand && <span className="text-textTitle/70 text-xs shrink-0">{open ? '▾' : '▸'}</span>}
          <span className="text-textTitle truncate">{student.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {scoreLabel && <span className="text-xs text-textTitle/70">{scoreLabel}</span>}
          <span className={`text-[11px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${statusStyle}`}>{status}</span>
        </div>
      </button>

      {open && sub && (
        <div className="mt-2 ml-4 pl-3 border-l-2 border-bgSage">
          {detail === 'loading' && <p className="text-xs text-textTitle/70">Loading submission…</p>}
          {detail === null && (
            <p className="text-xs text-textTitle/70">Couldn&apos;t load this submission.</p>
          )}
          {detail && typeof detail === 'object' && (
            <>
              {detail.allocation.boxes.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-textTitle/70 mb-1">Allocation</p>
                  <ul className="space-y-1">
                    {detail.allocation.boxes.map((box) => (
                      <li key={box.id} className="flex items-center justify-between text-[13px] text-textTitle/75">
                        <span>{box.name} <span className="text-textTitle/70">· {box.role}</span></span>
                        <span className="font-medium">${resolveBoxDollars(box, income).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.perCriterion.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-textTitle/70 mb-1">Criteria</p>
                  <ul className="flex flex-col gap-1">
                    {detail.perCriterion.map((c, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px]">
                        <span aria-hidden>{c.passed ? '✅' : '❌'}</span>
                        <span className={c.passed ? 'text-textTitle' : 'text-textTitle/70'}>{c.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {detail.reflection && (
                <div className="mb-3 bg-bgSage/60 rounded-xl p-3 text-[13px] text-textTitle/80">
                  <p className="text-[10.5px] font-bold uppercase tracking-wide text-textTitle/70 mb-1">Student reflection</p>
                  {detail.reflection}
                </div>
              )}

              {/* Feedback editor deferred (see 2026-07-12 ship spec C3); hiding read-only feedback until an authoring UI exists. */}
            </>
          )}
        </div>
      )}
    </div>
  )
}
