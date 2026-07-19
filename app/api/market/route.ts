import { NextRequest, NextResponse } from 'next/server'
import { quoteLimiter, getIP, safeLimit } from '@/lib/ratelimit'
import { isValidTicker, sanitizeString } from '@/lib/validate'

const MAX_TICKERS = 5

export async function GET(req: NextRequest) {
  const ip = getIP(req)
  const { success } = await safeLimit(quoteLimiter, ip)
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const raw = req.nextUrl.searchParams.get('tickers') ?? ''

  // Sanitize and validate each ticker
  const tickers = sanitizeString(raw, 60)
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(t => isValidTicker(t))
    .slice(0, MAX_TICKERS)

  if (!tickers.length) return NextResponse.json({})

  const apiKey = process.env.ALPHA_VANTAGE_API_KEY
  if (!apiKey || apiKey === 'your_alpha_vantage_api_key') {
    // Return mock data for development
    const mock: Record<string, { price: number; change: number; changePct: number }> = {}
    for (const t of tickers) {
      mock[t] = { price: 100 + Math.random() * 400, change: (Math.random() - 0.4) * 5, changePct: (Math.random() - 0.4) * 3 }
    }
    return NextResponse.json(mock)
  }

  const results: Record<string, { price: number; change: number; changePct: number }> = {}

  for (const ticker of tickers) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 300 } })
      const data = await res.json()
      const q = data['Global Quote']
      if (q) {
        results[ticker] = {
          price: parseFloat(q['05. price']),
          change: parseFloat(q['09. change']),
          changePct: parseFloat(q['10. change percent']?.replace('%', '') ?? '0'),
        }
      }
    } catch { /* skip */ }
  }

  return NextResponse.json(results)
}
