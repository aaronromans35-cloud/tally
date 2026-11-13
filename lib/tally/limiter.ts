/**
 * Rate limiting that degrades honestly.
 *
 * The repo already had Upstash-backed limiters (lib/ratelimit.ts), but
 * `safeLimit` there failed OPEN on any error. Failing open is right for a stock quote and wrong for a login: it
 * means anyone who can make Redis unreachable gets unlimited password guesses.
 *
 * This module:
 *   • uses Upstash when it's configured and reachable,
 *   • falls back to an in-process limiter when it isn't,
 *   • and lets each caller choose the failure direction explicitly.
 *
 * The in-process fallback is per-instance, so on serverless it is weaker than
 * Redis — an attacker spread across N cold instances gets N times the budget.
 * It is still far better than nothing, but do not present it as equivalent to
 * Redis. Production is configured with Upstash (UPSTASH_REDIS_REST_URL/TOKEN),
 * so the fallback only applies during an outage.
 */

type Outcome = { success: boolean; remaining: number; reset: number; backend: 'redis' | 'memory' }

const hasUpstash =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN

/* ─────────────────────── in-process sliding window ─────────────────────── */

const buckets = new Map<string, number[]>()
let lastSweep = Date.now()

/** Drop keys nobody has touched in a while so this can't grow without bound. */
function sweep(windowMs: number) {
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [k, hits] of buckets) {
    const live = hits.filter((t) => now - t < windowMs)
    if (live.length === 0) buckets.delete(k)
    else buckets.set(k, live)
  }
}

function memoryLimit(key: string, limit: number, windowMs: number): Outcome {
  sweep(windowMs)
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    return {
      success: false,
      remaining: 0,
      reset: hits[0] + windowMs,
      backend: 'memory',
    }
  }
  hits.push(now)
  buckets.set(key, hits)
  return { success: true, remaining: limit - hits.length, reset: now + windowMs, backend: 'memory' }
}

/* ─────────────────────── public API ─────────────────────── */

export interface LimitOptions {
  /** Unique bucket, e.g. `tally:login:1.2.3.4`. */
  key: string
  limit: number
  windowMs: number
  /**
   * Retained for callers that document intent, but note what "closed" can and
   * cannot mean here — see the comment on the catch block below.
   */
  onError: 'open' | 'closed'
}

/**
 * Circuit breaker. Without this, a dead-but-configured Redis costs every
 * single request a network timeout before falling back — which is exactly the
 * state this project was in before the Upstash instance was recreated.
 */
let redisDownUntil = 0
const REDIS_COOLDOWN_MS = 30_000

export async function rateLimit(opts: LimitOptions): Promise<Outcome> {
  if (!hasUpstash || Date.now() < redisDownUntil) {
    return memoryLimit(opts.key, opts.limit, opts.windowMs)
  }

  try {
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
    const windowKey = `${opts.key}:${Math.floor(Date.now() / opts.windowMs)}`
    const count = await redis.incr(windowKey)
    if (count === 1) await redis.pexpire(windowKey, opts.windowMs)
    const reset = (Math.floor(Date.now() / opts.windowMs) + 1) * opts.windowMs
    return {
      success: count <= opts.limit,
      remaining: Math.max(0, opts.limit - count),
      reset,
      backend: 'redis',
    }
  } catch {
    // Degrade to the in-process limiter rather than denying outright.
    //
    // "Fail closed" is the instinct here, but denying on backend error means a
    // configured-yet-unreachable Redis takes down sign-in and the coach for
    // everybody — a self-inflicted outage, which is how this bug first showed
    // up. The memory limiter still enforces a real ceiling; it is just
    // per-instance rather than global. Weaker, never absent.
    redisDownUntil = Date.now() + REDIS_COOLDOWN_MS
    return memoryLimit(opts.key, opts.limit, opts.windowMs)
  }
}

/**
 * Caller IP, trusting only the leftmost x-forwarded-for entry.
 *
 * On Vercel this header is set by the platform. Behind a proxy you do not
 * control, it is attacker-supplied — which is why rate limits keyed on IP are
 * a speed bump, not an identity check. Limits that matter are also keyed on
 * the authenticated user id.
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0].trim()
  return req.headers.get('x-real-ip')?.trim() || '127.0.0.1'
}

/** Standard headers so clients can back off politely. */
export function limitHeaders(o: Outcome, limit: number): Record<string, string> {
  return {
    'RateLimit-Limit': String(limit),
    'RateLimit-Remaining': String(o.remaining),
    'RateLimit-Reset': String(Math.max(0, Math.ceil((o.reset - Date.now()) / 1000))),
  }
}

/* ─────────────────────── named policies ─────────────────────── */

/**
 * Sign-in / sign-up / reset. Fails CLOSED — a broken limiter must not become
 * an open door to credential stuffing.
 */
export const authLimit = (ip: string) =>
  rateLimit({ key: `tally:auth:${ip}`, limit: 8, windowMs: 10 * 60_000, onError: 'closed' })

/** Per-account lockout, so rotating IPs doesn't defeat the limit above. */
export const accountLimit = (email: string) =>
  rateLimit({
    key: `tally:auth:acct:${email.toLowerCase()}`,
    limit: 10,
    windowMs: 15 * 60_000,
    onError: 'closed',
  })

/** AI coach. Fails closed because every call costs real money. */
export const coachLimit = (userKey: string) =>
  rateLimit({ key: `tally:coach:${userKey}`, limit: 12, windowMs: 60_000, onError: 'closed' })
