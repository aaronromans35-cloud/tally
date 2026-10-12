/**
 * Tally — state persistence and seed data.
 *
 * Two modes, by design:
 *
 *  • DEMO MODE (no account): state lives in localStorage. The app is fully
 *    usable, seeded with believable data, and survives a refresh. This is what
 *    a visitor gets, and it's deliberately a real experience rather than a
 *    dead screenshot.
 *
 *  • ACCOUNT MODE (signed in): the same shape is mirrored to Supabase. The
 *    sync layer lives in `app/tally/sync.ts`; this file stays storage-agnostic
 *    so the model never learns which mode it's in.
 *
 * Seed data is generated RELATIVE TO TODAY. The original prototype hardcoded
 * `dayOfMonth = 19`, so the app always believed it was the 19th — pace maths,
 * forecasts, and the streak were all frozen in place.
 */
import {
  TALLY_STATE_VERSION,
  type PersistedTallyState,
  type TallyState,
  type Txn,
} from './types'

export const STORAGE_KEY = 'tally:state:v2'

/* ─────────────────────────── date helpers ─────────────────────────── */

export const iso = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export const todayIso = (now: Date = new Date()): string => iso(now)

/** Nth day of the current month, clamped to a day that exists. */
const dayThisMonth = (day: number, now: Date = new Date()): string => {
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  return iso(new Date(now.getFullYear(), now.getMonth(), Math.min(day, last)))
}

/** `n` days before today. */
const daysAgo = (n: number, now: Date = new Date()): string => {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return iso(d)
}

export const daysInMonthOf = (now: Date = new Date()): number =>
  new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

