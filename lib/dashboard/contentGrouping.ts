import type { Assignment, ClassData } from '@/app/dashboard/useDashboard'
import { completionFor } from './completion'

export type ContentType = 'lesson' | 'journal' | 'challenge'

export function contentIdentity(a: Assignment): string {
  const type = a.type ?? 'lesson'
  if (type === 'challenge') return `challenge:${a.challengeId ?? ''}`
  if (type === 'journal') {
    const qs = (a.journal?.questions ?? []).map((q) => q.trim()).join('␟')
    return `journal:${(a.title ?? '').trim()}:${qs}`
  }
  return `lesson:${[...a.lessonIds].sort().join(',')}`
}

export interface AssignedTarget { classId: string; className: string; assignment: Assignment; done: number; total: number }
export interface AssignedGroup { key: string; type: ContentType; label: string; targets: AssignedTarget[] }

export function groupAssignments(classes: ClassData[], type: ContentType, labelFor: (a: Assignment) => string): AssignedGroup[] {
  const map = new Map<string, AssignedGroup>()
  for (const cls of classes) {
    for (const a of cls.assignments) {
      const t = a.type ?? 'lesson'
      if (t !== type) continue
      const key = contentIdentity(a)
      const { done, total } = completionFor(a, cls.students)
      const group = map.get(key) ?? { key, type, label: labelFor(a), targets: [] }
      group.targets.push({ classId: cls.id, className: cls.name, assignment: a, done, total })
      map.set(key, group)
    }
  }
  return Array.from(map.values())
}
