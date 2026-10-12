import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { clientIp, coachLimit, limitHeaders, rateLimit } from '@/lib/tally/limiter'
import { entitlementsFor, type Tier } from '@/lib/tally/tiers'

export const runtime = 'nodejs'

/**
 * Tally's budgeting coach.
 *
 * Cost control: this is the only route in the app that spends money per call,
 * so it is gated three ways — a per-minute burst limit, a per-day demo cap,
 * and a per-plan monthly quota. The limiter fails CLOSED here deliberately.
 *
 * Model choice: Haiku. A budgeting coach answering "why did Food run out"
 * does not need a frontier model, and the cheapest capable model is the right
 * default when someone else is paying the bill.
 */
const MODEL = 'claude-haiku-4-5-20251001'

/** Demo visitors get a real taste without being an open relay to a paid API. */
const DEMO_DAILY_CAP = 6

const MAX_MESSAGE_CHARS = 1200
const MAX_HISTORY = 10

interface BudgetContext {
  tier?: string
  monthName?: string
  dayOfMonth?: number
  daysInMonth?: number
  safeToSpend?: number
  checking?: number
  streak?: number
  buckets?: { name: string; kind: string; used: number; limit: number }[]
  goals?: { name: string; saved: number; target: number; due?: string | null }[]
  subs?: { name: string; price: number; tag?: string }[]
  topMerchants?: { name: string; total: number }[]
}

/**
 * The coach is told what the user's budget looks like, never who they are.
 * No name, email, account number, institution or raw transaction list leaves
 * the browser — only aggregate figures the user is already looking at.
 */
function renderContext(ctx: BudgetContext): string {
  const lines: string[] = []
  if (ctx.monthName && ctx.dayOfMonth) {
    lines.push(`Today is day ${ctx.dayOfMonth} of ${ctx.daysInMonth ?? 30} in ${ctx.monthName}.`)
  }
  if (typeof ctx.checking === 'number') lines.push(`Checking balance: $${ctx.checking.toFixed(2)}.`)
  if (typeof ctx.safeToSpend === 'number') {
    lines.push(`Tally's safe-to-spend for the rest of this week: $${ctx.safeToSpend.toFixed(2)}.`)
  }
  if (typeof ctx.streak === 'number') lines.push(`Current streak: ${ctx.streak} days.`)

  if (ctx.buckets?.length) {
    lines.push('\nBuckets (month to date):')
    for (const b of ctx.buckets.slice(0, 12)) {
      const pct = b.limit > 0 ? Math.round((b.used / b.limit) * 100) : 0
      lines.push(`- ${b.name} (${b.kind}): $${b.used.toFixed(2)} of $${b.limit.toFixed(2)} (${pct}%)`)
    }
  }
  if (ctx.goals?.length) {
    lines.push('\nGoals:')
    for (const g of ctx.goals.slice(0, 8)) {
      lines.push(
        `- ${g.name}: $${g.saved.toFixed(2)} of $${g.target.toFixed(2)}${g.due ? `, due ${g.due}` : ', no deadline'}`,
      )
    }
  }
  if (ctx.subs?.length) {
    lines.push('\nSubscriptions:')
    for (const s of ctx.subs.slice(0, 10)) {
      lines.push(`- ${s.name}: $${s.price.toFixed(2)}/mo${s.tag ? ` (${s.tag})` : ''}`)
    }
  }
  if (ctx.topMerchants?.length) {
    lines.push('\nWhere the money went:')
    for (const t of ctx.topMerchants.slice(0, 6)) lines.push(`- ${t.name}: $${t.total.toFixed(2)}`)
  }
  return lines.join('\n')
}

