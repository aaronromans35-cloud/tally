'use client'
import Link from 'next/link'
import { useUserData } from '@/lib/context/UserDataContext'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function DashboardPage() {
  const { profile, budgetSummary, totalDebt, portfolioValue, goalCount, loading } = useUserData()

  const name = profile?.full_name?.split(' ')[0] ?? 'there'
  const net = budgetSummary.net

  if (loading) {
    return (
      <div>
        <div className="h-8 w-48 rounded-lg animate-pulse mb-2" style={{ background: 'var(--card-border)' }} />
        <div className="h-4 w-56 rounded animate-pulse mb-8" style={{ background: 'var(--card-border)' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="stat-card">
              <div className="h-3 w-20 rounded animate-pulse mb-2" style={{ background: 'var(--card-border)' }} />
              <div className="h-6 w-28 rounded animate-pulse" style={{ background: 'var(--card-border)' }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">{greeting}, {name} 👋</h1>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>Here's your live financial snapshot</p>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Income (this month)', value: fmt(budgetSummary.income), color: 'var(--green)', icon: '↑' },
          { label: 'Expenses (this month)', value: fmt(budgetSummary.expenses), color: 'var(--red)', icon: '↓' },
          { label: 'Total Debt', value: fmt(totalDebt), color: totalDebt > 0 ? 'var(--yellow)' : 'var(--green)', icon: '🏦' },
          { label: 'Portfolio Value', value: fmt(portfolioValue), color: 'var(--accent)', icon: '📈' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Savings Rate */}
      {budgetSummary.income > 0 && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Monthly Savings Rate</span>
            <span className="font-bold" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {Math.round(budgetSummary.savingsRate)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${Math.max(0, Math.min(100, budgetSummary.savingsRate))}%`,
              background: net >= 0 ? 'var(--green)' : 'var(--red)',
            }} />
          </div>
          <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
            {fmt(Math.abs(net))} {net >= 0 ? 'remaining after expenses' : 'over budget'} this month
          </p>
        </div>
      )}

      {/* Net cash quick callout */}
      {budgetSummary.income > 0 && (
        <div className="card mb-6 flex items-center gap-4"
          style={{
            background: net >= 0 ? 'rgba(34,197,94,0.06)' : 'rgba(239,68,68,0.06)',
            borderColor: net >= 0 ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'
          }}>
          <span className="text-2xl">{net >= 0 ? '✅' : '⚠️'}</span>
          <div>
            <p className="font-semibold text-sm">
              {net >= 0 ? `You're saving ${fmt(net)} this month` : `You're ${fmt(Math.abs(net))} over budget`}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              {net >= 0
                ? 'Great work! Consider putting extra toward investments or goals.'
                : 'Review your budget to find areas to cut back.'}
            </p>
          </div>
        </div>
      )}

      {/* Module Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          {
            href: '/budget', icon: '💰', title: 'Budget Tracker',
            desc: budgetSummary.income > 0
              ? `${fmt(budgetSummary.income)} income · ${fmt(budgetSummary.expenses)} spent`
              : 'Track your spending by category'
          },
          {
            href: '/portfolio', icon: '📈', title: 'Portfolio & Markets',
            desc: portfolioValue > 0 ? `${fmt(portfolioValue)} total value` : 'Add holdings to track performance'
          },
          {
            href: '/plan', icon: '🤖', title: 'AI Financial Plan',
            desc: 'Get your personalized investment roadmap'
          },
          {
            href: '/debt', icon: '🏦', title: 'Debt Payoff',
            desc: totalDebt > 0 ? `${fmt(totalDebt)} total — see payoff plan` : 'No debts tracked'
          },
          { href: '/tax', icon: '🧾', title: 'Tax Assistant', desc: 'Estimate taxes & find savings' },
          {
            href: '/goals', icon: '🎯', title: 'Goals',
            desc: `${goalCount} goal${goalCount !== 1 ? 's' : ''} tracking`
          },
        ].map(m => (
          <Link key={m.href} href={m.href}
            className="card flex items-start gap-4 hover:border-indigo-500 transition-colors"
            style={{ textDecoration: 'none' }}>
            <span className="text-2xl">{m.icon}</span>
            <div>
              <div className="font-semibold text-sm mb-0.5">{m.title}</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>{m.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
