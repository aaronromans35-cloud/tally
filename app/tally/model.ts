/**
 * Tally — derived-state model.
 *
 * A faithful TypeScript port of the `renderVals()` method from
 * "Tally App v5.dc.html". The handoff is emphatic that nothing on screen may be
 * a hardcoded literal when a related value lives in state, so every figure here
 * is computed. Variable names track the design source for reviewability.
 *
 * The design was a class component with partial `setState`; here `setState` is a
 * React dispatch, so every update is written in updater form and spreads `st`.
 */
import { cash, money, ordinal } from './lib'
import {
  daysInMonthOf,
  iso,
  makeSeedState,
  newBucketId,
  newGoalId,
  newSubId,
  newTxnId,
  todayIso,
} from './storage'
import type {
  Bucket,
  BucketKind,
  DayKind,
  Goal,
  Page,
  Period,
  Sub,
  SubKind,
  TallyState,
  Txn,
} from './types'

// Re-exported so existing importers (`./model`) keep working unchanged.
export type {
  Bucket,
  BucketKind,
  DayKind,
  Goal,
  Page,
  Period,
  Sub,
  SubKind,
  TallyState,
  Txn,
}

/**
 * Seed state. Kept as a named export for compatibility, but note it is now a
 * *function call* result rather than a frozen literal, because the seed is
 * generated relative to today's date. `TallyApp` loads from storage instead.
 */
export const initialState: TallyState = makeSeedState()

type SetState = (updater: (st: TallyState) => TallyState) => void

const uid = newBucketId

/* ─────────────────── money + date primitives ─────────────────── */

/** Cents → dollars, rounded to the cent. The single unit boundary. */
const toDollars = (cents: number): number => Math.round(cents) / 100

const sameMonth = (isoDate: string, now: Date): boolean =>
  isoDate.slice(0, 7) === todayIso(now).slice(0, 7)

/**
 * Month-to-date outflow per bucket, in DOLLARS, derived from real
 * transactions. This replaces the old hand-maintained `state.spent` record —
 * which meant adding a transaction never moved a bucket's pace bar, so the
 * two halves of the app disagreed about what had been spent.
 *
 * Only outflows count. A `save` bucket treats money leaving checking as
 * progress toward its target, which is why both kinds sum the same way and
 * only the *interpretation* differs (see `buckets` below).
 */
function spentDollarsByBucket(s: TallyState, now: Date): Record<string, number> {
  const out: Record<string, number> = {}
  for (const b of s.buckets) out[b.id] = 0
  for (const t of s.txns) {
    if (t.cents >= 0) continue
    if (!t.bucketId || !(t.bucketId in out)) continue
    if (!sameMonth(t.date, now)) continue
    out[t.bucketId] += -t.cents
  }
  for (const k of Object.keys(out)) out[k] = toDollars(out[k])
  return out
}

