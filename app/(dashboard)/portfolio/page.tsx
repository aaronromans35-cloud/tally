'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { useUserData } from '@/lib/context/UserDataContext'
import { useWorkspace } from '@/lib/context/WorkspaceContext'
import { StockResearcher } from '@/components/StockResearcher'

type Holding = { id: string; ticker: string; name: string; shares: number; avg_cost_basis: number; account_type: string; asset_class: string }
type Quote = {
  ticker: string; name: string; price: number; change: number; changePct: number
  open: number; prevClose: number; high52: number; low52: number
  marketCap: number | null; volume: number | null
  rangeChange: number; rangeChangePct: number
  history: { date: string; price: number; volume: number }[]
}

const fmt  = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })
const fmt0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`
const fmtVol = (n: number) => n >= 1e9 ? `${(n/1e9).toFixed(1)}B` : n >= 1e6 ? `${(n/1e6).toFixed(1)}M` : n >= 1e3 ? `${(n/1e3).toFixed(1)}K` : String(n)

const ASSET_CLASSES = [
  { value: 'us_equity',    label: 'US Equity' },
  { value: 'intl_equity',  label: 'Intl Equity' },
  { value: 'bonds',        label: 'Bonds' },
  { value: 'commodities',  label: 'Commodities' },
  { value: 'real_estate',  label: 'Real Estate / REIT' },
  { value: 'cash',         label: 'Cash' },
  { value: 'crypto',       label: 'Crypto' },
  { value: 'other',        label: 'Other' },
]
const ACCOUNT_TYPES = [
  { value: 'taxable',         label: 'Taxable' },
  { value: 'traditional_ira', label: 'Traditional IRA' },
  { value: 'roth_ira',        label: 'Roth IRA' },
  { value: '401k',            label: '401(k)' },
  { value: 'hsa',             label: 'HSA' },
  { value: 'other',           label: 'Other' },
]
const COLORS = ['#5B6AF0', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#64748b']
const RANGES = ['1W', '1M', '3M', '6M', '1Y'] as const
type Range = typeof RANGES[number]

// Custom tooltip for the chart
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="px-3 py-2 rounded-lg shadow-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <p style={{ color: 'var(--muted)', fontSize: 11 }}>{label}</p>
      <p className="font-bold">{fmt(payload[0].value)}</p>
    </div>
  )
}

export default function PortfolioPage() {
  const { refresh } = useUserData()
  const { activeWorkspaceId } = useWorkspace()
  const [holdings, setHoldings]         = useState<Holding[]>([])
  const [quotes, setQuotes]             = useState<Record<string, Quote>>({})
  const [activeTicker, setActiveTicker] = useState<string | null>(null)
  const [range, setRange]               = useState<Range>('1M')
  const [tab, setTab]                   = useState<'portfolio' | 'add'>('portfolio')
  const [form, setForm]                 = useState({ ticker: '', name: '', shares: '', purchase_price: '', account_type: 'taxable', asset_class: 'us_equity' })
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [quotesLoading, setQuotesLoading] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const q = supabase.from('holdings').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    const { data, error: err } = await (activeWorkspaceId ? q.eq('workspace_id', activeWorkspaceId) : q.is('workspace_id', null))
    if (err) console.error('Load error:', err)
    const rows = data ?? []
    setHoldings(rows)
    if (rows.length > 0) {
      if (!activeTicker) setActiveTicker(rows[0].ticker)
      fetchQuotes(rows.map(h => h.ticker), range)
    }
  }, [activeWorkspaceId]) // eslint-disable-line

  async function fetchQuotes(tickers: string[], r: Range) {
    setQuotesLoading(true)
    const unique = [...new Set(tickers)]
    const results: Record<string, Quote> = {}
    await Promise.all(unique.map(async ticker => {
      try {
        const res = await fetch(`/api/quote?ticker=${ticker}&range=${r}`)
        if (res.ok) results[ticker] = await res.json()
      } catch { /* skip */ }
    }))
    setQuotes(results)
    setQuotesLoading(false)
  }

  useEffect(() => { load() }, [load])

  // When range changes, re-fetch for all loaded tickers
  useEffect(() => {
    if (holdings.length > 0) fetchQuotes(holdings.map(h => h.ticker), range)
  }, [range]) // eslint-disable-line

  async function addHolding(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    // Ensure profile row exists (holdings FK → profiles.id)
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

    const { error: insertError } = await supabase.from('holdings').insert({
      user_id: user.id,
      workspace_id: activeWorkspaceId ?? null,
      ticker: form.ticker.toUpperCase().trim(),
      name: form.name.trim() || form.ticker.toUpperCase().trim(),
      shares: parseFloat(form.shares),
      avg_cost_basis: parseFloat(form.purchase_price),
      account_type: form.account_type,
      asset_class: form.asset_class,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }

    const newTicker = form.ticker.toUpperCase().trim()
    setForm({ ticker: '', name: '', shares: '', purchase_price: '', account_type: 'taxable', asset_class: 'us_equity' })
    setLoading(false)
    setActiveTicker(newTicker)
    setTab('portfolio')
    await load()
    refresh()
  }

  async function deleteHolding(id: string, ticker: string) {
    const supabase = createClient()
    await supabase.from('holdings').delete().eq('id', id)
    if (activeTicker === ticker) setActiveTicker(holdings.find(h => h.id !== id)?.ticker ?? null)
    load()
    refresh()
  }

  const holdingsWithValue = holdings.map(h => {
    const q = quotes[h.ticker]
    const currentPrice = q?.price ?? h.avg_cost_basis
    const currentValue = currentPrice * h.shares
    const costBasis = h.avg_cost_basis * h.shares
    const gainLoss = currentValue - costBasis
    const gainLossPct = costBasis > 0 ? (gainLoss / costBasis) * 100 : 0
    return { ...h, currentPrice, currentValue, costBasis, gainLoss, gainLossPct, quote: q }
  })

  const totalValue    = holdingsWithValue.reduce((s, h) => s + h.currentValue, 0)
  const totalCost     = holdingsWithValue.reduce((s, h) => s + h.costBasis, 0)
  const totalGainLoss = totalValue - totalCost
  const totalGainPct  = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

  // Daily change — only meaningful when quotes are loaded
  const quotesReady   = Object.keys(quotes).length > 0
  const dailyChange   = holdingsWithValue.reduce((s, h) => s + h.shares * (h.quote?.change ?? 0), 0)
  const dailyChangePct = (totalValue - dailyChange) > 0
    ? (dailyChange / (totalValue - dailyChange)) * 100
    : 0

  const activeHolding = activeTicker ? holdingsWithValue.find(h => h.ticker === activeTicker) : null
  const activeQuote   = activeTicker ? quotes[activeTicker] : null
  const chartUp       = (activeQuote?.rangeChangePct ?? 0) >= 0
  const chartColor    = chartUp ? '#22c55e' : '#ef4444'

  const byAssetClass = Object.entries(
    holdingsWithValue.reduce((acc, h) => {
      acc[h.asset_class] = (acc[h.asset_class] || 0) + h.currentValue
      return acc
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1])

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">Portfolio</h1>
          {totalValue > 0 && (
            <div style={{ marginTop: 10 }}>
              {/* Total value */}
              <div className="num-display" style={{ fontSize: 44, lineHeight: 1, color: 'var(--nx-navy-900)' }}>
                {fmt0(totalValue)}
              </div>

              {/* Daily change row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
                {quotesLoading ? (
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Loading live prices…</span>
                ) : quotesReady ? (
                  <span className="num" style={{ fontSize: 15, fontWeight: 600, color: dailyChange >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)' }}>
                    {dailyChange >= 0 ? '+' : ''}{fmt(dailyChange)} ({fmtPct(dailyChangePct)}) today
                  </span>
                ) : (
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>Prices unavailable</span>
                )}

                {/* Separator dot */}
                {quotesReady && <span style={{ fontSize: 12, color: 'var(--muted)' }}>·</span>}

                {/* All-time gain */}
                <span className="num" style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500 }}>
                  <span style={{ color: totalGainLoss >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)', fontWeight: 600 }}>
                    {totalGainLoss >= 0 ? '+' : ''}{fmt0(totalGainLoss)} ({fmtPct(totalGainPct)})
                  </span>{' '}all time
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {tab === 'add' ? (
            <button className="btn-secondary" onClick={() => setTab('portfolio')}>← Back</button>
          ) : (
            <>
              {holdings.length > 0 && (
                <button className="btn-secondary" onClick={() => fetchQuotes(holdings.map(h => h.ticker), range)} disabled={quotesLoading}>
                  {quotesLoading ? '⟳ Updating…' : '⟳ Refresh prices'}
                </button>
              )}
              <button className="btn-primary" onClick={() => setTab('add')}>+ Add Holding</button>
            </>
          )}
        </div>
      </div>

      {/* Add Holding Form */}
      {tab === 'add' && (
        <div className="card max-w-lg">
          <h2 className="font-semibold mb-1">Add a Holding</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Enter the ticker and the price you paid per share.</p>
          {error && (
            <div className="mb-4 px-3 py-2 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>
          )}
          <form onSubmit={addHolding} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Ticker Symbol *</label>
                <input className="input" value={form.ticker} onChange={e => setForm(f => ({ ...f, ticker: e.target.value.toUpperCase() }))} required placeholder="e.g. VTI" />
              </div>
              <div>
                <label className="label">Name (optional)</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Vanguard Total Market" />
              </div>
              <div>
                <label className="label">Shares *</label>
                <input className="input" type="number" step="0.001" min="0.001" value={form.shares} onChange={e => setForm(f => ({ ...f, shares: e.target.value }))} required placeholder="10" />
              </div>
              <div>
                <label className="label">Price Paid / Share ($) *</label>
                <input className="input" type="number" step="0.01" min="0.01" value={form.purchase_price} onChange={e => setForm(f => ({ ...f, purchase_price: e.target.value }))} required placeholder="220.00" />
              </div>
              <div>
                <label className="label">Account Type</label>
                <select className="input" value={form.account_type} onChange={e => setForm(f => ({ ...f, account_type: e.target.value }))}>
                  {ACCOUNT_TYPES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Asset Class</label>
                <select className="input" value={form.asset_class} onChange={e => setForm(f => ({ ...f, asset_class: e.target.value }))}>
                  {ASSET_CLASSES.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </div>
            </div>
            {form.shares && form.purchase_price && (
              <div className="text-sm p-3 rounded-lg" style={{ background: 'var(--accent-light)', border: '1px solid rgba(91,106,240,0.2)' }}>
                Total cost basis: <strong>{fmt0(parseFloat(form.shares) * parseFloat(form.purchase_price))}</strong>
              </div>
            )}
            <button type="submit" className="btn-primary justify-center py-3" disabled={loading}>
              {loading ? 'Saving…' : 'Add Holding'}
            </button>
          </form>
        </div>
      )}

      {/* Empty state */}
      {tab === 'portfolio' && holdings.length === 0 && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📊</div>
          <h2 className="font-semibold mb-2">No holdings yet</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Add your investments to track live performance.</p>
          <button className="btn-primary" onClick={() => setTab('add')}>+ Add Your First Holding</button>
        </div>
      )}

      {/* Main portfolio view */}
      {tab === 'portfolio' && holdings.length > 0 && (
        <div className="flex flex-col gap-5">

          {/* Chart Panel */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Ticker tabs */}
            <div className="flex items-center gap-0 border-b overflow-x-auto" style={{ borderColor: 'var(--border)' }}>
              {holdingsWithValue.map((h, i) => {
                const q = h.quote
                const up = (q?.changePct ?? 0) >= 0
                const active = activeTicker === h.ticker
                return (
                  <button
                    key={h.ticker}
                    onClick={() => setActiveTicker(h.ticker)}
                    className="flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all border-b-2"
                    style={{
                      borderBottomColor: active ? chartColor : 'transparent',
                      background: active ? 'var(--accent-light)' : 'transparent',
                      color: active ? 'var(--foreground)' : 'var(--muted)',
                    }}>
                    <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-xs font-bold"
                      style={{ background: COLORS[i % COLORS.length], fontSize: 9 }}>
                      {h.ticker.slice(0, 2)}
                    </span>
                    <span>{h.ticker}</span>
                    {q && (
                      <span className="text-xs" style={{ color: up ? 'var(--green)' : 'var(--red)' }}>
                        {up ? '▲' : '▼'}{Math.abs(q.changePct).toFixed(2)}%
                      </span>
                    )}
                  </button>
                )
              })}
              <button onClick={() => setTab('add')} className="px-4 py-3 text-sm" style={{ color: 'var(--muted)', marginLeft: 'auto' }}>+ Add</button>
            </div>

            {/* Chart body */}
            <div className="p-5">
              {activeQuote ? (
                <>
                  {/* Price header */}
                  <div className="flex items-end gap-4 mb-4">
                    <div>
                      <div className="text-3xl font-bold tracking-tight">{fmt(activeQuote.price)}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm font-medium" style={{ color: activeQuote.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {activeQuote.change >= 0 ? '+' : ''}{fmt(activeQuote.change)} ({fmtPct(activeQuote.changePct)}) today
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>·</span>
                        <span className="text-sm font-medium" style={{ color: activeQuote.rangeChangePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {activeQuote.rangeChange >= 0 ? '+' : ''}{fmt(activeQuote.rangeChange)} ({fmtPct(activeQuote.rangeChangePct)}) {range}
                        </span>
                      </div>
                    </div>
                    <div className="ml-auto flex items-center gap-1">
                      {RANGES.map(r => (
                        <button key={r} onClick={() => setRange(r)}
                          className="px-3 py-1 rounded-lg text-xs font-medium transition-all"
                          style={{
                            background: range === r ? chartColor + '22' : 'transparent',
                            color: range === r ? chartColor : 'var(--muted)',
                            border: `1px solid ${range === r ? chartColor + '44' : 'transparent'}`,
                          }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Area chart */}
                  <div style={{ height: 220 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeQuote.history} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                            <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10, fill: 'var(--muted)' }} tickLine={false} axisLine={false}
                          tickFormatter={v => `$${v}`} width={60} />
                        {activeHolding && (
                          <ReferenceLine y={activeHolding.avg_cost_basis} stroke="var(--accent)" strokeDasharray="4 4" strokeWidth={1.5}
                            label={{ value: `Cost $${activeHolding.avg_cost_basis}`, position: 'insideTopRight', fontSize: 10, fill: 'var(--accent)' }} />
                        )}
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="price" stroke={chartColor} strokeWidth={2}
                          fill="url(#chartGrad)" dot={false} activeDot={{ r: 4, fill: chartColor }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats row under chart */}
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                    {[
                      { label: 'Open',       value: fmt(activeQuote.open) },
                      { label: 'Prev Close', value: fmt(activeQuote.prevClose) },
                      { label: '52W High',   value: fmt(activeQuote.high52) },
                      { label: '52W Low',    value: fmt(activeQuote.low52) },
                      { label: 'Volume',     value: activeQuote.volume ? fmtVol(activeQuote.volume) : '—' },
                      { label: 'Mkt Cap',    value: activeQuote.marketCap ? '$' + fmtVol(activeQuote.marketCap) : '—' },
                    ].map(s => (
                      <div key={s.label}>
                        <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
                        <div className="text-sm font-semibold">{s.value}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center" style={{ height: 300 }}>
                  {quotesLoading
                    ? <div className="flex flex-col items-center gap-3"><div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} /><p className="text-sm" style={{ color: 'var(--muted)' }}>Loading market data…</p></div>
                    : <p className="text-sm" style={{ color: 'var(--muted)' }}>Select a holding to view its chart</p>}
                </div>
              )}
            </div>
          </div>

          {/* Holdings table + Allocation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Holdings table */}
            <div className="lg:col-span-2 card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-semibold">Holdings</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="nx-table">
                  <thead>
                    <tr>
                      {['Asset', 'Price', 'Shares', 'Value', 'Cost', 'Gain/Loss', ''].map(h => (
                        <th key={h} className={h === '' ? 'w-8' : ''}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {holdingsWithValue.map((h, i) => (
                      <tr key={h.id}
                        className="cursor-pointer transition-colors"
                        style={{ borderBottom: '1px solid var(--border)', background: activeTicker === h.ticker ? 'var(--accent-light)' : 'transparent' }}
                        onClick={() => setActiveTicker(h.ticker)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                              style={{ background: COLORS[i % COLORS.length] }}>
                              {h.ticker.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold">{h.ticker}</div>
                              <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.account_type.replace(/_/g, ' ')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium">{fmt(h.currentPrice)}</div>
                          {h.quote && (
                            <div className="text-xs" style={{ color: h.quote.changePct >= 0 ? 'var(--green)' : 'var(--red)' }}>
                              {h.quote.changePct >= 0 ? '▲' : '▼'} {Math.abs(h.quote.changePct).toFixed(2)}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: 'var(--foreground-secondary)' }}>{h.shares}</td>
                        <td className="px-4 py-3 font-semibold">{fmt0(h.currentValue)}</td>
                        <td className="px-4 py-3" style={{ color: 'var(--muted)' }}>{fmt0(h.costBasis)}</td>
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: h.gainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {h.gainLoss >= 0 ? '+' : ''}{fmt0(h.gainLoss)}
                          </div>
                          <div className="text-xs" style={{ color: h.gainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {fmtPct(h.gainLossPct)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button onClick={e => { e.stopPropagation(); deleteHolding(h.id, h.ticker) }}
                            className="w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors hover:bg-red-100"
                            style={{ color: 'var(--muted)' }}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot style={{ borderTop: '2px solid var(--border)' }}>
                    <tr>
                      <td className="px-4 py-3 font-semibold" colSpan={3}>Total</td>
                      <td className="px-4 py-3 font-bold">{fmt0(totalValue)}</td>
                      <td className="px-4 py-3 font-semibold" style={{ color: 'var(--muted)' }}>{fmt0(totalCost)}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold" style={{ color: totalGainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {totalGainLoss >= 0 ? '+' : ''}{fmt0(totalGainLoss)}
                        </div>
                        <div className="text-xs" style={{ color: totalGainLoss >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {fmtPct(totalGainPct)}
                        </div>
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col gap-4">
              {/* Allocation */}
              <div className="card">
                <h2 className="font-semibold mb-4">Allocation</h2>
                <div className="flex flex-col gap-3">
                  {byAssetClass.map(([cls, val], i) => {
                    const pct = totalValue > 0 ? (val / totalValue) * 100 : 0
                    const label = cls.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    return (
                      <div key={cls}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                            {label}
                          </span>
                          <span className="font-medium">{pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Today's movers */}
              {Object.keys(quotes).length > 0 && (
                <div className="card">
                  <h2 className="font-semibold mb-3">Today&apos;s Movers</h2>
                  <div className="flex flex-col gap-2">
                    {holdingsWithValue
                      .filter(h => h.quote)
                      .sort((a, b) => (b.quote?.changePct ?? 0) - (a.quote?.changePct ?? 0))
                      .map(h => (
                        <div key={h.ticker} className="flex items-center justify-between text-sm cursor-pointer py-1"
                          onClick={() => setActiveTicker(h.ticker)}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{h.ticker}</span>
                            <span style={{ color: 'var(--muted)', fontSize: 11 }}>{fmt(h.quote!.price)}</span>
                          </div>
                          <span className="font-medium" style={{ color: (h.quote?.changePct ?? 0) >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {(h.quote?.changePct ?? 0) >= 0 ? '+' : ''}{h.quote?.changePct?.toFixed(2)}%
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Researcher */}
      <StockResearcher />
    </div>
  )
}
