import { NextRequest, NextResponse } from 'next/server'

const RANGE_MAP: Record<string, { interval: string; range: string }> = {
  '1W': { interval: '1d',  range: '5d' },
  '1M': { interval: '1d',  range: '1mo' },
  '3M': { interval: '1d',  range: '3mo' },
  '6M': { interval: '1wk', range: '6mo' },
  '1Y': { interval: '1mo', range: '1y' },
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker')
  const rangeKey = req.nextUrl.searchParams.get('range') ?? '1M'
  if (!ticker) return NextResponse.json({ error: 'No ticker' }, { status: 400 })

  const { interval, range } = RANGE_MAP[rangeKey] ?? RANGE_MAP['1M']

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=${interval}&range=${range}`,
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }, next: { revalidate: 60 } }
    )
    if (!res.ok) return NextResponse.json({ error: 'Yahoo Finance error' }, { status: 502 })
    const data = await res.json()
    const result = data?.chart?.result?.[0]
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const meta = result.meta
    const timestamps: number[] = result.timestamp ?? []
    const closes: number[] = result.indicators?.quote?.[0]?.close ?? []
    const volumes: number[] = result.indicators?.quote?.[0]?.volume ?? []

    const history = timestamps.map((t, i) => ({
      date: new Date(t * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
      volume: volumes[i] ?? 0,
    })).filter((d) => d.price !== null)

    const firstPrice = history[0]?.price ?? meta.regularMarketPrice
    const lastPrice = meta.regularMarketPrice ?? history[history.length - 1]?.price ?? 0

    const price      = parseFloat((meta.regularMarketPrice ?? 0).toFixed(2))
    const prevClose  = parseFloat((meta.chartPreviousClose ?? meta.previousClose ?? price).toFixed(2))
    // Prefer the API-reported change; fall back to price - prevClose (handles after-hours/weekend cases)
    const change     = parseFloat((meta.regularMarketChange != null ? meta.regularMarketChange : price - prevClose).toFixed(2))
    const changePct  = prevClose > 0 ? parseFloat(((change / prevClose) * 100).toFixed(2)) : parseFloat((meta.regularMarketChangePercent ?? 0).toFixed(2))

    return NextResponse.json({
      ticker: meta.symbol,
      name: meta.longName ?? meta.shortName ?? ticker,
      price,
      change,
      changePct,
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
