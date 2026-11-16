import { test, expect } from '@playwright/test'
import { isValidSponsorId, parseSponsorItems, sortedSponsors } from '../../lib/sponsors/shared'

const items = parseSponsorItems({
  'example-bank': { displayName: 'Example Bank', active: false, sortOrder: 1 },
  'first-national': { displayName: 'First National Bank', active: true, sortOrder: 2 },
  'acme-cu': { displayName: 'Acme Credit Union', active: true, sortOrder: 2 },
  classroom: { displayName: 'nope', active: true, sortOrder: 0 },       // reserved → dropped
  'Bad Id': { displayName: 'nope', active: true, sortOrder: 0 },        // invalid slug → dropped
  'no-name': { active: true, sortOrder: 0 },                            // missing displayName → dropped
})

test('isValidSponsorId: slug only, reserved ids rejected', () => {
  expect(isValidSponsorId('first-national')).toBe(true)
  expect(isValidSponsorId('classroom')).toBe(false)
  expect(isValidSponsorId('self')).toBe(false)
  expect(isValidSponsorId('Bad Id')).toBe(false)
  expect(isValidSponsorId('a')).toBe(false)
  expect(isValidSponsorId(42)).toBe(false)
})

test('parseSponsorItems: keeps well-formed entries, drops reserved/invalid', () => {
  expect(Object.keys(items).sort()).toEqual(['acme-cu', 'example-bank', 'first-national'])
  expect(items['example-bank']).toEqual({ displayName: 'Example Bank', active: false, sortOrder: 1 })
})

test('sortedSponsors: active only by default, sortOrder then name', () => {
  expect(sortedSponsors(items).map((s) => s.id)).toEqual(['acme-cu', 'first-national'])
  expect(sortedSponsors(items, false).map((s) => s.id)).toEqual(['example-bank', 'acme-cu', 'first-national'])
})
