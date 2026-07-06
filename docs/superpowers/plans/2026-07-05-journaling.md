# Journaling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a private student journal at `/dashboard/journal` plus teacher-assignable journal prompts, where teachers configure prompts and see metadata only (word count, time spent, completion) — never entry content.

**Architecture:** Entry content lives in the owner-only Firestore subcollection `users/{uid}/journal/{entryId}` (teachers cannot read subcollections, by rule). Teacher-visible metadata lives in a physically separate `classes/{cid}/assignments/{aid}/submissions/{uid}` doc holding counts only, written server-side via a new `/api/journal/submit` route (Admin SDK) that never persists content. Journal assignments extend the existing `assignments` collection with a `type: 'journal'` discriminator. Every entry defaults to `teacherAssigned: false`; the metadata pathway only activates for students who have joined a class via a code.

**Tech Stack:** Next.js 14 App Router, TypeScript (strict), Firebase Web SDK (client) + Admin SDK (server routes), Tailwind, Playwright (test runner).

**Spec:** `docs/superpowers/specs/2026-07-05-journaling-design.md`

## Global Constraints

- Before any commit: `npm run build` (zero errors) **and** `npx playwright test` (all 21 visual tests pass). Copied verbatim from `CLAUDE.md`. Never commit if either fails.
- No new runtime dependencies. Pure-logic tests run under the existing Playwright runner.
- Firestore Admin routes: `export const runtime = 'nodejs'` and `export const dynamic = 'force-dynamic'` (match existing routes).
- Auth: student routes verify via `verifyUser(req)`; teacher routes via `verifyTeacher(req)` + `ownsClass()`. Client sends `Authorization: Bearer <idToken>`.
- Privacy invariant (non-negotiable): entry `body`/answers never leave `users/{uid}/journal`. No server route or teacher read path may return or persist entry text. The `submissions` doc contains only `wordCount`, `secondsSpent`, `status`, `submittedAt`, `entryId`.
- Colors/typography per `CLAUDE.md` palette. Reuse existing shell/skeleton/error components.
- Marketing `/journal` page (`app/journal/page.tsx`) is NOT touched. The app journal is a distinct route `/dashboard/journal`.

---

## File Structure

**New files:**
- `lib/journal/journal.ts` — pure types + helpers (`countWords`, `journalStatus`, `newEntryId`, `sanitizeJournalConfig`, `buildSubmission`). No firebase import — trivially testable.
- `tests/unit/journal.spec.ts` — Playwright-runner unit tests for the pure helpers.
- `app/dashboard/journal/useJournal.ts` — client hook: read/write `users/{uid}/journal`.
- `app/dashboard/journal/page.tsx` — "My Journal" page (personal + assigned prompts + editor).
- `app/api/journal/submit/route.ts` — writes metadata-only submission (Admin SDK).

**Modified files:**
- `lib/curriculum/controls.ts` — extend `AssignmentLite` with optional `type`/`journal`.
- `app/student/useStudent.ts` — carry `type`/`journal` through `StudentAssignment` + `fetchStudentClasses`.
- `app/student/StudentShell.tsx` — add "Journal" nav item.
- `app/api/classes/[classId]/assign/route.ts` — accept `type:'journal'` + `journal` config.
- `app/api/dashboard/overview/route.ts` — surface `type`/`journal` + attach `submissions` map.
- `app/dashboard/useDashboard.ts` — extend `Assignment` type with `type`/`journal`/`submissions`.
- `app/dashboard/[classId]/course/page.tsx` — Lesson/Journal composer toggle + journal completion.
- `app/dashboard/[classId]/[studentUid]/page.tsx` — show journal submission status/counts.
- `docs/firestore.rules.proposed` — `submissions` subcollection rule.
- `scripts/seed_demo.py` — seed a journal assignment + sample submissions.
- `docs/STUB.md` — mark journaling done (if present).

---

## Phase 1 — Private personal journal

Ships a working `/dashboard/journal` where a student writes free-form entries stored privately. No teacher involvement yet (`teacherAssigned` always false).

### Task 1: Pure journal helpers + types

**Files:**
- Create: `lib/journal/journal.ts`
- Test: `tests/unit/journal.spec.ts`

**Interfaces:**
- Produces:
  - `interface JournalConfig { questions: string[]; minWords: number; minSeconds: number }`
  - `interface SubmissionMeta { wordCount: number; secondsSpent: number; status: 'complete' | 'in_progress' }`
  - `countWords(body: string): number`
  - `journalStatus(wordCount: number, secondsSpent: number, minWords?: number, minSeconds?: number): 'complete' | 'in_progress'`
  - `newEntryId(): string` (uppercase UUID)
  - `sanitizeJournalConfig(raw: unknown): JournalConfig | null`
  - `buildSubmission(input: { wordCount: unknown; secondsSpent: unknown }, config: { minWords?: number; minSeconds?: number }): SubmissionMeta`

- [ ] **Step 1: Write the failing test**

Create `tests/unit/journal.spec.ts`:

```ts
import { test, expect } from '@playwright/test'
import {
  countWords,
  journalStatus,
  sanitizeJournalConfig,
  buildSubmission,
  newEntryId,
} from '../../lib/journal/journal'

test('countWords handles empty, whitespace, and multi-space', () => {
  expect(countWords('')).toBe(0)
  expect(countWords('   ')).toBe(0)
  expect(countWords('one')).toBe(1)
  expect(countWords('  two   words  ')).toBe(2)
  expect(countWords('line one\nline two')).toBe(4)
})

test('journalStatus is complete only when both minimums are met', () => {
  expect(journalStatus(10, 60, 10, 60)).toBe('complete')   // exactly at both
  expect(journalStatus(9, 60, 10, 60)).toBe('in_progress') // one word short
  expect(journalStatus(10, 59, 10, 60)).toBe('in_progress') // one second short
  expect(journalStatus(0, 0, 0, 0)).toBe('complete')       // no minimums
  expect(journalStatus(5, 5)).toBe('complete')             // defaults (0/0)
})

test('sanitizeJournalConfig requires at least one non-empty question', () => {
  expect(sanitizeJournalConfig(null)).toBeNull()
  expect(sanitizeJournalConfig({ questions: [] })).toBeNull()
  expect(sanitizeJournalConfig({ questions: ['   ', ''] })).toBeNull()
  expect(sanitizeJournalConfig({ questions: [' Ask this? ', 5] })).toEqual({
    questions: ['Ask this?'],
    minWords: 0,
    minSeconds: 0,
  })
  expect(sanitizeJournalConfig({ questions: ['Q'], minWords: 50, minSeconds: 120 })).toEqual({
    questions: ['Q'],
    minWords: 50,
    minSeconds: 120,
  })
  // negative/garbage minimums coerce to 0
  expect(sanitizeJournalConfig({ questions: ['Q'], minWords: -3, minSeconds: 'x' })).toEqual({
    questions: ['Q'],
    minWords: 0,
    minSeconds: 0,
  })
})

test('buildSubmission returns ONLY metadata fields and never leaks content', () => {
  const out = buildSubmission(
    { wordCount: 42, secondsSpent: 130, body: 'SECRET DIARY TEXT', questions: ['x'] } as any,
    { minWords: 40, minSeconds: 120 },
  )
  expect(Object.keys(out).sort()).toEqual(['secondsSpent', 'status', 'wordCount'])
  expect(out).toEqual({ wordCount: 42, secondsSpent: 130, status: 'complete' })
  expect(JSON.stringify(out)).not.toContain('SECRET')
})

test('buildSubmission coerces bad counts to 0 and rounds', () => {
  expect(buildSubmission({ wordCount: 'nope', secondsSpent: -5 }, {})).toEqual({
    wordCount: 0,
    secondsSpent: 0,
    status: 'complete',
  })
  expect(buildSubmission({ wordCount: 3.7, secondsSpent: 9.2 }, { minWords: 4 })).toEqual({
    wordCount: 4,
    secondsSpent: 9,
    status: 'complete',
  })
})

test('newEntryId is an uppercase UUID, unique per call', () => {
  const a = newEntryId()
  const b = newEntryId()
  expect(a).toMatch(/^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/)
  expect(a).not.toBe(b)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx playwright test tests/unit/journal.spec.ts --project=desktop`
