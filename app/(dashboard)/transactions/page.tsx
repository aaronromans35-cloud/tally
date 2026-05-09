'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useWorkspace } from '@/lib/context/WorkspaceContext'

type Transaction = {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  type: 'income' | 'expense'
  date: string
}

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const fmtDate = (date: string) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })

function getMonthOptions() {
  const now = new Date()
  const options: { value: string; label: string }[] = []
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

type FilterType = 'all' | 'income' | 'expense'

export default function TransactionsPage() {
  const router = useRouter()
  const { activeWorkspaceId } = useWorkspace()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const monthOptions = getMonthOptions()
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0].value)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const q = supabase.from('transactions').select('*').eq('user_id', user.id).order('date', { ascending: false })
      const { data, error } = await (activeWorkspaceId ? q.eq('workspace_id', activeWorkspaceId) : q.is('workspace_id', null))
      if (!error && data) setTransactions(data as Transaction[])
      setLoading(false)
    }
    load()
  }, [activeWorkspaceId])

  // Filter by selected month
  const monthFiltered = transactions.filter(t => {
    const txMonth = t.date?.slice(0, 7)
    return txMonth === selectedMonth
  })

  // Filter by type
  const typeFiltered = filter === 'all'
    ? monthFiltered
    : monthFiltered.filter(t => t.type === filter)

  // Filter by search
  const searchLower = search.toLowerCase()
  const displayed = searchLower
    ? typeFiltered.filter(t =>
        t.name?.toLowerCase().includes(searchLower) ||
        t.category?.toLowerCase().includes(searchLower)
      )
    : typeFiltered

  // Summary stats for selected month
  const monthIncome   = monthFiltered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = monthFiltered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const monthNet      = monthIncome - monthExpenses

  const filterButtons: { key: FilterType; label: string }[] = [
    { key: 'all',     label: 'All' },
    { key: 'income',  label: 'Income' },
    { key: 'expense', label: 'Expense' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="eyebrow" style={{ marginBottom: 6 }}>NEXUS</p>
          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.25rem)',
            fontWeight: 400,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
            color: 'var(--foreground)',
            margin: 0,
          }}>
            Transaction History
          </h1>
          <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 4 }}>
            Every income and expense you&apos;ve logged.
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => router.push('/budget')}
          style={{ whiteSpace: 'nowrap' }}
        >
          Log transaction →
        </button>
      </div>

      {/* ── Summary Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          {
            label: 'Income',
            value: fmt(monthIncome),
            color: 'var(--nx-pos-500)',
            bg: 'var(--nx-pos-50)',
            border: 'var(--nx-pos-100)',
          },
          {
            label: 'Expenses',
            value: fmt(monthExpenses),
            color: 'var(--nx-neg-500)',
            bg: 'var(--nx-neg-50)',
            border: 'var(--nx-neg-100)',
          },
          {
            label: 'Net',
            value: fmt(monthNet),
            color: monthNet >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)',
            bg: monthNet >= 0 ? 'var(--nx-pos-50)' : 'var(--nx-neg-50)',
            border: monthNet >= 0 ? 'var(--nx-pos-100)' : 'var(--nx-neg-100)',
          },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <p className="eyebrow" style={{ marginBottom: 6, color: stat.color, opacity: 0.8 }}>
              {stat.label}
            </p>
            <p
              className="num-display"
              style={{ fontSize: 22, color: stat.color, lineHeight: 1 }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* ── Controls ── */}
      <div className="card" style={{ padding: '16px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>

        {/* Month Selector */}
        <div style={{ flex: '1 1 160px', minWidth: 160 }}>
          <label className="label">Month</label>
          <select
            className="input"
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
          >
            {monthOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div style={{ flex: '2 1 220px', minWidth: 180 }}>
          <label className="label">Search</label>
          <input
            className="input"
            type="text"
            placeholder="Search by name or category…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Type Filter Pills */}
        <div style={{ display: 'flex', gap: 6, paddingBottom: 1 }}>
          {filterButtons.map(btn => {
            const active = filter === btn.key
            return (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'var(--font-sans)',
                  cursor: 'pointer',
                  border: active ? 'none' : '1px solid var(--nx-navy-200)',
                  background: active ? 'var(--nx-navy-800)' : 'var(--surface)',
                  color: active ? 'var(--nx-cream-50)' : 'var(--nx-navy-700)',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >
                {btn.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Transaction List ── */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Card header */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>
            Transactions
          </span>
          <span className="num" style={{ fontSize: 12, color: 'var(--muted)' }}>
            {displayed.length} {displayed.length === 1 ? 'result' : 'results'}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 14 }}>
            Loading transactions…
          </div>
        ) : displayed.length === 0 ? (
          /* ── Empty State ── */
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 400, color: 'var(--foreground)', marginBottom: 6 }}>
              No transactions found
            </p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 20 }}>
              {search || filter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Start tracking your finances by logging your first transaction.'}
            </p>
            <button className="btn-primary" onClick={() => router.push('/budget')}>
              Log transaction →
            </button>
          </div>
        ) : (
          /* ── Desktop Table (hidden on mobile) ── */
          <>
            {/* Desktop view */}
            <div style={{ overflowX: 'auto' }}>
              <table
                className="nx-table"
                style={{ display: 'none' }}
                aria-hidden="true"
              />
              {/* We render a custom table that is responsive */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr>
                    {['Date', 'Name', 'Category', 'Type', 'Amount'].map((h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: '10px 16px',
                          textAlign: i === 4 ? 'right' : 'left',
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase' as const,
                          color: 'var(--muted)',
                          background: 'var(--nx-cream-100)',
                          borderBottom: '1px solid var(--border)',
                          whiteSpace: 'nowrap' as const,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((t, idx) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: idx < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--nx-cream-50)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Date */}
                      <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' as const, color: 'var(--foreground-secondary)', fontSize: 13 }}>
                        {fmtDate(t.date)}
                      </td>
                      {/* Name */}
                      <td style={{ padding: '13px 16px', fontWeight: 500, color: 'var(--foreground)', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {t.name || '—'}
                        </span>
                      </td>
                      {/* Category */}
                      <td style={{ padding: '13px 16px' }}>
                        {t.category ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '3px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 500,
                            background: 'var(--nx-cream-200)',
                            color: 'var(--foreground-secondary)',
                            whiteSpace: 'nowrap' as const,
                          }}>
                            {t.category}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: 13 }}>—</span>
                        )}
                      </td>
                      {/* Type Badge */}
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '3px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 600,
                          background: t.type === 'income' ? 'var(--nx-pos-50)' : 'var(--nx-neg-50)',
                          color: t.type === 'income' ? 'var(--nx-pos-700)' : 'var(--nx-neg-700)',
                        }}>
                          <span style={{ fontSize: 10 }}>{t.type === 'income' ? '▲' : '▼'}</span>
                          {t.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      {/* Amount */}
                      <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                        <span
                          className="num"
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: t.type === 'income' ? 'var(--nx-pos-500)' : 'var(--foreground)',
                          }}
                        >
                          {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile Card List ── */}
            <div>
              {displayed.map((t, idx) => (
                <div
                  key={t.id + '-mobile'}
                  style={{
                    padding: '14px 16px',
                    borderBottom: idx < displayed.length - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {/* Icon */}
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    background: t.type === 'income' ? 'var(--nx-pos-50)' : 'var(--nx-neg-50)',
                    color: t.type === 'income' ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)',
                    fontWeight: 700,
                  }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: 'var(--foreground)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {t.name || '—'}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{fmtDate(t.date)}</span>
                      {t.category && (
                        <span style={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: '1px 7px',
                          borderRadius: 999,
                          background: 'var(--nx-cream-200)',
                          color: 'var(--foreground-secondary)',
                        }}>
                          {t.category}
                        </span>
                      )}
                      <span style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '1px 7px',
                        borderRadius: 999,
                        background: t.type === 'income' ? 'var(--nx-pos-50)' : 'var(--nx-neg-50)',
                        color: t.type === 'income' ? 'var(--nx-pos-700)' : 'var(--nx-neg-700)',
                      }}>
                        {t.type === 'income' ? 'Income' : 'Expense'}
                      </span>
                    </div>
                  </div>

                  {/* Amount */}
                  <span
                    className="num"
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      flexShrink: 0,
                      color: t.type === 'income' ? 'var(--nx-pos-500)' : 'var(--foreground)',
                    }}
                  >
                    {t.type === 'income' ? '+' : '−'}{fmt(t.amount)}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Footer CTA ── */}
      {!loading && transactions.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderRadius: 10,
          background: 'var(--nx-cream-100)',
          border: '1px solid var(--nx-cream-300)',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <p style={{ fontSize: 13, color: 'var(--foreground-secondary)', margin: 0 }}>
            Showing <strong style={{ color: 'var(--foreground)' }}>{displayed.length}</strong> of{' '}
            <strong style={{ color: 'var(--foreground)' }}>{transactions.length}</strong> total transactions
          </p>
          <button className="btn-secondary" onClick={() => router.push('/budget')}>
            Log transaction →
          </button>
        </div>
      )}
    </div>
  )
}
