import { test, expect } from '@playwright/test'
import {
  pushBounded, splitForFlush, toEventDoc, cleanParams, resolveAppVersion, makeSessionId,
  type PendingEvent,
} from '../../lib/analytics/eventsCore'

const ev = (p: Partial<PendingEvent> = {}): PendingEvent => ({
  uid: 'u1', name: 'lesson_started', clientTs: 1_700_000_000_000, sessionId: 's1', ...p,
})

test('pushBounded: drops the oldest events past the cap', () => {
  let buf: PendingEvent[] = []
  for (let i = 0; i < 7; i++) buf = pushBounded(buf, ev({ name: `e${i}` }), 5)
  expect(buf.map((e) => e.name)).toEqual(['e2', 'e3', 'e4', 'e5', 'e6'])
})

test('splitForFlush: keeps only the current uid and reports what it dropped', () => {
  const buf = [ev({ uid: 'old' }), ev({ uid: 'u1' }), ev({ uid: 'old' }), ev({ uid: 'u1' })]
  const { pending, dropped } = splitForFlush(buf, 'u1')
  expect(pending).toHaveLength(2)
  expect(pending.every((e) => e.uid === 'u1')).toBe(true)
  expect(dropped).toBe(2)
})

test('toEventDoc: contract §3 shape, platform web, omits absent screen/params', () => {
  const d = toEventDoc(ev(), '02da1df')
  expect(d).toEqual({ uid: 'u1', name: 'lesson_started', platform: 'web', sessionId: 's1', appVersion: '02da1df' })
  expect('screen' in d).toBe(false)
  expect('params' in d).toBe(false)
})

test('toEventDoc: carries screen and flat params through', () => {
  const d = toEventDoc(ev({ screen: 'lesson', params: { lessonId: 'unit1lesson1', slideIndex: 3, isInteractive: true } }), 'v')
  expect(d.screen).toBe('lesson')
  expect(d.params).toEqual({ lessonId: 'unit1lesson1', slideIndex: 3, isInteractive: true })
})

test('cleanParams: strips undefined and non-finite numbers, keeps null (nullable score)', () => {
  expect(cleanParams({ score: null, timeSpent: 12, bad: NaN, gone: undefined as any })).toEqual({ score: null, timeSpent: 12 })
  expect(cleanParams({ gone: undefined as any })).toBeUndefined()
  expect(cleanParams(undefined)).toBeUndefined()
})

test('resolveAppVersion: short SHA wins, then package version, then unknown', () => {
  expect(resolveAppVersion({ sha: '02da1df0123456789', pkgVersion: '0.1.0' })).toBe('02da1df')
  expect(resolveAppVersion({ sha: '', pkgVersion: '0.1.0' })).toBe('0.1.0')
  expect(resolveAppVersion({})).toBe('unknown')
})

test('makeSessionId: v4-shaped UUID', () => {
  const id = makeSessionId()
  expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
  expect(makeSessionId()).not.toBe(id)
})
