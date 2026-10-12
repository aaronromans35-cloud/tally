# Tally — Launch Plan & Decision Record

Living document. Updated as work progresses. Written for Aaron + any agent picking this up mid-stream.

Last updated: 2026-10-11

---

## 0. The single most important finding

**Plaid's End User Services Agreement requires users to be 18 or over.** Plaid states its
services "are not directed to individuals under 18" and it "does not knowingly collect data
relating to children."

Tally was designed as a budgeting app for teens (~14+) that connects real bank accounts via
read-only Plaid. **Those two facts are in direct conflict.** Shipping teen-facing Plaid linking
would violate Plaid's own terms and create exactly the "legal trouble" we were asked to avoid.

Compounding constraints found in research:
- Minors aged 13–17 generally **cannot independently agree to terms of service** or hold a
  financial account; a parent/guardian must co-sign. Contracts with minors are **voidable** —
  meaning a subscription charged to a 15-year-old is legally unenforceable.
- COPPA's amended rule hit full compliance **April 22, 2026** (already in force). Under-13 data
  collection requires *verifiable* parental consent (gov ID, knowledge-based auth, or SMS
  confirm + follow-up).
- Many 2026 state laws extend protections to **everyone under 18**, not just under-13.

### Decision: the Guardian Model

Age-gate at signup on date of birth, then branch:

| Age band | What they get |
|---|---|
| **Under 13** | **Blocked.** Do not collect. COPPA verifiable-consent flow is out of scope and not worth the liability. |
| **13–17** | Full budgeting app with **manual + CSV transaction entry**. No Plaid. Bank linking requires a parent/guardian account. Billing is parent-only. |
| **18+** | Full self-serve, including Plaid bank linking and own billing. |

**Why this is better, not just safer:** every successful teen fintech (Greenlight, Step, Current,
Copper) is parent-owned for exactly this reason. The parent is also *the one holding the credit
card* — so designing for the parent as payer is a stronger business, not a compromise. Parental
visibility becomes a paid feature rather than a legal problem.

---

## 1. State of the code at audit (2026-10-11)

### What's real
- Builds clean, exit 0, 39 routes, Next.js **16.2.4** + React 19.2.4 + Tailwind 4.
- Strong security headers already in `next.config.ts` (CSP, HSTS, X-Frame-Options, Permissions-Policy).
- Rate-limiting infrastructure exists (`lib/ratelimit.ts`, Upstash) **and real keys are in `.env.local`**.
- `@anthropic-ai/sdk` installed + `ANTHROPIC_API_KEY` present → AI coach is achievable at no new cost.
- Supabase configured with a working RLS pattern in `supabase/schema.sql` (for FinPath).
- Tally UI is substantial and well-built: desktop (`TallyApp.tsx`) + mobile (`TallyMobile.tsx`)
  shells over a fully-derived model (`model.ts`, 42KB — nothing hardcoded).

### Confirmed defects (the real blockers)
1. **Tally has ZERO persistence.** `TallyApp.tsx:29` is `useState<TallyState>(initialState)`.
   Not even localStorage. Every refresh wipes everything. *A budgeting app that forgets your
   budget is a demo, not a product.* This is the #1 thing blocking "real value."
2. **Tally auth is unprotected against brute force.** `AccessForm.tsx` calls
   `supabase.auth.signInWithPassword` directly from the browser. The `authLimiter` is never
   invoked on this path — it only guards FinPath's `/api/auth/*`. Requested feature, currently absent.
3. **`typescript: { ignoreBuildErrors: true }` and `eslint: { ignoreDuringBuilds: true }`** in
   `next.config.ts` — the green build is not evidence of correctness. Hiding unknown bugs.
4. **`/tally` and `/tally/account` are not in `protectedPaths`** — the "signed-in" app is fully
   public. No gate at all.
5. **No tiers, no paywall, no entitlements.** Nothing exists.
6. **No AI chatbot. No Plaid. No email verification confirmed.**
7. **Legal links are dead ends** — Terms and Privacy both point at `/tally/site`, not real docs.
   Legal pages exist only as client-side state inside `TallySite.tsx`, so they have no URLs.
8. **Two products in one repo.** FinPath (`/`, `/dashboard`, `/deca`, `/teacher`, education +
   DECA) and Tally (`/tally/*`). Root domain currently serves FinPath, not the product we're launching.
