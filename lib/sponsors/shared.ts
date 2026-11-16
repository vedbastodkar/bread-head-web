// Sponsor list shape shared by the picker (iOS), the join route and the admin portal. Source of truth is the single world-readable Firestore document
// `public/sponsors = { items: { <sponsorId>: { displayName, active, sortOrder } } }`
// (spec 2026-08-30-sponsor-attribution.md §2). Pure — unit-tested in tests/unit/sponsors.spec.ts.

export interface SponsorItem {
  displayName: string
  active: boolean
  sortOrder: number
}
export type SponsorItems = Record<string, SponsorItem>

export interface Sponsor extends SponsorItem { id: string }

/** `classroom` and `self` are attribution sources, never sponsor ids. */
export const RESERVED_SPONSOR_IDS: ReadonlySet<string> = new Set(['classroom', 'self'])

/** Lower-case slug: what the iOS picker stores as `attribution.source` and BigQuery groups by. */
export const SPONSOR_ID_RE = /^[a-z0-9][a-z0-9-]{1,39}$/

export function isValidSponsorId(id: unknown): id is string {
  return typeof id === 'string' && SPONSOR_ID_RE.test(id) && !RESERVED_SPONSOR_IDS.has(id)
}

/** Tolerant parse of the raw `items` map — skips malformed or reserved entries. */
export function parseSponsorItems(raw: unknown): SponsorItems {
  const out: SponsorItems = {}
  if (!raw || typeof raw !== 'object') return out
  for (const [id, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!isValidSponsorId(id) || !v || typeof v !== 'object') continue
    const o = v as Record<string, unknown>
    if (typeof o.displayName !== 'string' || !o.displayName.trim()) continue
    out[id] = {
      displayName: o.displayName.trim(),
      active: o.active === true,
      sortOrder: Number.isFinite(Number(o.sortOrder)) ? Number(o.sortOrder) : 0,
    }
  }
  return out
}

/** Ordered list for UI: `sortOrder`, then name. `activeOnly` hides deactivated partners. */
export function sortedSponsors(items: SponsorItems, activeOnly = true): Sponsor[] {
  return Object.entries(items)
    .map(([id, s]) => ({ id, ...s }))
    .filter((s) => !activeOnly || s.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.displayName.localeCompare(b.displayName))
}
