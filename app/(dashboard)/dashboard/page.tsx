'use client'
import { useEffect, useState, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'
import { FinancialHealthScore } from '@/components/FinancialHealthScore'
import { TourOverlay } from '@/components/TourOverlay'

const fmt  = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

type Transaction = { id: string; merchant?: string; name?: string; category?: string; amount: number; type: string; date: string }
type Goal        = { id: string; name: string; type: string; target_amount: number; current_amount: number }
type Debt        = { id: string; name: string; type: string; balance: number; interest_rate: number; minimum_payment: number }

const GOAL_COLORS = ['var(--nx-navy-700)', 'var(--nx-gold-500)', 'var(--nx-pos-500)', 'var(--nx-neg-500)', '#8b5cf6']
const DEBT_ICONS: Record<string, string> = {
  credit_card: '💳', student_loan: '🎓', auto_loan: '🚗',
  personal_loan: '💵', mortgage: '🏠', medical: '🏥', other: '📄',
}

// ── Widget catalog ─────────────────────────────────────────────────
type WidgetId = 'greeting' | 'breakdown' | 'sparkline' | 'health' | 'stats' | 'cashflow' | 'goals' | 'recent' | 'bills'
type WidgetSize = 'full' | 'half'

const WIDGET_CATALOG: { id: WidgetId; label: string; desc: string; size: WidgetSize; emoji: string }[] = [
  { id: 'greeting',  label: 'Net Worth',          desc: 'Your total net worth with greeting',   size: 'full', emoji: '💎' },
  { id: 'breakdown', label: 'Breakdown',           desc: 'Assets vs debt visual breakdown',      size: 'full', emoji: '📊' },
  { id: 'sparkline', label: 'Portfolio Chart',     desc: '12-month portfolio trend line',        size: 'full', emoji: '📈' },
  { id: 'health',    label: 'Financial Health',    desc: 'Your financial health score 0–100',    size: 'full', emoji: '❤️' },
  { id: 'stats',     label: 'Key Stats',           desc: 'Income, investments, and debt cards',  size: 'full', emoji: '🔢' },
  { id: 'cashflow',  label: 'Cash Flow',           desc: 'Monthly income vs expenses donut',     size: 'half', emoji: '💸' },
  { id: 'goals',     label: 'Goals',               desc: 'Progress toward your financial goals', size: 'half', emoji: '🎯' },
  { id: 'recent',    label: 'Recent Activity',     desc: 'Your latest transactions',             size: 'half', emoji: '🕐' },
  { id: 'bills',     label: 'Upcoming Bills',      desc: 'Debt payments due this month',         size: 'half', emoji: '📅' },
]

const DEFAULT_LAYOUT: WidgetId[] = ['greeting', 'sparkline', 'health', 'stats', 'cashflow', 'goals', 'recent', 'bills']
const STORAGE_KEY = 'nexus-widget-layout-v2'

function loadLayout(): WidgetId[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
    if (Array.isArray(saved) && saved.length > 0) return saved
  } catch {}
  return DEFAULT_LAYOUT
}
function saveLayout(l: WidgetId[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(l))
}

// ── Sparkline ──────────────────────────────────────────────────────
function Sparkline() {
  const data = [120,122,121,124,128,127,131,130,134,138,137,141,144,142,146,150,148,152,156,154,158,162,161,165,168,172,170,175,178,184]
  const w = 1100, h = 140
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const pts = data.map((v, i) => [i * (w / (data.length - 1)), h - 6 - ((v - min) / range) * (h - 12)])
  const path = pts.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const area = `${path} L${w},${h} L0,${h} Z`
  const last = pts[pts.length - 1]
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: h }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--chart-line)" stopOpacity="0.18"/>
          <stop offset="1" stopColor="var(--chart-line)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill="url(#spark-fill)"/>
      <path d={path} fill="none" stroke="var(--chart-line)" strokeWidth="1.8"/>
      <circle cx={last[0]} cy={last[1]} r="4" fill="#C9A437"/>
    </svg>
  )
}

