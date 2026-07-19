'use client'
import { useState, useRef, useEffect } from 'react'

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
type Tab = 'overview' | 'technicals' | 'fundamentals' | 'ai'

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

// ═══════════════════════════ Technical indicators ═══════════════════════════

type Trend = 'up' | 'down' | 'flat'

function computeSMA(prices: number[], period: number): number | null {
  if (prices.length < period) return null
  const slice = prices.slice(-period)
  return slice.reduce((a, b) => a + b, 0) / period
}

function computeRSI(prices: number[], period = 14): number | null {
  if (prices.length < period + 1) return null
  let gains = 0, losses = 0
  const slice = prices.slice(-(period + 1))
  for (let i = 1; i < slice.length; i++) {
    const diff = slice[i] - slice[i - 1]
    if (diff >= 0) gains += diff; else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}

function computeVolatility(prices: number[]): number | null {
  if (prices.length < 3) return null
  const returns: number[] = []
  for (let i = 1; i < prices.length; i++) returns.push((prices[i] - prices[i - 1]) / prices[i - 1])
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * 100
}

function rateRSI(v: number | null): Rating | null {
  if (v == null) return null
  if (v < 30) return 'good'
  if (v > 70) return 'bad'
  return 'neutral'
}
function rateVolatility(v: number | null): Rating | null {
  if (v == null) return null
  if (v < 1.5) return 'good'
  if (v > 3.5) return 'bad'
  return 'neutral'
}
function rateTrend(t: Trend | null): Rating | null {
  if (t == null) return null
  return t === 'up' ? 'good' : t === 'down' ? 'bad' : 'neutral'
}
function rateMomentum(pct: number): Rating {
  if (pct > 5) return 'good'
  if (pct < -5) return 'bad'
  return 'neutral'
}

const RSI_LABEL: Record<Rating, string> = { good: 'Oversold', bad: 'Overbought', neutral: 'Neutral' }
const VOL_LABEL: Record<Rating, string> = { good: 'Low', bad: 'High', neutral: 'Moderate' }
const TREND_LABEL: Record<Rating, string> = { good: 'Uptrend', bad: 'Downtrend', neutral: 'Sideways' }
const MOMENTUM_LABEL: Record<Rating, string> = { good: 'Strong', bad: 'Weak', neutral: 'Flat' }
const GROWTH_LABEL: Record<Rating, string> = { good: '✓ Strong', bad: '⚠ Weak', neutral: '~ Okay' }
const RISK_LABEL: Record<Rating, string> = { good: '✓ Low Risk', bad: '⚠ High Risk', neutral: '~ Moderate' }

// ═══════════════════════════ Info modal library ═══════════════════════════

type InfoContent = { title: string; what: string; context: string }

function getMetricInfo(key: string, q: QuoteData, tech: {
  trend: Trend | null; smaPeriod: number; sma: number | null
  rsi: number | null; volatility: number | null; range52Pct: number
}): InfoContent {
  const t = q.ticker
  switch (key) {
    case 'pe': {
      const v = q.pe
      const r = rateMetric('pe', v)
      return {
        title: 'P/E Ratio (Price-to-Earnings)',
        what: "The P/E ratio shows how much investors pay for every $1 of a company's annual profit. It's the share price divided by earnings per share. A high P/E usually means the market expects strong future growth (or the stock is pricey); a low P/E can mean a bargain — or that growth expectations are weak.",
        context: v == null
          ? `${t} doesn't have a reported P/E right now — common for companies with no profit yet, or for ETFs and index funds.`
          : `${t} trades at a P/E of ${v.toFixed(1)}, which is ${r === 'good' ? 'on the cheaper side (under 15)' : r === 'bad' ? 'on the pricier side (over 30)' : 'in a fairly average range (15–30)'}. That means investors are paying $${v.toFixed(2)} for every $1 the company earns per year. ${r === 'bad' ? "A high P/E isn't automatically bad — it often reflects strong growth expectations — but it raises the bar for the company to deliver." : r === 'good' ? 'A lower P/E can mean a bargain, or it can mean the market expects slower growth ahead — worth digging into why.' : 'This is a fairly normal valuation for a stable, moderately-growing company.'}`,
      }
    }
    case 'forwardPe': {
      const v = q.forwardPe
      const r = rateMetric('forwardPe', v)
      return {
        title: 'Forward P/E',
        what: "Forward P/E uses analysts' estimate of next year's earnings instead of last year's. Comparing it to the regular (trailing) P/E tells you whether the market expects earnings to grow or shrink.",
        context: v == null
          ? `No forward P/E is available for ${t} right now.`
          : `${t}'s forward P/E is ${v.toFixed(1)}. ${q.pe != null ? (v < q.pe ? `That's lower than its trailing P/E of ${q.pe.toFixed(1)}, meaning analysts expect earnings to grow.` : `That's higher than its trailing P/E of ${q.pe.toFixed(1)}, meaning analysts expect earnings to shrink or growth to slow.`) : ''} ${r === 'good' ? 'A low forward P/E suggests the stock could be undervalued relative to expected earnings.' : r === 'bad' ? 'A high forward P/E means a lot of future growth is already priced in.' : ''}`,
      }
    }
    case 'eps': {
      const v = q.eps
      return {
        title: 'EPS (Earnings Per Share)',
        what: 'EPS is the company\'s total profit over the last 12 months divided by the number of shares outstanding. It tells you how much profit is attributable to a single share.',
        context: v == null
          ? `${t} doesn't report a trailing EPS right now.`
          : `${t} earned $${v.toFixed(2)} per share over the last twelve months. ${v > 0 ? "That's positive — the company is profitable." : 'That\'s negative, meaning the company lost money over that period — common for early-stage growth companies, but worth watching.'}`,
      }
    }
    case 'marketCap': {
      const v = q.marketCap
      return {
        title: 'Market Capitalization',
        what: "Market cap is a company's total value in the stock market — share price × total shares outstanding. It's the quickest way to gauge a company's size: mega-cap ($200B+), large-cap ($10B–$200B), mid-cap ($2B–$10B), small-cap (under $2B).",
        context: v == null
          ? `Market cap isn't available for ${t} right now.`
          : `${t} has a market cap of ${fmtBig(v)}, making it ${v >= 2e11 ? 'a mega-cap company — one of the largest and most established in the market.' : v >= 1e10 ? 'a large-cap company — well-established with a long track record.' : v >= 2e9 ? 'a mid-cap company — past the early stage but still with real room to grow.' : 'a small-cap company — smaller and typically more volatile, with more growth potential but more risk.'}`,
      }
    }
    case 'revenueGrowth': {
      const v = q.revenueGrowth
      const r = rateMetric('revenueGrowth', v)
      return {
        title: 'Revenue Growth (Year-over-Year)',
        what: "This measures how much faster (or slower) the company's sales grew compared to a year ago. Consistent double-digit growth is a sign of a healthy, expanding business.",
        context: v == null
          ? `Revenue growth isn't available for ${t} right now.`
          : `${t}'s revenue grew ${(v * 100).toFixed(1)}% year-over-year. ${r === 'good' ? "That's strong growth — well above the market average — a good sign demand for the company's products is increasing." : r === 'bad' ? "That's slow (or negative) growth, which could mean the business is maturing, facing more competition, or hitting headwinds." : "That's moderate, healthy growth — not explosive, but steady."}`,
      }
    }
    case 'profitMargin': {
      const v = q.profitMargin
      const r = rateMetric('profitMargin', v)
      return {
        title: 'Profit Margin',
        what: 'Profit margin is the percentage of every dollar in revenue the company keeps as actual profit after all expenses. Higher margins usually mean a more efficient, more defensible business.',
        context: v == null
          ? `Profit margin isn't available for ${t} right now.`
          : `${t} keeps ${(v * 100).toFixed(1)}% of every dollar of revenue as profit. ${r === 'good' ? "That's a high margin — a sign of pricing power or an efficient cost structure." : r === 'bad' ? "That's a thin margin, meaning small changes in costs or pricing could meaningfully impact profits." : "That's a reasonably healthy margin for most industries."}`,
      }
    }
    case 'dividendYield': {
      const v = q.dividendYield
      return {
        title: 'Dividend Yield',
        what: "Dividend yield is the annual dividend payment as a percentage of the stock's price. It's a way companies return cash directly to shareholders, separate from any price appreciation.",
        context: v == null || v === 0
          ? `${t} doesn't currently pay a dividend — common for growth-focused companies that reinvest profits back into the business instead.`
          : `${t} pays a dividend yield of ${(v * 100).toFixed(2)}%. That means for every $1,000 invested, you'd receive roughly $${(v * 1000).toFixed(0)} per year in dividends, on top of any price change.`,
      }
    }
    case 'beta': {
      const v = q.beta
      const r = rateMetric('beta', v)
      return {
        title: 'Beta (Volatility vs. the Market)',
        what: "Beta measures how much a stock tends to move relative to the overall market (like the S&P 500). A beta of 1.0 means it moves in line with the market; above 1.0 means bigger swings in both directions; below 1.0 means smaller, steadier moves.",
        context: v == null
          ? `Beta isn't available for ${t} right now.`
          : `${t} has a beta of ${v.toFixed(2)}. ${v > 1 ? `That means it tends to move about ${((v - 1) * 100).toFixed(0)}% more than the market — bigger gains in rallies, but bigger drops in downturns too.` : v < 0.8 ? "That means it tends to move less than the market — historically steadier, with smaller swings in either direction." : "That's close to the market average — roughly as volatile as a typical large stock."}`,
      }
    }
    case 'debtToEquity': {
      const v = q.debtToEquity
      const r = rateMetric('debtToEquity', v)
      return {
        title: 'Debt-to-Equity Ratio',
        what: "This compares how much a company owes (debt) to what shareholders actually own (equity). It's a core measure of financial risk — a heavily indebted company is more vulnerable if profits drop or interest rates rise.",
        context: v == null
          ? `Debt-to-equity isn't available for ${t} right now.`
          : `${t} has a debt-to-equity ratio of ${v.toFixed(1)}. ${r === 'good' ? "That's a conservative, low-debt balance sheet — generally lower financial risk." : r === 'bad' ? "That's a high level of debt relative to equity, which can amplify both gains and losses and adds financial risk, especially if interest rates rise." : "That's a moderate, fairly typical amount of leverage for most industries."}`,
      }
    }
    case 'trend': {
      const r = rateTrend(tech.trend)
      return {
        title: 'Price Trend',
        what: `This compares the current price to its ${tech.smaPeriod}-period moving average — the average closing price over the recent stretch of time shown on the chart. Price consistently above the average signals an uptrend; below signals a downtrend.`,
        context: tech.sma == null
          ? `Not enough price history in this range to calculate a reliable trend for ${t}. Try a longer time range.`
          : `${t} is currently trading ${q.price > tech.sma ? 'above' : 'below'} its ${tech.smaPeriod}-period average of ${fmt(tech.sma)}. ${r === 'good' ? "That's a bullish sign — the stock has been in an uptrend over this period." : r === 'bad' ? "That's a bearish sign — the stock has been in a downtrend over this period." : "Price is hovering near its average — the stock is moving sideways without a clear trend."}`,
      }
    }
    case 'momentum': {
      const r = rateMomentum(q.rangeChangePct)
      return {
        title: 'Momentum',
        what: "Momentum measures how strongly the price has moved over the selected time range. Strong positive momentum often (but not always) continues in the short term; strong negative momentum can signal a stock that's out of favor.",
        context: `${t} has moved ${q.rangeChangePct >= 0 ? '+' : ''}${q.rangeChangePct.toFixed(1)}% over this period. ${r === 'good' ? "That's strong positive momentum — buying interest has clearly outweighed selling." : r === 'bad' ? "That's a notable decline — selling pressure has outweighed buying over this period." : "That's fairly flat — no strong directional momentum either way recently."}`,
      }
    }
    case 'volatility': {
      const r = rateVolatility(tech.volatility)
      return {
        title: 'Volatility',
        what: "This measures how much the price has bounced around period-to-period, using the statistical spread (standard deviation) of returns. Higher volatility means bigger, more frequent price swings — more risk, but also more potential opportunity.",
        context: tech.volatility == null
          ? `Not enough price history to calculate volatility for ${t} in this range.`
          : `${t}'s price has swung by an average of about ${tech.volatility.toFixed(1)}% per period recently. ${r === 'good' ? "That's relatively low volatility — a steadier ride than average." : r === 'bad' ? "That's high volatility — expect larger, more frequent price swings than a typical stock." : "That's a moderate, fairly typical level of price movement."}`,
      }
    }
    case 'rsi': {
      const r = rateRSI(tech.rsi)
      return {
        title: 'RSI (Relative Strength Index)',
        what: "RSI is a 0–100 scale that measures how fast and how far a price has recently moved, based on the size of its gains vs. its losses. Above 70 is traditionally considered 'overbought' (may be due for a pullback); below 30 is 'oversold' (may be due for a bounce). It's a momentum signal, not a guarantee.",
        context: tech.rsi == null
          ? `Not enough recent price data to calculate RSI for ${t} in this range. Try a range with more data points.`
          : `${t}'s RSI is currently ${tech.rsi.toFixed(0)}. ${r === 'bad' ? "That's in overbought territory — the stock has risen quickly and could be due for a pause or pullback." : r === 'good' ? "That's in oversold territory — the stock has fallen quickly, which some traders see as a potential rebound opportunity (though it can also mean the decline continues)." : "That's a neutral reading — no strong overbought or oversold signal right now."}`,
      }
    }
    case 'range52': {
      return {
        title: '52-Week Range Position',
        what: "This shows where the current price sits between its lowest and highest points over the past year — a quick way to see if a stock is trading near the top, bottom, or middle of its recent range.",
        context: `${t} is at ${tech.range52Pct.toFixed(0)}% of its 52-week range (0% = the 52-week low, 100% = the 52-week high). ${tech.range52Pct > 85 ? "It's trading near its 52-week high — a sign of strong recent momentum, though it also means less room to run before hitting new highs." : tech.range52Pct < 15 ? "It's trading near its 52-week low — this can mean the stock is out of favor, or it can be a potential value opportunity. Worth investigating why." : "It's trading in the middle of its 52-week range — neither near a high nor a low."}`,
      }
    }
    default:
      return { title: '', what: '', context: '' }
  }
}

// ═══════════════════════════ Shared UI pieces ═══════════════════════════

function MetricCard({
  label, value, rating, ratingLabels = RATING_LABEL, barPct, onInfo,
}: {
  label: string; value: string; rating: Rating | null
  ratingLabels?: Record<Rating, string>; barPct?: number; onInfo: () => void
}) {
  const c = rating ? COLORS[rating] : null
  return (
    <div className="p-3 rounded-xl flex flex-col"
      style={{ background: c ? c.bg : 'var(--surface)', border: `1px solid ${c ? c.border : 'var(--border)'}` }}>
      <div className="flex items-start justify-between gap-1 mb-1">
        <div className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{label}</div>
        {rating && c && (
          <span className="text-xs font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
            style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
            {ratingLabels[rating]}
          </span>
        )}
      </div>
      <div className="text-xl font-black" style={{ color: c ? c.text : 'var(--foreground)' }}>{value}</div>
      {barPct != null && barPct > 0 && (
        <div style={{ height: 4, background: 'var(--border)', borderRadius: 2, marginTop: 6, marginBottom: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '100%', background: c ? c.text : 'var(--accent)', borderRadius: 2, transform: `scaleX(${Math.min(100, barPct) / 100})`, transformOrigin: 'left', transition: 'transform 0.6s ease' }} />
        </div>
      )}
      <button onClick={onInfo}
        className="text-xs font-bold flex items-center gap-1 mt-2 self-start"
        style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        ⓘ In depth
      </button>
    </div>
  )
}

function InfoModal({ info, onClose }: { info: InfoContent; onClose: () => void }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(10,26,47,0.55)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface)', borderRadius: 16, maxWidth: 440, width: '100%',
        maxHeight: '80vh', overflowY: 'auto', padding: 24,
        border: '1px solid var(--border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="font-black text-lg" style={{ letterSpacing: '-0.02em' }}>{info.title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--muted)', lineHeight: 1, flexShrink: 0 }}>✕</button>
        </div>
        <div className="text-sm leading-relaxed mb-4" style={{ color: 'var(--foreground-secondary)' }}>{info.what}</div>
        <div className="rounded-xl p-3.5 text-sm leading-relaxed" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent)' }}>For this stock, right now</div>
          {info.context}
        </div>
      </div>
    </div>
  )
}

