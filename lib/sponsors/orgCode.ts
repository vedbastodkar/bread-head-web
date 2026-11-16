// Organization codes: how a teacher proves they belong to a sponsoring partner. The admin
// generates one code per partner in /admin and hands it to that partner's teachers; a teacher
// enters it at sign-up or later in the dashboard. Pure — unit-tested in tests/unit/orgCode.spec.ts.

/** No I, O, 0 or 1 — the code is read aloud and typed from an email. */
const ORG_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const ORG_CODE_LENGTH = 8
const ORG_CODE_RE = new RegExp(`^[${ORG_CODE_ALPHABET}]{${ORG_CODE_LENGTH}}$`)

/** Upper-case and drop spaces/dashes, so "abcd-2345" and "ABCD 2345" are the same code. */
export function normalizeOrgCode(raw: unknown): string {
  return typeof raw === 'string' ? raw.toUpperCase().replace(/[\s-]/g, '') : ''
}

/** True for an already-normalised, well-formed code. */
export function isOrgCode(code: string): boolean {
  return ORG_CODE_RE.test(code)
}

function secureRandom(): number {
  const buf = new Uint32Array(1)
  globalThis.crypto.getRandomValues(buf)
  return buf[0] / 2 ** 32
}

/** A fresh code. `rand` returns [0, 1); injectable for tests. */
export function makeOrgCode(rand: () => number = secureRandom): string {
  let s = ''
  for (let i = 0; i < ORG_CODE_LENGTH; i++) s += ORG_CODE_ALPHABET[Math.floor(rand() * ORG_CODE_ALPHABET.length)]
  return s
}
