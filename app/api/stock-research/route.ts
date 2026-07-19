import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { aiLimiter, getIP, safeLimit } from '@/lib/ratelimit'
import { parseBody, sanitizeStockResearchInput } from '@/lib/validate'
import { createClient } from '@/lib/supabase/server'

const client = new Anthropic()

export async function POST(req: NextRequest) {
  // Require authenticated user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Rate limit per user ID
  const ip = getIP(req)
  const { success, remaining } = await safeLimit(aiLimiter, user.id ?? ip)
  if (!success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before analyzing another stock.' },
      { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
    )
  }

  // Parse and size-check body (max 16KB)
  const { data, error: parseError } = await parseBody(req, 16_000)
  if (parseError) return NextResponse.json({ error: parseError }, { status: 400 })

  const input = sanitizeStockResearchInput(data)
  if (!input) return NextResponse.json({ error: 'Invalid or malformed input' }, { status: 400 })

  const {
    ticker, name, price, change, changePct,
    high52, low52, marketCap, volume, history,
    rangeChangePct,
    pe, forwardPe, eps, beta, dividendYield,
    sector, industry, revenueGrowth, profitMargin, debtToEquity,
    question,
  } = input

  const historyStr = history.slice(-30).map((h) =>
    `${h!.date}: $${h!.price}`
  ).join(', ') || 'No history available'

  const rangePos = high52 > low52
    ? (((price - low52) / (high52 - low52)) * 100).toFixed(0)
    : '50'

  const fmtPct = (n: number | null | undefined, decimals = 1) =>
    n != null ? `${(n * 100).toFixed(decimals)}%` : 'N/A'

  const stockContext = `Company: ${name} (${ticker})
Sector: ${sector ?? 'N/A'} | Industry: ${industry ?? 'N/A'}
Price: $${price} | Today: ${change >= 0 ? '+' : ''}$${change} (${changePct}%) | Period Return: ${rangeChangePct >= 0 ? '+' : ''}${rangeChangePct}%
52-Week Range: $${low52} – $${high52} (currently at ${rangePos}%)
Market Cap: ${marketCap ? `$${(marketCap / 1e9).toFixed(1)}B` : 'N/A'} | Volume: ${volume ? volume.toLocaleString() : 'N/A'}
P/E: ${pe != null ? pe.toFixed(1) : 'N/A'} | Forward P/E: ${forwardPe != null ? forwardPe.toFixed(1) : 'N/A'} | EPS: ${eps != null ? `$${eps.toFixed(2)}` : 'N/A'}
Beta: ${beta != null ? beta.toFixed(2) : 'N/A'} | Dividend: ${dividendYield != null ? fmtPct(dividendYield) : 'None'}
Revenue Growth: ${revenueGrowth != null ? fmtPct(revenueGrowth) : 'N/A'} | Profit Margin: ${profitMargin != null ? fmtPct(profitMargin) : 'N/A'} | Debt/Equity: ${debtToEquity != null ? debtToEquity.toFixed(1) : 'N/A'}
Recent Price History: ${historyStr}`

  let prompt: string

  if (question) {
    // Follow-up question mode — targeted answer
    prompt = `You are a financial educator helping a teenager learn about investing. They're researching ${name} (${ticker}) and have a specific question.

━━━ STOCK DATA ━━━
${stockContext}

━━━ STUDENT'S QUESTION ━━━
${question}

Answer this question directly and educationally. Use plain language a high schooler can understand. Use **bold** to highlight key terms or important points. Be concise but thorough — 2-4 paragraphs max. Don't recommend buying or selling. Focus on teaching.`
  } else {
    // Full analysis mode — structured JSON, rendered as cards/lists on the client (not prose)
    prompt = `You are a financial educator at a top high school teaching a personal finance class. A student has looked up ${name} (${ticker}) and wants to understand it deeply. Your job is to teach — not just describe. Use plain language, real-world analogies, and concrete examples specific to THIS company. Never use generic filler.

━━━ STOCK DATA ━━━
${stockContext}

━━━ YOUR TASK ━━━
Respond with ONLY a valid JSON object — no markdown, no code fences, no commentary before or after. Match this exact shape:

{
  "whatItDoes": "2-3 sentences a 16-year-old would understand: what problem the company solves and how it makes money. Use a real-world analogy if it helps.",
  "priceContext": "1-2 sentences on what the price has done today and over the recent period, in context. Reference that it's trading at ${rangePos}% of its 52-week range and what that suggests.",
  "keyMetrics": [
    { "label": "metric name, e.g. P/E Ratio", "value": "this company's actual number, formatted (e.g. '28.4' or '$1.2B')", "explanation": "1-2 sentences: what the metric means in plain English, and whether this number is high, low, or average for the industry." }
    // 4-5 of these, prioritizing P/E, Beta, and any standout metrics from the data above
  ],
  "risks": [
    "one specific, substantive risk for THIS company (1-2 sentences) — competitive threats, industry trends, business model vulnerabilities, valuation concerns, or macro factors specific to this sector"
    // exactly 3 items
  ],
  "catalysts": [
    "one specific growth opportunity for THIS company (1-2 sentences) — new products, market expansion, industry tailwinds, competitive advantages, or favorable trends"
    // exactly 3 items
  ],
  "investorProfile": "one short phrase: what type of investor this stock suits, e.g. 'Growth-oriented, higher risk tolerance'",
  "watchFor": [
    "short phrase: one important thing to monitor going forward"
    // 2-3 items
  ],
  "researchQuestion": "one thought-provoking question the student should research before deciding — not a yes/no question"
}

Do NOT recommend buying or selling. Be balanced, honest, and specific — quality over word count. Every string should be concise (1-2 sentences max), never a paragraph.`
  }

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: question ? 600 : 1600,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  if (question) {
    return NextResponse.json({ analysis: text })
  }

  // Full analysis: parse structured JSON, defensively stripping any stray code fences
  try {
    const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
    const report = JSON.parse(cleaned)
    return NextResponse.json({ report })
  } catch {
    // Fall back to raw text so the client still has something to show
    return NextResponse.json({ analysis: text })
  }
}
