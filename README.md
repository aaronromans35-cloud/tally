# Tally

A budgeting app for teenagers, and the guardians who pay for it.

Tally tracks spending against custom buckets, keeps a streak for staying on
pace, watches for free trials about to convert, and forecasts the low point in
your month before you hit it. It is **read-only** — Tally never moves your
money, and is not a bank.

```bash
npm install
npm run dev        # http://localhost:3000/tally
npm run verify     # typecheck + RLS isolation tests + production build
```

---

## The Guardian Model

The single most important design constraint, and the reason the data model
looks the way it does:

**Plaid's End User Services Agreement requires users to be 18 or over**, and
Plaid states its services are not directed to under-18s. A teen-facing app
that links real bank accounts is therefore not something you can simply build —
it conflicts with the terms of the service doing the linking.

On top of that, 13–17 year olds generally cannot form an enforceable contract,
so a subscription billed to a 15-year-old is voidable; and COPPA's amended rule
(in force since 22 April 2026) makes under-13 data collection a
verifiable-parental-consent problem that isn't worth the liability.

So Tally age-gates at signup and branches:

| Age | What they get |
|---|---|
| **Under 13** | Refused. No data collected. Enforced by a database trigger, not just app code. |
| **13–17** | The full budgeting app, with manual and CSV transaction entry. No bank linking. Billing sits on a guardian. |
| **18+** | Full self-serve, including Plaid bank linking and their own billing. |

A guardian can **view** a linked teen's budget but not edit it — the teen owns
their own money decisions. AI coach conversations are private even from the
guardian, because a teen asking "how do I stop overspending" shouldn't be
surveilled.

See [`docs/LAUNCH-PLAN.md`](docs/LAUNCH-PLAN.md) for the full decision record.

---

## Plans

One source of truth in [`lib/tally/tiers.ts`](lib/tally/tiers.ts), imported by
both the UI and the server. A lock the UI draws but the server doesn't check is
decoration, so entitlements are enforced in route handlers.

| | Free | Starter $5 | Plus $10 | Family $20 |
|---|---|---|---|---|
| Buckets | 3 | ∞ | ∞ | ∞ |
| History | 1 month | 12 months | ∞ | ∞ |
| CSV import | — | ✓ | ✓ | ✓ |
| Subscription tracker | — | ✓ | ✓ | ✓ |
| Bank linking (18+) | — | — | ✓ | ✓ |
| Forecast | — | — | ✓ | ✓ |
| AI coach / month | — | 20 | 200 | 400 |
| Linked teens | — | — | — | 5 |

---

## Architecture

```
app/tally/
  types.ts        persisted data types (money in integer cents)
  storage.ts      localStorage persistence + date-relative seed data
  model.ts        deriveModel() — every on-screen value is computed here
  TallyApp.tsx    desktop shell
  TallyMobile.tsx phone shell (≤768px)
  site/           marketing site at /tally/site
  access/         auth; account/ settings
lib/tally/tiers.ts        plans + entitlements (shared client/server)
supabase/migrations/      schema with RLS
scripts/test-rls.mjs      RLS isolation proof
```

**Two modes.** Without a backend configured, Tally runs in **demo mode**:
fully usable, seeded with believable data, persisted to `localStorage`. With
Supabase configured, the same shape syncs to an account. The model never learns
which mode it's in.

**Units.** New data stores money as integer **cents**, because floats lose
money. The pre-existing `Bucket.limit` is in dollars; cents convert to dollars
at exactly one place (`spentDollarsByBucket` in `model.ts`). Don't add a second
conversion point.

---

## Security

A 2026 scan of ~31,000 vibe-coded apps found **57% of Supabase-backed ones
allowed unauthenticated table reads** — always a table that shipped without
RLS, never a flaw in Supabase itself.

So RLS here is a *tested* property, not an assumption:

```bash
npm run test:rls
```

This loads the real migration into real Postgres (PGlite, WASM — no Docker) and
asserts 39 isolation guarantees: tenant separation, IDOR attempts against known
row ids, guardian view-but-not-edit, anonymous access, the under-13 trigger,
and privilege escalation.

It has already earned its keep. It caught two bugs that would have shipped:

1. **Free tier upgrades.** RLS governs which *rows* you may update, never which
   *columns* — so "update your own profile" let any user run
   `update tally_profiles set tier='family'` against the REST API with their
   own token. Now blocked by a trigger.
2. **A missing `EXECUTE` grant** that would have made every policy-backed query
   error out in a real deployment.

Other invariants: Plaid access tokens live in a table with RLS enabled and
*zero* policies, so no browser-side key can read them — only the service role.
TypeScript errors fail the build (`ignoreBuildErrors` is off on purpose).

---

## Environment

Copy `.env.example` to `.env.local`. Tally runs without any of these in demo
mode; they light up account mode.

| Variable | Needed for |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | accounts, persistence, guardians |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only: tier changes, Plaid tokens. **Never** expose to the client. |
| `ANTHROPIC_API_KEY` | AI coach |
| `PLAID_CLIENT_ID` / `PLAID_SECRET` | bank linking (sandbox is free) |
| `UPSTASH_REDIS_REST_*` | distributed rate limiting (optional; falls back to in-memory) |

---

## Status

Working: the app itself — buckets, transactions, goals, subscriptions, streak,
forecast, recap — on desktop and mobile, persisted, in demo mode.

Not done yet: tier enforcement in route handlers, the AI coach, Plaid, auth
hardening, and account-mode sync. The legal pages under `/tally/site` are
good-faith drafts carrying a visible "not reviewed by counsel" banner — a teen
fintech touching bank data genuinely needs an attorney before taking real users
or real money.
