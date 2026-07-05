# Teacher Dashboard — Research & Spec

_What K-12 "assign-and-track" tools actually show teachers, what teachers actually use vs. ignore, and the prioritized feature list for Bread Head's teacher dashboard. Sourced from official help docs (Code.org, Khan, IXL, i-Ready, Lexia, Prodigy, Quizizz, Nearpod, Edpuzzle, Formative, Desmos, Google Classroom, Canvas) and real teacher voice (Code.org forum, NBC i-Ready reporting, Khan community, Common Sense reviews)._

---

## 1. What the tools show teachers (inventory)

**The core view is almost always a grid: students (rows) × lessons/skills/questions (columns), with drill-down.**

- **Code.org** — Progress grid of shapes/colors per level; click a lesson to expand into levels; click a level to see the student's actual work. Tabs for Text Responses, Assessments, Projects. Time-per-level and last-worked timestamp on hover. CSV (lesson or level detail). No auto struggling-student alerts.
- **Khan Academy** — Class Activity overview (minutes, skills leveled up, mastery) + per-student Individual Report (activity log, assignments with best score + **# attempts**, skills). Mastery levels: Attempted → Familiar → Proficient → Mastered. CSV exports.
- **IXL** — 20+ named reports around a 0–100 **SmartScore**. **Trouble Spots** auto-groups students by the exact skill+difficulty they're stuck on. **Questions Log** shows the exact questions, answers, and scratch work. Diagnostic → **Action Plans** (assign/print/email next skills).
- **i-Ready / Lexia** — Placement bands (grade levels below/at/above), **growth over time**, and the strongest "what to do next": **Instructional Grouping** (i-Ready) and **Action Plan with scripted lessons + "Mark as Delivered"** (Lexia). Lexia's **Performance Predictor** buckets each student On Target / Some Risk / High Risk.
- **Quizizz / Formative / Edpuzzle / Nearpod** — formative item analysis: **per-question class accuracy, most-missed questions, response distributions, and per-student answers.** Formative has a live red/orange/yellow/green response grid + "Top 3 Underperforming Questions." Quizizz has AI that names struggling students. Broad LMS gradebook sync + CSV.
- **Google Classroom / Canvas** — completion %, average grade, **active-student %**, last-participation date, and **conditional insight/alert cards** ("X students haven't visited in a week," "missed last 3 assignments") + "Message Students Who [threshold]."

The recurring capabilities: **class→student→lesson→item drill-down**, **at-a-glance mastery color-coding**, **struggling-student flags**, **item/question analysis**, **one-click CSV/gradebook export**, and **"next action" launchable from the dashboard.**

## 2. What teachers ACTUALLY use vs. ignore (the important part)

**Act on (build these):**
- **Skill/lesson-level mastery as red/yellow/green at a glance** — tells them what to reteach and to whom. The "understand → decide → act" loop.
- **The actual student work / answers** — the single biggest frustration is a score with the work hidden. NBC on i-Ready: _"Teachers can't see a student's answers, just an overall score… which some educators say makes it hard to know how to help."_
- **Item / most-missed-question analysis** — teachers plan reteach around the specific misconception, not the composite score.
- **"Who needs help right now, on what" on one screen** — the killer feature. Ideally with the next action attached and struggling students surfaced automatically.
- **Progress, not seat-time.** Code.org teacher: _"A student can log in and do nothing for 20 minutes and it will say 20 minutes spent… when they completed nothing."_
- **# attempts as a gaming/cheating signal** — Khan teachers watch attempt counts to catch hint-farming.
- **Auto-grouping by shared misconception** ("these 4 need fractions, these 3 need a challenge").

**Ignore / distrust (do NOT headline these):**
- **Raw time-on-task / minutes active** — the clearest teacher rejection.
- **XP / points / badges / streaks** — "digital participation trophies," "meaningless numbers," "students see through it immediately."
- **Cumulative vanity totals** (lifetime XP, total lessons viewed).
- **Opaque mastery scores** (SmartScore) that demoralize strugglers.
- **Dashboards built for admins, not teachers.**

**Trust killers (design around):**
- **Gaming** (sandbagging to get easier questions, hint-farming) → show attempts + show the work.
- **Flaky/late data** (work not appearing, inaccurate time) → completion must be reliable; show real timestamps.
- **Friction** — extra clicks to reach one student, 9-click CSV exports, no SIS/gradebook sync, tool sprawl.

## 3. The uncomfortable finding for Bread Head

The features teachers value **most** — seeing actual answers and per-question item analysis — are exactly what Bread Head **cannot show today**, because the app only writes `lessonProgress.completedLessons` + gamification to Firestore. **Quiz answers are never persisted.** And the metric Bread Head leads with today — **XP/level** — is the one teachers most explicitly dismiss as vanity.

So the dashboard needs two tracks: what we can build now from completion data, and a **backend instrumentation step** (capture quiz responses) that unlocks the high-value diagnostic layer.

---

## 4. Prioritized build plan for Bread Head's teacher dashboard

### Track A — buildable now (from existing completion data)

1. **Lesson-level drill-down grid** _(you picked this)_ — the Code.org core. Class view: students × units heatmap → click a unit → per-lesson done / in-progress / not-started, using `completedLessons` + the `currentUnit/currentLesson` pointer. Hover a lesson → its title.
2. **"Needs attention" panel at the top** — the #1 teacher ask. Auto-surface students who are **stalled** (no new lesson in N days / stuck on the same lesson), **inactive** (no activity in N days), or **far behind the class median**. One screen, sorted by who to help first. (Needs a real `lastActive` / per-lesson `completedAt` — see Track B item 6.)
3. **Student detail page** _(you picked this)_ — click a student → full lesson-by-lesson path, current position, completion, last active. Few clicks to reach one student (teachers complain about navigation friction).
4. **Multi-class + roster management** _(you picked this)_ — class sections as cards, join codes, add/remove students, switch sections. Replaces the seed script.
5. **Class median / distribution, not vanity totals** — show "class is here" reference lines; demote XP/level to a small secondary column, not the headline.
6. **Sorting + one-click CSV export** — sort by progress/name/last-active; single-click CSV (teachers hate multi-click exports). Gradebook-friendly columns.

### Track B — needs backend instrumentation (unlocks the highest-value features)

7. **Persist quiz responses** — the key change. Have the iOS app (and the web student app) write each quiz answer to Firestore, e.g. `users/{uid}/quizResponses/{unitNlessonMslideK}` = `{ questionId, chosenIndex(es), correct, attempts, answeredAt }`. Additive; doesn't disturb existing progress. This is a Swift change on the iOS side.
8. **Item analysis view** — once (7) exists: per-lesson **most-missed questions**, class accuracy per question, and **per-student actual answers** (solves the biggest teacher frustration). Group students by shared wrong answer.
9. **# attempts surfaced** — as the gaming/effort signal teachers actually use.
10. **Reliable timestamps** — add a `users/{uid}/lessonEvents/{autoId}` append log `{ lessonId, completedAt, platform }` so "last active," "progress today," and stall detection are trustworthy and progress-based (never seat-time).

### Explicitly NOT building (teacher-dismissed)
Raw minutes-on-task as a headline metric; XP/badges/streaks as primary teacher-facing signals (keep them for students, not the teacher view).

---

## 5. Recommended order
Track A #1 (drill-down) → #3 (student detail) → #2 (needs-attention, once timestamps exist) → #4 (multi-class/roster) → #6 (sort/CSV). Then Track B #10 (timestamps) → #7 (quiz capture, iOS) → #8/#9 (item analysis). The single highest-leverage move after the completion views is **#7 quiz capture**, because it converts Bread Head from a completion tracker into a diagnostic tool — which is what teachers say actually changes their instruction.
