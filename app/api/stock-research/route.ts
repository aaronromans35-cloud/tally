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
  } = input

  const historyStr = history.slice(-30).map((h) =>
    `${h!.date}: $${h!.price}`
  ).join(', ') || 'No history available'

  const rangePos = high52 > low52
    ? (((price - low52) / (high52 - low52)) * 100).toFixed(0)
    : '50'

  const fmtPct = (n: number | null | undefined, decimals = 1) =>
    n != null ? `${(n * 100).toFixed(decimals)}%` : 'N/A'

  const prompt = `You are a financial educator at a top high school teaching a personal finance class. A student has looked up ${name} (${ticker}) and wants to understand it deeply. Your job is to teach — not just describe. Explain what each metric *means* and what it tells us. Use plain language, real-world analogies, and concrete examples. Be thorough.

━━━ STOCK DATA ━━━
Company: ${name} (${ticker})
Sector: ${sector ?? 'N/A'} | Industry: ${industry ?? 'N/A'}

PRICE & PERFORMANCE
• Current Price: $${price}  |  Today: ${change >= 0 ? '+' : ''}$${change} (${changePct}%)
• Period Return: ${rangeChangePct >= 0 ? '+' : ''}${rangeChangePct}%
• 52-Week Range: $${low52} – $${high52}  |  Currently at ${rangePos}% of that range
• Market Cap: ${marketCap ? `$${(marketCap / 1e9).toFixed(1)}B` : 'N/A'}
• Volume Today: ${volume ? volume.toLocaleString() : 'N/A'}

VALUATION & FUNDAMENTALS
• P/E Ratio (Trailing): ${pe != null ? pe.toFixed(1) : 'N/A'}
• Forward P/E: ${forwardPe != null ? forwardPe.toFixed(1) : 'N/A'}
• EPS (Earnings Per Share): ${eps != null ? `$${eps.toFixed(2)}` : 'N/A'}
• Beta: ${beta != null ? beta.toFixed(2) : 'N/A'}
• Dividend Yield: ${dividendYield != null ? fmtPct(dividendYield) : 'None'}
• Revenue Growth (YoY): ${revenueGrowth != null ? fmtPct(revenueGrowth) : 'N/A'}
• Profit Margin: ${profitMargin != null ? fmtPct(profitMargin) : 'N/A'}
• Debt-to-Equity: ${debtToEquity != null ? debtToEquity.toFixed(1) : 'N/A'}

RECENT PRICE HISTORY: ${historyStr}

━━━ YOUR ANALYSIS TASK ━━━
Write a comprehensive educational breakdown using these exact sections. Use the headers exactly as written:

**📌 What This Company Does**
Explain the business in 2-3 sentences a 16-year-old would understand. What problem do they solve? How do they make money? Give a real-world analogy if helpful.

**📈 Price Performance**
Explain what the price has done today and over the recent period. Put it in context — is ${rangeChangePct >= 0 ? 'this gain' : 'this decline'} large or small for this type of company? What does trading at ${rangePos}% of its 52-week range suggest about where investors think the stock is headed?

**🔢 Understanding the Key Numbers**
Pick the 4-5 most relevant metrics from the data above and teach each one. For each: (1) explain what the metric IS in plain English, (2) state this company's actual number, (3) explain what that number tells us — is it high, low, or average for its industry? What does it imply about the company's health?
Focus especially on P/E ratio, Beta, and any standout metrics.

**⚠️ Risks to Understand**
Give 3 specific, substantive risks for THIS company — not generic "stocks can fall." Think about competitive threats, industry trends, business model vulnerabilities, valuation concerns, or macro factors specific to this sector.

**🚀 Growth Catalysts**
Give 3 specific opportunities that could drive this company's growth — new products, market expansion, industry tailwinds, competitive advantages, or trends working in their favor.

**🎓 What a Smart Young Investor Should Know**
Synthesize everything: What type of investor does this stock suit (growth, value, income, speculative)? What are the 2-3 most important things to monitor going forward? What would you tell a student who is considering this stock for a school investment portfolio? End with one thought-provoking question they should research before deciding.

Do NOT recommend buying or selling. Be balanced and honest. Length: aim for thorough, not padded — quality over word count.`

  const message = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 1400,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return NextResponse.json({ analysis: text })
}
