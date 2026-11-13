/**
 * Thin adapter over `lib/tally/limiter.ts`. The old `safeLimit` failed OPEN on
 * any Redis error, which would have given every route using it (login,
 * signup, market/quote proxies, the paid AI endpoints) no effective limit
 * whenever Redis hiccuped.
 *
 * The engine uses Upstash Redis (shared across serverless instances) and
 * degrades to an in-process limiter instead of allowing unlimited requests
 * when Redis is unreachable. Names/signatures below are unchanged so none of the 6 call
 * sites need to change.
 */
import { rateLimit } from './tally/limiter'

// Auth routes: 5 attempts per 10 minutes per IP
export const authLimiter = { limit: 5, windowMs: 10 * 60_000, prefix: 'nexus:auth' }

// AI routes (plan, stock-research): 10 per hour per user
export const aiLimiter = { limit: 10, windowMs: 60 * 60_000, prefix: 'nexus:ai' }

// Quote/market data: 60 per minute per IP
export const quoteLimiter = { limit: 60, windowMs: 60_000, prefix: 'nexus:quote' }

export function getIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1'
  return ip
}

type LimiterConfig = { limit: number; windowMs: number; prefix: string }

// Fails CLOSED in the sense that matters: a dead/unreachable Redis degrades
// to a real in-process ceiling rather than letting every request through.
export async function safeLimit(limiter: LimiterConfig, key: string) {
  const result = await rateLimit({
    key: `${limiter.prefix}:${key}`,
    limit: limiter.limit,
    windowMs: limiter.windowMs,
    onError: 'closed',
  })
  return { success: result.success, remaining: result.remaining, reset: result.reset }
}