let seq = 0
const id = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 6)}`

export const newTxnId = () => id('t')
export const newGoalId = () => id('g')
export const newSubId = () => id('s')
export const newBucketId = () => id('b')

/* ─────────────────────────── seed ─────────────────────────── */

/** Bucket limits the seed assumes. Kept beside the seed txns that fill them. */
const SEED_LIMITS: Record<string, number> = {
  food: 120,
  fun: 80,
  transport: 60,
  saving: 60,
}

/**
 * How much of a bucket's expected month-to-date pace the seed fills.
 * Deliberately under 1.0 so a first-time visitor lands on a *healthy* budget —
 * buckets on pace, a streak that counts — rather than four red "spending fast"
 * warnings. Saving sits above pace, which is what "ahead of target" means for
 * a save bucket.
 */
const SEED_FILL: Record<string, number> = {
  food: 0.76,
  fun: 0.72,
  transport: 0.68,
  saving: 1.15,
}

/**
 * The demo data the old prototype hardcoded, now expressed as real records the
 * user can edit, delete and add to.
 *
 * Amounts are generated PROPORTIONALLY to how far through the month we are.
 * The original fixed totals (food $62, fun $48 …) were tuned for the 19th of a
 * 31-day month; visit on the 3rd and every bucket looked wildly overspent,
 * visit on the 28th and they looked untouched.
 */
function seedTxns(now: Date): Txn[] {
  const elapsed = now.getDate()
  const dim = daysInMonthOf(now)
  const monthFraction = elapsed / dim

  const t = (
    name: string,
    dollars: number,
    date: string,
    bucketId: string | null,
    flag?: string,
  ): Txn => ({
    id: newTxnId(),
    name,
    cents: Math.round(dollars * 100),
    date,
    bucketId,
    source: 'seed',
    ...(flag ? { flag } : {}),
  })

  /**
   * Split a bucket's target spend across merchants by weight, dating each one
   * inside the days that have actually happened this month.
   */
  const fill = (
    bucketId: string,
    rows: { name: string; weight: number; dayBack: number; flag?: string }[],
  ): Txn[] => {
    const target = SEED_LIMITS[bucketId] * monthFraction * SEED_FILL[bucketId]
    // Drop rows that would fall before the 1st FIRST, then weight against what
    // survives. Weighting against the full list instead would silently
    // under-fill the bucket early in the month — which read on screen as
    // "behind target" on a budget that was actually fine.
    const usable = rows.filter((r) => r.dayBack < elapsed)
    const totalWeight = usable.reduce((a, r) => a + r.weight, 0) || 1
    return usable
      .map((r) =>
        t(
          r.name,
          -Math.round(target * (r.weight / totalWeight) * 100) / 100,
          daysAgo(r.dayBack, now),
          bucketId,
          r.flag,
        ),
      )
      .filter((x) => x.cents <= -50) // drop sub-50¢ noise early in the month
  }

  return [
    // Income lands mid-month so the forecast has something to climb back from.
    t(
      'Shift pay — Riverside Cafe',
      186.2,
      daysAgo(Math.min(5, Math.max(0, elapsed - 1)), now),
      null,
      'income?',
    ),

    ...fill('food', [
      { name: 'Blue Line Coffee', weight: 1.0, dayBack: 0, flag: 'new merchant' },
      { name: 'Campus Deli', weight: 2.2, dayBack: 0 },
      { name: 'Blue Line Coffee', weight: 1.0, dayBack: 1 },
      { name: 'Grocery run', weight: 2.6, dayBack: 3 },
      { name: 'Campus Deli', weight: 2.0, dayBack: 6 },
      { name: 'Blue Line Coffee', weight: 1.2, dayBack: 8 },
    ]),

    ...fill('fun', [
      { name: 'Streaming service', weight: 2.4, dayBack: 2, flag: 'recurring' },
      { name: 'Music premium', weight: 1.2, dayBack: 4, flag: 'recurring' },
      { name: 'Gaming pass', weight: 2.0, dayBack: 2, flag: 'recurring' },
      { name: 'Cinema', weight: 2.5, dayBack: 9 },
      { name: 'Bubble tea', weight: 1.5, dayBack: 4 },
    ]),

    ...fill('transport', [
      { name: 'Metro fare', weight: 1, dayBack: 1 },
      { name: 'Metro fare', weight: 1, dayBack: 2 },
      { name: 'Metro fare', weight: 1, dayBack: 7 },
      { name: 'Metro fare', weight: 1, dayBack: 10 },
      { name: 'Gas — Shell', weight: 3.6, dayBack: 5 },
    ]),

    // A 'save' bucket: money moved out of checking counts as progress.
    ...fill('saving', [
      { name: 'Transfer to savings', weight: 1, dayBack: 4 },
      { name: 'Transfer to savings', weight: 1.7, dayBack: 11 },
    ]),
  ]
}

export function makeSeedState(now: Date = new Date()): TallyState {
  return {
    page: 'today',
    buckets: [
      { id: 'food', name: 'Food', kind: 'spend', limit: 120 },
      { id: 'fun', name: 'Fun', kind: 'spend', limit: 80 },
      { id: 'transport', name: 'Transport', kind: 'spend', limit: 60 },
      { id: 'saving', name: 'Saving', kind: 'save', limit: 60 },
    ],
    txns: seedTxns(now),
    goals: [
      {
        id: 'goal_concert',
        name: 'Concert fund',
        savedCents: 18_200,
        targetCents: 25_000,
        dueDate: dayThisMonth(daysInMonthOf(now), now),
      },
      {
        id: 'goal_laptop',
        name: 'New laptop',
        savedCents: 64_000,
        targetCents: 90_000,
        dueDate: iso(new Date(now.getFullYear(), now.getMonth() + 2, 1)),
      },
      {
        id: 'goal_emergency',
        name: 'Emergency',
        savedCents: 31_800,
        targetCents: 50_000,
        dueDate: null,
      },
    ],
    subs: [
      {
        id: 'sub_stream',
        name: 'Streaming service',
        cents: 1199,
        dayOfMonth: 4,
        kind: 'recurring',
        note: 'Monthly, same date since Jan',
        cancelled: false,
      },
      {
        id: 'sub_music',
        name: 'Music premium',
        cents: 599,
        dayOfMonth: 9,
        kind: 'recurring',
        note: 'Monthly, student rate',
        cancelled: false,
      },
      {
        id: 'sub_fitness',
        name: 'Fitness app',
        cents: 1499,
        dayOfMonth: Math.min(now.getDate() + 3, daysInMonthOf(now)),
        kind: 'trial',
        note: 'Free trial converts to paid',
        cancelled: false,
      },
      {
        id: 'sub_cloud',
        name: 'Cloud storage',
        cents: 299,
        dayOfMonth: Math.min(now.getDate() + 6, daysInMonthOf(now)),
        kind: 'trial',
        note: 'Free trial converts to paid',
        cancelled: false,
      },
      {
        id: 'sub_gaming',
        name: 'Gaming pass',
        cents: 999,
        dayOfMonth: 21,
        kind: 'recurring',
        note: 'Monthly, same date since Mar',
        cancelled: false,
      },
      {
        id: 'sub_pay',
        name: 'Shift pay — Riverside Cafe',
        cents: 18_620,
        dayOfMonth: 29,
        kind: 'income',
        note: 'Every other Friday',
        cancelled: false,
      },
    ],
    checkingCents: 24_815,
    merchantRules: {},
    filter: 'All',
    period: 'Week',
    reviewedOn: [],
    freezesUsedOn: [],
  }
}

/* ─────────────────────────── load / save ─────────────────────────── */

/**
 * Narrow an unknown parsed blob to TallyState. localStorage is attacker-
 * controllable in the sense that anything could be sitting under our key — a
 * stale version, a half-written value, or hand-edited junk. A malformed save
 * must degrade to the seed rather than crash the app on boot.
 */
function looksLikeState(x: unknown): x is TallyState {
  if (!x || typeof x !== 'object') return false
  const s = x as Partial<TallyState>
  return (
    Array.isArray(s.buckets) &&
    Array.isArray(s.txns) &&
    Array.isArray(s.goals) &&
    Array.isArray(s.subs) &&
    typeof s.checkingCents === 'number' &&
    Array.isArray(s.reviewedOn)
  )
}

export function loadState(now: Date = new Date()): TallyState {
  if (typeof window === 'undefined') return makeSeedState(now)
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return makeSeedState(now)
    const parsed = JSON.parse(raw) as PersistedTallyState
    if (parsed?.version !== TALLY_STATE_VERSION) return makeSeedState(now)
    if (!looksLikeState(parsed.state)) return makeSeedState(now)
    // Always land on a real page, even if an old save held a removed tab.
    const pages = ['today', 'spending', 'goals', 'subs', 'recap', 'accounts']
    if (!pages.includes(parsed.state.page)) parsed.state.page = 'today'
    return parsed.state
  } catch {
    return makeSeedState(now)
  }
}

export function saveState(state: TallyState): void {
  if (typeof window === 'undefined') return
  try {
    const payload: PersistedTallyState = {
      version: TALLY_STATE_VERSION,
      state,
      savedAt: new Date().toISOString(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // Quota exceeded or storage disabled (Safari private mode). Losing
    // persistence is survivable; crashing the app is not.
  }
}

export function clearState(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}
