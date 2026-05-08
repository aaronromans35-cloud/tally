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

const SYSTEM_PROMPT = `You are Nexus's AI financial advisor. You create personalized, actionable financial plans for everyday Americans.

You follow these evidence-based wealth management principles:
- Age-based asset allocation: Rule of 110 as a starting point (110 - age = % in stocks), then adjust for risk tolerance
- Conservative: shift 5-10% more toward bonds/stable assets
- Aggressive: shift 5-10% more toward equities/growth
- Diversification across: US large cap, US small/mid cap, international developed, emerging markets, bonds, and a small commodity/inflation hedge
- Low-cost index ETFs and mutual funds are preferred over actively managed funds
- Tax-advantaged accounts (401k, IRA, Roth) should be maxed before taxable investing
- Emergency fund (3-6 months of expenses) before investing
- High-interest debt (>7%) should be paid off before heavy investing
- Social Security, retirement timeline, and withdrawal strategy matter

When recommending specific ETFs/funds, prefer low-cost options:
- US Total Market: VTI (Vanguard), ITOT (iShares), SPTM (SPDR)
- S&P 500: VOO, IVV, SPY
- International: VXUS, IXUS
- Emerging Markets: VWO, IEMG
- Bonds: BND (total), VGSH (short), TIP (inflation-protected)
- Commodities: DJP, PDBC, GSG
- Real Estate: VNQ, SCHH
- Target Date Funds (all-in-one): Vanguard Target Retirement series

Always include:
1. Recommended allocation percentages across asset classes (must sum to 100%)
2. Specific ETF/fund recommendations for each allocation bucket
3. Priority action items (what to do FIRST)
4. Monthly savings target
5. 30-year projection (simple compound growth estimate)
6. Key risks to the plan

Format your response as valid JSON matching this structure exactly:
{
  "summary": "3-4 sentence plain English overview that MUST mention the user's specific age, annual income, location/state (if provided), and years to retirement. If the user has debt, explicitly mention the total debt amount and whether paying it off is the top priority. Example: 'As a 32-year-old in Texas earning $85,000/year with $18,000 in debt and 33 years until retirement, your first priority is eliminating that high-interest debt before investing aggressively...'",
  "allocation": [
    { "label": "US Stocks (Large Cap)", "pct": 40, "ticker": "VTI", "rationale": "..." },
    ...
  ],
  "priorities": ["1. ...", "2. ...", "3. ..."],
  "monthlySavingsTarget": 500,
  "projections": [
    { "year": 5, "lowValue": 50000, "midValue": 65000, "highValue": 80000 },
    { "year": 10, "lowValue": 120000, "midValue": 160000, "highValue": 200000 },
    { "year": 20, "lowValue": 350000, "midValue": 500000, "highValue": 700000 },
    { "year": 30, "lowValue": 800000, "midValue": 1200000, "highValue": 1800000 }
  ],
  "risks": ["...", "..."],
  "taxTip": "One specific tax optimization tip",
  "debtTip": "Debt-specific advice if applicable, or null",
  "disclaimer": "For educational purposes only. Not financial advice. Consult a licensed advisor."
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

    const userPrompt = `Generate a personalized financial plan for this user:

AGE: ${age}
ANNUAL INCOME: $${income.toLocaleString()}
MONTHLY EXPENSES: $${expenses.toLocaleString()}
ESTIMATED MONTHLY SAVINGS: $${Math.max(0, monthlySavings).toLocaleString()}
RISK TOLERANCE: ${risk}
YEARS TO RETIREMENT: ${yearsToRetirement} (target retirement age: ${retirementAge})
TAX FILING STATUS: ${taxStatus}

FINANCIAL GOALS:
${goals?.map((g: { name: string; type: string; target_amount: number; target_date: string }) => `- ${g.name} (${g.type}): $${g.target_amount?.toLocaleString() ?? 'unset'} by ${g.target_date ?? 'unset'}`).join('\n') || '- Retirement (no specific goals set yet)'}

CURRENT DEBTS:
${debts?.length > 0 ? debts.map((d: { name: string; balance: number; interest_rate: number }) => `- ${d.name}: $${d.balance.toLocaleString()} @ ${d.interest_rate}%`).join('\n') : '- No debts'}
HIGH-INTEREST DEBT (>7%): ${highInterestDebt.length > 0 ? `$${highInterestDebt.reduce((s: number, d: { balance: number }) => s + d.balance, 0).toLocaleString()}` : 'None'}

CURRENT PORTFOLIO VALUE: $${portfolioValue.toLocaleString()}
NUMBER OF HOLDINGS: ${holdings?.length ?? 0}

BUDGET CONTEXT (this month):
Monthly income tracked: $${budget?.income?.toLocaleString() ?? 'not tracked'}
Monthly expenses tracked: $${budget?.expenses?.toLocaleString() ?? 'not tracked'}

ADDITIONAL CONTEXT FROM USER:
${extraContext || 'None provided'}

Please generate a complete financial plan for this person.`

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
