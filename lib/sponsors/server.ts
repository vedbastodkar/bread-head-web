// Server-only sponsor helpers (Admin SDK). NEVER import into a client component.
import { FieldValue } from 'firebase-admin/firestore'
import { adminDb } from '@/lib/firebase/admin'
import { parseSponsorItems, type SponsorItems } from './shared'
import { isOrgCode, makeOrgCode, normalizeOrgCode } from './orgCode'

export const SPONSORS_DOC = 'public/sponsors'

export async function loadSponsorItems(): Promise<SponsorItems> {
  const snap = await adminDb.doc(SPONSORS_DOC).get()
  return parseSponsorItems(snap.exists ? snap.get('items') : undefined)
}

// ── Teacher ↔ organization ───────────────────────────────────────────────────────────────
// Which sponsoring partner a teacher belongs to. Both collections are server-only: the rules
// deny everything not explicitly matched, and a teacher CAN write their own `users/{uid}` and
// `classes/{id}` docs from the browser, so neither of those may hold this. The join route
// reads it to decide which partner a student is verified for.
//   teacherOrgs/{teacherUid}  = { sponsorId, via: 'code' | 'admin', updatedAt }
//   sponsorCodes/{CODE}       = { sponsorId, createdAt }   (one live code per partner)
const TEACHER_ORGS = 'teacherOrgs'
const ORG_CODES = 'sponsorCodes'

/** The teacher's partner, or null if unaffiliated or the partner no longer exists. */
export async function getTeacherSponsorId(teacherUid: string, items?: SponsorItems): Promise<string | null> {
  const snap = await adminDb.collection(TEACHER_ORGS).doc(teacherUid).get()
  const id = snap.exists ? snap.get('sponsorId') : null
  if (typeof id !== 'string' || !id) return null
  return id in (items ?? await loadSponsorItems()) ? id : null
}

/** Set (or with null, clear) a teacher's partner. Caller validates `sponsorId`. */
export async function setTeacherSponsorId(teacherUid: string, sponsorId: string | null, via: 'code' | 'admin'): Promise<void> {
  const ref = adminDb.collection(TEACHER_ORGS).doc(teacherUid)
  if (sponsorId === null) { await ref.delete(); return }
  await ref.set({ sponsorId, via, updatedAt: FieldValue.serverTimestamp() })
}

/** Every teacher's partner id, keyed by teacher uid (admin Teachers table). */
export async function loadTeacherSponsorIds(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const snap = await adminDb.collection(TEACHER_ORGS).get()
  snap.forEach((d) => { const id = d.get('sponsorId'); if (typeof id === 'string' && id) out[d.id] = id })
  return out
}

/** The partner a code belongs to, or null. Accepts raw user input. */
export async function sponsorIdForOrgCode(raw: unknown, items?: SponsorItems): Promise<string | null> {
  const code = normalizeOrgCode(raw)
  if (!isOrgCode(code)) return null
  const snap = await adminDb.collection(ORG_CODES).doc(code).get()
  const id = snap.exists ? snap.get('sponsorId') : null
  if (typeof id !== 'string' || !id) return null
  return id in (items ?? await loadSponsorItems()) ? id : null
}

/** Live code per partner id (admin table). */
export async function loadOrgCodes(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  const snap = await adminDb.collection(ORG_CODES).get()
  snap.forEach((d) => { const id = d.get('sponsorId'); if (typeof id === 'string' && id) out[id] = d.id })
  return out
}

/** Replace a partner's code with a new one; the old code stops working. Returns the new code. */
export async function rotateOrgCode(sponsorId: string): Promise<string> {
  const col = adminDb.collection(ORG_CODES)
  const old = await col.where('sponsorId', '==', sponsorId).get()
  const code = makeOrgCode()
  const batch = adminDb.batch()
  old.forEach((d) => batch.delete(d.ref))
  batch.set(col.doc(code), { sponsorId, createdAt: FieldValue.serverTimestamp() })
  await batch.commit()
  return code
}
