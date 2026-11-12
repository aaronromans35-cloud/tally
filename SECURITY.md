# Security

This document describes the security measures in this codebase, their known
limitations, and how to report a problem. It covers both products in this
repo: **FinPath** (`app/(dashboard)/*`, `app/(auth)/*`) and **Tally**
(`app/tally/*`).

## Reporting a vulnerability

Email the maintainer directly rather than opening a public issue. Include
reproduction steps and, if possible, the smallest input that triggers the
problem.

## What's in place

### Authentication & sessions
- Auth is handled by Supabase (`@supabase/ssr`), never rolled by hand.
- Session cookies are set with explicit `httpOnly`, `secure`, and
  `sameSite: 'lax'` flags in both `lib/supabase/server.ts` and
  `lib/supabase/middleware.ts`, rather than relying on library defaults.
- `proxy.ts` (Next's middleware-equivalent) redirects unauthenticated requests
  away from protected routes server-side — not just a client-side check.
- Error messages on login/signup never echo raw provider errors to the
  client; failures map to generic, non-enumerating copy (e.g.
  `app/api/tally/auth/route.ts`, `app/api/auth/signup/route.ts`).

### Rate limiting
- All auth, AI, and market-data routes are rate limited through
  `lib/tally/limiter.ts`. It uses Upstash Redis when configured and reachable,
  and degrades to an in-process sliding-window limiter otherwise — it never
  silently allows unlimited requests. A circuit breaker avoids paying a
  network timeout on every request once Redis is known to be down.
- `lib/ratelimit.ts` (used by the FinPath routes) delegates to the same
  engine, so both products share one correctly-degrading implementation.
- **Known limitation:** the in-process fallback is per server instance. On a
  multi-instance serverless deployment, an attacker spread across N cold
  instances gets roughly N× the stated budget. Provisioning a real Upstash
  Redis instance (see Manual Actions in the repo's working notes, or just set
  `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`) removes this gap.

### Database access control
- Every `tally_*` table has Row Level Security enabled with `auth.uid()`-scoped
  policies — proven, not assumed, by `npm run test:rls` (39 isolation checks
  against a real Postgres instance via PGlite).
- `tally_plaid_items` has RLS enabled with **zero** policies: no browser-side
  key, including the account owner's own, can read it. Only the service role
  can.
- A `SECURITY DEFINER` trigger blocks a user from self-escalating their own
  `tier`, `role`, or `guardian_id` via a direct REST update — RLS controls
  which rows you can touch, not which columns, so this was added specifically
  to close that gap.
- A database trigger refuses to insert a profile for a self-attested date of
  birth under 13, so the age gate holds even if the Next.js layer is bypassed
  entirely.

### Input validation
- All 8 API routes validate and size-cap request bodies through
  `lib/validate.ts` (hand-rolled, no external dependency) before touching
  any data store or third-party API.

### Headers & transport
- `next.config.ts` sets CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, and `Permissions-Policy` on every route.

### Dependency hygiene
- Production dependencies are kept at `npm audit --omit=dev` zero
  vulnerabilities. Next.js is pinned to a version without the known
  Image-Optimization RCE/SSRF/cache-poisoning advisories.
- `.env.local` and all `.env*` files are gitignored; only `.env.example`
  (placeholder values, no real secrets) is tracked.

## Known limitations (by design, not oversight)

- **Self-attested date of birth.** Nothing independently verifies age at
  signup — this is an accepted industry-standard limitation, not a bug.
  The database-level trigger means even a bypassed client can't create an
  under-13 account, but a teenager lying about their birthday on the way in
  is not something any budgeting app can detect.
- **IP-based rate limiting is a speed bump, not an identity check.** Behind a
  proxy you don't control, `x-forwarded-for` is attacker-supplied. The
  account-keyed limiter (`accountLimit` in `lib/tally/limiter.ts`) is the one
  that actually bounds credential stuffing against a single account.
- **Plaid bank-linking is not implemented.** References in UI copy and
  `.env.example` describe the intended integration; there is no live token
  exchange code yet. Treat it as a roadmap item, not a currently-exposed
  surface.
- **Legal pages under `/tally/site` are good-faith drafts**, not
  attorney-reviewed, and say so visibly in the UI.

## Verifying this yourself

```bash
npm run typecheck     # TypeScript, build-blocking
npm run test:rls      # 39 RLS isolation assertions against real Postgres
npm run build          # production build (also runs TypeScript)
npm run verify         # all three, in order
npm audit --omit=dev   # production dependency vulnerabilities
```