// ── Individual Widgets ─────────────────────────────────────────────
function GreetingWidget({ profile, budgetSummary, portfolioValue, totalDebt, router }: { profile: { full_name?: string } | null, budgetSummary: { net: number }, portfolioValue: number, totalDebt: number, router: ReturnType<typeof useRouter> }) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = profile?.full_name?.split(' ')[0] ?? 'there'
  const net = budgetSummary.net
  const netWorth = portfolioValue - totalDebt
  return (
    <div data-tour="tour-networth" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
      <div>
        <div className="eyebrow" style={{ marginBottom: 8 }}>{greeting}, {name}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1 }}>Net worth</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          <div className="num-display" style={{ fontSize: 52, lineHeight: 1 }}>{fmt(netWorth !== 0 ? netWorth : portfolioValue)}</div>
          {net !== 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="num" style={{ fontWeight: 600, fontSize: 14, color: net >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)' }}>{net >= 0 ? '+' : '−'}{fmt(Math.abs(net))}</span>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>this month</span>
            </div>
          )}
        </div>
      </div>
      <button className="btn-primary" onClick={() => router.push('/plan')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg>
        Ask Nexus
      </button>
    </div>
  )
}

function BreakdownWidget({ portfolioValue, totalDebt, router }: { portfolioValue: number, totalDebt: number, router: ReturnType<typeof useRouter> }) {
  const netWorth = portfolioValue - totalDebt
  const total = portfolioValue + totalDebt
  const investPct = total > 0 ? (portfolioValue / total) * 100 : 0
  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="eyebrow">Net Worth Breakdown</div>
        <button onClick={() => router.push('/portfolio')} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>See portfolio →</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }} className="responsive-3col">
        {[
          { label: 'Investments', value: portfolioValue,    color: 'var(--foreground)',   sub: 'portfolio value' },
          { label: 'Total Debt',  value: totalDebt,         color: totalDebt > 0 ? 'var(--nx-neg-500)' : 'var(--nx-pos-500)', sub: totalDebt > 0 ? 'outstanding' : 'debt free 🎉' },
          { label: 'Net Worth',   value: Math.abs(netWorth),color: netWorth >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)', sub: netWorth >= 0 ? 'assets > debts' : 'debts > assets' },
        ].map(r => (
          <div key={r.label} style={{ padding: '14px', borderRadius: 10, background: 'var(--chart-inner-bg)', border: '1px solid var(--chart-inner-border)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>{r.label}</div>
            <div className="num-display" style={{ fontSize: 22, lineHeight: 1, color: r.color }}>{fmt(r.value)}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>{r.sub}</div>
          </div>
        ))}
      </div>
      {total > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>Assets vs Debt</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{Math.round(investPct)}% invested</span>
          </div>
          <div style={{ height: 6, background: 'var(--nx-neg-100)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${investPct}%`, background: 'var(--chart-line)', borderRadius: 999, transition: 'width 600ms' }} />
          </div>
        </div>
      )}
    </div>
  )
}

function SparklineWidget() {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div className="eyebrow">Portfolio · 12 months</div>
        <div style={{ display: 'flex', gap: 2, background: 'var(--nx-cream-100)', padding: 3, borderRadius: 6 }}>
          {['1M','3M','YTD','1Y','All'].map(p => (
            <span key={p} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 4, cursor: 'default', background: p === '1Y' ? 'var(--surface)' : 'transparent', fontWeight: p === '1Y' ? 600 : 400, color: p === '1Y' ? 'var(--foreground)' : 'var(--muted)', boxShadow: p === '1Y' ? 'var(--card-shadow)' : 'none' }}>{p}</span>
          ))}
        </div>
      </div>
      <Sparkline />
    </div>
  )
}