Expected: FAIL — cannot resolve `../../lib/journal/journal`.

- [ ] **Step 3: Write the implementation**

Create `lib/journal/journal.ts`:

```ts
// Pure journal helpers — NO firebase import so this is trivially unit-testable.
// The privacy-critical function here is buildSubmission: it returns ONLY metadata,
// never entry content, and is what the teacher-readable submission doc is built from.

export interface JournalConfig {
  questions: string[]
  minWords: number
  minSeconds: number
}

export interface SubmissionMeta {
  wordCount: number
  secondsSpent: number
  status: 'complete' | 'in_progress'
}

export function countWords(body: string): number {
  const t = body.trim()
  return t ? t.split(/\s+/).filter(Boolean).length : 0
}

export function journalStatus(
  wordCount: number,
  secondsSpent: number,
  minWords = 0,
  minSeconds = 0,
): 'complete' | 'in_progress' {
  return wordCount >= minWords && secondsSpent >= minSeconds ? 'complete' : 'in_progress'
}

// Uppercase UUID to match the iOS doc-id convention (categories/budget use uppercase UUIDs).
export function newEntryId(): string {
  const uuid =
    (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function'
      ? globalThis.crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Date.now() + Math.floor(Math.random() * 1e9)) % 16
          const v = c === 'x' ? r : (r & 0x3) | 0x8
          return v.toString(16)
        }))
  return uuid.toUpperCase()
}

// Validate a teacher's journal-assignment config. Returns null when unusable
// (no non-empty questions), mirroring sanitizeControls in the assign route.
export function sanitizeJournalConfig(raw: unknown): JournalConfig | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const questions = Array.isArray(r.questions)
    ? r.questions.filter((q): q is string => typeof q === 'string' && q.trim().length > 0).map((q) => q.trim())
    : []
  if (questions.length === 0) return null
  const minWords = typeof r.minWords === 'number' && r.minWords > 0 ? Math.min(5000, Math.round(r.minWords)) : 0
  const minSeconds = typeof r.minSeconds === 'number' && r.minSeconds > 0 ? Math.min(7200, Math.round(r.minSeconds)) : 0
  return { questions, minWords, minSeconds }
}

// Build the teacher-visible submission record from client-reported counts.
// CRITICAL: returns ONLY {wordCount, secondsSpent, status}. Any extra fields on
// `input` (e.g. body) are ignored — content never enters a teacher-readable doc.
export function buildSubmission(
  input: { wordCount: unknown; secondsSpent: unknown },
  config: { minWords?: number; minSeconds?: number },
): SubmissionMeta {
  const wordCount = Number.isFinite(Number(input.wordCount)) ? Math.max(0, Math.round(Number(input.wordCount))) : 0
  const secondsSpent = Number.isFinite(Number(input.secondsSpent)) ? Math.max(0, Math.round(Number(input.secondsSpent))) : 0
  return { wordCount, secondsSpent, status: journalStatus(wordCount, secondsSpent, config.minWords ?? 0, config.minSeconds ?? 0) }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx playwright test tests/unit/journal.spec.ts --project=desktop`
Expected: PASS (6 tests).

- [ ] **Step 5: Verify build and full test suite**

Run: `npm run build`
Expected: compiles with zero errors.
Run: `npx playwright test`
Expected: all 21 visual tests pass (new unit file adds passing tests; snapshots unchanged).

- [ ] **Step 6: Commit**

```bash
git add lib/journal/journal.ts tests/unit/journal.spec.ts
git commit -m "feat(journal): pure entry/submission helpers + unit tests"
```

---

### Task 2: `useJournal` hook + `/dashboard/journal` personal journal page + nav

**Files:**
- Create: `app/dashboard/journal/useJournal.ts`
- Create: `app/dashboard/journal/page.tsx`
- Modify: `app/student/StudentShell.tsx:53-57` (add nav item)

**Interfaces:**
- Consumes: `countWords`, `newEntryId`, `journalStatus` from `lib/journal/journal`; `useStudent`, `StudentShell`, `StudentSkeleton`, `StudentError` from the student area.
- Produces:
  - `interface JournalEntry { id: string; body: string; teacherAssigned: boolean; assignmentId?: string; classId?: string; questions?: string[]; wordCount: number; secondsSpent: number; createdAt?: Date; lastModified?: Date }`
  - `useJournal(): { entries: JournalEntry[]; loading: boolean; err: string; saveEntry(e: JournalEntry): Promise<void>; reload(): void; uid: string | null }`

- [ ] **Step 1: Write the hook**

Create `app/dashboard/journal/useJournal.ts`:

