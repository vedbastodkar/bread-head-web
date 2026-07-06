// Neutral slide schema — mirrors the SwiftUI SlideTemplates 1:1.
// Interactive slides gate advancement until the learner answers (see LessonLogic.next()).

export type Slide =
  | { type: 'title'; title: string; subtitle?: string; detailText?: string; image?: string | null }
  | { type: 'objectives'; headerTitle: string; subheader?: string; objectives: string[]; image?: string | null }
  | { type: 'poll'; title: string; options: string[]; afterVoting: string }
  | { type: 'badHabitWarning'; habits: string[]; whyBadExplanations: string[] }
  | { type: 'reflectPrompt'; prompt: string; mainTitle?: string; eyebrow?: string }
  | { type: 'recap'; title?: string; eyebrow?: string; subline?: string; takeaways: string[]; image?: string | null }
  | { type: 'termDefinition'; term: string; definition: string }
  | { type: 'trueFalse'; question: string; correctAnswer: boolean; explanation: string }
  | { type: 'multipleChoice'; title?: string; question: string; options: string[]; correctAnswerIndices: number[]; explanations: string[] }
  | { type: 'iconBreakdown'; title: string; items: { icon: string; title: string; description: string }[] }
  | { type: 'stepByStep'; title: string; steps: string[]; subtitle?: string; eyebrow?: string }
  | { type: 'realLifeScenario'; scenario: string; question: string; options: string[]; correctAnswerIndex: number; explanations: string[] }
  | { type: 'thisOrThat'; title: string; optionA: string; optionB: string; consequenceA: string; consequenceB: string }
  | { type: 'mythBusting'; myth: string; truth: string }
  | { type: 'prosAndCons'; title: string; pros: { title: string; description: string }[]; cons: { title: string; description: string }[] }
  | { type: 'contextualComparison'; title: string; leftTitle: string; leftBody: string; rightTitle: string; rightBody: string; eyebrow?: string; footer?: string }
  | { type: 'tapToReveal'; title?: string; prompt: string; revealedContent: string }
  | { type: 'visualAnalogy'; title?: string; subtitle?: string; contexts: { text: string; label: string; emoji: string }[] }
  | { type: 'image'; title: string; caption?: string; image?: string | null }
  | { type: 'interactiveGrowthVisual'; title: string; subtitle?: string; footer?: string; initialValue: number; secondaryValue: number; secondarySliderLabel: string; secondaryMin: number; secondaryMax: number; secondaryStep: number; timeYears: number; delayYears: number; summaryMessage: string; earlyCaption?: string; lateCaption?: string }
  | { type: 'calloutQuote'; quote: string; author?: string }
  | { type: 'callToAction'; title: string; message: string; actionText: string }
  | { type: 'checklist'; title: string; items: string[] }
  | { type: 'beforeAfter'; title?: string; beforeText: string; afterText: string }
  | { type: 'matchConcept'; title: string; concepts: string[]; definitions: string[]; correctMatches: Record<string, string> }
  | { type: 'content'; title: string; body: string[] }

export type SlideType = Slide['type']

// Which slide types require an answer/reveal before the learner can advance.
export const INTERACTIVE_TYPES: ReadonlySet<SlideType> = new Set<SlideType>([
  'poll', 'trueFalse', 'multipleChoice', 'realLifeScenario', 'thisOrThat', 'mythBusting', 'tapToReveal', 'matchConcept', 'interactiveGrowthVisual',
])

export function isInteractive(slide: Slide): boolean {
  return INTERACTIVE_TYPES.has(slide.type)
}

export interface Lesson {
  id: string            // "unit1lesson1"
  unit: number
  lesson: number
  name: string
  description?: string
  objectives?: string[]
  slides: Slide[]
}
