import { test, expect } from '@playwright/test'
import { PROMPT_CATEGORIES, PROMPT_TEMPLATES } from '../../lib/journal/prompts'

test('every category has an id, name, and non-empty prompts', () => {
  expect(PROMPT_CATEGORIES.length).toBeGreaterThan(0)
  for (const c of PROMPT_CATEGORIES) {
    expect(c.id.trim().length).toBeGreaterThan(0)
    expect(c.name.trim().length).toBeGreaterThan(0)
    expect(c.prompts.length).toBeGreaterThan(0)
    for (const p of c.prompts) expect(p.trim().length).toBeGreaterThan(0)
  }
})

test('every template has an id, name, and non-empty questions', () => {
  expect(PROMPT_TEMPLATES.length).toBeGreaterThan(0)
  for (const t of PROMPT_TEMPLATES) {
    expect(t.id.trim().length).toBeGreaterThan(0)
    expect(t.name.trim().length).toBeGreaterThan(0)
    expect(t.questions.length).toBeGreaterThan(0)
    for (const q of t.questions) expect(q.trim().length).toBeGreaterThan(0)
  }
})

test('category and template ids are unique', () => {
  const catIds = PROMPT_CATEGORIES.map((c) => c.id)
  const tplIds = PROMPT_TEMPLATES.map((t) => t.id)
  expect(new Set(catIds).size).toBe(catIds.length)
  expect(new Set(tplIds).size).toBe(tplIds.length)
})