```ts
'use client'
import { useCallback, useEffect, useState } from 'react'
import { collection, doc, getDocs, setDoc, serverTimestamp, orderBy, query } from 'firebase/firestore'
import { db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'

export interface JournalEntry {
  id: string
  body: string
  teacherAssigned: boolean
  assignmentId?: string
  classId?: string
  questions?: string[]
  wordCount: number
  secondsSpent: number
  createdAt?: Date
  lastModified?: Date
}

// Owner-only reads/writes of users/{uid}/journal — private by rule. Teachers can
// never read this subcollection; metadata reaches them only via the submit route.
export function useJournal() {
  const { user, loading: authLoading } = useAuth()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user) { setLoading(false); return }
    ;(async () => {
      setLoading(true)
      try {
        const q = query(collection(db, 'users', user.uid, 'journal'), orderBy('lastModified', 'desc'))
        const snap = await getDocs(q)
        const rows: JournalEntry[] = snap.docs.map((d) => {
          const x = d.data() as any
          return {
            id: d.id,
            body: x.body ?? '',
            teacherAssigned: x.teacherAssigned === true,
            assignmentId: x.assignmentId ?? undefined,
            classId: x.classId ?? undefined,
            questions: Array.isArray(x.questions) ? x.questions : undefined,
            wordCount: x.wordCount ?? 0,
            secondsSpent: x.secondsSpent ?? 0,
            createdAt: x.createdAt?.toDate?.() ?? undefined,
            lastModified: x.lastModified?.toDate?.() ?? undefined,
          }
        })
        setEntries(rows)
      } catch (e: any) {
        setErr(e?.message || 'Failed to load journal')
      } finally {
        setLoading(false)
      }
    })()
  }, [authLoading, user, reloadKey])

  const saveEntry = useCallback(async (e: JournalEntry) => {
    if (!user) throw new Error('Not signed in')
    const ref = doc(db, 'users', user.uid, 'journal', e.id)
    await setDoc(ref, {
      id: e.id,
      body: e.body,
      teacherAssigned: e.teacherAssigned,
      ...(e.assignmentId ? { assignmentId: e.assignmentId } : {}),
      ...(e.classId ? { classId: e.classId } : {}),
      ...(e.questions ? { questions: e.questions } : {}),
      wordCount: e.wordCount,
      secondsSpent: e.secondsSpent,
      createdAt: e.createdAt ?? serverTimestamp(),
      lastModified: serverTimestamp(),
    }, { merge: true })
  }, [user])

  return {
    entries, loading, err, saveEntry,
    reload: () => setReloadKey((k) => k + 1),
    uid: user?.uid ?? null,
  }
}
```

- [ ] **Step 2: Write the page (personal-only for Phase 1)**

Create `app/dashboard/journal/page.tsx`:

```tsx
'use client'
import { useEffect, useRef, useState } from 'react'
import { useStudent } from '@/app/student/useStudent'
import { StudentShell, StudentSkeleton, StudentError } from '@/app/student/StudentShell'
import { useJournal, type JournalEntry } from './useJournal'
import { countWords, newEntryId } from '@/lib/journal/journal'

export default function JournalPage() {
  const { data, err: studentErr, loading: studentLoading, user, signOut } = useStudent()
  const { entries, loading, err, saveEntry, reload } = useJournal()
  const [editing, setEditing] = useState<JournalEntry | null>(null)

  if (studentLoading || (!data && !studentErr)) return <StudentSkeleton />
  if (studentErr) return <StudentError message={studentErr} />

  const startNew = () =>
    setEditing({ id: newEntryId(), body: '', teacherAssigned: false, wordCount: 0, secondsSpent: 0 })

  return (
    <StudentShell data={data!} user={user} signOut={signOut}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl text-textTitle">My Journal</h1>
        <button onClick={startNew} className="px-4 py-2 rounded-xl bg-brandGreen text-white text-sm">+ New entry</button>
      </div>

      <p className="text-sm text-textTitle/55 mb-6 max-w-xl">
        Your journal is private. Only you can read what you write here — your teacher can never see the words,
        even for assigned prompts.
      </p>

      {err && <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-red-600 mb-4">{err}</div>}

      <h2 className="text-xs font-semibold tracking-wider text-textTitle/40 uppercase mb-2">Past entries</h2>
      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm p-4 text-sm text-textTitle/40">Loading…</div>
      ) : entries.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-6 text-sm text-textTitle/50">
          Nothing yet. Tap “New entry” to start writing.
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <button
              key={e.id}
              onClick={() => setEditing(e)}
              className="w-full text-left bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="text-sm text-textTitle truncate">
                  {e.teacherAssigned && <span className="text-accentGold mr-1">●</span>}
                  {e.body.trim().slice(0, 80) || 'Untitled entry'}
                </div>
                <div className="text-xs text-textTitle/45">
                  {e.lastModified ? e.lastModified.toLocaleDateString() : 'Draft'} · {e.wordCount} words
                </div>
              </div>
              <span className="text-textTitle/30 text-sm shrink-0">Edit ›</span>
            </button>
          ))}
        </div>
      )}

      {editing && (
        <JournalEditor
          entry={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); reload() }}
          saveEntry={saveEntry}
        />
      )}
    </StudentShell>
  )
}

// Full-screen editor with a live word count and an active-time timer that pauses
// when the tab is hidden. Writes the entry doc on save (content stays private).
function JournalEditor({
  entry, onClose, onSaved, saveEntry,
}: {
  entry: JournalEntry
  onClose: () => void
  onSaved: () => void
  saveEntry: (e: JournalEntry) => Promise<void>
}) {
  const [body, setBody] = useState(entry.body)
  const [seconds, setSeconds] = useState(entry.secondsSpent)
  const [busy, setBusy] = useState(false)
  const activeRef = useRef(true)

  useEffect(() => {
    const onVis = () => { activeRef.current = document.visibilityState === 'visible' }
    document.addEventListener('visibilitychange', onVis)
    const id = setInterval(() => { if (activeRef.current) setSeconds((s) => s + 1) }, 1000)
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const words = countWords(body)

  async function save() {
    setBusy(true)
    try {
      await saveEntry({ ...entry, body, wordCount: words, secondsSpent: seconds })
      onSaved()
    } catch { /* surfaced via reload */ setBusy(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        {entry.questions && entry.questions.length > 0 && (
          <div className="bg-bgSage rounded-2xl p-4 mb-4">
            <div className="text-xs uppercase tracking-wider text-textTitle/40 mb-2">Prompt</div>
            <ul className="space-y-1 text-sm text-textTitle/80">
              {entry.questions.map((q, i) => <li key={i}>• {q}</li>)}
            </ul>
          </div>
        )}
        <textarea
          autoFocus
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write freely…"
          className="w-full h-64 rounded-2xl border border-textTitle/15 p-4 text-sm text-textTitle outline-none focus:border-brandGreen resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <div className="text-xs text-textTitle/45">{words} words · {Math.floor(seconds / 60)}m {seconds % 60}s</div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
            <button onClick={save} disabled={busy} className="px-5 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Add the nav item**

In `app/student/StudentShell.tsx`, add a Journal link after the Course link (line 55):

```tsx
              {navItem('/dashboard', 'Dashboard')}
              {navItem('/dashboard/course', 'Course')}
              {navItem('/dashboard/journal', 'Journal')}
              {navItem('/account', 'Account')}
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`, sign in as a student, visit `/dashboard/journal`.
Expected: "My Journal" renders; "+ New entry" opens the editor; word count updates live; timer counts up and pauses when the tab is backgrounded; Save persists and the entry appears under "Past entries" with the correct word count on reload. Confirm in Firebase console the doc exists at `users/{uid}/journal/{ENTRYID}` with `teacherAssigned: false` and no assignment fields.

- [ ] **Step 5: Build + tests**

Run: `npm run build` → zero errors.
Run: `npx playwright test` → 21 visual tests pass (marketing snapshots unchanged; new app route is outside snapshot scope).

- [ ] **Step 6: Commit**

```bash
git add app/dashboard/journal/useJournal.ts app/dashboard/journal/page.tsx app/student/StudentShell.tsx
git commit -m "feat(journal): private personal journal at /dashboard/journal + nav"
```

---

## Phase 2 — Journal assignments (teacher authoring + student prompts)

Teachers author `type:'journal'` assignments; assigned prompts appear as to-dos in the student journal and open a linked (`teacherAssigned: true`) entry.

### Task 3: Backend — accept + surface journal assignments

**Files:**
- Modify: `app/api/classes/[classId]/assign/route.ts:29-53` (POST) and `:82-85` (PATCH)
- Modify: `app/api/dashboard/overview/route.ts:38-51`
- Modify: `lib/curriculum/controls.ts` (AssignmentLite type)
- Modify: `app/dashboard/useDashboard.ts:18-26` (Assignment type)

**Interfaces:**
- Consumes: `sanitizeJournalConfig` from `lib/journal/journal`.
- Produces: assignment docs may carry `type: 'journal'` and `journal: { questions: string[]; minWords: number; minSeconds: number }`. Overview returns these plus (Phase 3) a `submissions` map. `AssignmentLite` and `Assignment` gain optional `type`/`journal`.

- [ ] **Step 1: Extend the assign route POST**

In `app/api/classes/[classId]/assign/route.ts`, add the import at the top:

```ts
import { sanitizeJournalConfig } from '@/lib/journal/journal'
```

Replace the POST body-parsing + write (lines 37-53) with:

```ts
  const body = await req.json().catch(() => ({}))
  const type = body.type === 'journal' ? 'journal' : 'lesson'

  if (type === 'journal') {
    const journal = sanitizeJournalConfig(body.journal)
    if (!journal) return NextResponse.json({ error: 'Add at least one prompt question' }, { status: 400 })
    const scope = body.scope === 'students' ? 'students' : 'class'
    const studentUids: string[] = scope === 'students' && Array.isArray(body.studentUids) ? body.studentUids : []
    if (scope === 'students' && studentUids.length === 0)
      return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })
    const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
    const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
      type: 'journal', journal, lessonIds: [], scope, studentUids, dueDate, title,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id, type: 'journal', journal, scope, studentUids, dueDate, title })
  }

  const lessonIds: string[] = Array.isArray(body.lessonIds) ? body.lessonIds.filter((x: unknown) => typeof x === 'string') : []
  if (lessonIds.length === 0) return NextResponse.json({ error: 'Select at least one lesson' }, { status: 400 })
  const scope = body.scope === 'students' ? 'students' : 'class'
  const studentUids: string[] = scope === 'students' && Array.isArray(body.studentUids) ? body.studentUids : []
  if (scope === 'students' && studentUids.length === 0)
    return NextResponse.json({ error: 'Select at least one student' }, { status: 400 })
  const dueDate = typeof body.dueDate === 'string' && body.dueDate ? body.dueDate : null
  const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
  const controls = sanitizeControls(body.controls)

  const ref = await adminDb.collection('classes').doc(params.classId).collection('assignments').add({
    type: 'lesson', lessonIds, scope, studentUids, dueDate, title,
    ...(controls ? { controls } : {}),
    createdAt: FieldValue.serverTimestamp(),
  })
  return NextResponse.json({ id: ref.id, lessonIds, scope, studentUids, dueDate, title, controls })
