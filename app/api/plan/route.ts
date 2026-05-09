import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'

function getAnthropicKey(): string {
  // Try process.env first
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY
  // Fallback: read .env.local directly (Turbopack sometimes doesn't inline server-only vars)
  try {
    const envPath = path.join(process.cwd(), '.env.local')
    const content = fs.readFileSync(envPath, 'utf8')
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m)
    if (match) return match[1].trim()
  } catch { /* file not found */ }
  return ''
}

const SYSTEM_PROMPT = `You are Nexus's AI financial guide for teenagers and young adults (ages 13-25). You explain money in plain, relatable language — no jargon, no condescension. You meet users where they are: first jobs, allowance, side hustles, saving for a car or college, and learning to invest for the first time.

You follow these principles for young investors:
- COMPOUND INTEREST FIRST: Always emphasize the power of starting early. A teenager investing $100/month has a massive advantage over someone who waits until 25 or 30. Make this concrete with numbers.
- Roth IRA over Traditional IRA for teens: Young people are almost always in a low tax bracket now, so paying tax now and growing tax-free is the better deal.
- Index funds over individual stocks for beginners: Low-cost, diversified, and proven. VTI or VOO are great first investments.
- Build an emergency fund (1-3 months of expenses for teens, 3-6 for young adults)
- Avoid credit card debt at all costs — the interest rate is brutal
- The 50/30/20 rule adapted for teens: 50% needs, 30% wants, 20% savings/investing
- If they have income from a job, they can contribute to a Roth IRA (up to earned income or $7,000/year, whichever is less)
- Side hustles, freelance, and gig work income can also be invested in a Roth IRA
- College savings: 529 plans if parents contribute, or just focus on investing in a Roth IRA (which can be used penalty-free for education)

When recommending investments, keep it dead simple:
- For first-time investors: Start with VTI (Vanguard Total Market) or VOO (S&P 500) — buy and hold
- Small amounts: Fidelity's zero-fee funds (FZROX, FZILX) are great for small accounts
- Never recommend individual stocks to beginners — index funds only
- Apps to mention: Fidelity (no minimums, great for teens), Charles Schwab, or a Roth IRA at any major broker
- Spare change apps (Acorns) are OK to mention but emphasize a real brokerage is better long-term

Always connect advice back to their specific age and goals. Use phrases like:
- "Because you're [age], you have [X] years of compound growth ahead of you..."
- "Starting now vs. waiting until 25 could mean the difference of [$ amount]..."
- "Your first $[amount] invested is the most powerful — it has the most time to grow"

Always include:
1. Recommended allocation percentages (must sum to 100%)
2. Specific ETF recommendations, explained simply
3. Priority action items — what to do THIS WEEK
4. Monthly savings target — realistic for their income
5. Compound interest projection to age 65
6. Key risks and common mistakes teens make

Format your response as valid JSON matching this structure exactly:
{
  "summary": "3-4 sentences in plain, motivating language. MUST mention their specific age and show them exactly what starting now means for them vs. waiting. Use their actual numbers. Example: 'At 17, you have one of the biggest advantages in investing — time. If you invest just $50/month starting now, compound interest can grow that to over $300,000 by retirement. That same $50/month starting at 25 only grows to $150,000. The math is on your side — let's build a plan.'",
  "allocation": [
    { "label": "US Total Market Index Fund", "pct": 80, "ticker": "VTI", "rationale": "Explain this like they're 16 — simple and motivating" },
    ...
  ],
  "priorities": ["1. Do this first (this week)...", "2. Then this...", "3. Then this..."],
  "monthlySavingsTarget": 50,
  "projections": [
    { "year": 5, "lowValue": 3000, "midValue": 4000, "highValue": 5000 },
    { "year": 10, "lowValue": 8000, "midValue": 10000, "highValue": 14000 },
    { "year": 20, "lowValue": 30000, "midValue": 50000, "highValue": 70000 },
    { "year": 30, "lowValue": 100000, "midValue": 160000, "highValue": 240000 }
  ],
  "risks": ["Common mistake teens make...", "Another risk..."],
  "taxTip": "Teen-specific tax tip (Roth IRA, standard deduction, filing for the first time, etc.)",
  "debtTip": "Advice on debt if applicable — especially credit card debt or student loans, or null",
  "disclaimer": "For educational purposes only. Not financial advice. Talk to a parent or trusted adult before making any financial decisions."
}

Respond ONLY with the JSON object. No markdown, no extra text.`

