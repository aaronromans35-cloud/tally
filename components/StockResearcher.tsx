'use client'
import { useState } from 'react'

type QuoteData = {
  ticker: string; name: string; price: number; change: number; changePct: number
  open: number; prevClose: number; high52: number; low52: number
  marketCap: number | null; volume: number | null
  history: { date: string; price: number }[]
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export function StockResearcher() {
  const [ticker, setTicker] = useState('')
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [range, setRange] = useState('1M')

  async function search() {
    if (!ticker.trim()) return
    setLoading(true)
    setError('')
    setQuote(null)
    setAnalysis('')
    try {
      const res = await fetch(`/api/quote?ticker=${ticker.trim().toUpperCase()}&range=${range}`)
      if (!res.ok) { setError('Ticker not found. Try AAPL, TSLA, MSFT...'); setLoading(false); return }
      setQuote(await res.json())
    } catch { setError('Failed to fetch. Check your connection.') }
    setLoading(false)
  }

  async function fetchRange(r: string) {
    if (!quote) return
    setRange(r)
    const res = await fetch(`/api/quote?ticker=${quote.ticker}&range=${r}`)
    if (res.ok) {
      const q = await res.json()
      // Keep today's price/change — only update the chart history
      setQuote(prev => prev ? {
        ...q,
        price: prev.price,
        change: prev.change,
        changePct: prev.changePct,
        open: prev.open,
        prevClose: prev.prevClose,
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
    } catch { setAnalysis('Failed to generate analysis.') }
    setAnalyzing(false)
  }

  const prices = quote?.history.map(h => h.price) ?? []
  const minP = prices.length > 0 ? Math.min(...prices) : 0
  const maxP = prices.length > 0 ? Math.max(...prices) : 1
  const points = prices.map((p, i) => {
    const x = (i / (prices.length - 1)) * 400
    const y = 80 - ((p - minP) / (maxP - minP || 1)) * 70
    return `${x},${y}`
  }).join(' ')

  const isPositive = (quote?.change ?? 0) >= 0

  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">🔍 Stock Researcher</h2>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={ticker}
          onChange={e => setTicker(e.target.value.toUpperCase())}
          onKeyDown={e => e.key === 'Enter' && search()}
          placeholder="Search ticker — AAPL, TSLA, NVDA..."
        />
        <button className="btn-primary" onClick={search} disabled={loading}>
          {loading ? '…' : 'Search'}
        </button>
      </div>

      {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}

      {quote && (
        <div className="flex flex-col gap-4">
          {/* Price header */}
          <div className="flex items-start justify-between flex-wrap gap-2">
            <div>
              <div className="text-xl font-bold">{quote.ticker}</div>
              <div className="text-sm" style={{ color: 'var(--muted)' }}>{quote.name}</div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{fmt(quote.price)}</div>
              <div className="text-sm font-semibold" style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                {isPositive ? '+' : ''}{fmt(quote.change)} ({isPositive ? '+' : ''}{quote.changePct.toFixed(2)}%)
              </div>
            </div>
          </div>

          {/* Range selector */}
          <div className="flex gap-1">
            {['1W','1M','3M','6M','1Y'].map(r => (
              <button key={r} onClick={() => fetchRange(r)}
                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                style={{ background: range === r ? 'var(--accent)' : 'var(--card-border)', color: range === r ? 'white' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                {r}
              </button>
            ))}
          </div>

          {/* Chart */}
          {prices.length > 1 && (
            <div style={{ background: 'var(--background)', borderRadius: 12, padding: '12px 8px 8px', overflow: 'hidden' }}>
              <svg viewBox="0 0 400 90" style={{ width: '100%', height: 90 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="researchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`0,80 ${points} 400,80`} fill="url(#researchGrad)" />
                <polyline points={points} fill="none" stroke={isPositive ? '#22c55e' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Key stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Open', value: fmt(quote.open) },
              { label: 'Prev Close', value: fmt(quote.prevClose) },
              { label: '52W High', value: fmt(quote.high52) },
              { label: '52W Low', value: fmt(quote.low52) },
              { label: 'Market Cap', value: quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(1)}B` : 'N/A' },
              { label: 'Volume', value: quote.volume ? quote.volume.toLocaleString() : 'N/A' },
              { label: 'Range Position', value: (() => {
                const range52 = quote.high52 - quote.low52
                const pos = range52 > 0 ? ((quote.price - quote.low52) / range52) * 100 : 50
                return `${pos.toFixed(0)}% of 52W`
              })() },
              { label: 'From 52W High', value: `${(((quote.price - quote.high52) / quote.high52) * 100).toFixed(1)}%` },
            ].map(s => (
              <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--background)' }}>
                <div className="text-sm font-semibold">{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          <div>
            {!analysis && (
              <button className="btn-secondary w-full justify-center" onClick={getAnalysis} disabled={analyzing}>
                {analyzing ? '🤖 Analyzing…' : '🤖 Get AI Analysis'}
              </button>
            )}
            {analysis && (
              <div className="p-4 rounded-xl text-sm leading-relaxed" style={{ background: 'rgba(91,106,240,0.06)', border: '1px solid rgba(91,106,240,0.2)' }}>
                <div className="flex items-center gap-2 mb-3 font-semibold text-xs" style={{ color: 'var(--accent)' }}>
                  🤖 AI ANALYSIS — {quote.ticker}
                </div>
                <div style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>{analysis}</div>
                <button className="mt-3 text-xs" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAnalysis('')}>
                  Refresh analysis
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
