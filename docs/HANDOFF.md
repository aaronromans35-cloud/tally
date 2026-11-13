# Tally — what's done, and what's yours

Last updated: 2026-11-13 · Repo: https://github.com/aaronromans35-cloud/tally

---

## Status (2026-11-13)

Steps 1–3 are done and verified in production (https://nexus-app-snowy.vercel.app):
Supabase project `qhszfzgevmgjvbqtpzkp`, env vars on Vercel, Google sign-in
(via `/auth/callback`), Supabase Site URL + Redirect URLs, and Upstash-backed
rate limiting. The project deploys with `npx vercel --prod --yes`; it is not
connected to GitHub, so pushing does not deploy.

## Part 1 — Your steps, in order

Seven steps. Steps 1–3 take about 25 minutes and get you live with working
accounts. Everything after that is optional until you have users.

---

### ✅ Step 1 — New Supabase project *(8 min)*

The old project was deleted, so a new one was needed for sign-up, login and
password reset to work.

1. Go to **supabase.com** → sign in → **New project**
2. Name it `tally`, pick a region near you, save the database password somewhere
3. Wait ~2 minutes for it to provision
4. Go to **Settings → API** and copy these three values:
   - `Project URL`
   - `anon public` key
   - `service_role` key ← **secret, never put this in frontend code**
5. In the project, open **SQL Editor → New query**
6. Open `supabase/migrations/tally_core.sql` from the repo, paste the whole
   file in, and hit **Run**. You should see "Success. No rows returned."
7. Go to **Authentication → Providers → Email** and confirm
   **"Confirm email"** is ON. This is what makes verification emails send.

---

### ✅ Step 2 — Put the keys in *(3 min)*

Open `.env.local` in the project folder and replace these three lines:

```
NEXT_PUBLIC_SUPABASE_URL=<the Project URL from step 1>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<the anon public key>
SUPABASE_SERVICE_ROLE_KEY=<the service_role key>
```

Then prove the security actually works:

```bash
npm run test:rls
```

You want **39 passed, 0 failed**. This runs real Postgres locally and tries to
break into other users' data. If anything fails, stop and tell me.

---

### ✅ Step 3 — Deploy *(10 min)*

1. Go to **vercel.com** → **Add New → Project**
2. **Import** `aaronromans35-cloud/tally` from GitHub
3. Leave every build setting as detected — don't change anything
4. Expand **Environment Variables** and add the three from Step 2, plus:
   ```
   ANTHROPIC_API_KEY=<the one already in your .env.local>
   ```
5. Click **Deploy**

Your URL will be something like `tally-xxx.vercel.app`. To tidy it: **Settings
→ Domains → Edit** and try `tally-app`, `usetally`, or `tallybudget` — a
`.vercel.app` subdomain is free. A real `.com` costs ~$12/year, which is why I
didn't buy one.

From now on, every push to `main` deploys automatically.

---

### ⬜ Step 4 — Instagram *(20 min)*

I can't create accounts or accept terms of service, so this part is yours.

1. Create the account. Handle suggestions: `usetally`, `tally.app`,
   `gettally` — check availability in order
2. **Bio** (paste this):
   ```
   Budgeting that doesn't make you feel bad.
   Read-only — we never move your money.
   Free to start ↓
   ```
3. Link in bio → your Vercel URL
4. Profile picture → `marketing/instagram/out/singles/03.png`, cropped square
5. First post: `marketing/instagram/out/c1-save-every-day/` — upload all
   **7 images in order**, caption in `docs/marketing/CAMPAIGN.md` §4

The 30-day calendar is in `docs/marketing/CAMPAIGN.md` §6. Three posts a week
beats seven posts for two weeks and then nothing.

---

### ⬜ Step 5 — Bank linking *(optional, 15 min)*

Only needed when you want real bank connections rather than manual entry.

1. **dashboard.plaid.com** → sign up (free)
2. **Team Settings → Keys** → copy `client_id` and the **Sandbox** secret
3. Add to Vercel env vars: `PLAID_CLIENT_ID`, `PLAID_SECRET`, `PLAID_ENV=sandbox`

Sandbox uses fake banks and is free forever. Production needs a signed
agreement and a registered company — and read Part 3 before you apply.

---

### ⬜ Step 6 — Taking real money *(when you have users who want to pay)*

Deliberately not built. Stripe needs a real business entity, a bank account,
and someone to accept their terms — all three are yours, not mine.

What exists: a complete entitlement system. Tiers, limits and paywalls all
work and are enforced server-side. Only the card charge is missing.

When you're ready: register a business entity → Stripe account → Stripe
Billing with four products at $0/$5/$10/$20 → webhook that writes the `tier`
column on `tally_profiles` using the **service_role** key.

**Important:** bill the guardian, never the teen. Under-18s can't form an
enforceable subscription contract — a subscription charged to a 15-year-old is
legally voidable.

---

### ⬜ Step 7 — Talk to a lawyer *(before real users, non-negotiable)*

Read Part 3. This is the one step I'd genuinely not skip.

---

## Part 2 — What I built

### The app is real now
Tally was a convincing prototype that couldn't be used. Every number on screen
was derived, but the inputs were hardcoded and **nothing survived a refresh** —
not even in localStorage.

| Was | Now |
|---|---|
| No persistence at all | Saves everything, survives refresh |
| No way to add a transaction | Add, categorise, delete; CSV import |
| `dayOfMonth = 19` hardcoded | Real calendar |
| Streak was a fixed array | Replayed from your actual ledger |
| Charts hardcoded to August | Derived from real transactions |
| Goal button moved nothing | Actually moves money and logs a transfer |
| No tiers, no paywall | Four plans, server-enforced |
| No AI | Coach reading your real budget |
| Type errors ignored in build | Errors fail the build |

### Security
Research context: a 2026 scan of ~31,000 vibe-coded apps found **57% of
Supabase-backed ones let anyone read their database tables.** Always a missing
RLS policy, never a Supabase flaw.

So `npm run test:rls` loads the real migration into real Postgres and runs 39
attacks against it — cross-tenant reads, guessing row IDs, privilege
escalation, anonymous access. **It already caught two bugs that would have
shipped:**

1. **Anyone could give themselves the $20 plan.** RLS controls which *rows* you
   can update, never which *columns* — so "update your own profile" allowed
   `set tier='family'` straight against the API with your own login.
2. **A missing grant** that would have made every query fail in production.

Also: Plaid tokens live in a table no browser key can read; the under-13 block
is enforced by the database, not just the signup form; sign-in is rate limited
per IP *and* per account; password reset can't be used to discover who has an
account.

### The AI coach
Works today — your Anthropic key tested live. It reads your buckets, goals and
subscriptions, and **never** your name, email or bank details. Verified: it
refuses investment advice, and if you paste a password it tells you to delete
the message.

Uses Haiku, the cheapest capable model, because you're paying per message.

### Marketing
30 ready-to-post 1080×1350 PNGs in `marketing/instagram/out/` — four carousels
and four singles. Full campaign in `docs/marketing/CAMPAIGN.md`: captions,
hashtags, 30-day calendar, three email sequences, Reel scripts.

---

## Part 3 — Things you need to know

### 🔴 Plaid requires users to be 18+
This is the single most important finding, and it shaped the whole data model.

**Plaid's End User Services Agreement requires account holders to be 18 or
over**, and Plaid states its services are not directed to under-18s. Tally was
designed as a teen app with read-only Plaid. Those two facts collide.

So the app now uses a **Guardian Model**, which is how every competitor
(Greenlight, Step, Current) works and the only defensible structure:

- **Under 13** — refused. No data collected.
- **13–17** — the full app with manual and CSV entry; a guardian links the bank
- **18+** — everything, self-serve

This is better business, not just safer: the parent holds the credit card, so
Family at $20 is your margin tier.

### 🔴 You need a lawyer before real users
A teen fintech touching bank data is one of the most regulated intersections
there is:

- **COPPA's amended rule** has been in force since 22 April 2026
- Many 2026 state laws now cover **everyone under 18**, not just under-13
- Contracts with minors are **voidable**
- Aggregating bank data may make you a "financial institution" under GLBA

The legal pages are good-faith drafts with a visible "not reviewed by counsel"
banner and `[bracketed]` placeholders. They are a solid starting point that
will save you billable hours. They are not a substitute for an attorney.

### 🟡 Two products share this repo
`/` serves **FinPath** (the older education/DECA app). Tally lives at `/tally`.
FinPath's login will stay broken until the new Supabase keys are in.

When you're ready to make Tally the main product, say so and I'll move it to
the root and retire FinPath's routes.

### 🟡 What I couldn't verify
Sign-up, sign-in and password reset are **built but untested end-to-end**,
because the Supabase project was deleted before I started. The logic, rate
limiting and age gate are all tested; what's untested is the round trip to a
live Supabase. Do Step 1 and we'll confirm it together.

### 🟢 No money was spent
Supabase, Vercel, Upstash and Plaid sandbox are all free tiers. The only thing
that costs anything is the Anthropic API for coach messages — fractions of a
cent each, and rate-limited to 6/day per visitor in demo mode.

---

## Commands worth knowing

```bash
npm run dev       # http://localhost:3000/tally
npm run verify    # types + 39 security tests + production build
npm run test:rls  # just the security tests
node marketing/instagram/slides.mjs   # re-render all 30 campaign images
```
