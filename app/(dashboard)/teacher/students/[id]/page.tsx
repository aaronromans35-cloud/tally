'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Profile = { id: string; full_name: string; age: number | null; account_type: string; annual_income: number; monthly_expenses: number; risk_tolerance: string }
type Goal = { id: string; name: string; type: string; target_amount: number; current_amount: number; priority: number }
type Debt = { id: string; name: string; balance: number; interest_rate: number }
type Holding = { id: string; ticker: string; shares: number; avg_cost_basis: number }
type Transaction = { id: string; description: string; amount: number; type: string; category: string; date: string }
type Assignment = { id: string; title: string; module: string; points: number; completed: boolean; due_date: string | null; description: string }
type StreakData = { current_streak: number; longest_streak: number }
type AchievementData = { achievement_key: string }

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtDec = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })

function scoreColor(score: number) {
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--accent)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}
function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}

const GOAL_ICONS: Record<string, string> = {
  retirement: '🏖️', house: '🏠', education: '🎓',
  emergency_fund: '🛡️', travel: '✈️', savings: '💰',
  investment: '📈', other: '🎯',
}

const MODULE_COLORS: Record<string, string> = {
  budgeting: '#22c55e', investing: '#5B6AF0', debt: '#ef4444',
  goals: '#f59e0b', tax: '#8b5cf6', compound: '#3b82f6', general: '#64748b',
}

