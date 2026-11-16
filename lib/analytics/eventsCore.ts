// Pure, framework-free half of the browser EventLogger (see ./events.ts for the
// Firestore glue). Everything here is unit-tested in tests/unit/events.spec.ts.
//
// Shape and behaviour mirror the iOS logger (`Services/Analytics/EventLogger.swift`)
// and the shared contract (`breadhead/docs/analytics/data-contract.md` §3).

export const PLATFORM = 'web' as const

/** Flush once this many events are buffered. */
export const FLUSH_THRESHOLD = 25
/** Hard ceiling on the buffer — a WriteBatch tops out at 500 operations. */
export const MAX_BUFFERED_EVENTS = 500

/** Event params are flat primitives only (no nested maps) so BigQuery can JSON_VALUE them. */
export type EventParams = Record<string, string | number | boolean | null>

export interface PendingEvent {
  /** Captured at log time so events buffered under one account are never written under another. */
  uid: string
  name: string
  screen?: string
  params?: EventParams
  /** Device clock, ms epoch. */
  clientTs: number
  sessionId: string
}

/** Fields of the Firestore document that do not need the Firestore SDK (timestamps are added by the caller). */
export interface EventDocBase {
  uid: string
  name: string
  platform: typeof PLATFORM
  sessionId: string
  appVersion: string
  screen?: string
  params?: EventParams
}

/** Append, dropping the oldest events rather than growing without bound if flushes keep failing. */
export function pushBounded(buffer: PendingEvent[], ev: PendingEvent, max = MAX_BUFFERED_EVENTS): PendingEvent[] {
  const next = buffer.concat(ev)
  return next.length > max ? next.slice(next.length - max) : next
}

/**
 * Rules reject a batch containing any event whose uid is not the caller's, which would drop the
 * whole batch. Keep only the current account's events; anything left over from a previous
 * account in this tab is dropped, never re-attributed.
 */
export function splitForFlush(buffer: PendingEvent[], currentUid: string): { pending: PendingEvent[]; dropped: number } {
  const pending = buffer.filter((e) => e.uid === currentUid)
  return { pending, dropped: buffer.length - pending.length }
}

/** Strip undefined/NaN params so Firestore never sees an invalid value. */
export function cleanParams(params?: EventParams): EventParams | undefined {
  if (!params) return undefined
  const out: EventParams = {}
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    if (typeof v === 'number' && !Number.isFinite(v)) continue
    out[k] = v
  }
  return Object.keys(out).length ? out : undefined
}

export function toEventDoc(ev: PendingEvent, appVersion: string): EventDocBase {
  const d: EventDocBase = {
    uid: ev.uid,
    name: ev.name,
    platform: PLATFORM,
    sessionId: ev.sessionId,
    appVersion,
  }
  if (ev.screen) d.screen = ev.screen
  const p = cleanParams(ev.params)
  if (p) d.params = p
  return d
}

/** Vercel exposes the deploy SHA when system env vars are enabled; fall back to the package version. */
export function resolveAppVersion(env: { sha?: string; pkgVersion?: string }): string {
  const sha = (env.sha ?? '').trim()
  if (sha) return sha.slice(0, 7)
  return env.pkgVersion?.trim() || 'unknown'
}

/** RFC 4122 v4 without relying on crypto.randomUUID (missing in some non-secure contexts). */
export function makeSessionId(random: () => number = Math.random): string {
  const hex = '0123456789abcdef'
  let s = ''
  for (let i = 0; i < 36; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) { s += '-'; continue }
    if (i === 14) { s += '4'; continue }
    const r = Math.floor(random() * 16)
    s += hex[i === 19 ? (r & 0x3) | 0x8 : r]
  }
  return s
}