export function StockResearcher() {
  const [tickerInput, setTickerInput] = useState('')
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [range, setRange] = useState('1M')
  const [tab, setTab] = useState<Tab>('overview')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [activeInfo, setActiveInfo] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  // AI state
  const [analysis, setAnalysis] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [qaHistory, setQaHistory] = useState<QA[]>([])
  const [customQ, setCustomQ] = useState('')
  const [askingQ, setAskingQ] = useState(false)

  useEffect(() => {
    if (!activeInfo) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setActiveInfo(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [activeInfo])

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

  function askInAiTab(q: string) {
    setTab('ai')
    askQuestion(q)
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

  // Technical indicators (computed from whatever price history is loaded)
  const smaPeriod = Math.min(20, Math.max(3, Math.floor(prices.length / 2)))
  const sma = computeSMA(prices, smaPeriod)
  const trend: Trend | null = sma == null || !quote ? null
    : quote.price > sma * 1.01 ? 'up' : quote.price < sma * 0.99 ? 'down' : 'flat'
  const rsi = computeRSI(prices, 14)
  const volatility = computeVolatility(prices)
  const tech = { trend, smaPeriod, sma, rsi, volatility, range52Pct }

  const infoModal = activeInfo && quote ? getMetricInfo(activeInfo, quote, tech) : null

  return (
    <div className="card flex flex-col gap-0 overflow-hidden" style={{ padding: 0 }}>

      {infoModal && <InfoModal info={infoModal} onClose={() => setActiveInfo(null)} />}

      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
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
          style={{ borderBottom: '1px solid var(--border)' }}>
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
                    style={{ background: 'var(--background)', color: 'var(--muted)', border: '1px solid var(--border)' }}>
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
        <div className="flex" style={{ borderBottom: '1px solid var(--border)' }}>
          {([
            ['overview', '📊 Overview'],
            ['technicals', '📈 Technicals'],
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
                      border: `1px solid ${range === r ? 'var(--accent)' : 'var(--border)'}`,
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
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', zIndex: 10 }}>
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
                  style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
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

          {/* ════════════ TECHNICALS ════════════ */}
          {tab === 'technicals' && (<>

            <div>
              <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Trend & Momentum
              </div>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  label="Price Trend"
                  value={trend ? TREND_LABEL[rateTrend(trend)!] : 'N/A'}
                  rating={rateTrend(trend)}
                  ratingLabels={TREND_LABEL}
                  onInfo={() => setActiveInfo('trend')}
                />
                <MetricCard
                  label={`Momentum (${range})`}
                  value={`${quote.rangeChangePct >= 0 ? '+' : ''}${quote.rangeChangePct.toFixed(1)}%`}
                  rating={rateMomentum(quote.rangeChangePct)}
                  ratingLabels={MOMENTUM_LABEL}
                  onInfo={() => setActiveInfo('momentum')}
                />
                <MetricCard
                  label="RSI (14)"
                  value={rsi != null ? rsi.toFixed(0) : 'N/A'}
                  rating={rateRSI(rsi)}
                  ratingLabels={RSI_LABEL}
                  onInfo={() => setActiveInfo('rsi')}
                />
                <MetricCard
                  label="Volatility"
                  value={volatility != null ? `${volatility.toFixed(1)}%` : 'N/A'}
                  rating={rateVolatility(volatility)}
                  ratingLabels={VOL_LABEL}
                  onInfo={() => setActiveInfo('volatility')}
                />
              </div>
            </div>

            <div>
              <div className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: 'var(--accent)' }}>
                Range Position
              </div>
              <div className="grid grid-cols-1 gap-2">
                <MetricCard
                  label="52-Week Range Position"
                  value={`${range52Pct.toFixed(0)}%`}
                  rating={range52Pct > 85 ? 'bad' : range52Pct < 15 ? 'good' : 'neutral'}
                  ratingLabels={{ good: 'Near Low', bad: 'Near High', neutral: 'Mid-Range' }}
                  onInfo={() => setActiveInfo('range52')}
                />
              </div>
            </div>

            <button className="w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: 'rgba(91,106,240,0.08)', border: '1px solid rgba(91,106,240,0.2)', color: 'var(--accent)', cursor: 'pointer' }}
              onClick={() => askInAiTab(`Give me an in-depth technical analysis of ${quote.ticker}'s recent chart — the trend, momentum, RSI, and volatility — and what it suggests for short-term direction. Explain it for a beginner.`)}>
              🔬 Ask AI to Explain This Chart →
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
                  {quote.pe != null && (
                    <MetricCard label="P/E Ratio (TTM)" value={quote.pe.toFixed(1)} rating={rateMetric('pe', quote.pe)} onInfo={() => setActiveInfo('pe')} />
                  )}
                  {quote.forwardPe != null && (
                    <MetricCard label="Forward P/E" value={quote.forwardPe.toFixed(1)} rating={rateMetric('forwardPe', quote.forwardPe)} onInfo={() => setActiveInfo('forwardPe')} />
                  )}
                  {quote.eps != null && (
                    <MetricCard label="EPS (TTM)" value={`$${quote.eps.toFixed(2)}`} rating={null} onInfo={() => setActiveInfo('eps')} />
                  )}
                  {quote.marketCap != null && (
                    <MetricCard label="Market Cap" value={fmtBig(quote.marketCap)} rating={null} onInfo={() => setActiveInfo('marketCap')} />
                  )}
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
                  {quote.revenueGrowth != null && (
                    <MetricCard label="Revenue Growth" value={fmtPct(quote.revenueGrowth, true)} rating={rateMetric('revenueGrowth', quote.revenueGrowth)}
                      ratingLabels={GROWTH_LABEL} barPct={Math.min(100, Math.max(0, quote.revenueGrowth * 100 * 2.5))} onInfo={() => setActiveInfo('revenueGrowth')} />
                  )}
                  {quote.profitMargin != null && (
                    <MetricCard label="Profit Margin" value={fmtPct(quote.profitMargin, true)} rating={rateMetric('profitMargin', quote.profitMargin)}
                      ratingLabels={GROWTH_LABEL} barPct={Math.min(100, Math.max(0, quote.profitMargin * 100 * 2))} onInfo={() => setActiveInfo('profitMargin')} />
                  )}
                  {quote.dividendYield != null && (
                    <MetricCard label="Dividend Yield" value={fmtPct(quote.dividendYield, true)} rating={null} onInfo={() => setActiveInfo('dividendYield')} />
                  )}
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
                  {quote.beta != null && (
                    <MetricCard label="Beta" value={quote.beta.toFixed(2)} rating={rateMetric('beta', quote.beta)} ratingLabels={RISK_LABEL} onInfo={() => setActiveInfo('beta')} />
                  )}
                  {quote.debtToEquity != null && (
                    <MetricCard label="Debt / Equity" value={quote.debtToEquity.toFixed(1)} rating={rateMetric('debtToEquity', quote.debtToEquity)} ratingLabels={RISK_LABEL} onInfo={() => setActiveInfo('debtToEquity')} />
                  )}
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
                    style={{ background: i === 0 ? 'rgba(91,106,240,0.06)' : 'var(--background)', border: '1px solid var(--border)' }}>
                    {sec.header && <div className="text-sm font-bold mb-2">{sec.header}</div>}
                    <div className="text-sm leading-relaxed" style={{ color: 'var(--foreground)', whiteSpace: 'pre-wrap' }}>
                      {parseMarkdown(sec.body.trim())}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border)' }} />

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
                      background: 'var(--background)', border: '1px solid var(--border)',
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
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', width: 'fit-content' }}>
                        <span style={{ width: 12, height: 12, border: '2px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>Thinking…</span>
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed px-3 py-2.5 rounded-2xl rounded-tl-sm"
                        style={{ background: 'var(--background)', border: '1px solid var(--border)', whiteSpace: 'pre-wrap' }}>
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