type Tab = 'overview' | 'goals' | 'portfolio' | 'budget' | 'assignments'

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [goals, setGoals] = useState<Goal[]>([])
  const [debts, setDebts] = useState<Debt[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [streak, setStreak] = useState<StreakData | null>(null)
  const [achievements, setAchievements] = useState<AchievementData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()

      const [
        { data: prof },
        { data: goalData },
        { data: debtData },
        { data: holdingData },
        { data: txnData },
        { data: streakData },
        { data: achieveData },
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', studentId).single(),
        supabase.from('goals').select('*').eq('user_id', studentId).is('workspace_id', null).order('priority'),
        supabase.from('debts').select('*').eq('user_id', studentId).is('workspace_id', null),
        supabase.from('holdings').select('*').eq('user_id', studentId).is('workspace_id', null),
        supabase.from('transactions').select('*').eq('user_id', studentId).is('workspace_id', null).order('date', { ascending: false }).limit(50),
        supabase.from('streaks').select('*').eq('user_id', studentId).single(),
        supabase.from('achievements').select('achievement_key').eq('user_id', studentId),
      ])

      setProfile(prof)
      setGoals(goalData ?? [])
      setDebts(debtData ?? [])
      setHoldings(holdingData ?? [])
      setTransactions(txnData ?? [])
      setStreak(streakData)
      setAchievements(achieveData ?? [])

      // Load assignments for this student across teacher's classes
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: teacherClasses } = await supabase.from('classes').select('id').eq('teacher_id', user.id)
        const classIds = teacherClasses?.map(c => c.id) ?? []
        if (classIds.length > 0) {
          const { data: assignData } = await supabase.from('assignments').select('*').in('class_id', classIds)
          const { data: completions } = await supabase.from('assignment_completions').select('assignment_id').eq('student_id', studentId)
          const completedIds = new Set(completions?.map(c => c.assignment_id) ?? [])
          setAssignments((assignData ?? []).map(a => ({ ...a, completed: completedIds.has(a.id) })))
        }
      }

      setLoading(false)
    }
    load()
  }, [studentId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card text-center py-12">
        <p style={{ color: 'var(--muted)' }}>Student not found.</p>
        <button className="btn-secondary mt-4" onClick={() => router.back()}>← Go back</button>
      </div>
    )
  }

  const totalDebt = debts.reduce((s, d) => s + d.balance, 0)
  const portfolioValue = holdings.reduce((s, h) => s + h.shares * h.avg_cost_basis, 0)
  const monthlyIncome = profile.annual_income / 12
  const monthlySavings = Math.max(0, monthlyIncome - profile.monthly_expenses)
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0
  const netWorth = portfolioValue - totalDebt + (monthlySavings * 3)

  // Health score
  const savingsScore   = Math.min(25, savingsRate >= 20 ? 25 : Math.round(savingsRate * 1.25))
  const debtScore      = Math.min(25, totalDebt === 0 ? 25 : totalDebt < 500 ? 20 : totalDebt < 2000 ? 12 : 5)
  const portfolioScore = Math.min(25, portfolioValue > 0 ? Math.min(25, Math.round(portfolioValue / 100)) : 0)
  const goalScore      = Math.min(25, goals.length > 0 ? Math.min(25, goals.length * 8) : 0)
  const healthScore    = savingsScore + debtScore + portfolioScore + goalScore
  const healthColor    = scoreColor(healthScore)

  const completedAssignments = assignments.filter(a => a.completed).length
  const totalPoints = assignments.filter(a => a.completed).reduce((s, a) => s + a.points, 0)

  // Budget from transactions this month
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const thisMonth = transactions.filter(t => new Date(t.date) >= startOfMonth)
  const monthIncome = thisMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const monthExpenses = thisMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const R = 36, C = 2 * Math.PI * R

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'goals', label: '🎯 Goals' },
    { id: 'portfolio', label: '📈 Portfolio' },
    { id: 'budget', label: '💰 Budget' },
    { id: 'assignments', label: '📋 Assignments' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Teacher banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium"
        style={{ background: 'rgba(91,106,240,0.08)', border: '1px solid rgba(91,106,240,0.25)', color: 'var(--accent)' }}>
        <span>👁️ Teacher View</span>
        <span style={{ color: 'var(--muted)', fontWeight: 400 }}>—</span>
        <span style={{ color: 'var(--muted)', fontWeight: 400 }}>Read-only view of {profile.full_name}'s dashboard</span>
        <button onClick={() => router.back()}
          className="ml-auto text-xs px-3 py-1.5 rounded-lg"
          style={{ background: 'rgba(91,106,240,0.15)', color: 'var(--accent)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          ← Back to Class
        </button>
      </div>

      {/* Student Header */}
      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: 'var(--accent)', color: 'white' }}>
          {profile.full_name?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
        <div className="flex-1">
          <h1 className="page-title mb-0">{profile.full_name}</h1>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            {profile.age && <span className="text-sm" style={{ color: 'var(--muted)' }}>Age {profile.age}</span>}
            {streak && streak.current_streak > 0 && (
              <span className="text-sm" style={{ color: 'var(--yellow)' }}>🔥 {streak.current_streak} day streak</span>
            )}
            {streak && streak.longest_streak > 0 && (
              <span className="text-sm" style={{ color: 'var(--muted)' }}>Best: {streak.longest_streak}d</span>
            )}
            <span className="text-sm" style={{ color: 'var(--muted)' }}>⭐ {achievements.length} achievements</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
              style={{ background: healthColor + '22', color: healthColor }}>
              {scoreLabel(healthScore)}
            </span>
          </div>
        </div>
        {/* Net Worth */}
        <div className="text-center hidden md:block">
          <div className="text-2xl font-bold" style={{ color: netWorth >= 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(netWorth)}</div>
          <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Net Worth</div>
        </div>
        {/* Health score circle */}
        <div style={{ position: 'relative', width: 72, height: 72, flexShrink: 0 }}>
          <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="36" cy="36" r={R} fill="none" stroke="var(--card-border)" strokeWidth={7} />
            <circle cx="36" cy="36" r={R} fill="none" stroke={healthColor} strokeWidth={7}
              strokeDasharray={C} strokeDashoffset={C * (1 - healthScore / 100)}
              strokeLinecap="round" />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: healthColor, lineHeight: 1 }}>{healthScore}</span>
            <span style={{ fontSize: 9, color: 'var(--muted)' }}>/ 100</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'var(--background)', border: '1px solid var(--border)', width: 'fit-content' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--surface)' : 'transparent',
              color: activeTab === tab.id ? 'var(--foreground)' : 'var(--muted)',
              boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none', cursor: 'pointer',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'overview' && (
        <div className="flex flex-col gap-5">
          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Monthly Income',   value: fmt(monthlyIncome),           color: 'var(--green)' },
              { label: 'Monthly Expenses', value: fmt(profile.monthly_expenses), color: 'var(--red)' },
              { label: 'Portfolio Value',  value: fmt(portfolioValue),           color: 'var(--accent)' },
              { label: 'Total Debt',       value: fmt(totalDebt),                color: totalDebt > 0 ? 'var(--yellow)' : 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Health score breakdown */}
          <div className="card">
            <h2 className="font-semibold mb-4">Financial Health Breakdown</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Savings Rate', score: savingsScore, detail: `${savingsRate.toFixed(0)}%` },
                { label: 'Debt Load',    score: debtScore,    detail: fmt(totalDebt) },
                { label: 'Investing',    score: portfolioScore, detail: fmt(portfolioValue) },
                { label: 'Goals Set',    score: goalScore,    detail: `${goals.length} goal${goals.length !== 1 ? 's' : ''}` },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: 'var(--background)' }}>
                  <div className="text-xl font-bold" style={{ color: scoreColor(item.score * 4) }}>{item.score}<span className="text-sm font-normal text-muted">/25</span></div>
                  <div className="text-xs font-medium mt-0.5">{item.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two-col: recent goals + debts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="font-semibold mb-3">Top Goals</h2>
              {goals.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No goals set yet.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {goals.slice(0, 4).map(g => {
                    const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
                    return (
                      <div key={g.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{GOAL_ICONS[g.type] ?? '🎯'} {g.name}</span>
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>
                            {g.target_amount > 0 ? `${Math.round(pct)}%` : fmt(g.current_amount)}
                          </span>
                        </div>
                        {g.target_amount > 0 && (
                          <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : 'var(--accent)' }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                  {goals.length > 4 && <p className="text-xs" style={{ color: 'var(--muted)' }}>+{goals.length - 4} more — see Goals tab</p>}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-semibold mb-3">Debts &amp; Holdings</h2>
              {debts.length === 0 && holdings.length === 0 ? (
                <p className="text-sm" style={{ color: 'var(--muted)' }}>No debts or holdings recorded.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {debts.map(d => (
                    <div key={d.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">💳 {d.name}</span>
                      <span style={{ color: 'var(--muted)' }}>{d.interest_rate}% APR</span>
                      <span style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt(d.balance)}</span>
                    </div>
                  ))}
                  {holdings.map(h => (
                    <div key={h.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium">📊 {h.ticker}</span>
                      <span style={{ color: 'var(--muted)' }}>{h.shares} shares</span>
                      <span style={{ color: 'var(--green)', fontWeight: 600 }}>{fmt(h.shares * h.avg_cost_basis)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assignments quick summary */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Assignments Progress</h2>
              <button onClick={() => setActiveTab('assignments')} className="text-xs" style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                See all →
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{completedAssignments}/{assignments.length}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: 'var(--green)' }}>{totalPoints}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Points Earned</div>
              </div>
              <div className="flex-1">
                <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: assignments.length > 0 ? `${(completedAssignments / assignments.length) * 100}%` : '0%', background: 'var(--accent)' }} />
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {assignments.length > 0 ? `${Math.round((completedAssignments / assignments.length) * 100)}% complete` : 'No assignments yet'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'goals' && (
        <div className="flex flex-col gap-4">
          {goals.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">🎯</div>
              <h3 className="font-semibold mb-2">No goals yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>This student hasn't set any financial goals.</p>
            </div>
          ) : (
            goals.map(g => {
              const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
              return (
                <div key={g.id} className="card">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 font-semibold text-base">
                        <span>{GOAL_ICONS[g.type] ?? '🎯'}</span>
                        <span>{g.name}</span>
                      </div>
                      <div className="text-xs mt-0.5 capitalize" style={{ color: 'var(--muted)' }}>{g.type.replace('_', ' ')}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold" style={{ color: pct >= 100 ? 'var(--green)' : 'var(--foreground)' }}>{fmt(g.current_amount)}</div>
                      {g.target_amount > 0 && <div className="text-xs" style={{ color: 'var(--muted)' }}>of {fmt(g.target_amount)}</div>}
                    </div>
                  </div>
                  {g.target_amount > 0 && (
                    <>
                      <div className="w-full h-3 rounded-full overflow-hidden mb-1" style={{ background: 'var(--card-border)' }}>
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--green)' : 'var(--accent)' }} />
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>{pct.toFixed(1)}% · {fmt(g.target_amount - g.current_amount)} remaining</div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── PORTFOLIO TAB ── */}
      {activeTab === 'portfolio' && (
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="text-3xl font-bold mb-1" style={{ color: 'var(--green)' }}>{fmtDec(portfolioValue)}</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Total Portfolio Value (at cost basis)</div>
          </div>
          {holdings.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📈</div>
              <h3 className="font-semibold mb-2">No holdings yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>This student hasn't added any investments.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b font-semibold" style={{ borderColor: 'var(--border)' }}>Holdings</div>
              {holdings.map((h, i) => (
                <div key={h.id} className="flex items-center gap-4 px-5 py-4 border-b"
                  style={{ borderColor: 'var(--border)', borderBottomWidth: i === holdings.length - 1 ? 0 : 1 }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm"
                    style={{ background: 'rgba(91,106,240,0.1)', color: 'var(--accent)' }}>
                    {h.ticker.slice(0, 3)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{h.ticker}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{h.shares} shares @ {fmtDec(h.avg_cost_basis)}/share</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold" style={{ color: 'var(--green)' }}>{fmtDec(h.shares * h.avg_cost_basis)}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>cost basis</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {debts.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b font-semibold" style={{ borderColor: 'var(--border)' }}>Debts</div>
              {debts.map((d, i) => (
                <div key={d.id} className="flex items-center gap-4 px-5 py-4 border-b"
                  style={{ borderColor: 'var(--border)', borderBottomWidth: i === debts.length - 1 ? 0 : 1 }}>
                  <div className="flex-1">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>{d.interest_rate}% APR</div>
                  </div>
                  <div className="font-bold" style={{ color: 'var(--red)' }}>{fmt(d.balance)}</div>
                </div>
              ))}
              <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--background)' }}>
                <span className="text-sm font-semibold">Total Debt</span>
                <span className="font-bold" style={{ color: 'var(--red)' }}>{fmt(totalDebt)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BUDGET TAB ── */}
      {activeTab === 'budget' && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Income This Month',   value: fmt(monthIncome),                      color: 'var(--green)' },
              { label: 'Spent This Month',    value: fmt(monthExpenses),                    color: 'var(--red)' },
              { label: 'Savings Rate',        value: `${savingsRate.toFixed(0)}%`,           color: savingsRate >= 20 ? 'var(--green)' : savingsRate >= 10 ? 'var(--yellow)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} className="card text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {transactions.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">💰</div>
              <h3 className="font-semibold mb-2">No transactions yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>This student hasn't logged any transactions.</p>
            </div>
          ) : (
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold">Recent Transactions</span>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>Last 50</span>
              </div>
              <div className="flex flex-col divide-y" style={{ borderColor: 'var(--border)' }}>
                {transactions.map(t => (
                  <div key={t.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{t.description}</div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
                        <span>{t.category}</span>
                        <span>·</span>
                        <span>{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                    <div className="font-semibold text-sm" style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                      {t.type === 'income' ? '+' : '-'}{fmtDec(t.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ASSIGNMENTS TAB ── */}
      {activeTab === 'assignments' && (
        <div className="flex flex-col gap-4">
          <div className="card">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{completedAssignments}/{assignments.length}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold" style={{ color: 'var(--green)' }}>{totalPoints}</div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>Points Earned</div>
              </div>
              <div className="flex-1">
                <div className="w-full h-4 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                  <div className="h-full rounded-full transition-all"
                    style={{ width: assignments.length > 0 ? `${(completedAssignments / assignments.length) * 100}%` : '0%', background: 'var(--accent)' }} />
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {assignments.length > 0 ? `${Math.round((completedAssignments / assignments.length) * 100)}% complete` : 'No assignments'}
                </div>
              </div>
            </div>
          </div>

          {assignments.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="font-semibold mb-2">No assignments yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Post assignments from the class page.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {assignments.map(a => (
                <div key={a.id} className="card flex items-center gap-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: a.completed ? 'var(--green)' : 'var(--card-border)' }}>
                    {a.completed && <span style={{ fontSize: 12, color: 'white' }}>✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium" style={{ textDecoration: a.completed ? 'line-through' : 'none', color: a.completed ? 'var(--muted)' : 'var(--foreground)' }}>
                      {a.title}
                    </div>
                    {a.description && <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{a.description}</div>}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="px-2 py-0.5 rounded text-xs text-white"
                        style={{ background: MODULE_COLORS[a.module] ?? '#64748b' }}>{a.module}</span>
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>⭐ {a.points} pts</span>
                      {a.due_date && (
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          📅 Due {new Date(a.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-semibold flex-shrink-0" style={{ color: a.completed ? 'var(--green)' : 'var(--muted)' }}>
                    {a.completed ? 'Done ✓' : 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
