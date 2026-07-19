'use client'
import { useState, useRef } from 'react'

type QuoteData = {
  ticker: string; name: string; price: number; change: number; changePct: number
  open: number; prevClose: number; high52: number; low52: number
  marketCap: number | null; volume: number | null; avgVolume: number | null
  rangeChange: number; rangeChangePct: number
  pe: number | null; forwardPe: number | null; eps: number | null
  beta: number | null; dividendYield: number | null
  sector: string | null; industry: string | null
  revenueGrowth: number | null; profitMargin: number | null; debtToEquity: number | null
  history: { date: string; price: number; volume?: number }[]
}

type QA = { q: string; a: string; loading: boolean }
type Tab = 'overview' | 'fundamentals' | 'ai'

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number | null, multiply = false) =>
  n == null ? 'N/A' : `${(multiply ? n * 100 : n).toFixed(1)}%`
const fmtBig = (n: number | null) => {
  if (n == null) return 'N/A'
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`
  return n.toLocaleString()
}
const fmtVol = (n: number | null) => {
  if (n == null) return 'N/A'
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toLocaleString()
}

function parseMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>
    return part
  })
}

function parseAnalysisSections(text: string) {
  const sections: { header: string; body: string }[] = []
  const lines = text.split('\n')
  let current: { header: string; body: string } | null = null
  for (const line of lines) {
    const m = line.match(/^\*\*(.*?)\*\*\s*$/)
    if (m) {
      if (current) sections.push(current)
      current = { header: m[1], body: '' }
    } else if (current) {
      current.body += line + '\n'
    }
  }
  if (current) sections.push(current)
  if (!sections.length) sections.push({ header: '', body: text })
  return sections
}

type Rating = 'good' | 'neutral' | 'bad'
function rateMetric(key: string, value: number | null): Rating | null {
  if (value == null) return null
  switch (key) {
    case 'pe': return value < 15 ? 'good' : value < 30 ? 'neutral' : 'bad'
    case 'forwardPe': return value < 15 ? 'good' : value < 25 ? 'neutral' : 'bad'
    case 'beta': return value < 0.8 ? 'good' : value < 1.5 ? 'neutral' : 'bad'
    case 'profitMargin': return value > 0.2 ? 'good' : value > 0.05 ? 'neutral' : 'bad'
    case 'revenueGrowth': return value > 0.2 ? 'good' : value > 0.05 ? 'neutral' : 'bad'
    case 'debtToEquity': return value < 50 ? 'good' : value < 150 ? 'neutral' : 'bad'
    default: return null
  }
}

const COLORS: Record<Rating, { bg: string; border: string; text: string }> = {
  good:    { bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.25)',  text: '#22c55e' },
  neutral: { bg: 'rgba(234,179,8,0.08)',  border: 'rgba(234,179,8,0.25)',  text: '#eab308' },
  bad:     { bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.25)',  text: '#ef4444' },
}

const RATING_LABEL: Record<Rating, string> = {
  good: '✓ Good', neutral: '~ Fair', bad: '⚠ High',
}

const SUGGESTED_QUESTIONS = [
  '🎓 Explain this for a total beginner',
  '⚠️ What are the biggest risks?',
  '🐂 Make the bull case',
  '🐻 Make the bear case',
  '📊 Is the valuation cheap or expensive?',
  '🚀 What could make this stock 2x?',
  '💰 Is this a good beginner investment?',
  '🔍 Who are the main competitors?',
]

const W = 500; const H = 120; const PAD = 8

export function StockResearcher() {
  const [tickerInput, setTickerInput] = useState('')
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [range, setRange] = useState('1M')
  const [tab, setTab] = useState<Tab>('overview')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // AI state
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [qaHistory, setQaHistory] = useState<QA[]>([])
  const [customQ, setCustomQ] = useState('')
  const [askingQ, setAskingQ] = useState(false)

  async function search() {
    const t = tickerInput.trim().toUpperCase()
    if (!t) return
    setLoading(true)
    setError('')
    setQuote(null)
    setAnalysis('')
    setQaHistory([])
    setHoverIdx(null)
    try {
      const res = await fetch(`/api/quote?ticker=${t}&range=${range}`)
      if (!res.ok) { setError('Ticker not found. Try AAPL, TSLA, NVDA, VOO…'); setLoading(false); return }
      setQuote(await res.json())
      setTab('overview')
    } catch { setError('Failed to fetch. Check your connection.') }
    setLoading(false)
  }

  async function fetchRange(r: string) {
    if (!quote) return
    setRange(r)
    setHoverIdx(null)
    const res = await fetch(`/api/quote?ticker=${quote.ticker}&range=${r}`)
    if (res.ok) {
      const q = await res.json()
      setQuote(prev => prev ? {
        ...q,
        price: prev.price, change: prev.change, changePct: prev.changePct,
        open: prev.open, prevClose: prev.prevClose,
      } : q)
    }
  }

  async function getAnalysis() {
    if (!quote) return
    setAnalyzing(true)
    setAnalysis('')
    try {
      const res = await fetch('/api/stock-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quote),
      })
      if (res.ok) { const d = await res.json(); setAnalysis(d.analysis) }
      else setAnalysis('Failed to generate analysis. Please try again.')
    } catch { setAnalysis('Failed to generate analysis.') }
    setAnalyzing(false)
  }

  async function askQuestion(q: string) {
    if (!quote || !q.trim() || askingQ) return
    setAskingQ(true)
    setQaHistory(prev => [...prev, { q, a: '', loading: true }])
    setCustomQ('')
    try {
      const res = await fetch('/api/stock-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...quote, question: q }),
      })
      const answer = res.ok ? (await res.json()).analysis : 'Failed to get answer.'
      setQaHistory(prev => prev.map((item, i) => i === prev.length - 1 ? { q, a: answer, loading: false } : item))
    } catch {
      setQaHistory(prev => prev.map((item, i) => i === prev.length - 1 ? { q, a: 'Failed to get answer.', loading: false } : item))
    }
    setAskingQ(false)
  }

  // Chart calculations
  const prices = (quote?.history ?? []).map(h => h.price).filter(p => p != null) as number[]
  const minP = prices.length ? Math.min(...prices) : 0
  const maxP = prices.length ? Math.max(...prices) : 1
  const chartPoints = prices.map((p, i) => ({
    x: PAD + (i / Math.max(prices.length - 1, 1)) * (W - PAD * 2),
    y: H - PAD - ((p - minP) / (maxP - minP || 1)) * (H - PAD * 2),
    price: p,
    date: quote?.history[i]?.date ?? '',
  }))
  const polyLine = chartPoints.map(p => `${p.x},${p.y}`).join(' ')
  const fillPoly = prices.length > 1 ? `${PAD},${H - PAD} ${polyLine} ${W - PAD},${H - PAD}` : ''

  const isPositive = (quote?.change ?? 0) >= 0
  const rangePositive = (quote?.rangeChangePct ?? 0) >= 0
  const chartColor = rangePositive ? '#22c55e' : '#ef4444'

  const range52Pct = quote && quote.high52 > quote.low52
    ? ((quote.price - quote.low52) / (quote.high52 - quote.low52)) * 100
    : 50

  const hoverPt = hoverIdx !== null ? chartPoints[hoverIdx] : null

  function onChartMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !chartPoints.length) return
    const rect = svgRef.current.getBoundingClientRect()
    const mx = ((e.clientX - rect.left) / rect.width) * W
    let best = 0; let bestDist = Infinity
    chartPoints.forEach((p, i) => { const d = Math.abs(p.x - mx); if (d < bestDist) { bestDist = d; best = i } })
    setHoverIdx(best)
  }

  const analysisSections = analysis ? parseAnalysisSections(analysis) : []

  return (
    <div className="card flex flex-col gap-0 overflow-hidden" style={{ padding: 0 }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--card-border)' }}>
        <span style={{ fontSize: 18 }}>📈</span>
        <span className="font-bold text-base flex-1">Stock Researcher</span>
        {quote && (
          <span className="text-xs px-2 py-1 rounded-full font-bold"
            style={{ background: isPositive ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)', color: isPositive ? '#22c55e' : '#ef4444' }}>
            {isPositive ? '▲' : '▼'} {Math.abs(quote.changePct).toFixed(2)}%
          </span>
        )}
      </div>

      {/* ── Search ── */}
      <div className="flex gap-2 p-4 pb-3">
        <input
          className="input flex-1"
          value={tickerInput}
          onChange={e => setTickerInput(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Ticker — AAPL, TSLA, NVDA, VOO, SPY…"
          style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 15, letterSpacing: '0.03em' }}
        />
        <button className="btn-primary px-5" onClick={search} disabled={loading}>
          {loading
            ? <span style={{ width: 15, height: 15, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
            : 'Search'}
        </button>
      </div>

      {error && <p className="px-4 pb-3 text-sm" style={{ color: 'var(--red)' }}>{error}</p>}

      {quote && (<>

        {/* ── Ticker + Price ── */}
        <div className="px-4 pb-4 flex items-end justify-between flex-wrap gap-2"
          style={{ borderBottom: '1px solid var(--card-border)' }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px', lineHeight: 1.1 }}>{quote.ticker}</div>
            <div className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{quote.name}</div>
            {(quote.sector || quote.industry) && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {quote.sector && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                    style={{ background: 'rgba(91,106,240,0.1)', color: 'var(--accent)', border: '1px solid rgba(91,106,240,0.2)' }}>
                    {quote.sector}
                  </span>
                )}
                {quote.industry && (
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--background)', color: 'var(--muted)', border: '1px solid var(--card-border)' }}>
                    {quote.industry}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 }}>{fmt(quote.price)}</div>
            <div className="text-sm font-bold mt-1" style={{ color: isPositive ? '#22c55e' : '#ef4444' }}>
              {isPositive ? '+' : ''}{fmt(quote.change)} ({isPositive ? '+' : ''}{quote.changePct.toFixed(2)}%) today
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex" style={{ borderBottom: '1px solid var(--card-border)' }}>
          {([
            ['overview', '📊 Overview'],
            ['fundamentals', '📋 Fundamentals'],
            ['ai', '🤖 AI Research'],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-xs font-bold transition-all"
              style={{
                border: 'none', cursor: 'pointer', background: 'none',
                color: tab === t ? 'var(--accent)' : 'var(--muted)',
                borderBottom: tab === t ? '2px solid var(--accent)' : '2px solid transparent',
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="p-4 flex flex-col gap-4">

          {/* ════════════ OVERVIEW ════════════ */}
          {tab === 'overview' && (<>

            {/* Range buttons */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-1">
                {['1W','1M','3M','6M','1Y'].map(r => (
                  <button key={r} onClick={() => fetchRange(r)}
                    className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                    style={{
                      background: range === r ? 'var(--accent)' : 'var(--background)',
                      color: range === r ? 'white' : 'var(--muted)',
                      border: `1px solid ${range === r ? 'var(--accent)' : 'var(--card-border)'}`,
                      cursor: 'pointer',
                    }}>
                    {r}
                  </button>
                ))}
              </div>
              {quote.rangeChangePct !== 0 && (
                <div className="text-xs font-bold px-3 py-1 rounded-lg"
                  style={{ background: rangePositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: rangePositive ? '#22c55e' : '#ef4444' }}>
                  {rangePositive ? '+' : ''}{quote.rangeChangePct.toFixed(2)}% over {range}
                </div>
              )}
            </div>

            {/* Chart */}
            {prices.length > 1 && (
              <div style={{ background: 'var(--background)', borderRadius: 12, padding: '8px 4px 4px', position: 'relative', overflow: 'hidden' }}>
                {hoverPt && (
                  <div className="absolute top-2 left-3 text-xs font-bold px-2 py-1 rounded-lg pointer-events-none"
                    style={{ background: 'var(--card)', border: '1px solid var(--card-border)', zIndex: 10 }}>
                    {fmt(hoverPt.price)} · {hoverPt.date}
                  </div>
                )}
                <svg ref={svgRef}
                  viewBox={`0 0 ${W} ${H}`}
                  style={{ width: '100%', height: 140, display: 'block', cursor: 'crosshair' }}
                  preserveAspectRatio="none"
                  onMouseMove={onChartMouseMove}
                  onMouseLeave={() => setHoverIdx(null)}>
                  <defs>
                    <linearGradient id="srGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColor} stopOpacity="0.22" />
                      <stop offset="100%" stopColor={chartColor} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {fillPoly && <polygon points={fillPoly} fill="url(#srGrad)" />}
                  <polyline points={polyLine} fill="none" stroke={chartColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {hoverPt && (<>
                    <line x1={hoverPt.x} y1={PAD} x2={hoverPt.x} y2={H - PAD}
                      stroke={chartColor} strokeWidth="1" strokeDasharray="3,3" opacity="0.7" />
                    <circle cx={hoverPt.x} cy={hoverPt.y} r="4" fill={chartColor} stroke="white" strokeWidth="2" />
                  </>)}
                </svg>
              </div>
            )}

            {/* 52-week range bar */}
            <div>
              <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
                <span>52W Low: {fmt(quote.low52)}</span>
                <span className="font-bold" style={{ color: 'var(--foreground)' }}>{fmt(quote.price)}</span>
                <span>52W High: {fmt(quote.high52)}</span>
              </div>
              <div style={{ height: 8, background: 'var(--background)', borderRadius: 4, position: 'relative' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, #ef4444 0%, #eab308 50%, #22c55e 100%)', borderRadius: 4, opacity: 0.25 }} />
                <div style={{ position: 'absolute', left: `clamp(6px, calc(${range52Pct.toFixed(1)}% - 6px), calc(100% - 12px))`, top: -4, width: 16, height: 16, background: 'var(--accent)', borderRadius: '50%', border: '2px solid white', boxShadow: '0 0 0 2px var(--accent)' }} />
              </div>
              <div className="text-center text-xs mt-2 font-semibold" style={{ color: 'var(--muted)' }}>
                at {range52Pct.toFixed(0)}% of 52-week range
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Open', value: fmt(quote.open) },
                { label: 'Prev Close', value: fmt(quote.prevClose) },
                { label: 'Market Cap', value: fmtBig(quote.marketCap) },
                { label: 'Volume', value: fmtVol(quote.volume) },
                { label: '52W High', value: fmt(quote.high52) },
                { label: '52W Low', value: fmt(quote.low52) },
                { label: 'From High', value: `${(((quote.price - quote.high52) / quote.high52) * 100).toFixed(1)}%` },
                { label: 'From Low', value: `+${(((quote.price - quote.low52) / quote.low52) * 100).toFixed(1)}%` },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center"
                  style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
                  <div className="text-sm font-bold">{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* CTA to AI tab */}
            <button className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: 'rgba(91,106,240,0.08)', border: '1px solid rgba(91,106,240,0.2)', color: 'var(--accent)', cursor: 'pointer' }}
              onClick={() => { setTab('ai'); if (!analysis && !analyzing) getAnalysis() }}>
              🤖 Get Full AI Research Report →
            </button>

          </>)}

          {/* ════════════ FUNDAMENTALS ════════════ */}
          {tab === 'fundamentals' && (<>

            {/* Valuation */}
            {(quote.pe != null || quote.forwardPe != null || quote.eps != null || quote.marketCap != null) && (
              <div>
                <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Valuation
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    quote.pe != null && { key: 'pe', label: 'P/E Ratio (TTM)', raw: quote.pe, value: quote.pe.toFixed(1), hint: 'How much investors pay per $1 of earnings. Under 15 = cheap, over 30 = expensive.' },
                    quote.forwardPe != null && { key: 'forwardPe', label: 'Forward P/E', raw: quote.forwardPe, value: quote.forwardPe.toFixed(1), hint: "P/E based on next year's expected earnings. Lower = analysts expect growth." },
                    quote.eps != null && { key: 'eps', label: 'EPS (TTM)', raw: null, value: `$${quote.eps.toFixed(2)}`, hint: 'Profit per share over last 12 months. Positive = profitable company.' },
                    quote.marketCap != null && { key: 'marketCap', label: 'Market Cap', raw: null, value: fmtBig(quote.marketCap), hint: 'Total company value = shares × price. Mega-cap is $200B+.' },
                  ] as ({ key: string; label: string; raw: number | null; value: string; hint: string } | false)[])
                    .filter((x): x is { key: string; label: string; raw: number | null; value: string; hint: string } => !!x)
                    .map(s => {
                      const rating = rateMetric(s.key, s.raw)
                      const c = rating ? COLORS[rating] : null
                      return (
                        <div key={s.label} className="p-3 rounded-xl"
                          style={{ background: c ? c.bg : 'var(--background)', border: `1px solid ${c ? c.border : 'var(--card-border)'}` }}>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{s.label}</div>
                            {rating && c && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                                {RATING_LABEL[rating]}
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-black mb-1" style={{ color: c ? c.text : 'var(--foreground)' }}>{s.value}</div>
                          <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{s.hint}</div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Profitability */}
            {(quote.revenueGrowth != null || quote.profitMargin != null || quote.dividendYield != null) && (
              <div>
                <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Profitability & Growth
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    quote.revenueGrowth != null && { key: 'revenueGrowth', label: 'Revenue Growth', raw: quote.revenueGrowth, value: fmtPct(quote.revenueGrowth, true), barPct: Math.min(100, Math.max(0, quote.revenueGrowth * 100 * 2.5)), hint: 'How fast sales grew year-over-year. >20% is strong growth.' },
                    quote.profitMargin != null && { key: 'profitMargin', label: 'Profit Margin', raw: quote.profitMargin, value: fmtPct(quote.profitMargin, true), barPct: Math.min(100, Math.max(0, quote.profitMargin * 100 * 2)), hint: '% of revenue kept as profit. Higher = more efficient business.' },
                    quote.dividendYield != null && { key: 'dividendYield', label: 'Dividend Yield', raw: null, value: fmtPct(quote.dividendYield, true), barPct: 0, hint: 'Annual dividend paid as % of stock price. Passive income for shareholders.' },
                  ] as ({ key: string; label: string; raw: number | null; value: string; barPct: number; hint: string } | false)[])
                    .filter((x): x is { key: string; label: string; raw: number | null; value: string; barPct: number; hint: string } => !!x)
                    .map(s => {
                      const rating = rateMetric(s.key, s.raw)
                      const c = rating ? COLORS[rating] : null
                      return (
                        <div key={s.label} className="p-3 rounded-xl"
                          style={{ background: c ? c.bg : 'var(--background)', border: `1px solid ${c ? c.border : 'var(--card-border)'}` }}>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{s.label}</div>
                            {rating && c && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                                {rating === 'good' ? '✓ Strong' : rating === 'bad' ? '⚠ Weak' : '~ Okay'}
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-black mb-1.5" style={{ color: c ? c.text : 'var(--foreground)' }}>{s.value}</div>
                          {s.barPct > 0 && (
                            <div style={{ height: 4, background: 'var(--card-border)', borderRadius: 2, marginBottom: 6, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: '100%', background: c ? c.text : 'var(--accent)', borderRadius: 2, transform: `scaleX(${s.barPct / 100})`, transformOrigin: 'left', transition: 'transform 0.6s ease' }} />
                            </div>
                          )}
                          <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{s.hint}</div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Risk */}
            {(quote.beta != null || quote.debtToEquity != null) && (
              <div>
                <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                  Risk Factors
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    quote.beta != null && { key: 'beta', label: 'Beta', raw: quote.beta, value: quote.beta.toFixed(2), hint: `${quote.beta > 1 ? `Moves ${((quote.beta - 1) * 100).toFixed(0)}% more than the market — higher risk & reward.` : quote.beta < 0.8 ? 'Moves less than the market — lower volatility.' : 'Close to market average volatility.'}` },
                    quote.debtToEquity != null && { key: 'debtToEquity', label: 'Debt / Equity', raw: quote.debtToEquity, value: quote.debtToEquity.toFixed(1), hint: 'Debt relative to shareholder equity. Under 100 is generally healthy for most industries.' },
                  ] as ({ key: string; label: string; raw: number | null; value: string; hint: string } | false)[])
                    .filter((x): x is { key: string; label: string; raw: number | null; value: string; hint: string } => !!x)
                    .map(s => {
                      const rating = rateMetric(s.key, s.raw)
                      const c = rating ? COLORS[rating] : null
                      return (
                        <div key={s.label} className="p-3 rounded-xl"
                          style={{ background: c ? c.bg : 'var(--background)', border: `1px solid ${c ? c.border : 'var(--card-border)'}` }}>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{s.label}</div>
                            {rating && c && (
                              <span className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                                style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                                {rating === 'good' ? '✓ Low Risk' : rating === 'bad' ? '⚠ High Risk' : '~ Moderate'}
                              </span>
                            )}
                          </div>
                          <div className="text-xl font-black mb-1" style={{ color: c ? c.text : 'var(--foreground)' }}>{s.value}</div>
                          <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{s.hint}</div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Empty state */}
            {quote.pe == null && quote.beta == null && quote.revenueGrowth == null && (
              <div className="text-center py-10" style={{ color: 'var(--muted)' }}>
                <div style={{ fontSize: 36 }}>📋</div>
                <div className="text-sm font-semibold mt-2">No fundamental data for {quote.ticker}</div>
                <div className="text-xs mt-1">This may be an ETF, index fund, or a stock with limited data.</div>
              </div>
            )}

          </>)}

          {/* ════════════ AI RESEARCH ════════════ */}
          {tab === 'ai' && (<>

            {/* Full analysis block */}
            {!analysis && !analyzing && (
              <div className="text-center py-6">
                <div style={{ fontSize: 44, marginBottom: 10 }}>🤖</div>
                <div className="font-bold text-base mb-1">AI Research Report</div>
                <div className="text-sm mb-4" style={{ color: 'var(--muted)', maxWidth: 300, margin: '0 auto 16px' }}>
                  Get a full educational breakdown of {quote.ticker} — what the company does, how to read the numbers, risks, catalysts, and what it means for young investors.
                </div>
                <button className="btn-primary" onClick={getAnalysis}>Generate Full Report</button>
              </div>
            )}

            {analyzing && (
              <div className="text-center py-10">
                <span style={{ width: 36, height: 36, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                <div className="text-sm font-semibold mt-3">Researching {quote.ticker}…</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Analyzing business model, financials, risks, and growth drivers…</div>
              </div>
            )}

            {analysis && analysisSections.length > 0 && (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                    Research Report — {quote.ticker}
                  </div>
                  <button className="text-xs" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                    onClick={() => { setAnalysis(''); setQaHistory([]) }}>
                    ↺ Refresh
                  </button>
                </div>
                {analysisSections.map((sec, i) => (
                  <div key={i} className="rounded-xl p-3.5"
                    style={{ background: i === 0 ? 'rgba(91,106,240,0.06)' : 'var(--background)', border: '1px solid var(--card-border)' }}>
                    {sec.header && <div className="text-sm font-bold mb-2">{sec.header}</div>}
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                      {parseMarkdown(sec.body.trim())}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--card-border)' }} />

            {/* Q&A section */}
            <div>
              <div className="text-xs font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Ask About {quote.ticker}
              </div>

              {/* Suggested prompts */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {SUGGESTED_QUESTIONS.map(q => (
                  <button key={q} onClick={() => askQuestion(q)} disabled={askingQ}
                    className="text-xs px-3 py-1.5 rounded-full font-semibold transition-all"
                    style={{
                      background: 'var(--background)', border: '1px solid var(--card-border)',
                      color: 'var(--foreground)', cursor: askingQ ? 'not-allowed' : 'pointer',
                      opacity: askingQ ? 0.5 : 1,
                    }}>
                    {q}
                  </button>
                ))}
              </div>

              {/* Custom question input */}
              <div className="flex gap-2">
                <input
                  className="input flex-1 text-sm"
                  value={customQ}
                  onChange={e => setCustomQ(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && askQuestion(customQ)}
                  placeholder={`Ask anything about ${quote.ticker}…`}
                  disabled={askingQ}
                />
                <button className="btn-primary px-4 text-sm" onClick={() => askQuestion(customQ)}
                  disabled={askingQ || !customQ.trim()}>
                  Ask
                </button>
              </div>
            </div>

            {/* Q&A history */}
            {qaHistory.length > 0 && (
              <div className="flex flex-col gap-3">
                {qaHistory.map((qa, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    {/* User bubble */}
                    <div className="self-end max-w-xs text-sm font-semibold px-3 py-2 rounded-2xl rounded-br-sm"
                      style={{ background: 'var(--accent)', color: 'white' }}>
                      {qa.q}
                    </div>
                    {/* AI bubble */}
                    {qa.loading ? (
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl rounded-tl-sm"
                        style={{ background: 'var(--background)', border: '1px solid var(--card-border)', width: 'fit-content' }}>
                        <span style={{ width: 12, height: 12, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Thinking…</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed px-3 py-2.5 rounded-2xl rounded-tl-sm"
                        style={{ background: 'var(--background)', border: '1px solid var(--card-border)', whiteSpace: 'pre-wrap' }}>
                        {parseMarkdown(qa.a)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

          </>)}

        </div>

      </>)}
    </div>
  )
}
