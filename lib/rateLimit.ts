// In-memory fixed-window rate limiter. Adequate for single-region Vercel;
// for multi-instance/multi-region enforcement swap in a shared store (Upstash/
// Redis) — per-instance state resets on cold start and isn't shared across lambdas.
import { NextResponse } from 'next/server'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

// Bound memory: once the map grows past this, drop expired entries. Prevents
// unbounded growth from a flood of distinct keys (e.g. spoofed IPs) on a
// long-lived instance.
const MAX_BUCKETS = 10_000
function sweepExpired(now: number) {
  buckets.forEach((b, k) => { if (now >= b.resetAt) buckets.delete(k) })
}

export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): { ok: boolean; retryAfterSec: number } {
  const limit = opts.limit ?? 5
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()
  if (buckets.size > MAX_BUCKETS) sweepExpired(now)
  const b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterSec: Math.ceil((b.resetAt - now) / 1000) }
  }
  b.count += 1
  return { ok: true, retryAfterSec: 0 }
}

// Best-effort client IP. Prefer `x-real-ip` (set by the Vercel edge to the true
// client IP) over `x-forwarded-for` (client-controllable — an attacker can prepend
// entries). Falls back to the leftmost XFF hop, then 'unknown'.
export function clientIp(req: Request): string {
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return 'unknown'
}

// Convenience guard for route handlers. Keys by authenticated user id when given
// (per-user limit), else by client IP. Returns a 429 NextResponse to return early,
// or null when the request is within limits.
//   const limited = enforce(req, { prefix: 'lesson-submit', uid: decoded.uid, limit: 60, windowMs: 15 * 60_000 })
//   if (limited) return limited
export function enforce(
  req: Request,
  opts: { prefix: string; uid?: string; limit: number; windowMs: number },
): NextResponse | null {
  const id = opts.uid ? `u:${opts.uid}` : `ip:${clientIp(req)}`
  const rl = rateLimit(`${opts.prefix}:${id}`, { limit: opts.limit, windowMs: opts.windowMs })
  if (rl.ok) return null
  const resetSec = Math.ceil(Date.now() / 1000) + rl.retryAfterSec
  return NextResponse.json(
    { error: 'Too many requests', retryAfter: rl.retryAfterSec },
    {
      status: 429,
      headers: {
        'Retry-After': String(rl.retryAfterSec),
        'X-RateLimit-Limit': String(opts.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetSec),
      },
    },
  )
}
