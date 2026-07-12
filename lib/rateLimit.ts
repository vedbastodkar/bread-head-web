// In-memory fixed-window rate limiter. Adequate for single-region Vercel;
// for multi-region durability swap in Upstash/Redis. State resets on cold start.
type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

export function rateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {},
): { ok: boolean; retryAfterSec: number } {
  const limit = opts.limit ?? 5
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()
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

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}
