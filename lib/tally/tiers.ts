/**
 * Tally — plans and entitlements.
 *
 * ONE source of truth, imported by both the UI (to draw locks and upgrade
 * prompts) and the server route handlers (to actually enforce them). If these
 * ever lived in two places they would drift, and the drift would always favour
 * the attacker: a lock the UI draws but the server doesn't check is decoration.
 *
 * Rule for this file: it must stay free of any client-only or server-only
 * import so both sides can use it verbatim.
 *
 * ── Why the ladder is shaped this way ──────────────────────────────────────
 * The payer is usually a parent, not the teen (see the Guardian Model in
 * docs/LAUNCH-PLAN.md — minors can't form an enforceable subscription
 * contract, so billing is always on an adult). So the rungs climb:
 *   free    → prove it's useful at all
 *   starter → remember more than a month, import a statement
 *   plus    → stop typing: link the bank, see the forecast
 *   family  → the parent product: multiple teens, visibility, alerts
 */

export type Tier = 'free' | 'starter' | 'plus' | 'family'

export const TIER_ORDER: readonly Tier[] = ['free', 'starter', 'plus', 'family'] as const

/** Numeric rank, for `>=` style comparisons. */
export const tierRank = (t: Tier): number => TIER_ORDER.indexOf(t)

export interface Entitlements {
  /** Max budget buckets. */
  maxBuckets: number
  /** Max simultaneous savings goals. */
  maxGoals: number
  /** How far back history is readable, in months. */
  historyMonths: number
  /** Import transactions from a bank CSV export. */
  csvImport: boolean
  /** Recurring-charge + free-trial tracking. */
  subscriptionTracking: boolean
  /** Cash-flow forecast and the low-point warning. */
  forecast: boolean
  /** Shareable monthly recap card. */
  recapShare: boolean
  /** Plaid bank linking. Gated by tier AND by age — see canLinkBank(). */
  bankLinking: boolean
  /** AI coach messages per calendar month. 0 disables the feature. */
  aiMessagesPerMonth: number
  /** Linked teen profiles a guardian may watch. */
  guardianSeats: number
  /** Push/email alert when a bucket goes off pace. */
  spendAlerts: boolean
  /** Weekly family digest email. */
  weeklyDigest: boolean
}

const UNLIMITED = Number.MAX_SAFE_INTEGER

export const ENTITLEMENTS: Record<Tier, Entitlements> = {
  free: {
    maxBuckets: 3,
    maxGoals: 1,
    historyMonths: 1,
    csvImport: false,
    subscriptionTracking: false,
    forecast: false,
    recapShare: false,
    bankLinking: false,
    aiMessagesPerMonth: 0,
    guardianSeats: 0,
    spendAlerts: false,
    weeklyDigest: false,
  },
  starter: {
    maxBuckets: UNLIMITED,
    maxGoals: 5,
    historyMonths: 12,
    csvImport: true,
    subscriptionTracking: true,
    forecast: false,
    recapShare: true,
    bankLinking: false,
    aiMessagesPerMonth: 20,
    guardianSeats: 0,
    spendAlerts: false,
    weeklyDigest: false,
  },
  plus: {
    maxBuckets: UNLIMITED,
    maxGoals: UNLIMITED,
    historyMonths: UNLIMITED,
    csvImport: true,
    subscriptionTracking: true,
    forecast: true,
    recapShare: true,
    bankLinking: true,
    aiMessagesPerMonth: 200,
    guardianSeats: 0,
    spendAlerts: true,
    weeklyDigest: false,
  },
  family: {
    maxBuckets: UNLIMITED,
    maxGoals: UNLIMITED,
    historyMonths: UNLIMITED,
    csvImport: true,
    subscriptionTracking: true,
    forecast: true,
    recapShare: true,
    bankLinking: true,
    aiMessagesPerMonth: 400,
    guardianSeats: 5,
    spendAlerts: true,
    weeklyDigest: true,
  },
}

export interface PlanCopy {
  tier: Tier
  name: string
  /** Price in whole dollars per month. */
  priceMonthly: number
  tagline: string
  /** Bullets shown on the pricing page, in order. */
  features: string[]
  /** The one line that explains who this is for. */
  bestFor: string
  highlight?: boolean
}

