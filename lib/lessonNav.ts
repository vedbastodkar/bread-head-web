// Stash the intended lesson so the generic /lesson route can open it,
// keeping the URL as just "/lesson" (no guessable unit/lesson in the path).
export function setLessonTarget(unit: number, lesson: number) {
  try {
    window.sessionStorage.setItem('bh_lesson', JSON.stringify({ unit, lesson }))
  } catch {
    /* noop */
  }
}