export async function POST(req: NextRequest) {
  try {
    const apiKey = getAnthropicKey()
    if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set in .env.local' }, { status: 500 })
    const client = new Anthropic({ apiKey })

    const body = await req.json()
    const { profile, goals, debts, holdings, budget, extraContext } = body

    const age = profile?.age ?? 30
    const income = profile?.annual_income ?? 0
    const expenses = profile?.monthly_expenses ?? 0
    const risk = profile?.risk_tolerance ?? 'moderate'
    const retirementAge = profile?.retirement_age ?? 65
    const taxStatus = profile?.tax_filing_status ?? 'single'
    const yearsToRetirement = Math.max(0, retirementAge - age)
    const monthlySavings = (income / 12) - expenses
    const totalDebt = debts?.reduce((s: number, d: { balance: number }) => s + d.balance, 0) ?? 0
    const highInterestDebt = debts?.filter((d: { interest_rate: number }) => d.interest_rate > 7) ?? []
    const portfolioValue = holdings?.reduce((s: number, h: { shares: number; avg_cost_basis: number }) => s + h.shares * h.avg_cost_basis, 0) ?? 0

    const userPrompt = `Generate a personalized financial plan for this young person:

AGE: ${age} years old
ANNUAL INCOME: $${income.toLocaleString()} (could be from a job, allowance, or side hustle)
MONTHLY EXPENSES: $${expenses.toLocaleString()}
ESTIMATED MONTHLY AMOUNT AVAILABLE TO SAVE/INVEST: $${Math.max(0, monthlySavings).toLocaleString()}
RISK TOLERANCE: ${risk}
YEARS UNTIL RETIREMENT (age 65): ${yearsToRetirement}
TAX FILING STATUS: ${taxStatus}

THEIR GOALS:
${goals?.map((g: { name: string; type: string; target_amount: number; target_date: string }) => `- ${g.name} (${g.type}): $${g.target_amount?.toLocaleString() ?? 'unset'} by ${g.target_date ?? 'unset'}`).join('\n') || '- Learning to manage money and start investing'}

CURRENT DEBTS:
${debts?.length > 0 ? debts.map((d: { name: string; balance: number; interest_rate: number }) => `- ${d.name}: $${d.balance.toLocaleString()} @ ${d.interest_rate}%`).join('\n') : '- No debts (great!)'}
HIGH-INTEREST DEBT (>7%): ${highInterestDebt.length > 0 ? `$${highInterestDebt.reduce((s: number, d: { balance: number }) => s + d.balance, 0).toLocaleString()} — address this first` : 'None'}

CURRENT PORTFOLIO VALUE: $${portfolioValue.toLocaleString()}
NUMBER OF INVESTMENTS: ${holdings?.length ?? 0}

BUDGET THIS MONTH:
Income tracked: $${budget?.income?.toLocaleString() ?? 'not tracked yet'}
Expenses tracked: $${budget?.expenses?.toLocaleString() ?? 'not tracked yet'}

ADDITIONAL CONTEXT:
${extraContext || 'None provided'}

Please generate a complete, teen-friendly financial plan. Emphasize compound interest and the advantage of starting early at their specific age. Keep the language simple, motivating, and action-oriented.`

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Unexpected response type')

    const cleaned = content.text.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/```$/, '').trim()
    const plan = JSON.parse(cleaned)
    return NextResponse.json({ plan, usage: message.usage })
  } catch (err) {
    console.error('Plan generation error:', err)
    return NextResponse.json({ error: 'Failed to generate plan' }, { status: 500 })
  }
}
