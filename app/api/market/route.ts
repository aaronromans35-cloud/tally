import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const tickers = req.nextUrl.searchParams.get('tickers')?.split(',') ?? []
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

  // Alpha Vantage free tier: 25 requests/day — batch carefully
  for (const ticker of tickers.slice(0, 5)) {
    try {
      const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${apiKey}`
      const res = await fetch(url, { next: { revalidate: 300 } }) // cache 5 min
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
