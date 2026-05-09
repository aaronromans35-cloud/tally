import { NextRequest, NextResponse } from 'next/server'
import { quoteLimiter, getIP } from '@/lib/ratelimit'

const RANGE_MAP: Record<string, { interval: string; range: string }> = {
  '1W': { interval: '1d',  range: '5d' },
  '1M': { interval: '1d',  range: '1mo' },
  '3M': { interval: '1d',  range: '3mo' },
  '6M': { interval: '1wk', range: '6mo' },
  '1Y': { interval: '1mo', range: '1y' },
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Origin': 'https://finance.yahoo.com',
  'Referer': 'https://finance.yahoo.com/',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120"',
  'sec-fetch-dest': 'empty',
  'sec-fetch-mode': 'cors',
  'sec-fetch-site': 'same-site',
}

async function fetchYahoo(ticker: string, interval: string, range: string) {
  // Try query1 first, fall back to query2
  const urls = [
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}&includePrePost=false`,
    `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}&includePrePost=false`,
    `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, { headers: HEADERS, cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        // v7 quote endpoint has different shape
        if (url.includes('v7/finance/quote')) {
          const q = data?.quoteResponse?.result?.[0]
          if (q && q.regularMarketPrice) return { type: 'v7', data: q }
        } else {
          const result = data?.chart?.result?.[0]
          if (result) return { type: 'v8', data: result }
        }
      }
    } catch { /* try next */ }
  }
  return null
}

export async function GET(req: NextRequest) {
  // Rate limit: 60 quote requests per minute per IP
  const ip = getIP(req)
  const { success } = await quoteLimiter.limit(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests. Please slow down.' }, { status: 429 })
  }

  const ticker = req.nextUrl.searchParams.get('ticker')
  const rangeKey = req.nextUrl.searchParams.get('range') ?? '1M'
  if (!ticker) return NextResponse.json({ error: 'No ticker' }, { status: 400 })

  const { interval, range } = RANGE_MAP[rangeKey] ?? RANGE_MAP['1M']

  try {
    const result = await fetchYahoo(ticker.toUpperCase(), interval, range)
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (result.type === 'v7') {
      const q = result.data
      const price = parseFloat((q.regularMarketPrice ?? 0).toFixed(2))
      const prevClose = parseFloat((q.regularMarketPreviousClose ?? price).toFixed(2))
      const change = parseFloat((q.regularMarketChange ?? 0).toFixed(2))
      const changePct = parseFloat((q.regularMarketChangePercent ?? 0).toFixed(2))
      return NextResponse.json({
        ticker: q.symbol ?? ticker,
        name: q.longName ?? q.shortName ?? ticker,
        price, change, changePct,
        open: parseFloat((q.regularMarketOpen ?? 0).toFixed(2)),
        prevClose,
        high52: parseFloat((q.fiftyTwoWeekHigh ?? 0).toFixed(2)),
        low52: parseFloat((q.fiftyTwoWeekLow ?? 0).toFixed(2)),
        marketCap: q.marketCap ?? null,
        volume: q.regularMarketVolume ?? null,
        rangeChange: 0, rangeChangePct: 0,
        history: [{ date: 'Today', price, volume: q.regularMarketVolume ?? 0 }],
      })
    }

    // v8 chart response
    const meta = result.data.meta
    const timestamps: number[] = result.data.timestamp ?? []
    const closes: number[] = result.data.indicators?.quote?.[0]?.close ?? []
    const volumes: number[] = result.data.indicators?.quote?.[0]?.volume ?? []

    const history = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
      volume: volumes[i] ?? 0,
    })).filter((d) => d.price !== null)

    const firstPrice = history[0]?.price ?? meta.regularMarketPrice
    const lastPrice = meta.regularMarketPrice ?? history[history.length - 1]?.price ?? 0
    const price = parseFloat((meta.regularMarketPrice ?? 0).toFixed(2))
    const prevClose = parseFloat((meta.chartPreviousClose ?? meta.previousClose ?? price).toFixed(2))
    const change = parseFloat((meta.regularMarketChange != null ? meta.regularMarketChange : price - prevClose).toFixed(2))
    const changePct = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : parseFloat((meta.regularMarketChangePercent ?? 0).toFixed(2))

    return NextResponse.json({
      ticker: meta.symbol,
      name: meta.longName ?? meta.shortName ?? ticker,
      price, change, changePct,
      open: parseFloat((meta.regularMarketOpen ?? 0).toFixed(2)),
      prevClose,
      high52: parseFloat((meta.fiftyTwoWeekHigh ?? 0).toFixed(2)),
      low52: parseFloat((meta.fiftyTwoWeekLow ?? 0).toFixed(2)),
      marketCap: meta.marketCap ?? null,
      volume: meta.regularMarketVolume ?? null,
      rangeChange: parseFloat((lastPrice - firstPrice).toFixed(2)),
      rangeChangePct: firstPrice > 0 ? parseFloat(((lastPrice - firstPrice) / firstPrice * 100).toFixed(2)) : 0,
      history,
    })
  } catch (e) {
    console.error('Quote error:', e)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
