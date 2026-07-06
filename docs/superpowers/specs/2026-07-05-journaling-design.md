# Journaling — Design Spec

**Date:** 2026-07-05
**Scope:** A student journaling surface in the web app: a private personal journal plus teacher-assignable journal prompts. Teachers configure prompts and see **metadata only** (word count, time spent, completion) — never entry content.

## Goals

1. **Personal journal** — an authenticated `/journal` app page where a student writes free-form entries. Fully private; stored under the owner-only Firestore subcollection.
2. **Teacher-assigned prompts** — teachers author journal assignments (custom questions + due date + minimum requirement + who it's for). Assigned prompts appear in the student's journal as to-dos.
3. **Metadata-only teacher visibility** — teachers see, per assigned journal, whether a student did it and the `wordCount` / `secondsSpent` / `submittedAt`. **Content is physically unreachable to teachers** (owner-only subcollection; teacher-readable records store counts only).
4. **Shared store, web-first** — content lives at `users/{uid}/journal/{entryId}`, the same path the iOS app will use. No journal data exists in Firestore yet (verified against live DB), so the web defines the schema following iOS field conventions (UUID string `id`, `createdAt`/`lastModified` Timestamps, camelCase) for forward-compatible sync.
5. **Personal-by-default privacy gate** — every entry is `teacherAssigned: false` by default. The teacher-metadata pathway only activates for a student who has **ever joined a class** via a join code. A purely personal journaler is invisible by construction.

**Non-goals:** editing/deleting the marketing `/journal` page (kept as-is; the app page is a distinct route decision — see Open question O1); iOS-side journal UI; AI prompt generation; sharing entries between students; rich-text/media entries (plain text body only for v1); grading or teacher feedback on entries.

## Key discovery (drives the design)

Inspecting live Firestore (`bread-head-4b6f9`) across 50 users: the only per-user subcollections are `categories`, `budget`, `devices`, `lessonProgress`. **There is no `journal` subcollection.** The iOS journal is not synced to Firestore today, so there is no existing schema to match — the web app defines it. We mirror observed iOS conventions so iOS can adopt the same store later without a migration.

---

## Privacy model (the core invariant)

**Content and metadata are physically separate documents in separately-permissioned locations.**

- **Content** (`body`, prompt answers) → `users/{uid}/journal/{entryId}` — owner-only. Firestore rules grant a teacher read access to the *top-level* student doc but **explicitly not subcollections** (`docs/firestore.rules.proposed`). So content is unreachable to teachers by rule, and the server never copies content into a teacher-readable location.
- **Metadata** (counts, timestamps, status) → `classes/{cid}/assignments/{aid}/submissions/{uid}` — readable by the class's teacher(s), who already own the class. This doc contains **no words**, only integers/enums/timestamps and an `entryId` *pointer*.

**Join gate:** metadata is written only if the student has ever joined a class (`profile.classIds` non-empty). A student who has never used a join code produces no submission records and has no assigned prompts; every entry is `teacherAssigned: false`. This is enforced server-side in the submit route, not just client-side.

---

## Data model

### `users/{uid}/journal/{entryId}` — entry content (owner only)

`entryId` = client-generated uppercase UUID (matches iOS `categories`/`budget` doc-id convention).

```ts
interface JournalEntry {
  id: string                 // == entryId (duplicated in-doc, iOS convention)
  body: string               // the writing — NEVER leaves this subcollection
  teacherAssigned: boolean   // DEFAULT false. true only for assigned-prompt responses
  // assignment linkage — present only when teacherAssigned === true ("extra storage"):
  assignmentId?: string
  classId?: string
  questions?: string[]       // snapshot of the prompt questions at assign time
  // derived metadata (also mirrored to the teacher-readable submission doc):
  wordCount: number          // computed from body on save
  secondsSpent: number       // accumulated active editing time
  createdAt: Timestamp
  lastModified: Timestamp
}
```

- A **personal free-write** has `teacherAssigned: false` and none of the linkage fields.
- An **assigned response** has `teacherAssigned: true` + `assignmentId`/`classId`/`questions`.
- `wordCount` = `body.trim().split(/\s+/).filter(Boolean).length` (single source of truth, computed identically client- and server-side).

### `classes/{cid}/assignments/{aid}` — extend existing model with a type discriminator

Existing lesson-assignment fields are unchanged. Add:

```ts
type: 'lesson' | 'journal'   // NEW. Absent/undefined ⇒ 'lesson' (no migration needed)
// present only when type === 'journal':
journal?: {
  questions: string[]        // one or more prompts, ≥1 required
  minWords?: number          // 0/absent = no minimum
  minSeconds?: number        // 0/absent = no minimum
}
```

Reused as-is from the lesson model: `scope: 'class' | 'students'`, `studentUids[]`, `dueDate`, `title`, `createdAt`, `updatedAt`. Journal assignments ignore `lessonIds` and `controls`.

### `classes/{cid}/assignments/{aid}/submissions/{uid}` — teacher-visible metadata (NEW, metadata only)

```ts
interface JournalSubmission {
  wordCount: number
  secondsSpent: number
  status: 'complete' | 'in_progress'   // 'complete' once minWords & minSeconds both met
  submittedAt: Timestamp               // last update
  entryId: string                      // pointer into users/{uid}/journal — NOT content
}
```

**No `body`, no question text, no answers.** Doc id = `uid` so a teacher sees one row per student per assignment. Absence of the doc = not started.

---

## Server routes (Admin SDK, mirror existing patterns)

### `POST /api/classes/[classId]/assign` (extend existing route)
Accept `type: 'journal'` and a `journal` config block. Validate: teacher owns class (`verifyTeacher` + `ownsClass`, unchanged); `journal.questions` non-empty; `minWords`/`minSeconds` are non-negative integers. `PATCH`/`DELETE` already handle edit/remove generically.

### `POST /api/journal/submit` (NEW — mirrors `/api/report`)
The student's client calls this after saving an **assigned** entry. Body: `{ classId, assignmentId, entryId, wordCount, secondsSpent }`.
Server (`verifyUser`):
1. Confirm caller is the entry owner and **has joined the class** (`assignmentId` targets a class in the caller's `profile.classIds`; else 403 — this is the join gate).
2. Recompute `status` from the assignment's `minWords`/`minSeconds` vs the submitted counts (don't trust client status).
3. Write `classes/{cid}/assignments/{aid}/submissions/{uid}` with metadata only. **Reject/ignore any content field in the body** (defense in depth — the route never persists `body`).

Personal free-writes never call this route.

### Teacher read path
Extend the per-student drill-down (`app/dashboard/[classId]/[studentUid]/page.tsx`) and/or the assignments list (`app/dashboard/[classId]/course/page.tsx`) to read the `submissions` subcollection for `type:'journal'` assignments and render status + counts. Uses the same Admin-SDK/rules-read pattern as lesson completion today.

---

## Firestore rules (`docs/firestore.rules.proposed`)

- `users/{uid}/journal/{entryId}` — owner-only read+write (falls under the existing owner-only `users/{uid}/**` rule; no new grant to teachers). Verify the catch-all subcollection rule already covers this; add an explicit block if not.
- `classes/{cid}/assignments/{aid}/submissions/{uid}` — read: class teacher(s) (`isClassTeacher`) or the owning student (`uid == request.auth.uid`); write: **deny from client** — only the Admin SDK route writes it. This guarantees the client cannot inject content into a teacher-readable doc.

---

## Student UI — `/dashboard/journal` ("My Journal")

New client page at **`/dashboard/journal`**, living alongside the student's lessons/course views in the logged-in home (`StudentHome` / `/dashboard/course`) as a "My Journal" peer to "My Lessons." This is a distinct route from the marketing `/journal` page, which is left untouched (no SEO/snapshot disturbance). Auth-gated like `/lesson` (redirects unauthenticated to `/login`). Add a "My Journal" link into the student dashboard nav. Layout mirrors the mockup validated in brainstorming:

- **Assigned section** (only rendered if the student has joined a class and has open journal assignments): each assigned prompt as a card — questions, due date, min requirement, status pill, `[Write] →`.
- **Free-write**: `[+ New entry]`.
- **Past entries** (private): reverse-chron list showing date + word count only (never surfaced to anyone else).
- **Editor**: prompt questions shown read-only above a plain-text `<textarea>`; live word count; an active-time timer accumulating `secondsSpent` (pause when tab hidden). On save: write the entry doc (private); if assigned, also `POST /api/journal/submit`.

Reuse existing student data hooks (`useStudent.ts` for `classIds`/assignments) and shell/loading/error patterns already in the dashboard.

## Teacher UI

- **Compose:** add a **Lesson / Journal** mode toggle to the assign composer in `app/dashboard/[classId]/course/page.tsx`. Journal mode swaps the lesson picker for a questions editor (add/remove question rows) + `minWords`/`minSeconds` inputs; reuses the existing scope / due-date / student-picker controls.
- **View results:** in the assignments list and per-student drill-down, journal assignments show completion the same way lessons do, but sourced from `submissions` — status pill + `wordCount` / `secondsSpent`, **no content link**. Copy near the view makes the privacy explicit ("Responses are private to the student").

---

## Testing

- **Unit (pure fns):** `wordCount`, `status` derivation from `minWords`/`minSeconds` (boundaries: exactly min, one under, zero-min), `teacherAssigned` defaulting.
- **Route tests / manual with seeded data:** extend `scripts/seed_demo.py` to add a `type:'journal'` assignment and a couple of `submissions` docs (metadata only) so the teacher view has data. Verify `/api/journal/submit` (a) rejects a non-joined student (403), (b) never persists `body`, (c) recomputes status server-side.
- **Privacy assertion:** an automated check that the teacher read path returns no `body`/answer fields for any journal assignment.
- **Visual regression:** the marketing site's 21 Playwright snapshots must stay unchanged (the new app page is out of the marketing snapshot scope; confirm no incidental marketing regressions). Per `CLAUDE.md`: `npm run build` + `npx playwright test` green before any commit.

---

## Build order (each phase independently shippable)

1. **Entry schema + private personal journal** — `/journal` app page, entry read/write to `users/{uid}/journal`, editor with word count + timer. No teacher involvement yet. (`teacherAssigned` always false.)
2. **Journal assignments** — extend assign route + composer with `type:'journal'`; assigned prompts render as to-dos in `/journal`.
3. **Submission metadata + teacher view** — `/api/journal/submit`, `submissions` subcollection, rules, teacher results UI, join gate. Seed demo data.

---

## Resolved decisions

- **O1 — route (RESOLVED):** authenticated journal lives at **`/dashboard/journal`** ("My Journal"), a peer to the student's lessons/course views in the logged-in `/dashboard` area. The marketing `/journal` page is untouched.
- **O2 — one entry per assigned prompt (RESOLVED):** exactly one canonical entry per (student, assignment); re-saving updates that entry and its submission record. Personal free-writes remain unlimited, separate entries.
