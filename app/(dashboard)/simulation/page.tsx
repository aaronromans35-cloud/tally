'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtShort = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(2)}%`

type Game = { id: string; name: string; class_id: string | null; start_cash: number; end_date: string | null; status: string; created_by: string }
type Participant = { id: string; game_id: string; user_id: string; cash: number }
type SimHolding = { id: string; ticker: string; shares: number; avg_cost: number; currentPrice?: number }
type SimTx = { id: string; ticker: string; action: string; shares: number; price: number; total: number; executed_at: string }
type LeaderEntry = { user_id: string; full_name: string; cash: number; portfolio_value: number; total: number; gain_pct: number }

export default function SimulationPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [activeGame, setActiveGame] = useState<Game | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [holdings, setHoldings] = useState<SimHolding[]>([])
  const [transactions, setTransactions] = useState<SimTx[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'portfolio' | 'trade' | 'leaderboard' | 'history'>('portfolio')

  // Trade state
  const [searchTicker, setSearchTicker] = useState('')
  const [quote, setQuote] = useState<{ ticker: string; name: string; price: number; change: number; changePct: number } | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)
  const [tradeAction, setTradeAction] = useState<'buy' | 'sell'>('buy')
  const [tradeShares, setTradeShares] = useState('')
  const [tradeMsg, setTradeMsg] = useState('')
  const [trading, setTrading] = useState(false)

  // Create game state
  const [showCreate, setShowCreate] = useState(false)
  const [gameName, setGameName] = useState('')
  const [gameEndDate, setGameEndDate] = useState('')
  const [startCash, setStartCash] = useState('10000')
  const [creating, setCreating] = useState(false)

  const portfolioValue = holdings.reduce((s, h) => s + h.shares * (h.currentPrice ?? h.avg_cost), 0)
  const totalValue = (participant?.cash ?? 0) + portfolioValue
  const startCashNum = activeGame?.start_cash ?? 10000
  const gainLoss = totalValue - startCashNum
  const gainPct = startCashNum > 0 ? (gainLoss / startCashNum) * 100 : 0

  const loadPrices = useCallback(async (hs: SimHolding[]) => {
    if (hs.length === 0) return hs
    const updated = await Promise.all(hs.map(async h => {
      try {
        const res = await fetch(`/api/quote?ticker=${h.ticker}&range=1M`)
        if (res.ok) {
          const q = await res.json()
          return { ...h, currentPrice: q.price }
        }
      } catch { /* ignore */ }
      return h
    }))
    return updated
  }, [])

  const loadGame = useCallback(async (game: Game, uid: string) => {
    const supabase = createClient()

    // Ensure participant exists
    let { data: part } = await supabase.from('sim_participants').select('*').eq('game_id', game.id).eq('user_id', uid).single()
    if (!part) {
      const { data: newPart } = await supabase.from('sim_participants').insert({ game_id: game.id, user_id: uid, cash: game.start_cash }).select().single()
      part = newPart
    }
    setParticipant(part)

    // Load holdings
    const { data: hs } = await supabase.from('sim_holdings').select('*').eq('game_id', game.id).eq('user_id', uid).gt('shares', 0)
    const withPrices = await loadPrices(hs ?? [])
    setHoldings(withPrices)

    // Load transactions
    const { data: txs } = await supabase.from('sim_transactions').select('*').eq('game_id', game.id).eq('user_id', uid).order('executed_at', { ascending: false }).limit(50)
    setTransactions(txs ?? [])

    // Load leaderboard
    const { data: parts } = await supabase.from('sim_participants').select('user_id, cash').eq('game_id', game.id)
    if (parts && parts.length > 0) {
      const ids = parts.map(p => p.user_id)
      const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', ids)
      const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]))

      const entries: LeaderEntry[] = await Promise.all(parts.map(async p => {
        const { data: pHoldings } = await supabase.from('sim_holdings').select('ticker,shares,avg_cost').eq('game_id', game.id).eq('user_id', p.user_id).gt('shares', 0)
        let pv = 0
        if (pHoldings && pHoldings.length > 0) {
          for (const h of pHoldings) {
            try {
              const res = await fetch(`/api/quote?ticker=${h.ticker}&range=1M`)
              if (res.ok) { const q = await res.json(); pv += h.shares * q.price }
              else pv += h.shares * h.avg_cost
            } catch { pv += h.shares * h.avg_cost }
          }
        }
        const total = p.cash + pv
        return { user_id: p.user_id, full_name: profileMap[p.user_id] ?? 'Trader', cash: p.cash, portfolio_value: pv, total, gain_pct: ((total - game.start_cash) / game.start_cash) * 100 }
      }))
      setLeaderboard(entries.sort((a, b) => b.total - a.total))
    }
  }, [loadPrices])

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    // Load games this user is involved in or created
    const { data: gamesData } = await supabase.from('sim_games').select('*').or(`created_by.eq.${user.id},id.in.(${
      (await supabase.from('sim_participants').select('game_id').eq('user_id', user.id)).data?.map(p => p.game_id).join(',') || 'null'
    })`).eq('status', 'active')

    const allGames = gamesData ?? []
    setGames(allGames)

    if (allGames.length > 0) {
      const game = allGames[0]
      setActiveGame(game)
      await loadGame(game, user.id)
    }

    setLoading(false)
  }, [loadGame])

  useEffect(() => { load() }, [load])

  async function createGame() {
    if (!userId || !gameName.trim()) return
    setCreating(true)
    const supabase = createClient()
    const { data: game } = await supabase.from('sim_games').insert({
      name: gameName.trim(),
      created_by: userId,
      start_cash: parseFloat(startCash) || 10000,
      end_date: gameEndDate || null,
    }).select().single()
    setCreating(false)
    setShowCreate(false)
    setGameName('')
    if (game) {
      setActiveGame(game)
      setGames(g => [game, ...g])
      await loadGame(game, userId)
    }
  }

  async function searchQuote() {
    if (!searchTicker.trim()) return
    setQuoteLoading(true)
    setQuote(null)
    setTradeMsg('')
    try {
      const res = await fetch(`/api/quote?ticker=${searchTicker.trim().toUpperCase()}&range=1M`)
      if (res.ok) setQuote(await res.json())
      else setTradeMsg('Ticker not found.')
    } catch { setTradeMsg('Failed to fetch quote.') }
    setQuoteLoading(false)
  }

  async function executeTrade() {
    if (!activeGame || !participant || !quote || !tradeShares) return
    const shares = parseFloat(tradeShares)
    if (isNaN(shares) || shares <= 0) { setTradeMsg('Enter a valid number of shares.'); return }

    setTrading(true)
    setTradeMsg('')
    const supabase = createClient()
    const total = shares * quote.price

    if (tradeAction === 'buy') {
      if (total > participant.cash) { setTradeMsg(`Not enough cash. You have ${fmt(participant.cash)}.`); setTrading(false); return }

      // Deduct cash
      await supabase.from('sim_participants').update({ cash: participant.cash - total }).eq('id', participant.id)

      // Upsert holding
      const existing = holdings.find(h => h.ticker === quote.ticker)
      if (existing) {
        const newShares = existing.shares + shares
        const newAvg = ((existing.shares * existing.avg_cost) + total) / newShares
        await supabase.from('sim_holdings').update({ shares: newShares, avg_cost: newAvg }).eq('id', existing.id)
      } else {
        await supabase.from('sim_holdings').insert({ game_id: activeGame.id, user_id: userId!, ticker: quote.ticker, shares, avg_cost: quote.price })
      }
    } else {
      const existing = holdings.find(h => h.ticker === quote.ticker)
      if (!existing || existing.shares < shares) { setTradeMsg(`You only have ${existing?.shares ?? 0} shares of ${quote.ticker}.`); setTrading(false); return }

      // Add cash
      await supabase.from('sim_participants').update({ cash: participant.cash + total }).eq('id', participant.id)

      // Reduce holding
      const newShares = existing.shares - shares
      if (newShares < 0.0001) {
        await supabase.from('sim_holdings').update({ shares: 0 }).eq('id', existing.id)
      } else {
        await supabase.from('sim_holdings').update({ shares: newShares }).eq('id', existing.id)
      }
    }

    // Record transaction
    await supabase.from('sim_transactions').insert({ game_id: activeGame.id, user_id: userId!, ticker: quote.ticker, action: tradeAction, shares, price: quote.price, total })

    setTradeMsg(`✅ ${tradeAction === 'buy' ? 'Bought' : 'Sold'} ${shares} shares of ${quote.ticker} at ${fmt(quote.price)}`)
    setTradeShares('')
    await loadGame(activeGame, userId!)
    setTrading(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title mb-0">📈 Stock Simulation</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Trade real stocks with virtual money. No real money involved.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {games.length > 1 && (
            <select className="input text-sm" style={{ width: 'auto' }} value={activeGame?.id ?? ''} onChange={async e => {
              const g = games.find(x => x.id === e.target.value)
              if (g && userId) { setActiveGame(g); setLoading(true); await loadGame(g, userId); setLoading(false) }
            }}>
              {games.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          )}
          <button className="btn-primary text-sm" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? '← Cancel' : '+ New Game'}
          </button>
        </div>
      </div>

      {/* Create game form */}
      {showCreate && (
        <div className="card max-w-md">
          <h3 className="font-semibold mb-4">Create a Simulation</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="label">Game Name</label>
              <input className="input" value={gameName} onChange={e => setGameName(e.target.value)} placeholder="e.g. Spring Challenge 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Starting Cash</label>
                <input className="input" type="number" value={startCash} onChange={e => setStartCash(e.target.value)} />
              </div>
              <div>
                <label className="label">End Date (optional)</label>
                <input className="input" type="date" value={gameEndDate} onChange={e => setGameEndDate(e.target.value)} />
              </div>
            </div>
            <button className="btn-primary justify-center" onClick={createGame} disabled={creating || !gameName.trim()}>
              {creating ? 'Creating…' : 'Start Simulation'}
            </button>
          </div>
        </div>
      )}

      {/* No game yet */}
      {!activeGame && !showCreate && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">📈</div>
          <h2 className="font-semibold mb-2">Start a Simulation</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>
            Trade real stocks with $10,000 in virtual cash. Compete with classmates or play solo.
          </p>
          <button className="btn-primary" onClick={() => setShowCreate(true)}>+ Create Your First Game</button>
        </div>
      )}

      {activeGame && (
        <>
          {/* Portfolio summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Cash', value: fmt(participant?.cash ?? 0), color: 'var(--green)' },
              { label: 'Portfolio', value: fmtShort(portfolioValue), color: 'var(--accent)' },
              { label: 'Total Value', value: fmtShort(totalValue), color: 'var(--foreground)' },
              { label: 'Gain / Loss', value: `${gainLoss >= 0 ? '+' : ''}${fmtShort(gainLoss)} (${fmtPct(gainPct)})`, color: gainLoss >= 0 ? 'var(--green)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'var(--background)', border: '1px solid var(--border)', width: 'fit-content' }}>
            {([['portfolio', '💼 Holdings'], ['trade', '⚡ Trade'], ['leaderboard', '🏆 Leaderboard'], ['history', '📋 History']] as const).map(([id, label]) => (
              <button key={id} onClick={() => setTab(id)}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ background: tab === id ? 'var(--surface)' : 'transparent', color: tab === id ? 'var(--foreground)' : 'var(--muted)', boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', border: 'none', cursor: 'pointer' }}>
                {label}
              </button>
            ))}
          </div>

          {/* Holdings tab */}
          {tab === 'portfolio' && (
            <div className="flex flex-col gap-3">
              {holdings.filter(h => h.shares > 0).length === 0 ? (
                <div className="card text-center py-12">
                  <div className="text-4xl mb-3">💼</div>
                  <h3 className="font-semibold mb-2">No holdings yet</h3>
                  <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Go to Trade to buy your first stock.</p>
                  <button className="btn-primary" onClick={() => setTab('trade')}>Start Trading →</button>
                </div>
              ) : (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="px-5 py-4 border-b font-semibold flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                    <span>Your Holdings</span>
                    <span className="text-sm font-normal" style={{ color: 'var(--muted)' }}>{activeGame.name}</span>
                  </div>
                  {holdings.filter(h => h.shares > 0).map((h, i) => {
                    const curPrice = h.currentPrice ?? h.avg_cost
                    const value = h.shares * curPrice
                    const gain = (curPrice - h.avg_cost) * h.shares
                    const gainP = h.avg_cost > 0 ? ((curPrice - h.avg_cost) / h.avg_cost) * 100 : 0
                    return (
                      <div key={h.id} className="flex items-center gap-4 px-5 py-4 border-b"
                        style={{ borderColor: 'var(--border)', borderBottomWidth: i === holdings.filter(x => x.shares > 0).length - 1 ? 0 : 1 }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                          style={{ background: 'rgba(91,106,240,0.1)', color: 'var(--accent)' }}>
                          {h.ticker.slice(0, 3)}
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{h.ticker}</div>
                          <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.shares} shares · avg {fmt(h.avg_cost)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{fmt(value)}</div>
                          <div className="text-xs" style={{ color: gain >= 0 ? 'var(--green)' : 'var(--red)' }}>
                            {gain >= 0 ? '+' : ''}{fmt(gain)} ({fmtPct(gainP)})
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Trade tab */}
          {tab === 'trade' && (
            <div className="flex flex-col gap-4 max-w-xl">
              <div className="card">
                <h3 className="font-semibold mb-4">Search a Stock</h3>
                <div className="flex gap-2">
                  <input className="input flex-1" value={searchTicker} onChange={e => setSearchTicker(e.target.value.toUpperCase())}
                    onKeyDown={e => e.key === 'Enter' && searchQuote()}
                    placeholder="e.g. AAPL, TSLA, MSFT" />
                  <button className="btn-primary" onClick={searchQuote} disabled={quoteLoading}>
                    {quoteLoading ? '…' : 'Search'}
                  </button>
                </div>

                {quote && (
                  <div className="mt-4 p-4 rounded-xl flex flex-col gap-4" style={{ background: 'var(--background)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-lg">{quote.ticker}</div>
                        <div className="text-sm" style={{ color: 'var(--muted)' }}>{quote.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">{fmt(quote.price)}</div>
                        <div className="text-sm" style={{ color: quote.change >= 0 ? 'var(--green)' : 'var(--red)' }}>
                          {quote.change >= 0 ? '+' : ''}{fmt(quote.change)} ({fmtPct(quote.changePct)})
                        </div>
                      </div>
                    </div>

                    {/* Buy/Sell toggle */}
                    <div className="flex gap-2">
                      {(['buy', 'sell'] as const).map(a => (
                        <button key={a} onClick={() => setTradeAction(a)}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
                          style={{ background: tradeAction === a ? (a === 'buy' ? 'var(--green)' : 'var(--red)') : 'var(--card-border)', color: tradeAction === a ? 'white' : 'var(--muted)', border: 'none', cursor: 'pointer' }}>
                          {a === 'buy' ? '📈 Buy' : '📉 Sell'}
                        </button>
                      ))}
                    </div>

                    <div>
                      <label className="label">Number of Shares</label>
                      <input className="input" type="number" min="0.001" step="0.001" value={tradeShares} onChange={e => setTradeShares(e.target.value)} placeholder="e.g. 5" />
                      {tradeShares && parseFloat(tradeShares) > 0 && (
                        <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          Total: {fmt(parseFloat(tradeShares) * quote.price)} · Cash after: {fmt((participant?.cash ?? 0) + (tradeAction === 'sell' ? 1 : -1) * parseFloat(tradeShares) * quote.price)}
                        </div>
                      )}
                    </div>

                    <button className="btn-primary justify-center" onClick={executeTrade} disabled={trading || !tradeShares}>
                      {trading ? 'Executing…' : `${tradeAction === 'buy' ? 'Buy' : 'Sell'} ${quote.ticker}`}
                    </button>

                    {tradeMsg && (
                      <div className="text-sm px-3 py-2 rounded-lg" style={{ background: tradeMsg.startsWith('✅') ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: tradeMsg.startsWith('✅') ? 'var(--green)' : 'var(--red)' }}>
                        {tradeMsg}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="card">
                <div className="text-sm font-medium mb-2">Available Cash</div>
                <div className="text-3xl font-bold" style={{ color: 'var(--green)' }}>{fmt(participant?.cash ?? 0)}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>of {fmtShort(activeGame.start_cash)} starting balance</div>
              </div>
            </div>
          )}

          {/* Leaderboard tab */}
          {tab === 'leaderboard' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b font-semibold" style={{ borderColor: 'var(--border)' }}>
                🏆 {activeGame.name} — Leaderboard
              </div>
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No participants yet. Share this game!</div>
              ) : (
                leaderboard.map((e, i) => {
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : null
                  return (
                    <div key={e.user_id} className="flex items-center gap-4 px-5 py-4 border-b" style={{ borderColor: 'var(--border)', borderBottomWidth: i === leaderboard.length - 1 ? 0 : 1 }}>
                      <div className="w-8 text-center font-bold" style={{ fontSize: medal ? 20 : 14, color: 'var(--muted)' }}>{medal ?? `#${i + 1}`}</div>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{ background: 'var(--accent)', color: 'white' }}>
                        {e.full_name?.charAt(0)?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold">{e.full_name} {e.user_id === userId ? '(you)' : ''}</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>Cash: {fmtShort(e.cash)} · Stocks: {fmtShort(e.portfolio_value)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{fmtShort(e.total)}</div>
                        <div className="text-xs" style={{ color: e.gain_pct >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPct(e.gain_pct)}</div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* History tab */}
          {tab === 'history' && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b font-semibold" style={{ borderColor: 'var(--border)' }}>Trade History</div>
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-sm" style={{ color: 'var(--muted)' }}>No trades yet.</div>
              ) : (
                transactions.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-4 px-5 py-3 border-b" style={{ borderColor: 'var(--border)', borderBottomWidth: i === transactions.length - 1 ? 0 : 1 }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ background: t.action === 'buy' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)', color: t.action === 'buy' ? 'var(--green)' : 'var(--red)' }}>
                      {t.action === 'buy' ? '↑' : '↓'}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{t.action === 'buy' ? 'Bought' : 'Sold'} {t.ticker}</div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{t.shares} shares @ {fmt(t.price)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold" style={{ color: t.action === 'buy' ? 'var(--red)' : 'var(--green)' }}>
                        {t.action === 'buy' ? '-' : '+'}{fmt(t.total)}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>
                        {new Date(t.executed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
