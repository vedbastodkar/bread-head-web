import { test, expect } from '@playwright/test'
import { fanoutAssign } from '../../lib/dashboard/assignFanout'

test('fanoutAssign: assigns per class and reports partial failure', async () => {
  const calls: Array<{ classId: string; body: any }> = []
  const post = async (classId: string, body: object) => {
    calls.push({ classId, body })
    if (classId === 'c2') throw new Error('roster')
    return { id: 'x' }
  }
  const res = await fanoutAssign(post, { type: 'challenge', challengeId: 'lib:1' }, [
    { classId: 'c1', className: 'P3', dueDate: '2026-09-10' },
    { classId: 'c2', className: 'P5', dueDate: '2026-09-12', studentUids: ['s1'] },
  ])
  expect(res).toEqual([
    { classId: 'c1', className: 'P3', ok: true },
    { classId: 'c2', className: 'P5', ok: false, error: 'roster' },
  ])
  expect(calls[0]).toEqual({ classId: 'c1', body: { type: 'challenge', challengeId: 'lib:1', scope: 'class', studentUids: [], dueDate: '2026-09-10' } })
  expect(calls[1]).toEqual({ classId: 'c2', body: { type: 'challenge', challengeId: 'lib:1', scope: 'students', studentUids: ['s1'], dueDate: '2026-09-12' } })
})