function StatsWidget({ budgetSummary, portfolioValue, totalDebt }: { budgetSummary: { income: number; expenses: number; net: number }, portfolioValue: number, totalDebt: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }} className="responsive-3col">
      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Income this month</div>
        <div className="num-display" style={{ fontSize: 28, lineHeight: 1, color: 'var(--nx-pos-500)' }}>{fmt(budgetSummary.income)}</div>
        {budgetSummary.income > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{fmt(budgetSummary.expenses)} spent · {fmt(budgetSummary.net)} saved</div>}
      </div>
      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Investments</div>
        <div className="num-display" style={{ fontSize: 28, lineHeight: 1 }}>{fmt(portfolioValue)}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{portfolioValue > 0 ? 'portfolio value' : 'no holdings yet'}</div>
      </div>
      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 8 }}>Total Debt</div>
        <div className="num-display" style={{ fontSize: 28, lineHeight: 1, color: totalDebt > 0 ? 'var(--nx-warn-500)' : 'var(--nx-pos-500)' }}>{fmt(totalDebt)}</div>
        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>{totalDebt > 0 ? 'total balance' : 'debt free 🎉'}</div>
      </div>
    </div>
  )
}

function CashFlowWidget({ budgetSummary, router }: { budgetSummary: { income: number; expenses: number; net: number; savingsRate: number }, router: ReturnType<typeof useRouter> }) {
  const { income, expenses, net } = budgetSummary
  return (
    <div className="card" style={{ padding: '22px 24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 4 }}>Monthly Cash Flow</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--foreground)', lineHeight: 1 }}>{income > 0 ? fmt(income) : '—'}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>income this month</div>
        </div>
        {income > 0 && (
          <div style={{ padding: '5px 10px', borderRadius: 99, background: net >= 0 ? 'rgba(45,138,92,0.12)' : 'rgba(199,62,62,0.12)', border: `1px solid ${net >= 0 ? 'rgba(45,138,92,0.25)' : 'rgba(199,62,62,0.25)'}`, fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: net >= 0 ? 'var(--nx-pos-700)' : 'var(--nx-neg-700)' }}>
            {net >= 0 ? '+' : ''}{fmt(net)}
          </div>
        )}
      </div>
      {income > 0 ? (() => {
        const sav = Math.max(0, net)
        const savPct = income > 0 ? Math.round((sav / income) * 100) : 0
        const expPct = income > 0 ? Math.round((expenses / income) * 100) : 0
        const r = 42, cx = 52, cy = 52, stroke = 11
        const circ = 2 * Math.PI * r
        const expArc = (expenses / income) * circ
        const savArc = (sav / income) * circ
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <svg width={104} height={104} viewBox="0 0 104 104" style={{ flexShrink: 0 }}>
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--nx-cream-200)" strokeWidth={stroke} />
              <circle cx={cx} cy={cy} r={r} fill="none" stroke="#C9A437" strokeWidth={stroke} strokeDasharray={`${expArc} ${circ - expArc}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
              {savArc > 0 && <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--chart-savings)" strokeWidth={stroke} strokeDasharray={`${savArc} ${circ - savArc}`} strokeDashoffset={circ * 0.25 - expArc} strokeLinecap="round" />}
              <text x={cx} y={cy - 5} textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="700" fontFamily="var(--font-mono)">{savPct}%</text>
              <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--muted)" fontSize="9">saved</text>
            </svg>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
              {[
                { label: 'Expenses', value: fmt(expenses), pct: expPct, color: '#C9A437' },
                { label: 'Saved',    value: fmt(sav),      pct: savPct, color: 'var(--chart-savings)' },
              ].map(row => (
                <div key={row.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: row.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: 'var(--muted)' }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--foreground)', fontWeight: 600 }}>{row.value}</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--nx-cream-200)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${row.pct}%`, background: row.color, borderRadius: 999, transition: 'width 600ms' }} />
                  </div>
                </div>
              ))}
              <button onClick={() => router.push('/budget')} style={{ marginTop: 2, fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', padding: 0 }}>View budget →</button>
            </div>
          </div>
        )
      })() : (
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Log income & expenses to see your cash flow.</p>
          <button onClick={() => router.push('/budget')} className="btn-secondary" style={{ fontSize: 12 }}>Go to Budget →</button>
        </div>
      )}
    </div>
  )
}