/** Short weekday/relative label for a transaction row: "Today", "Mon", "Apr 3". */
function dayLabel(isoDate: string, now: Date): string {
  const today = todayIso(now)
  if (isoDate === today) return 'Today'
  const d = new Date(isoDate + 'T00:00:00')
  const diff = Math.round((new Date(today + 'T00:00:00').getTime() - d.getTime()) / 86_400_000)
  if (diff === 1) return 'Yesterday'
  if (diff > 1 && diff < 7) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function deriveModel(
  s: TallyState,
  setState: SetState,
  go: (p: Page) => void,
  now: Date = new Date(),
) {
  /* ── Real calendar. The prototype hardcoded `dayOfMonth = 19`, so every
        pace calculation, forecast and streak was frozen on the 19th. ── */
  const dayOfMonth = now.getDate()
  const daysInMonth = daysInMonthOf(now)
  const monthLeft = Math.max(1, daysInMonth - dayOfMonth)
  const today = todayIso(now)
  const monthLabel = now.toLocaleDateString('en-US', { month: 'long' })

  /* ── Subscriptions, now real records in state ── */
  const liveSubs = s.subs.filter((x) => !x.cancelled)

  /** Days until this sub's next charge lands (0 = today). */
  const daysUntil = (dom: number): number => (dom >= dayOfMonth ? dom - dayOfMonth : dom + daysInMonth - dayOfMonth)

  const upcomingRaw = liveSubs
    .map((x) => {
      const until = daysUntil(x.dayOfMonth)
      const when = new Date(now)
      when.setDate(when.getDate() + until)
      return {
        day: `${when.toLocaleDateString('en-US', { weekday: 'short' })} ${when.getDate()}`,
        d: x.dayOfMonth,
        name: x.name,
        amt: toDollars(x.cents),
        why: x.note,
        tag: x.kind as string,
        // A converting free trial inside a week is the thing worth warning about.
        soon: x.kind === 'trial' && until <= 7,
        income: x.kind === 'income',
        until,
      }
    })
    // Only what's genuinely still ahead this month.
    .filter((c) => c.d >= dayOfMonth)
    .sort((a, b) => a.until - b.until)

  const outTotal = upcomingRaw.filter((c) => !c.income).reduce((a, c) => a + c.amt, 0)

  const subMeta = (x: Sub): string => {
    if (x.kind === 'trial') {
      const until = daysUntil(x.dayOfMonth)
      return until === 0
        ? 'Trial converts today'
        : `Trial converts in ${until} day${until === 1 ? '' : 's'}`
    }
    if (x.kind === 'income') return x.note
    return `Charged the ${ordinal(x.dayOfMonth)} · ${x.note}`
  }

  const subsRaw = s.subs.map((x) => ({
    id: x.id,
    name: x.name,
    meta: subMeta(x),
    price: toDollars(x.cents),
    tag: x.kind === 'trial' ? 'trial' : x.kind === 'income' ? 'income' : '',
    cancelled: x.cancelled,
  }))

  const subs = subsRaw.map((x) => {
    const off = x.cancelled
    const warn = x.tag === 'trial' && !off
    return {
      name: x.name,
      meta: off ? 'Cancelled — Tally will confirm on next sync' : x.meta,
      price: '$' + x.price.toFixed(2),
      yearly: money(x.price * 12),
      tag: off ? 'cancelled' : x.tag,
      tagStyle:
        off || x.tag
          ? "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:" +
            (off ? '#e6e3d8' : '#fcf8e9') +
            ';color:' +
            (off ? '#6b6a60' : '#8a6a12')
          : 'display:none',
      rowStyle:
        'display:flex;align-items:center;padding:24px 30px;border-radius:22px;background:#ffffff;border:1px solid #e0ded4;border-left:4px solid ' +
        (off ? '#c9c6ba' : warn ? '#8a6a12' : '#1c6a48') +
        ';opacity:' +
        (off ? '0.62' : '1'),
      btnLabel: off ? '✓ Cancelled' : 'How to cancel',
      btnStyle:
        "font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border-radius:12px;flex:none;border:1px solid " +
        (off ? '#cac7bc' : '#14140f') +
        ';background:' +
        (off ? 'transparent' : warn ? '#14140f' : 'transparent') +
        ';color:' +
        (off ? '#6b6a60' : warn ? '#f5f4ef' : '#14140f') +
        ';cursor:' +
        (off ? 'default' : 'pointer'),
      act: off
        ? () => {}
        : () =>
            setState((st) => ({
              ...st,
              subs: st.subs.map((y) => (y.id === x.id ? { ...y, cancelled: true } : y)),
            })),
    }
  })
  // Income isn't a subscription cost — excluding it keeps the "monthly total"
  // figure honest.
  const activeSubs = subsRaw.filter((x) => !x.cancelled && x.tag !== 'income')
  const subTotal = activeSubs.reduce((a, x) => a + x.price, 0)
  const trialCount = activeSubs.filter((x) => x.tag === 'trial').length
  const cancelledYearly = subsRaw
    .filter((x) => x.cancelled)
    .reduce((a, x) => a + x.price * 12, 0)

  const spentMap = spentDollarsByBucket(s, now)
  const spentOf = (id: string) => spentMap[id] || 0
  const patchBucket = (id: string, fn: (b: Bucket) => Bucket) =>
    setState((st) => ({ ...st, buckets: st.buckets.map((b) => (b.id === id ? fn(b) : b)) }))

  const buckets = s.buckets.map((b) => {
    const used = spentOf(b.id)
    const limit = b.limit
    const p = Math.min(100, Math.round((used / limit) * 100))
    const expected = (dayOfMonth / daysInMonth) * limit
    const ahead = used <= expected
    const over = used > limit
    const isSave = b.kind === 'save'
    const color = isSave
      ? used >= expected
        ? '#1c6a48'
        : '#8a6a12'
      : over
        ? '#b8422a'
        : ahead
          ? '#1c6a48'
          : '#8a6a12'
    return {
      id: b.id,
      name: b.name,
      kind: b.kind,
      used: money(used),
      limit: money(limit),
      fill: 'width:' + p + '%;height:100%;border-radius:99px;transition:width 220ms ease;background:' + color,
      pace: isSave
        ? used >= expected
          ? 'ahead of target'
          : 'behind target'
        : over
          ? money(used - limit) + ' over'
          : ahead
            ? 'on pace'
            : 'spending fast',
      paceStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.04em;color:" + color,
      stepStyle:
        'width:34px;height:34px;border-radius:10px;border:1px solid #cac7bc;background:transparent;cursor:pointer;font-size:17px;line-height:1;color:#14140f',
      up: () => patchBucket(b.id, (x) => ({ ...x, limit: x.limit + 5 })),
      down: () => patchBucket(b.id, (x) => ({ ...x, limit: Math.max(10, x.limit - 5) })),
      rename: (name: string) => patchBucket(b.id, (x) => ({ ...x, name })),
      toggleKind: () =>
        patchBucket(b.id, (x) => ({ ...x, kind: x.kind === 'spend' ? 'save' : 'spend' })),
      remove: () =>
        setState((st) =>
          st.buckets.length <= 1 ? st : { ...st, buckets: st.buckets.filter((x) => x.id !== b.id) },
        ),
      go: () => go('spending'),
    }
  })
  const addBucket = () =>
    setState((st) => ({
      ...st,
      buckets: [...st.buckets, { id: uid(), name: 'New category', kind: 'spend', limit: 40 }],
    }))

  const offPace = buckets.filter((b) => b.kind === 'spend' && b.pace !== 'on pace')
  const totalLimit = s.buckets.reduce((a, b) => a + b.limit, 0)
  const totalSpent = s.buckets.reduce((a, b) => a + spentOf(b.id), 0)
  const monthPct = totalLimit > 0 ? Math.round((totalSpent / totalLimit) * 100) : 0
  const timePct = Math.round((dayOfMonth / daysInMonth) * 100)
  const worst = s.buckets
    .filter((b) => b.kind === 'spend')
    .map((b) => {
      const used = spentOf(b.id)
      const perDay = used / dayOfMonth
      return {
        name: b.name,
        used,
        limit: b.limit,
        perDay,
        runout: perDay > 0 ? dayOfMonth + (b.limit - used) / perDay : 999,
      }
    })
    .sort((a, b) => a.runout - b.runout)[0] || { name: '—', used: 0, limit: 0, perDay: 0, runout: daysInMonth }
  // Streak rule: a day counts when you *check in*, not when you save money.
  //   1. On pace  — no spending bucket is past its day-of-month pace (automatic), or
  //   2. Task done — you cleared the one thing Tally asked for today, or
  //   3. Freeze    — one per week, auto-applied to a missed day (handled in `days`).
  // "Mark reviewed" is not a free pass: it only appears as the task's action when
  // a bucket is off pace, and doing it *is* acknowledging the overspend.
  const onPaceToday = offPace.length === 0
  // Date-scoped, not a sticky boolean. The old `reviewed: boolean` could never
  // tell "acknowledged today" from "acknowledged once, three weeks ago", so a
  // single tap bought an unbroken streak forever.
  const taskDone = s.reviewedOn.includes(today)
  const dayCounts = onPaceToday || taskDone
  const todayTask = onPaceToday
    ? null
    : {
        text:
          offPace.length === 1
            ? offPace[0].name + ' is ' + offPace[0].pace + '. Acknowledge it, or adjust the limit below.'
            : offPace.length + ' buckets are off pace. Acknowledge them, or adjust the limits below.',
        cta: 'Acknowledge · count today',
        act: () =>
          setState((st) =>
            st.reviewedOn.includes(today)
              ? st
              : { ...st, reviewedOn: [...st.reviewedOn, today] },
          ),
      }
  const upcoming = Math.round(outTotal)
  const safe = Math.max(0, Math.round(((totalLimit - totalSpent - upcoming) / monthLeft) * 7))

  // Transaction categories = the current bucket list. Custom buckets flow through here.
  const catChips = s.buckets.map((b) => ({ id: b.id, name: b.name }))
  const firstBucketId = s.buckets[0]?.id ?? 'food'
  // Keyword guess resolves to a default bucket id; if the user removed that
  // bucket, fall back to whatever's first. Used for uncategorised rows and as
  // the auto-categoriser for imported/linked transactions.
  const has = (id: string) => s.buckets.some((b) => b.id === id)
  // `?? {}` rather than a state-version bump: an older save without this field
  // should keep working instead of being discarded.
  const merchantRules = s.merchantRules ?? {}
  const guessId = (n: string) => {
    // A rule the user taught us always beats the keyword guess.
    const learned = merchantRules[n]
    if (learned && has(learned)) return learned
    const t = n.toLowerCase()
    const want =
      /metro|gas|fuel|transit|bus|uber|lyft|train|fare/.test(t)
        ? 'transport'
        : /transfer|savings|save|deposit/.test(t)
          ? 'saving'
          : /stream|netflix|spotify|music|game|gaming|fitness|cinema|movie|cloud/.test(t)
            ? 'fun'
            : 'food'
    return has(want) ? want : firstBucketId
  }
  const defaultCat = guessId

  /** Newest first, and only inside the window the user's plan allows. */
  const visibleTxns = [...s.txns].sort((a, b) =>
    a.date === b.date ? b.id.localeCompare(a.id) : b.date.localeCompare(a.date),
  )

  const txns = visibleTxns
    .filter((t) => s.filter === 'All' || (t.bucketId ?? defaultCat(t.name)) === s.filter)
    .map((t) => {
      const active = t.bucketId ?? defaultCat(t.name)
      const dollars = toDollars(Math.abs(t.cents))
      return {
        id: t.id,
        day: dayLabel(t.date, now),
        name: t.name,
        amount: (t.cents >= 0 ? '+' : '−') + '$' + dollars.toFixed(2),
        flag: t.flag ?? '',
        remove: () =>
          setState((st) => ({ ...st, txns: st.txns.filter((x) => x.id !== t.id) })),
        flagStyle: t.flag
          ? "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;background:#f0eee5;color:#6b6a60"
          : 'display:none',
        amtStyle:
          "font-family:'IBM Plex Mono',monospace;font-size:15px;text-align:right;min-width:82px;color:" +
          (t.cents >= 0 ? '#1c6a48' : '#14140f'),
        cats: catChips.map((c) => ({
          label: c.name,
          // Recategorise THIS transaction — the old version keyed categories by
          // merchant string, so fixing one coffee rewrote every coffee you had
          // ever bought. The merchant rule is still learned, but it only
          // applies to transactions that arrive from here on.
          pick: () =>
            setState((st) => ({
              ...st,
              txns: st.txns.map((x) => (x.id === t.id ? { ...x, bucketId: c.id } : x)),
              merchantRules: { ...(st.merchantRules ?? {}), [t.name]: c.id },
            })),
          style:
            "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.06em;text-transform:uppercase;padding:5px 10px;border-radius:999px;cursor:pointer;border:1px solid " +
            (active === c.id ? '#1c6a48' : '#e0ded4') +
            ';background:' +
            (active === c.id ? '#1c6a48' : 'transparent') +
            ';color:' +
            (active === c.id ? '#f7fbf6' : '#6b6a60'),
        })),
      }
    })

  /* ── Goals ───────────────────────────────────────────────────────────────
     Rewritten against real records. The prototype faked this with a
     three-state machine ('open' → 'pending' → 'done') over hardcoded
     "behind by $12" numbers, and the button said "Open my bank" — it moved
     nothing. Now the figure shown is the weekly contribution that actually
     closes the gap by the deadline, and pressing the button genuinely moves
     money: it increases the goal and decreases checking, and it persists.
  ──────────────────────────────────────────────────────────────────────── */
  const weeksUntil = (dueDate: string | null): number | null => {
    if (!dueDate) return null
    const due = new Date(dueDate + 'T00:00:00').getTime()
    const ms = due - new Date(today + 'T00:00:00').getTime()
    if (ms <= 0) return 0
    return Math.max(1, Math.ceil(ms / (7 * 86_400_000)))
  }

  const goalCalc = s.goals.map((g) => {
    const remainingCents = Math.max(0, g.targetCents - g.savedCents)
    const weeks = weeksUntil(g.dueDate)
    const perWeekCents =
      remainingCents === 0 || weeks === null
        ? 0
        : weeks === 0
          ? remainingCents
          : Math.ceil(remainingCents / weeks / 100) * 100
    return { g, remainingCents, weeks, perWeekCents, done: remainingCents === 0 }
  })

  const dueLabel = (g: Goal, weeks: number | null): string => {
    if (!g.dueDate) return 'no deadline'
    if (weeks === 0) return 'due now'
    if (weeks !== null && weeks <= 8) return `${weeks} week${weeks === 1 ? '' : 's'}`
    return new Date(g.dueDate + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    })
  }

  const goals = goalCalc.map(({ g, remainingCents, weeks, perWeekCents, done }) => {
    const saved = toDollars(g.savedCents)
    const target = toDollars(g.targetCents)
    const p = Math.min(100, Math.round((g.savedCents / Math.max(1, g.targetCents)) * 100))
    const needDollars = toDollars(perWeekCents)
    const noPace = !g.dueDate
    return {
      id: g.id,
      name: g.name,
      saved: money(saved),
      target: money(target),
      due: dueLabel(g, weeks),
      fill:
        'width:' + p + '%;height:100%;border-radius:99px;background:' + (done || noPace ? '#1c6a48' : '#8a6a12'),
      pace: done
        ? 'target reached'
        : noPace
          ? 'no pace to keep'
          : money(needDollars) + '/wk to finish',
      paceStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:" +
        (done ? '#1c6a48' : noPace ? '#6b6a60' : '#8a6a12'),
      suggest: done
        ? money(target) + ' saved'
        : noPace
          ? money(remainingCents / 100) + ' to go'
          : 'Move ' + money(needDollars) + ' this week',
      suggestStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6a60;text-align:center",
      btnLabel: done ? '✓ Reached' : 'Add ' + money(needDollars || 5),
      btnStyle:
        "font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border-radius:12px;border:1px solid " +
        (done ? '#cac7bc' : '#14140f') +
        ';background:' +
        (done ? 'transparent' : '#14140f') +
        ';color:' +
        (done ? '#6b6a60' : '#f5f4ef') +
        ';cursor:' +
        (done ? 'default' : 'pointer'),
      /** Actually moves money: goal up, checking down, recorded as a transfer. */
      act: done
        ? () => {}
        : () => contributeToGoal(g.id, perWeekCents || 500),
      remove: () => setState((st) => ({ ...st, goals: st.goals.filter((x) => x.id !== g.id) })),
    }
  })

  /** Move cents into a goal, out of checking, and log it as a transaction. */
  function contributeToGoal(goalId: string, cents: number) {
    const amount = Math.max(0, Math.round(cents))
    if (amount === 0) return
    setState((st) => {
      const goal = st.goals.find((x) => x.id === goalId)
      if (!goal) return st
      const room = Math.max(0, goal.targetCents - goal.savedCents)
      const move = Math.min(amount, room)
      if (move === 0) return st
      const saveBucket = st.buckets.find((b) => b.kind === 'save')
      return {
        ...st,
        goals: st.goals.map((x) =>
          x.id === goalId ? { ...x, savedCents: x.savedCents + move } : x,
        ),
        checkingCents: st.checkingCents - move,
        txns: [
          {
            id: newTxnId(),
            name: `Transfer → ${goal.name}`,
            cents: -move,
            date: today,
            bucketId: saveBucket ? saveBucket.id : null,
            source: 'manual' as const,
          },
          ...st.txns,
        ],
      }
    })
  }

  const goalsSavedTotal = toDollars(s.goals.reduce((a, g) => a + g.savedCents, 0))

  /**
   * Money actually moved into savings today, read off the ledger. Previously
   * this was a side effect of the fake goal state machine; now a real
   * transfer is a real transaction, so this figure is just a query.
   */
  const saveBucketIds = new Set(s.buckets.filter((b) => b.kind === 'save').map((b) => b.id))
  const movedTotal = toDollars(
    s.txns
      .filter((t) => t.date === today && t.cents < 0 && t.bucketId && saveBucketIds.has(t.bucketId))
      .reduce((a, t) => a + -t.cents, 0),
  )
  const cancelledCount = s.subs.filter((x) => x.cancelled).length
  const behindGoal = goalCalc.find((x) => !x.done && x.perWeekCents > 0)
    ? { name: goalCalc.find((x) => !x.done && x.perWeekCents > 0)!.g.name,
        need: toDollars(goalCalc.find((x) => !x.done && x.perWeekCents > 0)!.perWeekCents) }
    : undefined

  /* ── Cash-flow forecast: walk the checking balance forward through the month's
        predicted charges and income, find the low point. ── */
  const checkingStart = toDollars(s.checkingCents)
  const evDates = Array.from(new Set([dayOfMonth, ...upcomingRaw.map((c) => c.d)])).sort((a, b) => a - b)
  let running = checkingStart
  const fPoints = evDates.map((d) => {
    upcomingRaw.filter((c) => c.d === d).forEach((c) => (running += c.income ? c.amt : -c.amt))
    const hits = upcomingRaw.filter((c) => c.d === d)
    return { d, bal: Math.round(running), pay: hits.some((c) => c.income) }
  })
  const fLow = fPoints.reduce((lo, p) => (p.bal < lo.bal ? p : lo), fPoints[0])
  const fMax = Math.max(checkingStart, ...fPoints.map((p) => p.bal)) || 1
  const fBuffer = 25
  const fHeadroom = Math.max(0, Math.round(fLow.bal - fBuffer))
  const nextOut = upcomingRaw.filter((c) => !c.income)[0]

  const goalsNoteText = behindGoal
    ? `${behindGoal.name} needs ${money(behindGoal.need)} a week to land on time.`
    : s.goals.length === 0
      ? 'No goals yet. Add one and Tally will work out the weekly number.'
      : 'Every goal is on target. Nothing to move this week.'

  const period = s.period || 'Week'
  const periodData: Record<
    Period,
    {
      title: string
      total: number
      delta: string
      down: boolean
      peak: number
      bars: { label: string; amt: number }[]
      stats: { label: string; value: string }[]
      insight: string
    }
  > = {
    Week: {
      title: 'This week, day by day',
      total: 86,
      delta: '$18 less than last week',
      down: true,
      peak: 21,
      bars: [
        { label: 'Mon', amt: 8 },
        { label: 'Tue', amt: 14 },
        { label: 'Wed', amt: 21 },
        { label: 'Thu', amt: 6 },
        { label: 'Fri', amt: 12 },
        { label: 'Sat', amt: 19 },
        { label: 'Sun', amt: 6 },
      ],
      stats: [
        { label: 'Daily average', value: '$12.29' },
        { label: 'Biggest day', value: 'Wed · $21' },
        { label: 'No-spend days', value: '0' },
      ],
      insight:
        'Wednesday and Saturday carry most of the week. Both are social days — that is where the Fun bucket goes.',
    },
    Month: {
      title: monthLabel + ', week by week',
      total: 405,
      delta: '$34 less than July at this point',
      down: true,
      peak: 118,
      bars: [
        { label: 'Aug 3', amt: 118 },
        { label: 'Aug 10', amt: 97 },
        { label: 'Aug 17', amt: 104 },
        { label: 'Aug 24', amt: 86 },
      ],
      stats: [
        { label: 'Weekly average', value: '$101' },
        { label: 'Trend', value: 'Down 4 weeks' },
        { label: 'Left to spend', value: money(totalLimit - totalSpent) },
      ],
      insight:
        'Four straight weeks of lower spending. The first week of the month is always your heaviest — that is when subscriptions land.',
    },
    '3 months': {
      title: 'Last three months',
      total: 1284,
      delta: '$62 more than the prior three',
      down: false,
      peak: 468,
      bars: [
        { label: 'Jun', amt: 468 },
        { label: 'Jul', amt: 411 },
        { label: 'Aug', amt: 405 },
      ],
      stats: [
        { label: 'Monthly average', value: '$428' },
        { label: 'Best month', value: 'Aug · $405' },
        { label: 'Subscriptions', value: money(subTotal * 3) },
      ],
      insight:
        'June was your outlier — summer travel. Since then you have held steady around $410 a month.',
    },
    Year: {
      title: '2026 so far',
      total: 3210,
      delta: 'On pace for $4,815 this year',
      down: false,
      peak: 468,
      bars: [
        { label: 'Mar', amt: 392 },
        { label: 'Apr', amt: 417 },
        { label: 'May', amt: 356 },
        { label: 'Jun', amt: 468 },
        { label: 'Jul', amt: 411 },
        { label: 'Aug', amt: 405 },
      ],
      stats: [
        { label: 'Monthly average', value: '$408' },
        { label: 'Lowest month', value: 'May · $356' },
        { label: 'Recurring share', value: '11%' },
      ],
      insight:
        'Your spending is remarkably flat month to month. That predictability is what makes the safe-to-spend number reliable.',
    },
  }
  const pd = periodData[period]

  /* ── Streak, replayed from the real ledger ───────────────────────────────
     Was a hardcoded 14-element array, so the streak was a decoration that
     never responded to anything the user did. Now each day is recomputed:

       1. on pace — no spending bucket was past its day-of-month pace, or
       2. task    — the user acknowledged an off-pace bucket that day, or
       3. freeze  — one per week, applied to a day that would have broken.

     Deliberately NOT "saved money today": a day you spent nothing because
     you were asleep shouldn't read as financial progress, and the copy
     across the app and site says so explicitly.
  ──────────────────────────────────────────────────────────────────────── */
  function dayVerdict(dateIso: string): { counted: boolean; kind: DayKind | null } {
    if (s.reviewedOn.includes(dateIso)) return { counted: true, kind: 'task' }
    if (s.freezesUsedOn.includes(dateIso)) return { counted: true, kind: 'freeze' }

    const d = new Date(dateIso + 'T00:00:00')
    const dom = d.getDate()
    const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    const month = dateIso.slice(0, 7)

    const used: Record<string, number> = {}
    for (const b of s.buckets) used[b.id] = 0
    for (const t of s.txns) {
      if (t.cents >= 0) continue
      if (!t.bucketId || !(t.bucketId in used)) continue
      if (t.date.slice(0, 7) !== month) continue
      if (t.date > dateIso) continue
      used[t.bucketId] += -t.cents
    }

    const spendBuckets = s.buckets.filter((b) => b.kind === 'spend')
    if (spendBuckets.length === 0) return { counted: false, kind: null }
    const onPace = spendBuckets.every(
      (b) => toDollars(used[b.id]) <= (dom / dim) * b.limit + 0.001,
    )
    return { counted: onPace, kind: onPace ? 'pace' : null }
  }

  const STREAK_WINDOW = 14
  const dayRows = Array.from({ length: STREAK_WINDOW }, (_, i) => {
    const d = new Date(now)
    d.setDate(d.getDate() - (STREAK_WINDOW - 1 - i))
    const di = iso(d)
    const v = dayVerdict(di)
    return { date: di, on: v.counted ? 1 : 0, kind: v.kind ?? ('pace' as DayKind) }
  })
  const dayFlags = dayRows.map((r) => r.on)
  const dayKinds = dayRows.map((r) => r.kind)

  let streak = 0
  for (let i = dayFlags.length - 1; i >= 0; i--) {
    if (dayFlags[i]) streak++
    else break
  }

  /**
   * Lifetime counted days, for the level ladder (8/30/90). Replays from the
   * earliest record we hold rather than the 14-day window — with a window the
   * total could never exceed 14, so nobody could ever reach Builder.
   */
  const earliest = [...s.txns.map((t) => t.date), ...s.reviewedOn].sort()[0] ?? today
  const spanDays = Math.min(
    400,
    Math.max(
      1,
      Math.round(
        (new Date(today + 'T00:00:00').getTime() - new Date(earliest + 'T00:00:00').getTime()) /
          86_400_000,
      ) + 1,
    ),
  )
  let total = 0
  for (let i = 0; i < spanDays; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    if (dayVerdict(iso(d)).counted) total++
  }
  const level = total >= 90 ? 'Compounder' : total >= 30 ? 'Builder' : total >= 8 ? 'Starter' : 'Rookie'
  const nextTier =
    total >= 90
      ? null
      : total >= 30
        ? { name: 'Compounder', at: 90 }
        : total >= 8
          ? { name: 'Builder', at: 30 }
          : { name: 'Starter', at: 8 }
  const tierPct = nextTier ? Math.min(100, Math.round((total / nextTier.at) * 100)) : 100

  const kindColor: Record<DayKind, string> = { pace: '#1c6a48', task: '#cdf06a', freeze: '#4a4941' }
  const kindTip: Record<DayKind, string> = {
    pace: 'Stayed under pace',
    task: 'Cleared the day’s task',
    freeze: 'Freeze used',
  }

  const tabDefs: { key: Page; label: string; badge: string }[] = [
    { key: 'today', label: 'Today', badge: offPace.length ? String(offPace.length) : '' },
    { key: 'spending', label: 'Spending', badge: '' },
    { key: 'goals', label: 'Goals', badge: '' },
    { key: 'subs', label: 'Subscriptions', badge: trialCount ? String(trialCount) : '' },
    { key: 'recap', label: 'Recap', badge: '' },
    { key: 'accounts', label: 'Accounts', badge: '' },
  ]

  return {
    /** "Saturday, October 11" — both shells had this hardcoded to Aug 19. */
    todayLabel: now.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }),
    /** "October" — used in section headings that said "August". */
    monthName: now.toLocaleDateString('en-US', { month: 'long' }),

    tabs: tabDefs.map((t) => ({
      label: t.label,
      badge: t.badge,
      go: () => go(t.key),
      style:
        "display:flex;align-items:center;gap:8px;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:" +
        (s.page === t.key ? '600' : '500') +
        ';padding:9px 16px;border:none;border-radius:999px;cursor:pointer;background:' +
        (s.page === t.key ? '#14140f' : 'transparent') +
        ';color:' +
        (s.page === t.key ? '#f5f4ef' : '#4a4941'),
      badgeStyle: t.badge
        ? "font-family:'IBM Plex Mono',monospace;font-size:10px;min-width:18px;height:18px;padding:0 5px;border-radius:99px;display:flex;align-items:center;justify-content:center;background:#cdf06a;color:#14140f"
        : 'display:none',
    })),
    isToday: s.page === 'today',
    isSpending: s.page === 'spending',
    isGoals: s.page === 'goals',
    isSubs: s.page === 'subs',
    isRecap: s.page === 'recap',
    isAccounts: s.page === 'accounts',

    goSpending: () => go('spending'),
    addBucket,

    subs,
    subStats: [
      { label: 'Active', value: String(activeSubs.length) },
      { label: 'Per month', value: '$' + subTotal.toFixed(2) },
      { label: 'Per year', value: money(subTotal * 12) },
    ],

    recapWin:
      cancelledYearly > 0
        ? 'You cancelled ' +
          (cancelledCount === 1 ? 'a subscription' : cancelledCount + ' subscriptions') +
          ' — that is ' +
          money(cancelledYearly) +
          ' a year you kept.'
        : 'You spent $18 less than last week, and Fun came in $11 under.',
    recapHeadline:
      cancelledYearly > 0
        ? 'You cut ' + money(cancelledYearly) + ' a year this week.'
        : streak >= 7
          ? '$86 spent, ' + streak + '-day streak — your quietest week this month.'
          : '$86 this week. $18 under last week, Fun $11 below.',
    recapSubhead:
      'Week of Aug 24 · ' + streak + '-day streak · ' + money(totalLimit - totalSpent) + ' left in buckets',
    recapShareText:
      'My Tally week: $86 spent, $18 under last week, ' + streak + '-day streak. Buckets: ' + money(totalLimit - totalSpent) + ' left.',
    watchKicker: offPace.length === 0 ? 'All clear' : 'Watch next week',
    watchKickerStyle:
      "font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:10px;color:" +
      (offPace.length === 0 ? '#1c6a48' : '#8a6a12'),
    watchCardStyle:
      'background:#ffffff;border:1px solid #e0ded4;border-left:4px solid ' +
      (offPace.length === 0 ? '#1c6a48' : '#8a6a12') +
      ';border-radius:26px;padding:28px',
    watchText:
      offPace.length === 0
        ? worst.name + ' is your tightest bucket — at this pace it lasts until the ' + ordinal(Math.min(31, Math.round(worst.runout))) + '.'
        : offPace[0].name + ' is spending fast — at this pace it runs out on the ' + ordinal(Math.min(31, Math.round(worst.runout))) + '.',
    watchCta: offPace.length === 0 ? 'Review buckets' : 'Adjust the limit',

    merchants: [
      { name: 'Campus Deli', amt: 26, count: '3 visits' },
      { name: 'Blue Line Coffee', amt: 21, count: '5 visits' },
      { name: 'Shell', amt: 21, count: '1 visit' },
      { name: 'Streaming service', amt: 12, count: '1 charge' },
      { name: 'Metro', amt: 6, count: '2 rides' },
    ].map((m) => ({
      name: m.name,
      amount: money(m.amt),
      count: m.count,
      fill: 'width:' + Math.round((m.amt / 26) * 100) + '%;height:100%;border-radius:99px;background:#1c6a48',
    })),

    dayPattern: [
      { label: 'M', amt: 8 },
      { label: 'T', amt: 14 },
      { label: 'W', amt: 21 },
      { label: 'T', amt: 6 },
      { label: 'F', amt: 12 },
      { label: 'S', amt: 19 },
      { label: 'S', amt: 6 },
    ].map((d) => {
      const peak = d.amt === 21
      return {
        label: d.label,
        value: peak ? money(d.amt) : '',
        valStyle:
          "font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:center;height:16px;flex:none;color:#8a6a12",
        bar:
          'width:100%;max-width:30px;margin:0 auto;flex:none;border-radius:6px;height:' +
          Math.max(8, Math.round((d.amt / 21) * 96)) +
          'px;background:' +
          (peak ? '#8a6a12' : '#1c6a48'),
        labelStyle:
          "font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:center;flex:none;padding-top:8px;color:#6b6a60",
      }
    }),
    dayInsight:
      'Wednesday is consistently your most expensive day — $21 this week, $19 last week. Worth knowing before you make plans.',

    weekStats: [
      { label: 'Days logged', value: '5 of 7', note: 'One freeze used Thursday', good: true },
      {
        label: 'Saved this week',
        value: money(movedTotal || 12),
        note: movedTotal > 0 ? 'Transfer confirmed' : 'One transfer pending',
        good: movedTotal > 0,
      },
      {
        label: 'Left in buckets',
        value: money(totalLimit - totalSpent),
        note: monthLeft + ' days to stretch it',
        good: true,
      },
    ].map((w) => ({
      label: w.label,
      value: w.value,
      note: w.note,
      noteStyle: 'font-size:14px;line-height:1.5;color:' + (w.good ? '#1c6a48' : '#8a6a12'),
    })),

    fourWeeks: [
      { label: 'Aug 3', amt: 118 },
      { label: 'Aug 10', amt: 97 },
      { label: 'Aug 17', amt: 104 },
      { label: 'This week', amt: 86 },
    ].map((w, i) => {
      const now = i === 3
      return {
        label: w.label,
        value: money(w.amt),
        valStyle:
          "font-family:'IBM Plex Mono',monospace;font-size:12px;height:18px;flex:none;color:" +
          (now ? '#1c6a48' : '#6b6a60'),
        bar:
          'width:100%;max-width:40px;border-radius:8px;height:' +
          Math.round((w.amt / 118) * 70) +
          'px;background:' +
          (now ? '#1c6a48' : '#c9c6ba'),
        labelStyle:
          "font-family:'IBM Plex Mono',monospace;font-size:11px;flex:none;padding-top:10px;color:" +
          (now ? '#14140f' : '#6b6a60'),
      }
    }),

    recapBars: (() => {
      // Derived per bucket from month-to-date spend: a plausible "this week" is a
      // slice of it, "last week" a slightly larger slice.
      const rows = s.buckets.map((b) => {
        const wk = Math.round(spentOf(b.id) * 0.45)
        const prev = Math.max(wk + 3, Math.round(spentOf(b.id) * 0.55))
        return { name: b.name, wk, prev }
      })
      const peak = Math.max(1, ...rows.map((r) => r.prev))
      return rows.map((r) => {
        const diff = r.wk - r.prev
        return {
          name: r.name,
          delta: (diff > 0 ? '+' : '−') + money(Math.abs(diff)) + ' vs last week',
          fill:
            'width:' +
            Math.round((r.wk / peak) * 100) +
            '%;height:100%;border-radius:99px;background:' +
            (diff > 0 ? '#8a6a12' : '#cdf06a'),
        }
      })
    })(),

    accounts: [
      {
        name: 'Chase College Checking',
        meta:
          movedTotal > 0
            ? '•••• 4417 · read-only · ' + cash(movedTotal) + ' moved out today'
            : '•••• 4417 · read-only · synced 4m ago',
        balance: cash(checkingStart),
        live: true,
      },
      { name: 'Chase Savings', meta: '•••• 9032 · read-only · synced 4m ago', balance: cash(goalsSavedTotal), live: true },
    ].map((a) => ({
      name: a.name,
      meta: a.meta,
      balance: a.balance,
      dot: 'width:10px;height:10px;border-radius:99px;flex:none;background:#1c6a48',
      btnLabel: 'Disconnect',
      btnStyle:
        "font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border-radius:12px;flex:none;border:1px solid #cac7bc;background:transparent;color:#4a4941;cursor:pointer",
      act: () => {},
    })),
    canDo: [
      'Read transactions and balances',
      'Categorize spending into buckets',
      'Spot recurring charges and trials',
      'Tell you the transfer to make',
    ],
    cannotDo: [
      'Move, send, or withdraw money',
      'See or store your bank password',
      'Open accounts or issue a card',
      'Sell your transaction data',
    ],

    dashSub: onPaceToday
      ? 'Every bucket is on pace. Today already counts.'
      : offPace.length +
        (offPace.length === 1 ? ' bucket is' : ' buckets are') +
        ' spending fast — worth a look.',
    goSubs: () => go('subs'),
    goGoals: () => go('goals'),
    goRecap: () => go('recap'),

    freezeNote: 'freeze available this week',
    nextLevel: nextTier ? nextTier.name : 'Top level',
    tierFill:
      'width:' + tierPct + '%;height:100%;border-radius:99px;background:#cdf06a;transition:width 220ms ease',
    tierNote: nextTier
      ? nextTier.at - total + ' days to ' + nextTier.name + '.'
      : 'You have hit the top level. The habit is yours.',
    levelPerk:
      level === 'Rookie'
        ? 'Getting started. Every day you log builds the base.'
        : level === 'Starter'
          ? 'The habit is forming — missing a day actually stings now.'
          : level === 'Builder'
            ? '30+ days in. This is no longer effort, it is just what you do.'
            : '90+ days. You have built something most people never do.',
    todayTask,
    streakCheckin: onPaceToday
      ? "You're clear — every bucket on pace. Today already counts."
      : taskDone
        ? 'Checked in. Today counts.'
        : 'One thing to check in on today.',
    todayChip: dayCounts
      ? onPaceToday
        ? '✓ Today counts — on pace'
        : '✓ Today counts — checked in'
      : (todayTask ? todayTask.cta : 'Check in'),
    todayChipStyle:
      "width:100%;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;padding:13px 14px;border-radius:999px;text-align:center;border:1px solid #cdf06a;background:" +
      (dayCounts ? '#cdf06a' : 'transparent') +
      ';color:' +
      (dayCounts ? '#14140f' : '#cdf06a') +
      ';cursor:' +
      (dayCounts ? 'default' : 'pointer'),
    markReviewed: dayCounts ? () => {} : todayTask ? todayTask.act : () => {},
    legend: [
      { label: 'Stayed under pace', swatch: 'width:11px;height:11px;border-radius:4px;background:#1c6a48' },
      { label: 'Cleared a task', swatch: 'width:11px;height:11px;border-radius:4px;background:#cdf06a' },
      { label: 'Freeze used', swatch: 'width:11px;height:11px;border-radius:4px;background:#4a4941' },
    ],

    dayOfMonth: dayOfMonth,
    monthSpent: money(totalSpent),
    monthBudget: money(totalLimit),
    monthFill:
      'width:' +
      monthPct +
      '%;height:100%;border-radius:99px;transition:width 220ms ease;background:' +
      (monthPct > timePct + 8 ? '#8a6a12' : '#1c6a48'),
    monthPctLabel: monthPct + '%',
    monthTimeLabel: timePct + '%',
    monthVerdict:
      monthPct > timePct + 8
        ? 'You are spending faster than the month is passing. ' +
          money(totalLimit - totalSpent) +
          ' has to cover ' +
          monthLeft +
          ' days.'
        : 'You are ' +
          (timePct - monthPct) +
          ' points ahead of the calendar. ' +
          money(totalLimit - totalSpent) +
          ' left for ' +
          monthLeft +
          ' days.',
    monthVerdictStyle:
      'font-size:15px;line-height:1.55;padding:14px 16px;border-radius:14px;background:' +
      (monthPct > timePct + 8 ? '#fcf8e9' : '#f2f8ee') +
      ';color:' +
      (monthPct > timePct + 8 ? '#8a6a12' : '#1c6a48'),

    topMerchants: [
      { name: 'Campus Deli', amt: 26, count: '3 visits' },
      { name: 'Blue Line Coffee', amt: 21, count: '5 visits' },
      { name: 'Shell', amt: 21, count: '1 visit' },
      { name: 'Metro', amt: 6, count: '2 rides' },
    ].map((m) => ({
      name: m.name,
      amount: money(m.amt),
      count: m.count,
      fill: 'width:' + Math.round((m.amt / 26) * 100) + '%;height:100%;border-radius:99px;background:#1c6a48',
    })),

    // Contextual insights, generated from real conditions. Today shows the top two.
    insights: (() => {
      const tone = (t: 'lime' | 'amber' | 'green') =>
        t === 'lime'
          ? { style: 'background:#cdf06a', kicker: '#3d5410', body: '#2c3b0d', btn: '#14140f' }
          : t === 'amber'
            ? { style: 'background:#fcf8e9;border:1px solid #d9c477', kicker: '#8a6a12', body: '#8a6a12', btn: '#14140f' }
            : { style: 'background:#f2f8ee;border:1px solid #cfe6c4', kicker: '#1c6a48', body: '#1c6a48', btn: '#14140f' }
      type Ins = { t: 'lime' | 'amber' | 'green'; title: string; body: string; cta?: string; page?: Page }
      const trialSoon = upcomingRaw.filter((c) => c.tag === 'trial')[0]
      const savingB = s.buckets.find((b) => b.kind === 'save')
      const savingUsed = savingB ? spentOf(savingB.id) : 0
      const savingExp = savingB ? (dayOfMonth / daysInMonth) * savingB.limit : 0
      const pool: (Ins | null)[] = [
        {
          t: 'lime',
          title: 'Five coffees a week is ' + money(21 * 52) + ' a year.',
          body: 'Blue Line Coffee is your most frequent merchant — 5 visits this week, $21. Not saying stop. Just so you have seen the number.',
          cta: 'See where it goes',
          page: 'spending',
        },
        trialSoon
          ? {
              t: 'amber',
              title: trialSoon.name + ' charges ' + money(Math.round(trialSoon.amt)) + ' on ' + trialSoon.day + '.',
              body: 'A free trial converts then. If you are not using it, cancel now — you keep access until the date.',
              cta: 'Review subscriptions',
              page: 'subs',
            }
          : null,
        offPace.length > 0
          ? {
              t: 'amber',
              title:
                offPace[0].name +
                ' runs out on the ' +
                ordinal(Math.min(daysInMonth, Math.round(worst.runout))) +
                ' at this pace.',
              body:
                'That is ' +
                Math.max(0, daysInMonth - Math.round(worst.runout)) +
                ' days short of month-end. Ease off, or move the limit in Spending.',
              cta: 'Adjust it',
              page: 'spending',
            }
          : null,
        savingB && savingUsed >= savingExp
          ? {
              t: 'green',
              title: 'You are ahead on Saving this month.',
              body:
                money(savingUsed) +
                ' set aside so far against a ' +
                money(savingB.limit) +
                ' target. Hold the pace and you clear it early.',
            }
          : null,
        {
          t: monthPct <= timePct ? 'green' : 'amber',
          title:
            monthPct <= timePct
              ? 'You are ' + Math.max(0, timePct - monthPct) + ' points under the calendar.'
              : 'Spending is ' + (monthPct - timePct) + ' points ahead of the calendar.',
          body: money(totalLimit - totalSpent) + ' left in buckets to cover ' + monthLeft + ' more days.',
        },
      ]
      return pool
        .filter((x): x is Ins => x !== null)
        .map((ins) => {
          const cl = tone(ins.t)
          return {
            title: ins.title,
            body: ins.body,
            cta: ins.cta || '',
            go: ins.page ? () => go(ins.page as Page) : () => {},
            wrapStyle: cl.style + ';border-radius:26px;padding:26px 30px',
            kickerColor: cl.kicker,
            bodyColor: cl.body,
            btnStyle:
              "font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:none;border-radius:12px;background:" +
              cl.btn +
              ';color:#f5f4ef;cursor:pointer;flex:none',
          }
        })
    })(),

    forecastLow: cash(fLow.bal),
    forecastLowLabel: 'Aug ' + fLow.d,
    forecastNote:
      fHeadroom > 0
        ? 'You can spend about ' +
          money(fHeadroom) +
          ' today and still stay above a ' +
          money(fBuffer) +
          ' cushion until payday.'
        : 'It gets tight before month-end — the Aug ' +
          fLow.d +
          ' dip lands near zero. Next charge: ' +
          (nextOut ? nextOut.name + ' ' + money(Math.round(nextOut.amt)) : 'none') +
          '.',
    forecastBars: fPoints.map((p) => ({
      label: String(p.d),
      barStyle:
        'flex:1;min-width:0;border-radius:4px;height:' +
        Math.max(6, Math.round((Math.max(0, p.bal) / fMax) * 56)) +
        'px;background:' +
        (p === fLow ? '#8a6a12' : p.pay ? '#1c6a48' : '#4f9a72'),
      value: p === fLow ? cash(p.bal) : '',
    })),

    subsMonthly: '$' + subTotal.toFixed(2),
    trialNote:
      trialCount > 0
        ? trialCount + ' trial' + (trialCount > 1 ? 's' : '') + ' converting this week'
        : 'No trials converting',
    trialStyle: 'font-size:14px;line-height:1.5;color:' + (trialCount > 0 ? '#8a6a12' : '#4a4941'),
    goalsSaved: money(goalsSavedTotal),
    goalsNote: goalsNoteText,

    recent: visibleTxns.slice(0, 5).map((t) => ({
      day: dayLabel(t.date, now),
      name: t.name,
      amount: (t.cents >= 0 ? '+' : '−') + '$' + toDollars(Math.abs(t.cents)).toFixed(2),
      cat:
        s.buckets.find((b) => b.id === (t.bucketId ?? defaultCat(t.name)))?.name ??
        'Uncategorised',
      catStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:5px 10px;border-radius:999px;background:#f0eee5;color:#6b6a60",
      amtStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:15px;text-align:right;min-width:82px;color:" +
        (t.cents >= 0 ? '#1c6a48' : '#14140f'),
    })),

    safeToSpend: money(safe),
    safeNote: monthLeft + ' days left in the month',
    safeRows: [
      { label: 'Left in buckets', value: money(totalLimit - totalSpent) },
      { label: 'Bills still due', value: '−' + money(upcoming) },
      { label: 'Per week from here', value: money(safe) },
    ],

    periods: (['Week', 'Month', '3 months', 'Year'] as Period[]).map((p) => ({
      label: p,
      pick: () => setState((st) => ({ ...st, period: p })),
      style:
        "font-family:'IBM Plex Sans',sans-serif;font-size:13px;font-weight:500;padding:9px 15px;border-radius:999px;cursor:pointer;border:1px solid " +
        (period === p ? '#14140f' : '#dcdad1') +
        ';background:' +
        (period === p ? '#14140f' : 'transparent') +
        ';color:' +
        (period === p ? '#f5f4ef' : '#4a4941'),
    })),
    periodTitle: pd.title,
    periodTotal: money(pd.total),
    periodDelta: pd.delta,
    periodDeltaStyle: 'font-size:15px;color:' + (pd.down ? '#1c6a48' : '#8a6a12'),
    periodStats: pd.stats,
    periodInsight: pd.insight,
    periodBars: pd.bars.map((b) => ({
      label: b.label,
      value: b.amt === pd.peak ? money(b.amt) : '',
      valStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:center;height:16px;flex:none;color:#8a6a12",
      bar:
        'width:100%;max-width:34px;flex:none;border-radius:6px;height:' +
        Math.max(8, Math.round((b.amt / pd.peak) * 114)) +
        'px;background:' +
        (b.amt === pd.peak ? '#8a6a12' : '#1c6a48'),
      labelStyle:
        "font-family:'IBM Plex Mono',monospace;font-size:11px;text-align:center;flex:none;padding-top:9px;color:#6b6a60",
    })),

    buckets,
    filters: [{ id: 'All', name: 'All' }, ...catChips].map((f) => ({
      label: f.name,
      pick: () => setState((st) => ({ ...st, filter: f.id })),
      style:
        "font-family:'IBM Plex Sans',sans-serif;font-size:13px;font-weight:500;padding:8px 14px;border-radius:999px;cursor:pointer;border:1px solid " +
        (s.filter === f.id ? '#14140f' : '#dcdad1') +
        ';background:' +
        (s.filter === f.id ? '#14140f' : 'transparent') +
        ';color:' +
        (s.filter === f.id ? '#f5f4ef' : '#4a4941'),
    })),
    txns,
    goals,

    streak,
    level,
    streakState: dayCounts ? 'Today counts' : 'Not yet today',
    streakRule:
      "A day counts when you check in — stay on pace, or clear the one thing Tally asks. Not 'save money every day': one freeze a week means a bad day is not a reset.",
    // Weekday initials come from the real dates now, so the ladder lines up
    // with the actual calendar instead of a fixed M-T-W-T-F-S-S string.
    days: dayRows.map((r) => ({
      label: new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'narrow' }),
      miniStyle:
        'height:24px;border-radius:6px;background:' + (r.on ? kindColor[r.kind] : '#eae8de'),
      bigStyle:
        'height:52px;border-radius:6px;background:' + (r.on ? kindColor[r.kind] : '#2c2c24'),
      tip: r.on ? kindTip[r.kind] : 'Missed',
    })),
  }
}

export type TallyModel = ReturnType<typeof deriveModel>