export const PLANS: readonly PlanCopy[] = [
  {
    tier: 'free',
    name: 'Free',
    priceMonthly: 0,
    tagline: 'See where the money went.',
    bestFor: 'Trying it for a month before you commit to anything.',
    features: [
      '3 spending buckets',
      '1 savings goal',
      'This month‘s history',
      'Daily streak + pace tracking',
      'Add transactions by hand',
    ],
  },
  {
    tier: 'starter',
    name: 'Starter',
    priceMonthly: 5,
    tagline: 'Stop losing last month.',
    bestFor: 'A first job or allowance, tracked properly.',
    features: [
      'Unlimited buckets',
      '5 savings goals',
      '12 months of history',
      'Import a bank CSV',
      'Subscription + free-trial tracker',
      'Shareable monthly recap',
      '20 AI coach messages a month',
    ],
  },
  {
    tier: 'plus',
    name: 'Plus',
    priceMonthly: 10,
    tagline: 'Stop typing. Link the bank.',
    bestFor: 'Anyone 18+ who wants it to run itself.',
    highlight: true,
    features: [
      'Everything in Starter',
      'Connect a bank — read-only',
      'Automatic categorisation',
      'Cash-flow forecast + low-balance warning',
      'Unlimited goals and history',
      'Off-pace spending alerts',
      '200 AI coach messages a month',
    ],
  },
  {
    tier: 'family',
    name: 'Family',
    priceMonthly: 20,
    tagline: 'For the parent paying for all of it.',
    bestFor: 'A guardian with up to 5 teens.',
    features: [
      'Everything in Plus',
      'Up to 5 linked teen profiles',
      'Guardian view of each teen‘s budget',
      'Weekly family digest email',
      'Alerts when a teen goes off pace',
      '400 AI coach messages a month',
    ],
  },
] as const

export const planFor = (tier: Tier): PlanCopy =>
  PLANS.find((p) => p.tier === tier) ?? PLANS[0]

export const entitlementsFor = (tier: Tier): Entitlements =>
  ENTITLEMENTS[tier] ?? ENTITLEMENTS.free

export const isUnlimited = (n: number): boolean => n >= UNLIMITED

/** Render a limit for humans: 9007199254740991 → "Unlimited". */
export const limitLabel = (n: number): string => (isUnlimited(n) ? 'Unlimited' : String(n))

/**
 * A teen's entitlements come from whoever pays for them. Without this, a
 * guardian on Family would watch their teen hit a Free-tier bucket cap.
 */
export function effectiveTier(ownTier: Tier, guardianTier: Tier | null): Tier {
  if (!guardianTier) return ownTier
  return tierRank(guardianTier) > tierRank(ownTier) ? guardianTier : ownTier
}

/**
 * Bank linking is gated by TWO independent things, and both must hold:
 *
 *  1. Tier — it's a Plus feature.
 *  2. Age  — Plaid's End User Services Agreement requires the person linking
 *            the account to be 18 or over, and Plaid states its services are
 *            not directed to under-18s. A 15-year-old linking their own bank
 *            would breach Plaid's terms no matter what we charged them.
 *
 * So a teen never links a bank; their guardian does, on their own account.
 */
export function canLinkBank(args: { tier: Tier; isAdult: boolean }): boolean {
  return entitlementsFor(args.tier).bankLinking && args.isAdult
}

/** Reason bank linking is unavailable, for an honest UI message. */
export function bankLinkBlocker(args: {
  tier: Tier
  isAdult: boolean
}): 'none' | 'tier' | 'age' {
  if (!args.isAdult) return 'age'
  if (!entitlementsFor(args.tier).bankLinking) return 'tier'
  return 'none'
}

export const isAdultDob = (dob: string | Date, now: Date = new Date()): boolean => {
  const d = typeof dob === 'string' ? new Date(dob + 'T00:00:00') : dob
  if (Number.isNaN(d.getTime())) return false
  const eighteen = new Date(d.getFullYear() + 18, d.getMonth(), d.getDate())
  return now >= eighteen
}

export const ageFromDob = (dob: string | Date, now: Date = new Date()): number => {
  const d = typeof dob === 'string' ? new Date(dob + 'T00:00:00') : dob
  if (Number.isNaN(d.getTime())) return NaN
  let age = now.getFullYear() - d.getFullYear()
  const beforeBirthday =
    now.getMonth() < d.getMonth() ||
    (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (beforeBirthday) age--
  return age
}

/** Minimum age for an account at all. Under this, we refuse to collect data. */
export const MIN_AGE = 13