const SYSTEM = `You are Tally's budgeting coach. Tally is a read-only budgeting app; most users are 13–19 and many are managing their own money for the first time.

HOW TO ANSWER
- Be concrete and specific to the numbers you are given. "Your Food bucket is 82% used on day 11" beats "try to watch your spending."
- Short. Two or three sentences for a simple question. Use a short list only when genuinely enumerating options.
- Suggest one next action, not five. The user should know exactly what to do when they finish reading.
- Plain language. No jargon, no lecturing, no financial-advisor voice. Never moralise about what they bought.
- If the data shows they are doing well, say so plainly rather than inventing a problem.

HARD LIMITS
- You are NOT a licensed financial adviser. Never recommend specific investments, stocks, crypto, funds or trading strategies, and never advise on taxes, loans, credit products or debt consolidation. If asked, say that is outside what you can help with and suggest they talk to a parent, guardian or a qualified adviser.
- Never tell a user to move, send or transfer money to anyone. Tally is read-only and cannot move money; you have no ability to act.
- Never ask for a password, card number, account number, SSN, or any login detail. If a user volunteers one, tell them not to share it and do not repeat it back.
- You only know what is in the budget summary below. If asked about something outside it, say you cannot see that rather than guessing.
- If a user describes financial hardship, food insecurity, or an unsafe situation at home, respond with care, do not try to solve it with budgeting advice, and suggest talking to a trusted adult.`

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'The coach is not configured on this deployment.' },
      { status: 503 },
    )
  }

  let body: { messages?: { role: string; content: string }[]; context?: BudgetContext }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const incoming = Array.isArray(body.messages) ? body.messages : []
  if (incoming.length === 0) {
    return NextResponse.json({ error: 'Nothing to answer.' }, { status: 400 })
  }

  const ip = clientIp(req)

  // 1. Burst limit, per caller, fails closed.
  const burst = await coachLimit(ip)
  if (!burst.success) {
    return NextResponse.json(
      { error: 'You are sending messages very quickly. Give it a moment.' },
      { status: 429, headers: limitHeaders(burst, 12) },
    )
  }

  // 2. Daily cap. The client reports its tier, but an unauthenticated caller
  //    can claim anything, so demo traffic is capped on its own budget
  //    regardless of what it says it is.
  const claimedTier = (body.context?.tier ?? 'free') as Tier
  const ent = entitlementsFor(claimedTier)
  const daily = await rateLimit({
    key: `tally:coach:day:${ip}`,
    limit: DEMO_DAILY_CAP,
    windowMs: 24 * 60 * 60_000,
    onError: 'closed',
  })
  if (!daily.success) {
    return NextResponse.json(
      {
        error: `That's ${DEMO_DAILY_CAP} coach messages today — the demo's daily limit. Create an account to get your plan's full allowance.`,
        upgrade: true,
      },
      { status: 429, headers: limitHeaders(daily, DEMO_DAILY_CAP) },
    )
  }

  // NOTE: once accounts are live, replace the demo cap above with the signed-in
  // user's monthly quota (ent.aiMessagesPerMonth), counted from tally_ai_messages
  // server-side. Until then the tier in the request is presentation only.
  void ent

  const messages = incoming
    .slice(-MAX_HISTORY)
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({
      role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
      content: m.content.slice(0, MAX_MESSAGE_CHARS),
    }))

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Nothing to answer.' }, { status: 400 })
  }

  const contextBlock = body.context ? renderContext(body.context) : ''

  try {
    const anthropic = new Anthropic({ apiKey })
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      system: contextBlock
        ? `${SYSTEM}\n\n--- THIS USER'S BUDGET ---\n${contextBlock}`
        : SYSTEM,
      messages,
    })

    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim()

    return NextResponse.json(
      { reply: text || 'I could not come up with an answer to that one.' },
      { headers: limitHeaders(daily, DEMO_DAILY_CAP) },
    )
  } catch (err) {
    // Never leak provider errors (they can contain key hints and quota detail).
    const status =
      typeof err === 'object' && err && 'status' in err ? Number((err as { status: unknown }).status) : 0
    if (status === 429 || status === 529) {
      return NextResponse.json(
        { error: 'The coach is busy right now. Try again in a moment.' },
        { status: 503 },
      )
    }
    console.error('[tally/coach] upstream failure', status || err)
    return NextResponse.json({ error: 'The coach could not answer just now.' }, { status: 502 })
  }
}
