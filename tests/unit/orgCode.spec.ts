import { test, expect } from '@playwright/test'
import { ORG_CODE_LENGTH, isOrgCode, makeOrgCode, normalizeOrgCode } from '../../lib/sponsors/orgCode'

test('normalizeOrgCode: uppercases and strips spaces/dashes', () => {
  expect(normalizeOrgCode(' abcd-2345 ')).toBe('ABCD2345')
  expect(normalizeOrgCode('abcd 2345')).toBe('ABCD2345')
  expect(normalizeOrgCode(undefined)).toBe('')
  expect(normalizeOrgCode(42)).toBe('')
})

test('isOrgCode: exactly 8 chars from the unambiguous alphabet', () => {
  expect(isOrgCode('ABCD2345')).toBe(true)
  expect(isOrgCode('ABCD234')).toBe(false)
  expect(isOrgCode('ABCD23456')).toBe(false)
  expect(isOrgCode('ABCD234O')).toBe(false) // O excluded (looks like 0)
  expect(isOrgCode('ABCD2341')).toBe(false) // 1 excluded (looks like I)
  expect(isOrgCode('abcd2345')).toBe(false) // must already be normalised
})

test('makeOrgCode: valid code, driven by the injected random source', () => {
  expect(makeOrgCode(() => 0)).toBe('AAAAAAAA')
  expect(makeOrgCode(() => 0.999999)).toBe('99999999')
  for (let i = 0; i < 50; i++) {
    const c = makeOrgCode()
    expect(c).toHaveLength(ORG_CODE_LENGTH)
    expect(isOrgCode(c)).toBe(true)
  }
})
