// Browser EventLogger — the web half of the shared behavioural event log.
// Contract: breadhead/docs/analytics/data-contract.md §3 (document shape) and §4 (catalogue).
// iOS counterpart: breadhead/.../Services/Analytics/EventLogger.swift.
//
//  - One Firestore document per event in the top-level `events` collection, written as a
//    single WriteBatch. The rule is create-only and requires data.uid == auth.uid.
//  - Buffered in memory; flushed at FLUSH_THRESHOLD, on visibilitychange→hidden / pagehide,
//    and on a short idle timer. Unlike iOS, the web SDK has no offline persistence here, so a
//    closed tab drops whatever is still buffered — the idle flush keeps that window small.
//  - No-op when signed out or anonymous (the rule would reject the write anyway).
//  - sessionId lives in sessionStorage: one per tab, survives reloads, new per tab. A fresh
//    session emits `session_start`.
//  - Each buffered event captures the uid at log time; at flush only the current account's
//    events are written (a batch with a foreign uid would be rejected wholesale).
import { collection, doc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import pkg from '@/package.json'
import {
  FLUSH_THRESHOLD, MAX_BUFFERED_EVENTS, type EventParams, type PendingEvent,
  pushBounded, splitForFlush, toEventDoc, resolveAppVersion, makeSessionId,
} from './eventsCore'

export type { EventParams }

const SESSION_KEY = 'bh.analytics.sessionId'
const LAST_ACTIVE_KEY = 'bh.analytics.lastActive'
const IDLE_FLUSH_MS = 8_000
/** A log call after this long idle starts a new session (iOS rotates after 30 min in background). */
const SESSION_TIMEOUT_MS = 30 * 60_000
/** Written at once instead of waiting for the idle timer: people often leave the page right
 *  after these, and a full navigation drops whatever is still buffered. */
const FLUSH_IMMEDIATELY: ReadonlySet<string> = new Set(['transaction_created', 'lesson_completed'])

const APP_VERSION = resolveAppVersion({
  sha: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  pkgVersion: (pkg as { version?: string }).version,
})

let buffer: PendingEvent[] = []
let flushing = false
let idleTimer: ReturnType<typeof setTimeout> | null = null
let listenersInstalled = false
let memorySessionId: string | null = null // fallback when sessionStorage is unavailable

function currentUid(): string | null {
  const u = auth.currentUser
  if (!u || u.isAnonymous) return null
  return u.uid
}

/** Per-tab session id. `isNew` is true when this call created one (first use, or after SESSION_TIMEOUT_MS idle). */
function ensureSession(now: number): { id: string; isNew: boolean } {
  try {
    const ss = window.sessionStorage
    const existing = ss.getItem(SESSION_KEY)
    const last = Number(ss.getItem(LAST_ACTIVE_KEY) ?? 0)
    ss.setItem(LAST_ACTIVE_KEY, String(now))
    if (existing && now - last < SESSION_TIMEOUT_MS) return { id: existing, isNew: false }
    const id = makeSessionId()
    ss.setItem(SESSION_KEY, id)
    return { id, isNew: true }
  } catch {
    if (memorySessionId) return { id: memorySessionId, isNew: false }
    memorySessionId = makeSessionId()
    return { id: memorySessionId, isNew: true }
  }
}

function installListeners() {
  if (listenersInstalled || typeof window === 'undefined') return
  listenersInstalled = true
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void flushEvents()
  })
  window.addEventListener('pagehide', () => { void flushEvents() })
}

function scheduleIdleFlush() {
  if (idleTimer) return
  idleTimer = setTimeout(() => { idleTimer = null; void flushEvents() }, IDLE_FLUSH_MS)
}

/**
 * Record one event. Names and params come from the catalogue (contract §4); params must be
 * flat primitives. Safe to call anywhere on the client — it is a no-op on the server, when
 * signed out, or for anonymous users.
 */
export function logEvent(name: string, opts: { screen?: string; params?: EventParams } = {}): void {
  if (typeof window === 'undefined') return
  const uid = currentUid()
  if (!uid) return
  installListeners()

  const now = Date.now()
  const session = ensureSession(now)
  if (session.isNew) {
    buffer = pushBounded(buffer, { uid, name: 'session_start', clientTs: now, sessionId: session.id }, MAX_BUFFERED_EVENTS)
  }
  buffer = pushBounded(buffer, { uid, name, screen: opts.screen, params: opts.params, clientTs: now, sessionId: session.id }, MAX_BUFFERED_EVENTS)

  if (buffer.length >= FLUSH_THRESHOLD || FLUSH_IMMEDIATELY.has(name)) void flushEvents()
  else scheduleIdleFlush()
}

/**
 * Write the buffered events as one batch and clear them. A failed commit is logged and the
 * events dropped: Firestore already retries transient failures, so a throw here means a
 * persistent problem (rules, auth) that retrying would not fix.
 */
export async function flushEvents(): Promise<void> {
  if (buffer.length === 0) return
  if (flushing) { scheduleIdleFlush(); return } // try again once the in-flight batch settles
  const uid = currentUid()
  if (!uid) return
  if (idleTimer) { clearTimeout(idleTimer); idleTimer = null }

  flushing = true
  const all = buffer
  buffer = []
  try {
    const { pending, dropped } = splitForFlush(all, uid)
    if (dropped > 0 && process.env.NODE_ENV !== 'production') {
      console.warn(`[events] dropped ${dropped} event(s) from a previous account`)
    }
    if (pending.length === 0) return

    const batch = writeBatch(db)
    const col = collection(db, 'events')
    for (const ev of pending) {
      batch.set(doc(col), {
        ...toEventDoc(ev, APP_VERSION),
        clientTs: Timestamp.fromMillis(ev.clientTs),
        serverTs: serverTimestamp(),
      })
    }
    await batch.commit()
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') console.warn('[events] flush failed, events dropped', e)
  } finally {
    flushing = false
  }
}