function GoalsWidget({ goals, dataLoaded, router }: { goals: Goal[], dataLoaded: boolean, router: ReturnType<typeof useRouter> }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Goals</h3>
        <button onClick={() => router.push('/goals')} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>See all</button>
      </div>
      {!dataLoaded || goals.length === 0 ? (
        <div>
          <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12 }}>Set your first financial goal to get started.</p>
          <button className="btn-secondary" onClick={() => router.push('/goals')} style={{ fontSize: 13 }}>+ Add goal</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {goals.map((g, i) => {
            const pct = g.target_amount ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
            return (
              <div key={g.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                  {g.target_amount ? <span className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>{fmt(g.current_amount)} / {fmt(g.target_amount)}</span> : <span style={{ fontSize: 12, color: 'var(--muted)' }}>No target</span>}
                </div>
                {g.target_amount > 0 && (
                  <div style={{ height: 5, background: 'var(--nx-cream-200)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: GOAL_COLORS[i % GOAL_COLORS.length], borderRadius: 999, transition: 'width 400ms' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function RecentWidget({ recentTxns, dataLoaded, router }: { recentTxns: Transaction[], dataLoaded: boolean, router: ReturnType<typeof useRouter> }) {
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Recent activity</h3>
        <button onClick={() => router.push('/transactions')} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>See all</button>
      </div>
      {!dataLoaded || recentTxns.length === 0 ? (
        <div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14 }}>No transactions logged yet.</p>
          <button className="btn-secondary" onClick={() => router.push('/budget')} style={{ fontSize: 13 }}>Log a transaction →</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {recentTxns.map((t, i) => (
            <div key={t.id} style={{ display: 'flex', alignItems: 'center', padding: '11px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name || t.merchant || 'Transaction'}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{t.category || t.type} · {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
              </div>
              <div className="num" style={{ fontSize: 14, fontWeight: 500, color: t.type === 'income' ? 'var(--nx-pos-500)' : 'var(--foreground)' }}>{t.type === 'income' ? '+' : '−'}{fmt(Math.abs(t.amount))}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function BillsWidget({ debts, dataLoaded, router }: { debts: Debt[], dataLoaded: boolean, router: ReturnType<typeof useRouter> }) {
  const upcomingBills = debts.filter(d => d.minimum_payment > 0)
  const totalDue = upcomingBills.reduce((s, d) => s + d.minimum_payment, 0)
  return (
    <div className="card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600 }}>Upcoming bills</h3>
        <button onClick={() => router.push('/debt')} style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>Manage →</button>
      </div>
      {!dataLoaded || upcomingBills.length === 0 ? (
        <div>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 14 }}>No debts tracked yet.</p>
          <button className="btn-secondary" onClick={() => router.push('/debt')} style={{ fontSize: 13 }}>Add a debt →</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {upcomingBills.slice(0, 4).map((d, i) => (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{DEBT_ICONS[d.type] ?? '📄'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{d.interest_rate}% APR · min payment</div>
                </div>
                <div className="num" style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-warn-500)', flexShrink: 0 }}>{fmtD(d.minimum_payment)}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total due</span>
            <span className="num" style={{ fontSize: 15, fontWeight: 700 }}>{fmtD(totalDue)}</span>
          </div>
        </>
      )}
    </div>
  )
}

// ── Widget Shell (edit mode wrapper) ──────────────────────────────
type DragHandlers = {
  draggable: boolean
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onDragEnd: () => void
}

function WidgetShell({ id, editMode, onRemove, dragHandlers, isDragging, isDragOver, children }: {
  id: WidgetId; editMode: boolean; onRemove: () => void
  dragHandlers: DragHandlers
  isDragging: boolean; isDragOver: boolean; children: React.ReactNode
}) {
  return (
    <div
      {...(editMode ? dragHandlers : {})}
      style={{
        position: 'relative',
        opacity: isDragging ? 0.4 : 1,
        outline: isDragOver ? '2px solid var(--nx-gold-500)' : 'none',
        outlineOffset: 4,
        borderRadius: 14,
        transition: 'opacity 150ms',
        cursor: editMode ? 'grab' : 'auto',
      }}
    >
      {editMode && (
        <>
          {/* Drag handle badge */}
          <div style={{
            position: 'absolute', top: -10, left: 12, zIndex: 20,
            background: 'var(--nx-navy-700)', borderRadius: 6, padding: '2px 8px',
            display: 'flex', alignItems: 'center', gap: 5, border: '1px solid var(--nx-navy-600)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--nx-navy-300)" strokeWidth={2.5}>
              <circle cx="9" cy="7" r="1.5" fill="var(--nx-navy-300)"/>
              <circle cx="15" cy="7" r="1.5" fill="var(--nx-navy-300)"/>
              <circle cx="9" cy="12" r="1.5" fill="var(--nx-navy-300)"/>
              <circle cx="15" cy="12" r="1.5" fill="var(--nx-navy-300)"/>
              <circle cx="9" cy="17" r="1.5" fill="var(--nx-navy-300)"/>
              <circle cx="15" cy="17" r="1.5" fill="var(--nx-navy-300)"/>
            </svg>
            <span style={{ fontSize: 10, color: 'var(--nx-navy-300)', fontWeight: 600 }}>drag</span>
          </div>
          {/* Remove button */}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove() }}
            style={{
              position: 'absolute', top: -10, right: 8, zIndex: 20,
              width: 22, height: 22, borderRadius: '50%',
              background: 'var(--nx-neg-500)', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 14, lineHeight: 1,
            }}
          >×</button>
        </>
      )}
      {children}
    </div>
  )
}

// ── Add Widget Panel ──────────────────────────────────────────────
function AddWidgetPanel({ layout, onAdd, onClose }: { layout: WidgetId[], onAdd: (id: WidgetId) => void, onClose: () => void }) {
  const hidden = WIDGET_CATALOG.filter(w => !layout.includes(w.id))
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      background: 'rgba(0,0,0,0.5)',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: '100%', maxWidth: 540,
        background: 'var(--surface)', borderRadius: '20px 20px 0 0',
        padding: '24px 24px 40px',
        border: '1px solid var(--border)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.25)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, color: 'var(--foreground)' }}>Add Widget</h3>
          <button onClick={onClose} style={{ background: 'var(--nx-cream-200)', border: 'none', borderRadius: '50%', width: 30, height: 30, cursor: 'pointer', fontSize: 18, color: 'var(--foreground-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
        </div>
        {hidden.length === 0 ? (
          <p style={{ fontSize: 14, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>All widgets are already on your dashboard.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {hidden.map(w => (
              <button key={w.id} onClick={() => { onAdd(w.id); onClose() }} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                borderRadius: 12, border: '1px solid var(--border)', background: 'var(--background)',
                cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-sans)', transition: 'all 140ms',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--nx-gold-500)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <span style={{ fontSize: 24 }}>{w.emoji}</span>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--foreground)' }}>{w.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{w.desc}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────────
function TourStarter({ onStart }: { onStart: () => void }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    if (searchParams.get('tour') === '1') {
      setTimeout(onStart, 800)
      router.replace('/dashboard')
    }
  }, [searchParams, router, onStart])
  return null
}

export default function DashboardPage() {
  const router = useRouter()
  const { profile, budgetSummary, totalDebt, portfolioValue, loading } = useUserData()
  const [showTour, setShowTour] = useState(false)
  const [recentTxns, setRecentTxns] = useState<Transaction[]>([])
  const [goals, setGoals]           = useState<Goal[]>([])
  const [debts, setDebts]           = useState<Debt[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  // Widget layout state
  const [layout, setLayout]       = useState<WidgetId[]>(DEFAULT_LAYOUT)
  const [editMode, setEditMode]   = useState(false)
  const [showAdd, setShowAdd]     = useState(false)
  const [draggingId, setDraggingId] = useState<WidgetId | null>(null)
  const [dragOverId, setDragOverId] = useState<WidgetId | null>(null)

  // Load layout from localStorage on mount
  useEffect(() => { setLayout(loadLayout()) }, [])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: txns }, { data: goalData }, { data: debtData }] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false }).limit(5),
        supabase.from('goals').select('*').eq('user_id', user.id).order('priority').limit(3),
        supabase.from('debts').select('*').eq('user_id', user.id),
      ])
      setRecentTxns(txns ?? [])
      setGoals(goalData ?? [])
      setDebts(debtData ?? [])
      setDataLoaded(true)
    }
    load()
  }, [])

  function removeWidget(id: WidgetId) {
    const next = layout.filter(w => w !== id)
    setLayout(next); saveLayout(next)
  }
  function addWidget(id: WidgetId) {
    const next = [...layout, id]
    setLayout(next); saveLayout(next)
  }
  function resetLayout() {
    setLayout(DEFAULT_LAYOUT); saveLayout(DEFAULT_LAYOUT)
  }

  // Drag handlers
  function onDragStart(id: WidgetId) { setDraggingId(id) }
  function onDragOver(e: React.DragEvent, id: WidgetId) { e.preventDefault(); setDragOverId(id) }
  function onDrop(e: React.DragEvent, targetId: WidgetId) {
    e.preventDefault()
    if (!draggingId || draggingId === targetId) { setDraggingId(null); setDragOverId(null); return }
    const next = [...layout]
    const from = next.indexOf(draggingId)
    const to   = next.indexOf(targetId)
    next.splice(from, 1)
    next.splice(to, 0, draggingId)
    setLayout(next); saveLayout(next)
    setDraggingId(null); setDragOverId(null)
  }
  function onDragEnd() { setDraggingId(null); setDragOverId(null) }

  function makeDragHandlers(id: WidgetId): DragHandlers {
    return {
      draggable: true,
      onDragStart: () => onDragStart(id),
      onDragOver:  (e: React.DragEvent) => onDragOver(e, id),
      onDrop:      (e: React.DragEvent) => onDrop(e, id),
      onDragEnd:   () => onDragEnd(),
    }
  }

  // Render a widget by id
  function renderWidget(id: WidgetId) {
    switch (id) {
      case 'greeting':  return <GreetingWidget profile={profile} budgetSummary={budgetSummary} portfolioValue={portfolioValue} totalDebt={totalDebt} router={router} />
      case 'breakdown': return <BreakdownWidget portfolioValue={portfolioValue} totalDebt={totalDebt} router={router} />
      case 'sparkline': return <SparklineWidget />
      case 'stats':     return <StatsWidget budgetSummary={budgetSummary} portfolioValue={portfolioValue} totalDebt={totalDebt} />
      case 'health':    return <FinancialHealthScore />
      case 'cashflow':  return <CashFlowWidget budgetSummary={budgetSummary} router={router} />
      case 'goals':     return <GoalsWidget goals={goals} dataLoaded={dataLoaded} router={router} />
      case 'recent':    return <RecentWidget recentTxns={recentTxns} dataLoaded={dataLoaded} router={router} />
      case 'bills':     return <BillsWidget debts={debts} dataLoaded={dataLoaded} router={router} />
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {[1,2,3].map(i => <div key={i} style={{ height: 80, borderRadius: 12, background: 'var(--nx-cream-200)' }} />)}
      </div>
    )
  }

  // Group half-size widgets into pairs for layout
  const fullWidgets = layout.filter(id => WIDGET_CATALOG.find(w => w.id === id)?.size === 'full')
  const halfWidgets = layout.filter(id => WIDGET_CATALOG.find(w => w.id === id)?.size === 'half')

  // Build ordered render list: preserve original order, pairing halves
  const renderOrder: { type: 'full' | 'pair'; ids: WidgetId[] }[] = []
  let i = 0
  const ordered = layout.filter(id => WIDGET_CATALOG.find(w => w.id === id)) // filter unknown ids
  while (i < ordered.length) {
    const id = ordered[i]
    const meta = WIDGET_CATALOG.find(w => w.id === id)
    if (!meta) { i++; continue }
    if (meta.size === 'full') {
      renderOrder.push({ type: 'full', ids: [id] })
      i++
    } else {
      // look for next half widget
      const next = ordered[i + 1]
      const nextMeta = next ? WIDGET_CATALOG.find(w => w.id === next) : null
      if (nextMeta?.size === 'half') {
        renderOrder.push({ type: 'pair', ids: [id, next] })
        i += 2
      } else {
        renderOrder.push({ type: 'pair', ids: [id] })
        i++
      }
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: editMode ? 32 : 24 }}>

      {/* ── Customize bar ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
        {editMode && (
          <>
            <button onClick={resetLayout} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', padding: '6px 12px' }}>
              Reset to default
            </button>
            <button onClick={() => setShowAdd(true)} className="btn-secondary" style={{ fontSize: 13, gap: 6 }}>
              <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> Add Widget
            </button>
          </>
        )}
        <button
          onClick={() => setEditMode(e => !e)}
          style={{
            fontSize: 13, fontWeight: 600, padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
            background: editMode ? 'var(--nx-gold-500)' : 'var(--nx-cream-200)',
            color: editMode ? 'var(--nx-navy-900)' : 'var(--foreground-secondary)',
            border: `1px solid ${editMode ? 'var(--nx-gold-400)' : 'var(--border)'}`,
            fontFamily: 'var(--font-sans)', transition: 'all 140ms', display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          {editMode ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Done
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
              Customize
            </>
          )}
        </button>
      </div>

      {/* ── Edit mode hint ── */}
      {editMode && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(201,164,55,0.08)', border: '1px solid rgba(201,164,55,0.2)', fontSize: 13, color: 'var(--nx-gold-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          Drag widgets to reorder · tap × to remove · tap Done when finished
        </div>
      )}

      {/* ── Widget canvas ── */}
      {layout.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--foreground)', marginBottom: 8 }}>Your dashboard is empty</h3>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 24 }}>Add widgets to build your perfect overview.</p>
          <button className="btn-primary" onClick={() => { setEditMode(true); setShowAdd(true) }}>Add widgets</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: editMode ? 32 : 24 }}>
          {renderOrder.map((row, ri) => (
            <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.type === 'pair' ? '1fr 1fr' : '1fr', gap: 18 }} className={row.type === 'pair' ? 'responsive-2col' : ''}>
              {row.ids.map(id => (
                <WidgetShell
                  key={id}
                  id={id}
                  editMode={editMode}
                  onRemove={() => removeWidget(id)}
                  dragHandlers={makeDragHandlers(id)}
                  isDragging={draggingId === id}
                  isDragOver={dragOverId === id}
                >
                  {renderWidget(id)}
                </WidgetShell>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* ── Add widget sheet ── */}
      {showAdd && <AddWidgetPanel layout={layout} onAdd={addWidget} onClose={() => setShowAdd(false)} />}

      {/* ── Tour starter (reads ?tour=1 param safely) ── */}
      <Suspense fallback={null}>
        <TourStarter onStart={() => setShowTour(true)} />
      </Suspense>

      {/* ── Interactive Tour ── */}
      {showTour && <TourOverlay onDone={() => setShowTour(false)} />}
    </div>
  )
}
