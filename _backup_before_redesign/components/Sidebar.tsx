'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'

const NAV = [
  { href: '/dashboard', label: 'Overview', icon: '🏠' },
  { href: '/budget', label: 'Budget', icon: '💰' },
  { href: '/portfolio', label: 'Portfolio', icon: '📈' },
  { href: '/plan', label: 'AI Plan', icon: '🤖' },
  { href: '/debt', label: 'Debt Payoff', icon: '🏦' },
  { href: '/tax', label: 'Tax Assistant', icon: '🧾' },
  { href: '/goals', label: 'Goals', icon: '🎯' },
]

const BOTTOM_NAV = [
  { href: '/profile', label: 'Settings', icon: '⚙️' },
]

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { budgetSummary, totalDebt, portfolioValue, goalCount, loading } = useUserData()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-full border-r"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      {/* Logo */}
      <div className="px-5 py-5 border-b flex items-center gap-2.5" style={{ borderColor: 'var(--border)' }}>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
          style={{ background: 'var(--accent)' }}>N</div>
        <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--foreground)', letterSpacing: '-0.03em' }}>Nexus</span>
      </div>

      {/* Main Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <p className="section-title px-3 mb-2">Menu</p>
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: active ? 'var(--accent-light)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--foreground-secondary)',
              }}>
              <span className="w-5 text-center text-base">{icon}</span>
              {label}
              {active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </Link>
          )
        })}

        {/* Live Stats Panel */}
        <div className="mx-1 mt-4 rounded-xl p-3 flex flex-col gap-2.5"
          style={{ background: 'var(--accent-light)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>Live Overview</p>
          {loading ? (
            <div className="flex flex-col gap-2">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-4 rounded animate-pulse" style={{ background: 'rgba(99,102,241,0.15)' }} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Month Income</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--green)' }}>{fmt(budgetSummary.income)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Expenses</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--red)' }}>{fmt(budgetSummary.expenses)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Portfolio</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--accent)' }}>{fmt(portfolioValue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Total Debt</span>
                <span className="text-xs font-semibold" style={{ color: totalDebt > 0 ? 'var(--yellow)' : 'var(--green)' }}>{fmt(totalDebt)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Goals</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{goalCount} active</span>
              </div>
              {budgetSummary.income > 0 && (
                <div className="mt-0.5">
                  <div className="flex justify-between text-xs mb-1">
                    <span style={{ color: 'var(--muted)' }}>Savings rate</span>
                    <span style={{ color: budgetSummary.savingsRate >= 0 ? 'var(--green)' : 'var(--red)' }}>
                      {Math.round(budgetSummary.savingsRate)}%
                    </span>
                  </div>
                  <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.15)' }}>
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, budgetSummary.savingsRate))}%`,
                        background: budgetSummary.savingsRate >= 0 ? 'var(--green)' : 'var(--red)'
                      }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t flex flex-col gap-0.5" style={{ borderColor: 'var(--border)' }}>
        {BOTTOM_NAV.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{ color: active ? 'var(--accent)' : 'var(--foreground-secondary)' }}>
              <span className="w-5 text-center">{icon}</span>
              {label}
            </Link>
          )
        })}
        <button onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full transition-all text-left"
          style={{ color: 'var(--muted)' }}>
          <span className="w-5 text-center">🚪</span> Sign Out
        </button>
      </div>
    </aside>
  )
}
