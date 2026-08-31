import { test, expect } from '@playwright/test'
import { contentIdentity, groupAssignments } from '../../lib/dashboard/contentGrouping'
import type { Assignment, ClassData } from '../../app/dashboard/useDashboard'

const ch = (id: string, challengeId: string): Assignment =>
  ({ id, type: 'challenge', challengeId, lessonIds: [], scope: 'class', studentUids: [], dueDate: null, submissions: {} } as Assignment)
const cls = (id: string, name: string, assignments: Assignment[]): ClassData =>
  ({ id, name, joinCode: null, grade: [], archived: false, assignments, students: [] } as ClassData)

test('contentGrouping: same challenge in two classes shares one identity', () => {
  expect(contentIdentity(ch('a', 'lib:1'))).toBe(contentIdentity(ch('b', 'lib:1')))
})

test('contentGrouping: same challenge across classes collapses into one group with two targets', () => {
  const classes = [cls('c1', 'P3', [ch('a', 'lib:1')]), cls('c2', 'P5', [ch('b', 'lib:1')])]
  const groups = groupAssignments(classes, 'challenge', () => 'Budget #1')
  expect(groups).toHaveLength(1)
  expect(groups[0].targets.map((t) => t.className).sort()).toEqual(['P3', 'P5'])
})
