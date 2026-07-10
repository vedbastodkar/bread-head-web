# Budget Assignments, Challenges & Grading — Design Spec

**Date:** 2026-07-09 · **Rev 2** (post-review: adds Information Architecture, fixes the challenge-solve model, tightens scoring/data-source/id-resolution)
**Builds on:** `2026-07-07-my-budget-web-design.md` (the personal `/mybudget` tool, already implemented).
**Scope:** The teacher-assignable layer on top of budgeting — three assignment types, a challenge system (library + custom), a student gradebook, the grading model, and the routes/navigation to reach all of it. AI-assisted authoring is **deferred**.

## Goals

1. **Make budgeting assignable** without compromising the personal tool. Private `/mybudget` stays untouched; assignments live alongside it.
2. **Three assignment types**, each reusing something already built:
   - **Personal budget** (habit) — "build / track your own budget." Completion-only, private.
   - **Budget Challenge** (scenario) — everyone solves the *same fake-money* problem. Gradeable, work visible.
   - **Reflect on your spending** (journal variant) — journal that pulls the student's own real purchases inline. Completion-only, private.
3. **Challenge library + custom authoring.** A curated, tagged, searchable library is the backbone; "duplicate & tweak" is customization. No blank-page authoring.
4. **A VHL-style in-app gradebook.** Students see their own assignments, status, and challenge scores in BH. Teachers see the same (privacy-respecting). BH is **not** the gradebook of record — teachers transcribe/export to their LMS.
5. **Grading split by type**, respecting privacy: challenges auto-score (fake money → visible); personal/journal are completion-only (real money → metadata only).
6. **Everything is reachable from a menu.** Every surface below has a defined route and a nav entry (see Information Architecture).

**Non-goals (v1):**
- **AI authoring/matching** — deferred (schema stays LLM-fillable at near-zero later cost).
- **Long-term simulation challenges (Type B)** — designed here, **Phase 2**. v1 = monthly (Type A) only.
- **LMS grade passback / LTI** — deferred. v1 shows results in-app; teacher exports manually.
- iOS budgeting engine, receipt photos, the 60-setting hub (all app-only per the personal-budget spec).

## Prior art

**VHL Central / code.org / Khan:** students do work in-platform, objective work auto-grades, students see their own gradebook, teachers get a progress/results dashboard — and the platform is **not** the official gradebook; teachers transcribe (or later, sync) to their LMS. We follow this exactly.

---

## The unifying model: one challenge *schema*, three create-paths, two solve-engines

A **challenge is a structured template**. Everything composes from it.

- **Create-paths:** (1) pick from the **library** (pre-filled), (2) **duplicate & tweak** (edited), (3) *[deferred]* AI-drafted.
- **Solve-engines:**
  - **Type A — monthly allocation** *(v1)*. **The student's verb is ALLOCATE, not spend.** Given an income and mandatory bills, they create boxes and set each box's target (fixed $ or %) so the plan satisfies the criteria (every dollar allocated, bills covered, savings ≥ target). This reuses the **income + box-allocation** half of the `/mybudget` workbench — **not** the receipt-drag/spending half. The submitted artifact is the **allocation** (boxes + targets + resulting per-box dollars), not transactions.
  - **Type B — long-term simulation** *(Phase 2)*. A decision + time-projection chart (compound-growth math). Different UI, same assign→solve→grade→reflect flow.

