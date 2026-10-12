/**
 * Tally — persisted data types.
 *
 * These replace the hardcoded `txnData` / `goalDefs` / `upcomingRaw` constants
 * that used to live inside `deriveModel`. Those made Tally a convincing
 * prototype but not a usable product: you could not record what you actually
 * spent, and nothing survived a page refresh.
 *
 * ── Units ──────────────────────────────────────────────────────────────────
 * Everything NEW in this file stores money as integer **cents**, because
 * floats lose money (0.1 + 0.2 !== 0.3) and this is a budgeting app.
 *
 * The pre-existing `Bucket.limit` stays in **dollars**, which is what the
 * original design and both UI shells already expect. Rather than ripple a unit
 * change through 80KB of view code, cents are converted to dollars at exactly
 * one place — `spentDollarsByBucket()` in model.ts. That single conversion
 * point is the whole boundary; don't add others.
 */

import type { Tier } from '@/lib/tally/tiers'

export type { Tier }

export type BucketKind = 'spend' | 'save'

export interface Bucket {
  id: string
  name: string
  kind: BucketKind
  /** DOLLARS (see the units note above). */
  limit: number
}

/** Where a transaction came from. Drives what the user is allowed to edit. */
export type TxnSource = 'seed' | 'manual' | 'csv' | 'plaid'

export interface Txn {
  id: string
  /** Merchant or description, as the user or the bank reported it. */
  name: string
  /** CENTS. Negative = money out, positive = money in. */
  cents: number
  /** ISO `yyyy-mm-dd`. */
  date: string
  /** Null means uncategorised — the UI nudges the user to pick a bucket. */
  bucketId: string | null
  source: TxnSource
  /** Optional UI chip: 'new merchant', 'recurring', 'trial', 'income?'. */
  flag?: string
}

export interface Goal {
  id: string
  name: string
  /** CENTS already put aside. */
  savedCents: number
  /** CENTS target. Must be > 0. */
  targetCents: number
  /** ISO `yyyy-mm-dd`, or null for "no deadline". */
  dueDate: string | null
}

export type SubKind = 'recurring' | 'trial' | 'income'

export interface Sub {
  id: string
  name: string
  /** CENTS per charge. Positive number; `kind` says which direction. */
  cents: number
  /** Day of the month it lands, 1–31. */
  dayOfMonth: number
  kind: SubKind
  /** Human explanation: "Monthly, same date since March". */
  note: string
  cancelled: boolean
}

export type Page = 'today' | 'spending' | 'goals' | 'subs' | 'recap' | 'accounts'
export type DayKind = 'pace' | 'task' | 'freeze'
export type Period = 'Week' | 'Month' | '3 months' | 'Year'

export interface TallyState {
  page: Page
  buckets: Bucket[]
  txns: Txn[]
  goals: Goal[]
  subs: Sub[]
  /** CENTS in checking. Plaid overwrites this; otherwise user-editable. */
  checkingCents: number
  /**
   * Merchant name → bucket id. Learned when the user categorises a
   * transaction, and applied as the default for FUTURE transactions from the
   * same merchant. Correcting one row no longer rewrites history, but the app
   * still "remembers the merchant next time" as the UI promises.
   */
  merchantRules: Record<string, string>
  filter: string // 'All' | bucket id
  period: Period
  /**
   * ISO dates the user acknowledged an off-pace bucket. Replaces the old
   * boolean `reviewed`, which could never distinguish "reviewed today" from
   * "reviewed once, three weeks ago" — and so made the streak meaningless.
   */
  reviewedOn: string[]
  /** ISO dates a freeze was spent. One per week. */
  freezesUsedOn: string[]
  /**
   * The plan this session behaves as.
   *
   * In DEMO mode this is switchable, so a visitor can feel what each tier
   * actually unlocks instead of reading a feature table — the paywall is part
   * of the product, not a separate marketing page.
   *
   * In ACCOUNT mode the server is the authority: this is overwritten from the
   * profile on load and never trusted for anything that matters. Entitlement
   * checks that protect real resources happen in route handlers.
   */
  tier: Tier
}

/** Bumped when the shape changes incompatibly, so old saves are discarded. */
export const TALLY_STATE_VERSION = 2

export interface PersistedTallyState {
  version: number
  state: TallyState
  savedAt: string
}