```

Then extend PATCH so a journal config can be edited. After the `controls` block (line 85), add:

```ts
  if ('journal' in body) {
    const journal = sanitizeJournalConfig(body.journal)
    if (!journal) return NextResponse.json({ error: 'Add at least one prompt question' }, { status: 400 })
    updates.journal = journal
  }
```

- [ ] **Step 2: Extend the overview route to surface type/journal**

In `app/api/dashboard/overview/route.ts`, in the `assignments` mapping (lines 38-51), add two fields to the returned object:

```ts
          type: (a.get('type') ?? 'lesson') as 'lesson' | 'journal',
          journal: (a.get('journal') ?? undefined) as { questions: string[]; minWords: number; minSeconds: number } | undefined,
```

(The `submissions` attachment is added in Phase 3, Task 6.)

- [ ] **Step 3: Extend the client types**

In `lib/curriculum/controls.ts`, find the `AssignmentLite` interface and add:

```ts
  type?: 'lesson' | 'journal'
  journal?: { questions: string[]; minWords: number; minSeconds: number }
```

In `app/dashboard/useDashboard.ts`, extend the `Assignment` interface (after `controls?`):

```ts
  type?: 'lesson' | 'journal'
  journal?: { questions: string[]; minWords: number; minSeconds: number }
  submissions?: Record<string, { wordCount: number; secondsSpent: number; status: 'complete' | 'in_progress'; submittedAt: string | null }>
```

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: zero errors (new optional fields, no behavior change to existing lesson assignments).

- [ ] **Step 5: Commit**

```bash
git add app/api/classes app/api/dashboard/overview/route.ts lib/curriculum/controls.ts app/dashboard/useDashboard.ts
git commit -m "feat(journal): assign route + overview accept type:'journal' config"
```

---

### Task 4: Teacher composer — Lesson/Journal toggle

**Files:**
- Modify: `app/dashboard/[classId]/course/page.tsx`

**Interfaces:**
- Consumes: `Assignment` (with `type`/`journal`) from `useDashboard`.
- Produces: teacher can create/edit journal assignments via the assign panel.

- [ ] **Step 1: Add composer state**

In `CoursePage`, after `const [title, setTitle] = useState('')` (line 20), add:

```tsx
  const [assignType, setAssignType] = useState<'lesson' | 'journal'>('lesson')
  const [questions, setQuestions] = useState<string[]>([''])
  const [minWords, setMinWords] = useState(0)
  const [minSeconds, setMinSeconds] = useState(0)
```

- [ ] **Step 2: Reset + edit journal state**

In `resetComposer()` add: `setAssignType('lesson'); setQuestions(['']); setMinWords(0); setMinSeconds(0)`.

In `startEdit(a)` add, before the `window.scrollTo` line:

```tsx
    setAssignType(a.type === 'journal' ? 'journal' : 'lesson')
    if (a.type === 'journal' && a.journal) {
      setQuestions(a.journal.questions.length ? a.journal.questions : [''])
      setMinWords(a.journal.minWords ?? 0)
      setMinSeconds(a.journal.minSeconds ?? 0)
    } else {
      setQuestions(['']); setMinWords(0); setMinSeconds(0)
    }
