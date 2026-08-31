'use client'
import type { AssignedGroup, AssignedTarget } from '@/lib/dashboard/contentGrouping'

// Shared "Currently assigned" card for the class-agnostic content pages
// (lessons/journal/challenges). Mirrors the "Assigned" card in
// app/dashboard/[classId]/course/page.tsx, but grouped by content identity
// with one row per class the content is assigned to.
export function AssignedGroups({
  groups, emptyLabel, onEdit, onRemove,
}: {
  groups: AssignedGroup[]
  emptyLabel: string
  onEdit: (t: AssignedTarget) => void
  onRemove: (t: AssignedTarget) => void
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="text-sm font-medium text-textTitle mb-2">Currently assigned</div>
      {groups.length === 0 ? (
        <p className="text-xs text-textTitle/70">{emptyLabel}</p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <div key={g.key} className="text-xs border-b border-textTitle/5 pb-3 last:border-0">
              <div className="text-textTitle font-medium mb-1.5">{g.label}</div>
              <div className="space-y-2 pl-1">
                {g.targets.map((t) => (
                  <div key={t.classId} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-textTitle/75 truncate">{t.className}</div>
                      <div className="text-textTitle/70">
                        due {t.assignment.dueDate ?? '-'} · {t.done}/{t.total} done
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => onEdit(t)} className="text-brandGreen hover:underline">Edit</button>
                      <button onClick={() => onRemove(t)} className="text-red-600 hover:underline">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
