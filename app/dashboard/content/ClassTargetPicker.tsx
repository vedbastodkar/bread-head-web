'use client'
import { useEffect, useState } from 'react'
import type { ClassData } from '../useDashboard'
import type { ClassTarget } from '@/lib/dashboard/assignFanout'

// Multi-class assignment target picker. Replaces the single-class <select>
// composers used pre-fan-out: a teacher checks any number of active classes,
// sets a per-class due date, and optionally narrows each checked class down
// to specific students (toggle default OFF = whole class).
export function ClassTargetPicker({
  classes,
  value,
  onChange,
}: {
  classes: ClassData[]
  value: ClassTarget[]
  onChange: (next: ClassTarget[]) => void
}) {
  const [chooseStudents, setChooseStudents] = useState(false)
  const today = new Date().toISOString().slice(0, 10)

  // Reveal specific-student mode whenever the incoming targets are already
  // student-scoped (a non-null studentUids array) — e.g. when editing an
  // assignment that was scoped to specific students. Without this the toggle
  // starts OFF, the assignment looks whole-class, and the student set is hidden
  // (and would be wiped the moment the teacher ticked the box to inspect it).
  useEffect(() => {
    if (value.some((t) => Array.isArray(t.studentUids))) setChooseStudents(true)
  }, [value])

  const targetFor = (classId: string) => value.find((t) => t.classId === classId)

  function toggleClass(c: ClassData) {
    const existing = targetFor(c.id)
    if (existing) {
      onChange(value.filter((t) => t.classId !== c.id))
    } else {
      onChange([...value, { classId: c.id, className: c.name, dueDate: null, studentUids: null }])
    }
  }

  function setDueDate(classId: string, dueDate: string) {
    onChange(value.map((t) => (t.classId === classId ? { ...t, dueDate: dueDate || null } : t)))
  }

  function toggleStudent(classId: string, uid: string) {
    onChange(
      value.map((t) => {
        if (t.classId !== classId) return t
        const current = new Set(t.studentUids ?? [])
        current.has(uid) ? current.delete(uid) : current.add(uid)
        return { ...t, studentUids: Array.from(current) }
      }),
    )
  }

  function toggleChooseStudents() {
    const next = !chooseStudents
    setChooseStudents(next)
    // Reset per-class student scoping when the toggle flips, so state doesn't
    // carry stale selections between whole-class and specific-student modes.
    onChange(value.map((t) => ({ ...t, studentUids: next ? [] : null })))
  }

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-textTitle/70 mb-3">
        <input type="checkbox" checked={chooseStudents} onChange={toggleChooseStudents} />
        Choose specific students
      </label>

      <div className="space-y-2">
        {classes.map((c) => {
          const target = targetFor(c.id)
          const checked = !!target
          return (
            <div key={c.id} className="rounded-xl border border-textTitle/15 p-3">
              <label className="flex items-start gap-2 text-sm text-textTitle">
                <input type="checkbox" checked={checked} onChange={() => toggleClass(c)} className="mt-0.5 shrink-0" />
                <span className="leading-snug">{c.name}</span>
              </label>

              {checked && (
                <div className="mt-2 pl-6 space-y-2">
                  <div>
                    <label className="block text-xs text-textTitle/70 mb-1">Due date (optional)</label>
                    <input
                      type="date"
                      value={target?.dueDate ?? ''}
                      min={today}
                      onChange={(e) => setDueDate(c.id, e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-textTitle/15 text-sm"
                    />
                  </div>

                  {chooseStudents && (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {c.students.map((s) => (
                        <label key={s.uid} className="flex items-center gap-2 text-sm text-textTitle/80">
                          <input
                            type="checkbox"
                            checked={(target?.studentUids ?? []).includes(s.uid)}
                            onChange={() => toggleStudent(c.id, s.uid)}
                          />
                          {s.name}
                        </label>
                      ))}
                      {c.students.length === 0 && (
                        <p className="text-xs text-textTitle/70">No students in this class yet.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
        {classes.length === 0 && <p className="text-xs text-textTitle/70">No active classes.</p>}
      </div>
    </div>
  )
}