```

- [ ] **Step 3: Branch submit()**

Replace the top of `submit()` validation + payload (lines 139-160) with:

```tsx
    if (!user) return
    if (assignType === 'journal') {
      const qs = questions.map((q) => q.trim()).filter(Boolean)
      if (qs.length === 0) { alert('Add at least one prompt question.'); return }
      if (scope === 'students' && targets.size === 0) { alert('Pick at least one student.'); return }
      const payload = {
        type: 'journal',
        journal: { questions: qs, minWords, minSeconds },
        scope,
        studentUids: scope === 'students' ? Array.from(targets) : [],
        dueDate: due || null,
        title: title.trim() || null,
      }
      setBusy(true)
      try {
        if (editingId) await apiCall(user, `/api/classes/${classId}/assign?id=${editingId}`, 'PATCH', payload)
        else await apiCall(user, `/api/classes/${classId}/assign`, 'POST', payload)
        resetComposer(); reload()
      } catch (e: any) { alert(e?.message) } finally { setBusy(false) }
      return
    }
    if (selected.size === 0) { alert('Select at least one lesson.'); return }
    if (scope === 'students' && targets.size === 0) { alert('Pick at least one student.'); return }

    // Duplicate guard (create only): warn on an identical lessons+scope+targets assignment.
    if (!editingId) {
      const dup = (cls?.assignments ?? []).some((a) =>
        a.type !== 'journal' &&
        a.scope === scope &&
        sameSet(a.lessonIds, selected) &&
        (scope === 'class' || sameSet(a.studentUids ?? [], targets)),
      )
      if (dup && !confirm('An identical assignment already exists. Add another anyway?')) return
    }

    const payload = {
      type: 'lesson',
      lessonIds: Array.from(selected),
      scope,
      studentUids: scope === 'students' ? Array.from(targets) : [],
      dueDate: due || null,
      title: title.trim() || null,
      controls: overrideControls ? controls : null,
    }
