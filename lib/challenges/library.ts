import type { Challenge } from './challenge'

export const LIBRARY: Challenge[] = [
  {
    id: 'lib:first-paycheck',
    kind: 'monthly',
    title: 'Your First Paycheck',
    prompt: 'You just landed a part-time job earning $2,000 a month. Essentials (rent $1,000, phone $50) come to $1,050. Build your whole budget: create a bucket for every dollar, and save at least 15%.',
    tags: { focus: ['saving'], context: ['first-job'], difficulty: 1 },
    monthly: { income: 2000, mandatory: [
      { id: 'rent', name: 'Rent', amount: 1000 },
      { id: 'phone', name: 'Phone', amount: 50 },
    ] },
    criteria: [{ kind: 'min_needs' }, { kind: 'min_savings_rate', value: 15 }, { kind: 'zero_unallocated' }],
    reflection: 'What did you cut to hit your savings goal?',
    source: 'library',
  },
  {
    id: 'lib:tight-month',
    kind: 'monthly',
    title: 'A Tight Month',
    prompt: 'You make $1,500 this month. Essentials (rent $800, utilities $150, bus pass $70) come to $1,020. Build your whole budget: create a bucket for every dollar, and save at least 10%.',
    tags: { focus: ['needs-vs-wants'], context: ['low-income'], difficulty: 2 },
    monthly: { income: 1500, mandatory: [
      { id: 'rent', name: 'Rent', amount: 800 },
      { id: 'utilities', name: 'Utilities', amount: 150 },
      { id: 'transit', name: 'Bus Pass', amount: 70 },
    ] },
    criteria: [{ kind: 'min_needs' }, { kind: 'min_savings_rate', value: 10 }, { kind: 'zero_unallocated' }],
    reflection: 'Which want was hardest to give up?',
    source: 'library',
  },
  {
    id: 'lib:car-goal',
    kind: 'monthly',
    title: 'Saving for a Car',
    prompt: 'You earn $2,800 a month and want a car soon. Essentials (rent $1,100, insurance $120, phone $60) come to $1,280. Build your whole budget: create a bucket for every dollar, and save aggressively: at least 25%.',
    tags: { focus: ['saving', 'goals'], context: ['goal'], difficulty: 2 },
    monthly: { income: 2800, mandatory: [
      { id: 'rent', name: 'Rent', amount: 1100 },
      { id: 'insurance', name: 'Insurance', amount: 120 },
      { id: 'phone', name: 'Phone', amount: 60 },
    ] },
    criteria: [{ kind: 'min_needs' }, { kind: 'min_savings_rate', value: 25 }, { kind: 'zero_unallocated' }],
    reflection: 'How long until you can buy the car at this rate?',
    source: 'library',
  },
  {
    id: 'lib:big-earner',
    kind: 'monthly',
    title: 'More Money, More Choices',
    prompt: 'A better job pays $4,000 a month. Essentials (rent $1,500, car payment $350, phone $70) come to $1,920. Build your whole budget: create a bucket for every dollar, keep needs in check, and save at least 20%.',
    tags: { focus: ['lifestyle-creep'], context: ['raise'], difficulty: 3 },
    monthly: { income: 4000, mandatory: [
      { id: 'rent', name: 'Rent', amount: 1500 },
      { id: 'car', name: 'Car Payment', amount: 350 },
      { id: 'phone', name: 'Phone', amount: 70 },
    ] },
    criteria: [{ kind: 'min_needs' }, { kind: 'min_savings_rate', value: 20 }, { kind: 'zero_unallocated' }],
    reflection: 'Did lifestyle creep tempt you to save less?',
    source: 'library',
  },
]

export function getLibraryChallenge(id: string): Challenge | null {
  return LIBRARY.find((c) => c.id === id) ?? null
}
