'use client'
import { useState } from 'react'

type QuoteData = {
  ticker: string; name: string; price: number; change: number; changePct: number
  open: number; prevClose: number; high52: number; low52: number
  marketCap: number | null; volume: number | null
  rangeChange: number; rangeChangePct: number
  // Fundamentals
  pe: number | null; forwardPe: number | null; eps: number | null
  beta: number | null; dividendYield: number | null
  sector: string | null; industry: string | null
  revenueGrowth: number | null; profitMargin: number | null; debtToEquity: number | null
  history: { date: string; price: number }[]
}

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtPct = (n: number | null, multiply = false) =>
  n == null ? 'N/A' : `${(multiply ? n * 100 : n).toFixed(1)}%`

// Parse **bold** markers from AI text into React elements
function parseMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    return part
  })
}

// Split AI analysis into sections by **emoji Header** pattern
function parseAnalysisSections(text: string): { header: string; body: string }[] {
  const sections: { header: string; body: string }[] = []
  // Match lines starting with **📌, **📈, **🔢, **⚠️, **🚀, **🎓
  const lines = text.split('\n')
  let current: { header: string; body: string } | null = null

  for (const line of lines) {
    const headerMatch = line.match(/^\*\*(.*?)\*\*\s*$/)
    if (headerMatch) {
      if (current) sections.push(current)
      current = { header: headerMatch[1], body: '' }
    } else if (current) {
      current.body += line + '\n'
    }
  }
  if (current) sections.push(current)

  // If no sections parsed (fallback), return as single block
  if (sections.length === 0) {
    sections.push({ header: '', body: text })
  }
  return sections
}

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
  const rangePositive = (quote?.rangeChangePct ?? 0) >= 0

  const sections = analysis ? parseAnalysisSections(analysis) : []

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
              {(quote.sector || quote.industry) && (
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {[quote.sector, quote.industry].filter(Boolean).join(' · ')}
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{fmt(quote.price)}</div>
              <div className="text-sm font-semibold" style={{ color: isPositive ? 'var(--green)' : 'var(--red)' }}>
                {isPositive ? '+' : ''}{fmt(quote.change)} ({isPositive ? '+' : ''}{quote.changePct.toFixed(2)}%) today
              </div>
            </div>
          </div>

          {/* Range selector + period return */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex gap-1">
              {['1W','1M','3M','6M','1Y'].map(r => (
                <button key={r} onClick={() => fetchRange(r)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold transition-all"
                  style={{ background: range === r ? 'var(--accent)' : 'var(--card-border)', color: range === r ? 'white' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            {quote.rangeChangePct !== 0 && (
              <div className="text-sm font-semibold px-3 py-1 rounded-lg"
                style={{ background: rangePositive ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: rangePositive ? 'var(--green)' : 'var(--red)' }}>
                {rangePositive ? '+' : ''}{quote.rangeChangePct.toFixed(2)}% over {range}
              </div>
            )}
          </div>

          {/* Chart */}
          {prices.length > 1 && (
            <div style={{ background: 'var(--background)', borderRadius: 12, padding: '12px 8px 8px', overflow: 'hidden' }}>
              <svg viewBox="0 0 400 90" style={{ width: '100%', height: 90 }} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="researchGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={rangePositive ? '#22c55e' : '#ef4444'} stopOpacity="0.25" />
                    <stop offset="100%" stopColor={rangePositive ? '#22c55e' : '#ef4444'} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polygon points={`0,80 ${points} 400,80`} fill="url(#researchGrad)" />
                <polyline points={points} fill="none" stroke={rangePositive ? '#22c55e' : '#ef4444'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Price stats grid */}
          <div>
            <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Price Stats</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { label: 'Open', value: fmt(quote.open) },
                { label: 'Prev Close', value: fmt(quote.prevClose) },
                { label: '52W High', value: fmt(quote.high52) },
                { label: '52W Low', value: fmt(quote.low52) },
                { label: 'Market Cap', value: quote.marketCap ? `$${(quote.marketCap / 1e9).toFixed(1)}B` : 'N/A' },
                { label: 'Volume', value: quote.volume ? quote.volume.toLocaleString() : 'N/A' },
                { label: '52W Position', value: (() => {
                  const r = quote.high52 - quote.low52
                  const pos = r > 0 ? ((quote.price - quote.low52) / r) * 100 : 50
                  return `${pos.toFixed(0)}% of range`
                })() },
                { label: 'From 52W High', value: `${(((quote.price - quote.high52) / quote.high52) * 100).toFixed(1)}%` },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'var(--background)' }}>
                  <div className="text-sm font-semibold">{s.value}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Fundamentals grid */}
          {(quote.pe != null || quote.beta != null || quote.eps != null || quote.dividendYield != null || quote.revenueGrowth != null || quote.profitMargin != null || quote.debtToEquity != null) && (
            <div>
              <div className="text-xs font-semibold mb-2" style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fundamentals</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  quote.pe != null && { label: 'P/E Ratio', value: quote.pe.toFixed(1), hint: 'Price vs earnings' },
                  quote.forwardPe != null && { label: 'Forward P/E', value: quote.forwardPe.toFixed(1), hint: 'Expected earnings' },
                  quote.eps != null && { label: 'EPS (TTM)', value: `$${quote.eps.toFixed(2)}`, hint: 'Earnings per share' },
                  quote.beta != null && { label: 'Beta', value: quote.beta.toFixed(2), hint: 'Market volatility' },
                  quote.dividendYield != null && { label: 'Dividend Yield', value: fmtPct(quote.dividendYield, true), hint: 'Annual payout' },
                  quote.revenueGrowth != null && { label: 'Revenue Growth', value: fmtPct(quote.revenueGrowth, true), hint: 'Year-over-year' },
                  quote.profitMargin != null && { label: 'Profit Margin', value: fmtPct(quote.profitMargin, true), hint: 'Kept per dollar' },
                  quote.debtToEquity != null && { label: 'Debt/Equity', value: quote.debtToEquity.toFixed(1), hint: 'Leverage ratio' },
                ].filter(Boolean).map((s: { label: string; value: string; hint: string } | false) => {
                  if (!s) return null
                  return (
                    <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: 'rgba(91,106,240,0.05)', border: '1px solid rgba(91,106,240,0.12)' }}>
                      <div className="text-sm font-bold">{s.value}</div>
                      <div className="text-xs font-semibold mt-0.5">{s.label}</div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.hint}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div>
            {!analysis && (
              <button className="btn-secondary w-full justify-center" onClick={getAnalysis} disabled={analyzing}>
                {analyzing
                  ? <span className="flex items-center gap-2 justify-center"><span style={{ width: 14, height: 14, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Generating deep analysis…</span>
                  : '🤖 Get Deep AI Analysis'}
              </button>
            )}

            {analysis && sections.length > 0 && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold" style={{ color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🤖 AI Analysis — {quote.ticker}
                  </div>
                  <button className="text-xs" style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => setAnalysis('')}>
                    Refresh
                  </button>
                </div>

                {sections.map((sec, i) => (
                  <div key={i} className="rounded-xl p-4" style={{ background: i === 0 ? 'rgba(91,106,240,0.06)' : 'var(--background)', border: '1px solid var(--card-border)' }}>
                    {sec.header && (
                      <div className="text-sm font-bold mb-2" style={{ color: 'var(--foreground)' }}>{sec.header}</div>
                    )}
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                      {parseMarkdown(sec.body.trim())}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