```

- [ ] **Step 4: Add the mode toggle + questions editor to the assign panel**

In the assign panel, immediately after the panel header `<div>` (line 324, before the title `<input>`), insert the mode toggle:

```tsx
            <div className="flex gap-2 mb-3">
              {(['lesson', 'journal'] as const).map((t) => (
                <button key={t} onClick={() => setAssignType(t)}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm ${assignType === t ? 'bg-brandGreen text-white' : 'bg-bgSage text-textTitle/70'}`}>
                  {t === 'lesson' ? 'Lesson' : 'Journal'}
                </button>
              ))}
            </div>
```

Then, still in the assign panel, wrap the journal-only editor. Insert after the title input (line 330) and before the scope toggle:

```tsx
            {assignType === 'journal' && (
              <div className="rounded-xl bg-bgSage/60 p-3 mb-3 space-y-2">
                <div className="text-xs uppercase tracking-wider text-textTitle/40">Prompt questions</div>
                {questions.map((q, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text" value={q}
                      onChange={(e) => setQuestions((qs) => qs.map((x, j) => (j === i ? e.target.value : x)))}
                      placeholder={`Question ${i + 1}`}
                      className="flex-1 px-3 py-2 rounded-lg border border-textTitle/15 text-sm"
                    />
                    {questions.length > 1 && (
                      <button onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                        className="px-2 text-textTitle/40 hover:text-red-600">×</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setQuestions((qs) => [...qs, ''])} className="text-xs text-brandGreen hover:underline">+ Add question</button>
                <div className="flex items-center justify-between gap-2 pt-1">
                  <label className="flex items-center gap-2 text-sm text-textTitle/80">Min words
                    <input type="number" min={0} max={5000} value={minWords}
                      onChange={(e) => setMinWords(Math.max(0, Number(e.target.value) || 0))}
                      className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-right" />
                  </label>
                  <label className="flex items-center gap-2 text-sm text-textTitle/80">Min seconds
                    <input type="number" min={0} max={7200} value={minSeconds}
                      onChange={(e) => setMinSeconds(Math.max(0, Number(e.target.value) || 0))}
                      className="w-20 px-2 py-1 rounded-lg border border-textTitle/15 text-right" />
                  </label>
                </div>
              </div>
            )}
```

Finally, gate the lesson-only "Custom lesson controls" block (line 355) so it only shows for lessons: wrap it with `{assignType === 'lesson' && ( … )}`. Update the panel header count (line 323) to not say "N lessons" for journals:

```tsx
              {editingId ? 'Edit assignment' : 'Assign'} {assignType === 'lesson' && selected.size > 0 && <span className="text-textTitle/50">· {selected.size} lesson{selected.size > 1 ? 's' : ''}</span>}
```

- [ ] **Step 5: Render journal assignments in the "Assigned" list**

In the assignments list `completion(a)` is lesson-based. Add a journal-aware branch. Replace the `const { done, total } = completion(a)` line (402) with:

```tsx
                  const isJournal = a.type === 'journal'
                  const { done, total } = isJournal ? journalCompletion(a) : completion(a)
```

Add this helper next to `completion` (after line 184):

```tsx
  // Journal completion = target students whose submission status is 'complete'.
  function journalCompletion(a: Assignment): { done: number; total: number } {
    const roster = cls!.students
    const total = a.scope === 'class' ? roster.length : (a.studentUids ?? []).length
    const targetStudents = a.scope === 'class' ? roster : roster.filter((s) => (a.studentUids ?? []).includes(s.uid))
    const done = targetStudents.filter((s) => a.submissions?.[s.uid]?.status === 'complete').length
    return { done, total }
  }
```

Update the assignment title line (409) so a journal shows its prompt count instead of lesson count, and the expanded list shows questions:

```tsx
                          <div className="text-textTitle font-medium truncate">
                            {a.title || (isJournal
                              ? `Journal · ${a.journal?.questions.length ?? 0} question${(a.journal?.questions.length ?? 0) > 1 ? 's' : ''}`
                              : `${a.lessonIds.length} lesson${a.lessonIds.length > 1 ? 's' : ''}`)} <span className="text-textTitle/40">{isOpen ? '▾' : '▸'}</span>
                          </div>
```

And the expanded body (line 423-430) — show questions for journals:

```tsx
                      {isOpen && (
                        isJournal ? (
                          <ul className="mt-2 pl-1 space-y-0.5 text-textTitle/60">
                            {(a.journal?.questions ?? []).map((q, i) => <li key={i}>• {q}</li>)}
                            <li className="text-textTitle/40 mt-1">Responses are private to each student.</li>
                          </ul>
                        ) : (
                          <ul className="mt-2 pl-1 space-y-0.5 text-textTitle/60">
                            {a.lessonIds.map((id) => {
                              const p = parseLessonId(id)
                              return <li key={id}>• {p ? (lessonName(p.unit, p.lesson) ?? `Unit ${p.unit} · Lesson ${p.lesson}`) : id}</li>
                            })}
                          </ul>
                        )
                      )}
```

- [ ] **Step 6: Manual verification**

Run `npm run dev`, sign in as a teacher, open a class → Course. Toggle to "Journal", add two questions + min words 30, assign to whole class. Expected: it appears under "Assigned" as "Journal · 2 questions · 0/N done", expanding shows the questions + privacy note. Edit it and confirm the questions reload into the composer.

- [ ] **Step 7: Build**

Run: `npm run build` → zero errors.

- [ ] **Step 8: Commit**

```bash
git add app/dashboard/[classId]/course/page.tsx
git commit -m "feat(journal): teacher composer Lesson/Journal toggle + journal assignment list"
```

---

### Task 5: Student sees assigned prompts as to-dos

**Files:**
- Modify: `app/student/useStudent.ts:18-25` (StudentAssignment type) and `:43-72` (fetchStudentClasses) and `:98-111` (assignment mapping)
- Modify: `app/dashboard/journal/page.tsx` (render assigned section + write linked entries)

**Interfaces:**
- Consumes: `StudentAssignment` now carries `type`/`journal`.
- Produces: opening an assigned prompt creates/edits a `teacherAssigned: true` entry linked by `assignmentId`.

- [ ] **Step 1: Carry type/journal through useStudent**

In `app/student/useStudent.ts`, extend `StudentAssignment` (after `controls?`):

```ts
  type?: 'lesson' | 'journal'
  journal?: { questions: string[]; minWords: number; minSeconds: number }
```

In `fetchStudentClasses`, in the `assignments.push({...})` block (lines 59-66), add:

```ts
          type: ad.type === 'journal' ? 'journal' : 'lesson',
          journal: ad.journal ?? undefined,
```

In `useStudent`, in the applicable-assignments `assignments.push({...})` block (lines 102-109), add:

```ts
              type: a.type ?? 'lesson',
              journal: a.journal,
```

- [ ] **Step 2: Render assigned prompts + write linked entries in the journal page**

In `app/dashboard/journal/page.tsx`, compute the journal assignments from student data. Add before the return, after the hooks:

```tsx
  const today = new Date().toISOString().slice(0, 10)
  const journalAssignments = (data?.assignments ?? []).filter((a) => a.type === 'journal')

  // Find the student's existing entry for an assignment, or start a fresh linked one.
  const openAssigned = (a: NonNullable<typeof data>['assignments'][number]) => {
    const existing = entries.find((e) => e.assignmentId === a.id)
    if (existing) { setEditing(existing); return }
    setEditing({
      id: newEntryId(),
      body: '',
      teacherAssigned: true,
      assignmentId: a.id,
      classId: (a as any).classId, // set below via classId lookup; see note
      questions: a.journal?.questions ?? [],
      wordCount: 0,
      secondsSpent: 0,
    })
  }
```

Note on `classId`: `StudentAssignment` does not currently carry `classId`. Add it. In `useStudent.ts` `useStudent`, the mapping loops `classIds.forEach((cid, i) => …)` — add `classId: cid` to the pushed object, and add `classId: string` to the `StudentAssignment` interface. Then in `openAssigned` use `a.classId`.

Add the assigned section to the page JSX, before the "Past entries" heading:

```tsx
      {journalAssignments.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-semibold tracking-wider text-textTitle/40 uppercase mb-2">Assigned prompts</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {journalAssignments.map((a) => {
              const entry = entries.find((e) => e.assignmentId === a.id)
              const overdue = !!a.dueDate && a.dueDate < today && !entry
              return (
                <button key={a.id} onClick={() => openAssigned(a)}
                  className={`text-left bg-white rounded-2xl shadow-sm p-4 hover:shadow-md transition border-l-4 ${overdue ? 'border-red-500' : 'border-accentGold'}`}>
                  <div className="text-sm font-medium text-textTitle truncate">{a.title || 'Journal prompt'}</div>
                  <div className="text-xs text-textTitle/55 mt-0.5 line-clamp-2">{a.journal?.questions[0]}</div>
                  <div className="text-xs mt-1 flex gap-2">
                    {entry ? <span className="text-brandGreen">Started · {entry.wordCount} words</span> : <span className="text-textTitle/50">Not started</span>}
                    {a.dueDate && <span className={overdue ? 'text-red-600' : 'text-textTitle/50'}>{overdue ? 'Overdue' : 'Due'} {a.dueDate}</span>}
                    {a.journal && (a.journal.minWords > 0 || a.journal.minSeconds > 0) && (
                      <span className="text-textTitle/40">min {a.journal.minWords}w{a.journal.minSeconds ? ` · ${a.journal.minSeconds}s` : ''}</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </section>
      )}
```

(The submission write on save arrives in Phase 3, Task 6. For now, saving an assigned entry persists it privately with `teacherAssigned: true` + linkage.)

- [ ] **Step 3: Manual verification**

As the teacher from Task 4, ensure a class has a journal assignment. Sign in as a rostered student in that class → `/dashboard/journal`. Expected: "Assigned prompts" section lists it; opening it shows the prompt questions in the editor; saving persists an entry with `teacherAssigned: true`, `assignmentId`, `classId`, `questions` (verify in Firebase console); re-opening the prompt reloads the same entry (one-per-prompt). A student NOT in any class sees no assigned section.

- [ ] **Step 4: Build + tests**

Run: `npm run build` → zero errors. Run: `npx playwright test` → 21 pass.

- [ ] **Step 5: Commit**

```bash
git add app/student/useStudent.ts app/dashboard/journal/page.tsx
git commit -m "feat(journal): student assigned-prompt to-dos + linked entries"
```

---

## Phase 3 — Submission metadata, teacher visibility, join gate, rules

### Task 6: `/api/journal/submit` + wire student save

**Files:**
- Create: `app/api/journal/submit/route.ts`
- Modify: `app/api/dashboard/overview/route.ts` (attach `submissions` map)
- Modify: `app/dashboard/journal/page.tsx` (call submit on assigned save)

**Interfaces:**
- Consumes: `verifyUser`, `adminDb`; `buildSubmission`, `sanitizeJournalConfig` from `lib/journal/journal`.
- Produces: `POST /api/journal/submit` writes `classes/{cid}/assignments/{aid}/submissions/{uid}` with metadata only. Overview returns `submissions` per journal assignment.

- [ ] **Step 1: Write the submit route**

Create `app/api/journal/submit/route.ts`:

```ts
import { NextRequest, NextResponse } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { verifyUser } from '@/lib/firebase/verifyTeacher'
import { buildSubmission } from '@/lib/journal/journal'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/journal/submit
// { classId, assignmentId, entryId, wordCount, secondsSpent }
// Writes ONLY metadata to the teacher-readable submissions doc. Never receives or
// persists entry content. Gated on the caller having joined the target class.
export async function POST(req: NextRequest) {
  const u = await verifyUser(req)
  if (!u) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const classId = String(body.classId ?? '')
  const assignmentId = String(body.assignmentId ?? '')
  const entryId = String(body.entryId ?? '')
  if (!classId || !assignmentId || !entryId)
    return NextResponse.json({ ok: false, error: 'Missing fields' }, { status: 400 })

  // Join gate: caller must be rostered on the class (never-joined ⇒ no metadata ever).
  const rosterDoc = await adminDb.collection('classes').doc(classId).collection('roster').doc(u.uid).get()
  if (!rosterDoc.exists) return NextResponse.json({ ok: false, error: 'Not in class' }, { status: 403 })

  // Recompute status server-side from the assignment's minimums (don't trust client status).
  const aDoc = await adminDb.collection('classes').doc(classId).collection('assignments').doc(assignmentId).get()
  if (!aDoc.exists || aDoc.get('type') !== 'journal')
    return NextResponse.json({ ok: false, error: 'Assignment not found' }, { status: 404 })
  const cfg = (aDoc.get('journal') ?? {}) as { minWords?: number; minSeconds?: number }

  const meta = buildSubmission(
    { wordCount: body.wordCount, secondsSpent: body.secondsSpent },
    { minWords: cfg.minWords ?? 0, minSeconds: cfg.minSeconds ?? 0 },
  )

  await adminDb
    .collection('classes').doc(classId)
    .collection('assignments').doc(assignmentId)
    .collection('submissions').doc(u.uid)
    .set({ ...meta, entryId, submittedAt: FieldValue.serverTimestamp() }, { merge: true })

  return NextResponse.json({ ok: true, status: meta.status })
}
```

- [ ] **Step 2: Attach submissions in the overview route**

In `app/api/dashboard/overview/route.ts`, the assignments mapping is currently synchronous (`assignSnap.docs.map(...)`). Make it async to read submissions for journal assignments. Replace lines 38-51 with:

```ts
      const assignments = await Promise.all(assignSnap.docs.map(async (a) => {
        const ua = a.get('updatedAt')
        const isJournal = (a.get('type') ?? 'lesson') === 'journal'
        let submissions: Record<string, { wordCount: number; secondsSpent: number; status: string; submittedAt: string | null }> | undefined
        if (isJournal) {
          const subSnap = await a.ref.collection('submissions').get()
          submissions = {}
          subSnap.forEach((s) => {
            const sa = s.get('submittedAt')
            submissions![s.id] = {
              wordCount: s.get('wordCount') ?? 0,
              secondsSpent: s.get('secondsSpent') ?? 0,
              status: s.get('status') ?? 'in_progress',
              submittedAt: sa && typeof sa.toDate === 'function' ? sa.toDate().toISOString() : null,
            }
          })
        }
        return {
          id: a.id,
          type: (a.get('type') ?? 'lesson') as 'lesson' | 'journal',
          journal: (a.get('journal') ?? undefined) as { questions: string[]; minWords: number; minSeconds: number } | undefined,
          lessonIds: (a.get('lessonIds') ?? []) as string[],
          scope: (a.get('scope') ?? 'class') as 'class' | 'students',
          studentUids: (a.get('studentUids') ?? []) as string[],
          dueDate: (a.get('dueDate') ?? null) as string | null,
          title: (a.get('title') ?? null) as string | null,
          controls: (a.get('controls') ?? undefined) as Record<string, unknown> | undefined,
          submissions,
          updatedAt: ua && typeof ua.toDate === 'function' ? ua.toDate().toISOString() : null,
        }
      }))
```

(Remove the `type`/`journal` fields added in Task 3 Step 2 if they now duplicate — this block supersedes it.)

- [ ] **Step 3: Call submit on assigned save**

In `app/dashboard/journal/page.tsx`, update the editor save flow so that saving a `teacherAssigned` entry also posts metadata. Pass `user` into `JournalEditor` and after `saveEntry(...)` succeeds, if the entry is assigned, call the route:

In `JournalEditor`'s `save()`, after `await saveEntry({ ... })` and before `onSaved()`:

```tsx
      if (entry.teacherAssigned && entry.assignmentId && entry.classId && user) {
        try {
          const token = await user.getIdToken()
          await fetch('/api/journal/submit', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              classId: entry.classId,
              assignmentId: entry.assignmentId,
              entryId: entry.id,
              wordCount: words,
              secondsSpent: seconds,
            }),
          })
        } catch { /* metadata is best-effort; content is already saved */ }
      }
```

Add `user` to `JournalEditor`'s props (`user: { getIdToken: () => Promise<string> } | null`) and pass `user={user}` where `<JournalEditor … />` is rendered. Import nothing new (`user` comes from `useStudent`).

- [ ] **Step 4: Manual verification**

As a rostered student, open an assigned prompt, write ≥ the min words, Save. Expected: `classes/{cid}/assignments/{aid}/submissions/{uid}` exists in Firebase console with `wordCount`/`secondsSpent`/`status:'complete'`/`submittedAt`/`entryId` and **no body/questions**. As a non-rostered user, a direct POST returns 403 (test with a token that isn't in the class).

- [ ] **Step 5: Build**

Run: `npm run build` → zero errors.

- [ ] **Step 6: Commit**

```bash
git add app/api/journal/submit/route.ts app/api/dashboard/overview/route.ts app/dashboard/journal/page.tsx
git commit -m "feat(journal): submit route (metadata only) + overview submissions + join gate"
```

---

### Task 7: Teacher per-student journal view

**Files:**
- Modify: `app/dashboard/[classId]/[studentUid]/page.tsx`

**Interfaces:**
- Consumes: `Assignment.submissions`, `Assignment.journal` from `useDashboard`.
- Produces: per-student page shows each journal assignment's status + counts (no content).

- [ ] **Step 1: Add a journal panel to the student detail page**

In `app/dashboard/[classId]/[studentUid]/page.tsx`, compute the student's journal assignments and render a panel above the per-unit drill-down. After `const d = daysSince(s.lastActive)` (line 20), add:

```tsx
  const journalAssignments = cls.assignments.filter(
    (a) => a.type === 'journal' && (a.scope === 'class' || (a.studentUids ?? []).includes(s.uid)),
  )
```

Then, before the `{/* Per-unit, per-lesson drill-down */}` block (line 33), insert:

```tsx
      {journalAssignments.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-medium text-textTitle">Journal</div>
            <div className="text-[11px] text-textTitle/40">Responses are private — counts only</div>
          </div>
          <div className="space-y-2">
            {journalAssignments.map((a) => {
              const sub = a.submissions?.[s.uid]
              const done = sub?.status === 'complete'
              return (
                <div key={a.id} className="flex items-center justify-between text-sm border-b border-textTitle/5 pb-2 last:border-0">
                  <div className="min-w-0">
                    <div className="text-textTitle truncate">{a.title || `Journal · ${a.journal?.questions.length ?? 0} question${(a.journal?.questions.length ?? 0) > 1 ? 's' : ''}`}</div>
                    {a.dueDate && <div className="text-xs text-textTitle/45">Due {a.dueDate}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xs font-medium ${done ? 'text-brandGreen' : sub ? 'text-accentGold' : 'text-textTitle/40'}`}>
                      {done ? 'Complete' : sub ? 'In progress' : 'Not started'}
                    </div>
                    {sub && <div className="text-[11px] text-textTitle/45">{sub.wordCount} words · {Math.floor(sub.secondsSpent / 60)}m</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
```

- [ ] **Step 2: Manual verification**

As the teacher, open the drill-down for the student who submitted in Task 6. Expected: a "Journal" panel shows the assignment as "Complete" with "N words · Mm" and the privacy note. No entry text anywhere. A student who hasn't started shows "Not started" with no counts.

- [ ] **Step 3: Build + tests**

Run: `npm run build` → zero errors. Run: `npx playwright test` → 21 pass.

- [ ] **Step 4: Commit**

```bash
git add app/dashboard/[classId]/[studentUid]/page.tsx
git commit -m "feat(journal): teacher per-student journal status (metadata only)"
```

---

### Task 8: Firestore rules + seed data + docs

**Files:**
- Modify: `docs/firestore.rules.proposed:68-72` (add submissions rule)
- Modify: `scripts/seed_demo.py`
- Modify: `docs/STUB.md` (if it tracks journaling)

**Interfaces:**
- Produces: deployable rule for the submissions subcollection; demo data for the teacher view.

- [ ] **Step 1: Add the submissions rule**

In `docs/firestore.rules.proposed`, inside the `match /assignments/{assignmentId}` block (after line 71's `allow write`), add a nested match:

```
        // + WEB: journal submission metadata (counts only — NEVER content).
        // A class teacher OR the owning student may READ; clients may NOT write
        // (only the Admin SDK /api/journal/submit route writes these).
        match /submissions/{studentUid} {
          allow read:  if request.auth.uid == studentUid
                       || isClassTeacher(get(/databases/$(database)/documents/classes/$(classId)).data);
          allow write: if false;
        }
```

Add a short comment near the top-level `users/{userId}` block confirming journal entries stay private (the existing `users/{userId}/{document=**}` owner rule already covers `users/{uid}/journal`; no change needed — note this in the diff description).

- [ ] **Step 2: Seed a journal assignment + submissions**

In `scripts/seed_demo.py`, after the existing assignment seeding, add a journal assignment to one class and a couple of submission docs (metadata only). Follow the file's existing Firestore-write style:

```python
    # --- Journal assignment (type='journal') with metadata-only submissions ---
    journal_ref = db.collection("classes").document(class_id).collection("assignments").document()
    journal_ref.set({
        "type": "journal",
        "journal": {
            "questions": ["What's one money goal for this month?", "What might get in the way?"],
            "minWords": 30,
            "minSeconds": 60,
        },
        "lessonIds": [],
        "scope": "class",
        "studentUids": [],
        "dueDate": None,
        "title": "Monthly money goal",
        "createdAt": firestore.SERVER_TIMESTAMP,
    })
    # Two students: one complete, one in progress. NOTE: metadata only — no body.
    subs = journal_ref.collection("submissions")
    subs.document(student_uids[0]).set({
        "wordCount": 48, "secondsSpent": 95, "status": "complete",
        "entryId": "SEED-ENTRY-0001", "submittedAt": firestore.SERVER_TIMESTAMP,
    })
    if len(student_uids) > 1:
        subs.document(student_uids[1]).set({
            "wordCount": 12, "secondsSpent": 40, "status": "in_progress",
            "entryId": "SEED-ENTRY-0002", "submittedAt": firestore.SERVER_TIMESTAMP,
        })
```

(Adjust `class_id` / `student_uids` variable names to match the surrounding seed code.)

- [ ] **Step 3: Docs**

If `docs/STUB.md` lists journaling as a stub/TODO, mark it done with a one-line summary and the route (`/dashboard/journal`). Add a "Journaling" row to `CLAUDE.md`'s component/route tables if the maintainer keeps those current (optional; keep the edit minimal).

- [ ] **Step 4: Verify seed + view (optional, if you can run the seed)**

Run the seed script per its usual invocation, then open the teacher dashboard for the seeded class → student detail. Expected: the seeded journal assignment shows "Complete · 48 words" for student 0 and "In progress · 12 words" for student 1.

- [ ] **Step 5: Build + full tests**

Run: `npm run build` → zero errors. Run: `npx playwright test` → 21 pass.

- [ ] **Step 6: Commit**

```bash
git add docs/firestore.rules.proposed scripts/seed_demo.py docs/STUB.md CLAUDE.md
git commit -m "feat(journal): submissions firestore rule + demo seed + docs"
```

- [ ] **Step 7: Deploy rules (maintainer action — note, do not run blindly)**

The proposed rules must be copied into the live rules file and deployed:
`firebase deploy --only firestore:rules`. Flag this to the user; do not deploy without explicit confirmation (it affects the production iOS app).

---

## Self-Review (completed during authoring)

- **Spec coverage:** personal journal (Task 2) ✓; assigned prompts config — questions/due/min/scope (Tasks 3-4) ✓; metadata-only teacher visibility (Tasks 6-7) ✓; shared store at `users/{uid}/journal` with iOS conventions (Task 1 `newEntryId`, Task 2 hook) ✓; `teacherAssigned` default-false + join gate (Tasks 2, 5, 6) ✓; route `/dashboard/journal` (Task 2) ✓; one-entry-per-prompt (Task 5 `openAssigned` lookup) ✓; rules content/metadata split (Task 8) ✓; tests + build gate (every task) ✓.
- **Placeholder scan:** none — every code step is complete. The one narrative note (Task 5 `classId`) is resolved inline with the exact edit.
- **Type consistency:** `JournalConfig`/`SubmissionMeta` (Task 1) reused verbatim; `Assignment.submissions` shape (Task 3/6) matches what the overview writes and the teacher view reads; `JournalEntry` (Task 2) reused in Tasks 5-6.
```