### Reusing the workbench safely (data-source abstraction)
The current workbench (`loadBudget`/`saveCategory`/`addTransaction`) is hardwired to `users/{uid}/…`. To reuse its UI for a challenge **sandbox** without ever touching the real budget, introduce a `BudgetDataSource` interface with two implementations:
- `FirestoreBudgetSource` — the personal tool (today's behavior).
- `SandboxBudgetSource` — in-memory, seeded from the challenge; persists only on **Submit**, and only to the assignment's submission doc.

The allocation workbench component takes a `source` prop. A challenge attempt **never** writes to `users/{uid}/categories` or `budget`.

### Challenge schema

```ts
interface Challenge {
  id: string                            // namespaced: 'lib:<slug>' or 'custom:<docId>' (see Data model)
  kind: 'monthly' | 'longterm'          // Type A (v1) | Type B (Phase 2)
  title: string
  prompt: string                        // the situation, in student-facing words
  tags: { focus: FocusTag[]; context: ContextTag[]; difficulty: 1 | 2 | 3 }
  monthly?: {                           // Type A params
    income: number
    mandatory: { name: string; amount: number }[]   // bills that MUST be funded (seeded as required boxes)
    curveball?: { label: string; delta: { name: string; amount: number }[] }
  }
  longterm?: {                          // Type B params (Phase 2)
    years: number; annualRate: number
    options: { label: string; upfrontSpend: number; invested: number }[]
  }
  criteria: Criterion[]                 // auto-checkable, e.g.:
  //   {kind:'zero_unallocated'} | {kind:'fund_mandatory'} | {kind:'min_savings_rate', value:15} | {kind:'no_overspend'}
  reflection?: string
  source: 'library' | 'custom'
}
```

- **Library** ships in code (`lib/challenges/library.ts`), versioned & tagged. ~8 seed challenges for v1.
- **Custom** = teacher copies stored at `classes/{cid}/challenges/{docId}`, authored by duplicating a library challenge into the same field editor.

---

## Assignment types (all under the existing assignments collection)

Extend the `type` discriminator (`'lesson' | 'journal'`, plus `'budget'`) to:

| `type` | What it is | Gradeable? | Teacher sees | Student solves at |
|--------|-----------|-----------|--------------|-------------------|
| `budget` | Personal habit ("build/track YOUR budget") | Completion only | status + last-updated | `/mybudget` |
| `challenge` | Fake-money scenario (Type A now, B later) | **Auto-scored** | the actual allocation + score + feedback | `/challenge/[assignmentId]` |
| `journal` (`source:'purchases'`) | Reflect on your own real spending | Completion only | status + wordCount/time | `/dashboard/journal?assignment=…` |

### `budget` (personal habit)
Config `{ requireIncome, minBoxes, minReceipts? }`. Completion from client-reported **facts** (has income, box count, receipt count) — never amounts. Submission stores only `{status, hasStarted, lastUpdatedAt}` (reuses the tested `buildBudgetSubmission`). *Note: `minReceipts` is trivially gamed (junk receipts) — acceptable because it's completion-only, not scored.*

### `challenge`
Assignment references a namespaced `challengeId`. Student opens `/challenge/[assignmentId]`, solves in the **SandboxBudgetSource** allocation workbench seeded from `monthly`. On Submit:
- **Auto-score server-side** by evaluating each `criterion` against the submitted allocation → `{ perCriterion:[{kind,passed}], allPassed, score }`.
- Fake money ⇒ the full allocation is **teacher-visible**: `classes/{cid}/assignments/{aid}/submissions/{uid}` = `{ allocation, score, allPassed, perCriterion, reflection?, submittedAt, teacherFeedback?, overrideScore? }`.

### `journal` with `source:'purchases'`
New journal config flag + window (`last7days | thisMonth | box:{id}`). The journal screen reads the student's own budget transactions (client-side, owner-only) and renders them inline above the prompt, then asks them to reflect. Privacy unchanged: purchases shown **only to the student**; teacher submission stays metadata-only (`wordCount, secondsSpent, status`).

---

## Grading model (VHL-style)

- **`challenge` → auto-scored.** `evaluateChallenge(challenge, allocation)` is **pure, shared** logic used for the client's live preview **and** the server's authoritative score. **Completion (`status`) = all hard criteria pass (`allPassed`).** The `score` = `passedCount / total`, shown as an **informational** per-criterion checklist (✅ every dollar allocated / ❌ savings below 15%) — not a weighted grade. Teacher may add `teacherFeedback` and an `overrideScore` for judgment calls.
- **`budget` / `journal` → completion only.** Bare `status` + timestamp; no numeric score (nothing to grade without seeing private data).

**BH is an in-app gradebook, not the gradebook of record.** Results are stored and shown to students and teachers; the teacher transcribes/exports to their LMS (Canvas/Google Classroom). No official-grade semantics, no auto-passback (deferred). Acknowledged cost: light double-entry until LTI passback is built.

---

## Information Architecture — routes & navigation

**This section exists because the review found surfaces defined with no route and no menu.** Every surface below gets a route *and* a nav entry.

### Current state (verified in code)
- Student menu (`StudentShell.tsx`): **Dashboard · Course · Journal · Account**.
- Student home (`StudentHome.tsx`): renders assigned to-dos; the only deep-link is `→ /lesson`.
- Teacher assign UI (`/dashboard/[classId]/course`): a single `assignType: 'lesson' | 'journal'` toggle → `POST /api/classes/{cid}/assign`.
- Teacher review: journal review at `/dashboard/[classId]/journal`.
- `/dashboard` role-branches to `TeacherHome` / `StudentHome`.
- **`/mybudget` is currently linked nowhere (orphaned).**
- No teacher *class-level tab bar* was found — navigation between class sub-pages must be defined/confirmed before new sections can hang off it.

### Student routes & menu (proposed)
| Surface | Route | Menu entry | Notes |
|---|---|---|---|
| My Budget (built) | `/mybudget` | **add “My Budget”** to StudentShell | fixes the orphan |
| Gradebook | `/grades` (student-guarded; or `/dashboard/grades` that role-branches) | **add “Grades”** to StudentShell | VHL-style “how you did”: status everywhere, score + per-criterion + feedback for challenges |
| Solve a challenge | `/challenge/[assignmentId]` | reached from the to-do, not the menu | SandboxBudgetSource workbench |
| Reflect journal | `/dashboard/journal?assignment=…` | reached from the to-do | existing journal surface + purchases pull |

**StudentHome to-dos** must render `budget`, `challenge`, and `journal` assignments (today only lessons deep-link) with correct CTAs → the routes above. New student menu: **Dashboard · Course · Journal · My Budget · Grades · Account** (6 items — confirm this isn't too many; if so, group Journal/My Budget/Grades under a “My Work” submenu).

### Teacher routes & navigation (proposed)
| Surface | Route | Notes |
|---|---|---|
| Assign (extend) | `/dashboard/[classId]/course` | extend `assignType` to `lesson | journal | budget | challenge`; `challenge` opens the library picker |
| Challenge library + author | `/dashboard/[classId]/challenges` | browse/filter by focus·context·difficulty; assign; **duplicate-tweak** editor |
| Challenge review | `/dashboard/[classId]/challenges/[assignmentId]` | per-student score, allocation, per-criterion, feedback/override |
| Budget review | `/dashboard/[classId]/budget` | completion + last-updated only (mirrors journal review) |
| Per-student rollup | `/dashboard/[classId]/[studentUid]` (existing) | add budget/challenge sections |

**Prerequisite:** define/extend a **teacher class-nav** (tabs) so Roster · Course · Journal · **Challenges** · **Budget** · Settings are reachable. If no shared class-nav exists today, building one is part of this work, not an afterthought.

---

## Data model

- **Library challenges:** code — `lib/challenges/library.ts`; **pure logic** in `lib/challenges/challenge.ts` (criterion evaluation, `evaluateChallenge`, param/solvability validation) — firebase-free, unit-tested like `lib/budget/budget.ts`.
- **Custom challenges:** `classes/{cid}/challenges/{docId}` (teacher-owned).
- **`challengeId` resolution (namespaced):** `lib:<slug>` → load from code; `custom:<docId>` → load from `classes/{cid}/challenges`. The solver/grader dispatch on the prefix.
- **Assignments:** `classes/{cid}/assignments/{id}` with `type` + (for challenges) `challengeId`.
- **Submissions:** `classes/{cid}/assignments/{aid}/submissions/{uid}`:
  - `challenge` → `{ allocation, score, allPassed, perCriterion, reflection?, submittedAt, teacherFeedback?, overrideScore? }` (fake money — safe in full).
  - `budget` → `{ status, hasStarted, lastUpdatedAt, submittedAt }` (metadata only).
  - `journal` → `{ status, wordCount, secondsSpent, submittedAt }` (metadata only).
- **Write path:** `POST /api/challenge/submit` (admin SDK, roster join-gate, **auto-score recomputed server-side** — never trust a client score), mirroring `/api/journal/submit`.

## Privacy invariants (must hold)

1. **Real money is never teacher-visible.** `budget`/`journal` submissions are metadata-only by construction (pure builders drop content/amounts). Reflect-on-purchases shows purchases **only to the student**.
2. **Fake money is fair game.** `challenge` allocations are visible/gradeable because no real financial data is involved. The two submission shapes live in **separate code paths** so a personal-budget doc can never receive an allocation dump.
3. **Sandbox isolation.** A challenge attempt uses `SandboxBudgetSource` and never writes to `users/{uid}/categories|budget`.
4. **Join gate.** No class joined ⇒ no submissions ⇒ a purely personal user is invisible.
5. **Server recomputes.** Clients report facts / preview scores; the API recomputes `status` and `score` authoritatively.

## Testing

- Pure `lib/challenges/challenge.ts`: each criterion evaluator, `evaluateChallenge`, param/solvability validation, **library integrity** (every seed challenge is solvable and its criteria satisfiable).
- Extend budget tests for `minReceipts`.
- Round-trip: challenge submit → server auto-score → teacher view; assert personal/journal submissions never carry amounts/content; assert `SandboxBudgetSource` performs zero Firestore writes before Submit.
- Playwright: reachability (every new surface reachable from a menu), the challenge solve→score flow, and `/grades`, at all three viewports.

## Build order

1. **Nav/IA groundwork:** add **My Budget** + **Grades** to the student menu (fixes the orphan immediately); define the teacher class-nav.
2. **Challenge schema + pure logic** (`lib/challenges/*`, TDD) + ~8 seed library challenges.
3. **`BudgetDataSource` abstraction** + `SandboxBudgetSource`; refactor the workbench to take a `source`.
4. **`challenge` type** + `/api/challenge/submit` (server auto-score) + `/challenge/[assignmentId]` solve sandbox.
5. **Student `/grades`** gradebook (all types).
6. **Teacher** `challenges` (library browse/filter, duplicate-tweak author, review) + `budget` review; wire into class-nav; extend the assign toggle.
7. **`budget` habit assignment** + `/api/budget/submit` (logic already built).
8. **Reflect-on-purchases journal** variant.
9. **Phase 2:** long-term simulation engine (Type B) + seed sims.
10. **Deferred:** AI draft/match authoring.

## Acceptance criteria

- [ ] **Reachability:** `/mybudget`, `/grades`, and every teacher challenge/budget surface are reachable from a menu — no URL-typing required.
- [ ] A teacher assigns a library challenge; the student solves it in the **sandbox** (zero writes to their real budget); it auto-scores server-side; both see the score + per-criterion result.
- [ ] A teacher **duplicates** a library challenge, tweaks numbers, assigns the custom copy; `challengeId` resolves correctly (`lib:` vs `custom:`).
- [ ] A monthly challenge is solved by **allocation** (income + box targets), and `zero_unallocated` / `fund_mandatory` / `min_savings_rate` evaluate correctly.
- [ ] A `budget` (personal) assignment shows the teacher only completion + last-updated; no amounts reachable.
- [ ] Reflect-on-purchases shows the student their own recent purchases; the teacher sees only word/time/status.
- [ ] The student gradebook lists all assignments with correct status/score per type; a forged client score is ignored (server recomputes).
- [ ] BH stores/displays results but asserts no official-grade semantics (no passback).