9. `safeLimit` **fails open** — if Redis is unreachable, requests pass. Acceptable for quotes,
   wrong for auth (DoS Redis → unlimited password attempts).

---

## 2. Security checklist (from research)

Research context: a scan of 30,998 live vibe-coded apps found **57% of Supabase-backed apps
allowed unauthenticated table reads**. The related disclosure (CVE-2025-48757) scored **CVSS 9.3**.
Nearly all real Supabase incidents come from RLS being off — not from a Supabase flaw.

The five flaws present in almost every AI-built codebase, and Tally's status:

| Flaw | Mitigation | Status |
|---|---|---|
| Missing authorization on endpoints | Every route handler re-checks `auth.getUser()` server-side | TODO |
| Hardcoded/committed secrets | `.gitignore` covers `.env*`; verify git history clean | VERIFY |
| Weak JWT validation | Use `@supabase/ssr` server client, never trust client claims | Partly done |
| IDOR by default | RLS on every table, `auth.uid()` scoped; never filter only in app code | TODO |
| eval-pattern RCE | No `eval`/dynamic exec; audit | VERIFY |
| Missing security headers | Already present in `next.config.ts` | DONE |

**Hard rules for this project:**
- Every new table gets `enable row level security` **plus** a policy, in the same migration.
- RLS must be *verified by test*, not assumed — query with the anon key and prove isolation.
- `service_role` key never enters client code or `NEXT_PUBLIC_*`.
- Entitlement checks happen **server-side**; a paywall enforced only in React is decoration.

---

## 3. Build order

- [ ] **Phase 1 — Foundation:** type checking on + fix fallout; Tally schema + RLS; real
      persistence; auth hardening (server route + rate limit + age gate + email verification).
- [ ] **Phase 2 — Monetization:** tiers (Free/$5/$10/$20), server-enforced entitlements,
      paywalls, master test account per tier.
- [ ] **Phase 3 — Intelligence:** AI coach chatbot (Anthropic, tier-gated + rate-limited);
      Plaid sandbox (18+/guardian only).
- [ ] **Phase 4 — Legal & hardening:** real legal routes, privacy policy, security pass.
- [ ] **Phase 5 — Product polish:** UI, feature coherence, mobile.
- [ ] **Phase 6 — Deploy:** Vercel, free tier, `.vercel.app` subdomain (no spend).
- [ ] **Phase 7 — Marketing:** researched Instagram campaign + captions, email funnel.
- [ ] **Phase 8 — Handoff:** step-by-step list of what only Aaron can do.

---

## 4. Constraints

- **No money spent.** → Plaid **sandbox** only (free, no approval needed; production requires a
  signed agreement + company). Vercel free tier. Free `.vercel.app` domain — a custom domain
  costs money, so it's in the handoff list, not done here.
- **I cannot create accounts or accept terms of service.** Instagram account creation, Plaid
  production application, Stripe onboarding, and app-store submission are all handoff items.
- **Billing is not wired to real money.** Stripe requires a business entity + bank account +
  accepting terms. Tiers will be fully functional with a real entitlement system; the payment
  processor is a handoff step. Master accounts let every tier be tested now.
- **Legal docs are good-faith drafts, not legal advice.** A teen fintech touching bank data is
  one of the most regulated intersections that exists. An attorney is genuinely required before
  taking real users or money. This is stated plainly in the handoff.

---

## 5. Sources

- Plaid legal / developer policy — https://plaid.com/legal/ , https://plaid.com/developer-policy/
- Bradley, "How Banks And Fintechs Can Build COPPA-Ready Youth Apps" (Apr 2026) —
  https://www.bradley.com/insights/publications/2026/04/how-banks-and-fintechs-can-build-coppaready-youth-apps
- Precursor Security, testing Supabase RLS — https://www.precursorsecurity.com/blog/row-level-recklessness-testing-supabase-security
- Vibe Coding Security Report, Aug 2026 (30,998 apps) — https://vibe-eval.com/updates/vibe-coding-security-monthly-aug-2026/
- CSA, AI-Generated Code Vulnerability Surge — https://labs.cloudsecurityalliance.org/research/csa-research-note-ai-generated-code-vulnerability-surge-2026/
- LegalClarity, money apps minors can use — https://legalclarity.org/what-money-apps-can-minors-use-top-options-for-teens/
