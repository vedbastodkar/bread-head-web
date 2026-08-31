// Starter budget templates — mirrored from the iOS app's BudgetTemplate.presetTemplates
// (Budgeting/Models/BudgetSettings.swift). These back the web budget onboarding's
// "Choose Your Budget Style" step. Picking one creates its categories as real boxes
// (percent targets), and — where the template defines a Need/Want/Save split — those
// pcts are written to settings so iOS honours the same split.
import type { BudgetCategory } from './budget'

export interface TemplateCategory {
  name: string
  iconKey: string // shared SF Symbol key (rendered via lib/sfIcon)
  targetValue: number // percent of income (0–100)
}

export interface BudgetTemplate {
  id: string
  name: string
  description: string
  bestFor: string
  categories: TemplateCategory[]
  // Present only for templates that budget by Need/Want/Save buckets; written to
  // settings.nws*Pct so iOS enforces the same caps. Category templates omit these.
  nws?: { need: number; want: number; save: number }
}

export const BUDGET_TEMPLATES: BudgetTemplate[] = [
  {
    id: '50-30-20',
    name: '50/30/20 Split',
    description:
      'Splits your income into three buckets (half for needs, 30% for wants, 20% for savings) and enforces those caps automatically.',
    bestFor: 'Best for: beginners who want a simple, proven rule without tracking every category.',
    categories: [
      { name: 'Needs', iconKey: 'house.fill', targetValue: 50 },
      { name: 'Wants', iconKey: 'heart.fill', targetValue: 30 },
      { name: 'Savings', iconKey: 'target', targetValue: 20 },
    ],
    nws: { need: 50, want: 30, save: 20 },
  },
  {
    id: 'student',
    name: 'Student Budget',
    description: 'Four focused categories (Essentials, Food, Entertainment, Savings) with per-category percentage caps.',
    bestFor: 'Best for: students with tight, predictable income who want to track each spending area.',
    categories: [
      { name: 'Essentials', iconKey: 'house.fill', targetValue: 60 },
      { name: 'Food', iconKey: 'fork.knife', targetValue: 20 },
      { name: 'Entertainment', iconKey: 'gamecontroller.fill', targetValue: 10 },
      { name: 'Savings', iconKey: 'target', targetValue: 10 },
    ],
  },
  {
    id: 'summer-job',
    name: 'Summer Job Budget',
    description: 'Six detailed categories covering everyday spending from food to fun, all with individual percentage caps.',
    bestFor: 'Best for: seasonal earners who want detailed control over exactly where each dollar goes.',
    categories: [
      { name: 'Essentials', iconKey: 'house.fill', targetValue: 20 },
      { name: 'Food & Drink', iconKey: 'fork.knife', targetValue: 20 },
      { name: 'Health & Fitness', iconKey: 'heart.fill', targetValue: 10 },
      { name: 'Shopping & Clothes', iconKey: 'bag.fill', targetValue: 15 },
      { name: 'Fun & Entertainment', iconKey: 'gamecontroller.fill', targetValue: 20 },
      { name: 'Savings & Goals', iconKey: 'target', targetValue: 15 },
    ],
  },
  {
    id: 'savings-challenge',
    name: 'Savings Challenge Mode',
    description: 'An aggressive 40/10/50 split: only 40% for needs, 10% for wants, and a full 50% locked into savings.',
    bestFor: 'Best for: goal-chasers who want to build savings fast and are comfortable cutting back on spending.',
    categories: [
      { name: 'Essentials Only', iconKey: 'house.fill', targetValue: 40 },
      { name: 'Minimal Fun', iconKey: 'heart.fill', targetValue: 10 },
      { name: 'Savings Goal', iconKey: 'target', targetValue: 50 },
    ],
    nws: { need: 40, want: 10, save: 50 },
  },
]

// Box colours for template-created categories, assigned by position. Mirrors the
// look of the existing web board (dark green, teal, purple, gold, coral, gold…).
const TEMPLATE_COLORS = ['#3B4A2F', '#4FB3A6', '#B07FD4', '#E0A93F', '#E0685F', '#C79A2E', '#4A6C8A', '#B0567A']

// Lowercase + collapse any run of non-alphanumeric chars into a single underscore,
// trimming leading/trailing underscores. Used to build deterministic category ids.
function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Turn a chosen template into fresh BudgetCategory docs (percent targets), ready to
// persist via store.saveCategory. Colours cycle through TEMPLATE_COLORS by index.
// Ids are deterministic (derived from template id + category name) so re-running
// onboarding after a partial failure upserts the same docs instead of duplicating
// them — saveCategory keys its write on cat.id with merge:false.
export function templateToCategories(template: BudgetTemplate): BudgetCategory[] {
  return template.categories.map((c, i) => ({
    id: `tpl_${slugify(template.id)}_${slugify(c.name)}`,
    name: c.name,
    iconKey: c.iconKey,
    color: TEMPLATE_COLORS[i % TEMPLATE_COLORS.length],
    targetMode: 'percent',
    targetValue: c.targetValue,
    sortOrder: i,
    isActive: true,
    isSystemCategory: false,
    fixedPayments: [],
  }))
}
