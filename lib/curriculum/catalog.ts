// Curriculum spine (names + counts only) — mirrors CourseCatalog in the SwiftUI app.
// Used by the dashboard to label progress and size the completion math.
// Lesson ids match LessonLogic.getCurrentLessonId(): `unit{N}lesson{M}` (1-indexed).

export interface CatalogUnit { unit: number; name: string; lessonCount: number; description: string }

export const CATALOG: CatalogUnit[] = [
  { unit: 1,  name: 'Introduction to Personal Finance', lessonCount: 4,  description: 'What personal finance is and why it matters — an overview of everything you’ll learn.' },
  { unit: 2,  name: 'Income and Career Planning',       lessonCount: 15, description: 'Types of income and careers, and how to plan and budget what you earn.' },
  { unit: 3,  name: 'Smart Spending',                   lessonCount: 8,  description: 'Needs vs. wants, making smart purchases, and spending with intention.' },
  { unit: 4,  name: 'Credit and Loans',                 lessonCount: 18, description: 'How credit, loans, and borrowing work — and how to use them responsibly.' },
  { unit: 5,  name: 'Saving',                           lessonCount: 9,  description: 'Why and how to save: emergencies, goals, and building healthy habits.' },
  { unit: 6,  name: 'Investing',                        lessonCount: 7,  description: 'Growing your money over time: risk, reward, stocks, and diversification.' },
  { unit: 7,  name: 'Insurance',                        lessonCount: 13, description: 'Protecting yourself and your money, and avoiding common scams.' },
  { unit: 8,  name: 'Taxes',                            lessonCount: 8,  description: 'How taxes work, reading pay stubs, and the basics of filing.' },
  { unit: 9,  name: 'Other Topics',                     lessonCount: 7,  description: 'Extra money skills and real-world financial situations.' },
  { unit: 10, name: 'Next Steps and Reflection',        lessonCount: 6,  description: 'Putting it all together and planning your financial future.' },
]

export const TOTAL_LESSONS = CATALOG.reduce((s, u) => s + u.lessonCount, 0) // 95

export function parseLessonId(id: string): { unit: number; lesson: number } | null {
  const m = id.match(/^unit(\d+)lesson(\d+)$/)
  return m ? { unit: Number(m[1]), lesson: Number(m[2]) } : null
}

export function unitName(unit: number): string {
  return CATALOG.find((c) => c.unit === unit)?.name ?? `Unit ${unit}`
}

export function lessonLabel(id: string): string {
  const p = parseLessonId(id)
  return p ? `Unit ${p.unit} · Lesson ${p.lesson}` : id
}

// all lesson ids for a unit, e.g. unit 3 -> ["unit3lesson1", ... "unit3lesson8"]
export function unitLessonIds(unit: number): string[] {
  const c = CATALOG.find((u) => u.unit === unit)
  if (!c) return []
  return Array.from({ length: c.lessonCount }, (_, i) => `unit${unit}lesson${i + 1}`)
}

// completed count per unit, from a student's completedLessons array
export function completedByUnit(completedLessons: string[]): Record<number, number> {
  const out: Record<number, number> = {}
  for (const id of completedLessons) {
    const p = parseLessonId(id)
    if (p) out[p.unit] = (out[p.unit] ?? 0) + 1
  }
  return out
}
