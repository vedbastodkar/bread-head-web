// Seed journal prompts — curated from Bread Head's existing content so teachers can
// start from proven prompts and customize. Two shapes:
//   • PROMPT_CATEGORIES — individual prompts grouped by topic, for per-question insert.
//   • PROMPT_TEMPLATES  — ready-made multi-question sets, to fill the whole form at once.
// Sourced from the marketing journal themes (app/journal/page.tsx) and the curriculum
// reflectPrompt slides (lib/curriculum/lessons). Kept as a static library (no curriculum
// import) so it never bloats the client bundle.

export interface PromptCategory {
  id: string
  name: string
  prompts: string[]
}

export interface PromptTemplate {
  id: string
  name: string
  description: string
  questions: string[]
}

export const PROMPT_CATEGORIES: PromptCategory[] = [
  {
    id: 'spending',
    name: 'Spending awareness',
    prompts: [
      'You logged three dining transactions this week. How did each one feel — planned, impulsive, or social?',
      'You’ve overspent in the same category three months in a row. Is the budget wrong, or is the habit?',
      'Think of the last unplanned purchase you made. What were you feeling right before you bought it?',
      'Do you notice any patterns in when or why you spend — boredom, celebration, anxiety?',
    ],
  },
  {
    id: 'saving',
    name: 'Saving',
    prompts: [
      'Your savings rate dropped below target this month. What got in the way — an unexpected expense, or a gradual drift?',
      'You skipped your savings contribution this month. Was it a conscious trade-off, or something that just slipped by?',
      'You stayed under budget in every category this week. What made that easier than usual?',
    ],
  },
  {
    id: 'budgeting',
    name: 'Budgeting',
    prompts: [
      'You allocated everything in your budget this month. How does having every dollar assigned feel compared to before?',
      'What are your current fixed payments every month? List every recurring charge you can think of — phone, subscriptions, memberships. Add them up. Does that number surprise you?',
    ],
  },
  {
    id: 'income',
    name: 'Income & work',
    prompts: [
      'What’s one source of income you’ve had lately — even a small one — and did you track it? If not, what would help you keep tabs next time?',
      'Is there something you’re already good at or interested in that someone else would pay for? What would your side hustle be if you had to start tomorrow?',
      'If you started freelancing tomorrow, what’s one thing you’d want to charge for? And what percentage would you set aside for taxes each time you got paid?',
      'What’s one problem you notice in your everyday life — something annoying, slow, or done badly — that you could imagine solving for people?',
      'Think of a job you’d actually take right now, even if it seems small. What skills could it teach you? Could it connect to a longer-term direction you’re interested in?',
      'If you had two job offers — one at $18/hour and one at $38,000/year — what questions would you ask before deciding which pays better?',
      'Think about a career you’re curious about. What path — college, trade, certification, or experience — makes the most sense to get there, and what would the cost and payoff look like?',
      'Think of one person you know who works in a field you’re curious about. What’s one question you could ask them that would teach you something real about that career?',
      'Have you ever been afraid to ask for something you deserved — at work, school, or anywhere else? What held you back, and what would you do differently now?',
    ],
  },
  {
    id: 'goals',
    name: 'Goals & reflection',
    prompts: [
      'Are the choices you’re making right now moving you toward what you said you wanted — or quietly working against it?',
      'What money idea changed the way you think the most?',
      'What financial habits do you most want to improve?',
      'What money mistake do you most want to avoid?',
      'What is one action you can take this week?',
    ],
  },
  {
    id: 'mindset',
    name: 'Money mindset',
    prompts: [
      'Is there a money situation in your life that feels stressful right now? What would make it feel more manageable?',
      'When money feels tight, where do you notice it first — your choices, your mood, or your relationships?',
    ],
  },
]

export const PROMPT_TEMPLATES: PromptTemplate[] = [
  {
    id: 'month-in-review',
    name: 'Month in review',
    description: 'Close out the month in one entry.',
    questions: [
      'What did you plan for this month?',
      'What actually happened?',
      'What surprised you?',
      'What is one thing you want to carry forward?',
    ],
  },
  {
    id: 'end-of-course',
    name: 'End-of-course reflection',
    description: 'A wrap-up + action plan (from Unit 10).',
    questions: [
      'What money idea changed the way you think the most?',
      'What financial habits do you most want to improve?',
      'What money mistake do you most want to avoid?',
      'What is one action you can take this week?',
    ],
  },
  {
    id: 'money-and-mind',
    name: 'Money & mental health check-in',
    description: 'Spending psychology (from Unit 9).',
    questions: [
      'Think of the last unplanned purchase you made. What were you feeling right before you bought it?',
      'Is there a money situation in your life that feels stressful right now? What would make it feel more manageable?',
      'Do you notice any patterns in when or why you spend — boredom, celebration, anxiety?',
    ],
  },
  {
    id: 'spending-week',
    name: 'Weekly spending check-in',
    description: 'Notice this week’s spending patterns.',
    questions: [
      'Which purchase this week felt most worth it, and which felt least worth it?',
      'Was anything impulsive? What set it off?',
      'What is one spending choice you want to make differently next week?',
    ],
  },
  {
    id: 'savings-checkin',
    name: 'Savings check-in',
    description: 'Track how saving is going.',
    questions: [
      'Did your savings move the way you wanted this month?',
      'If it dropped, was it an unexpected expense or a slow drift?',
      'What is one small change that would make saving easier next month?',
    ],
  },
]
