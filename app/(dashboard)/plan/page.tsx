'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'

type Allocation = { label: string; pct: number; ticker: string; rationale: string }
type Projection = { year: number; lowValue: number; midValue: number; highValue: number }
type Plan = {
  summary: string
  allocation: Allocation[]
  priorities: string[]
  monthlySavingsTarget: number
  projections: Projection[]
  risks: string[]
  taxTip: string
  debtTip: string | null
  disclaimer: string
}
type Profile = {
  id: string; full_name: string; age: number; annual_income: number
  monthly_expenses: number; risk_tolerance: string; retirement_age: number
  tax_filing_status: string; state: string
}
type Debt = { id: string; name: string; balance: number; interest_rate: number; minimum_payment: number }
type Goal = { id: string; name: string; type: string; target_amount: number; current_amount: number }

const fmt0 = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const COLORS = ['#6366f1', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981', '#64748b']

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
  'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
  'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
  'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
  'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
  'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','Washington DC',
]

const GOAL_ICONS: Record<string, string> = {
  retirement: '🏖️', house: '🏠', education: '🎓',
  emergency_fund: '🛡️', travel: '✈️', other: '🎯',
}

export default function PlanPage() {
  const { refresh: refreshContext, totalDebt, portfolioValue, budgetSummary, goalCount } = useUserData()
  const [plan, setPlan]               = useState<Plan | null>(null)
  const [profile, setProfile]         = useState<Profile | null>(null)
  const [profileEdit, setProfileEdit] = useState<Partial<Profile>>({})
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile]   = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [lastGenerated, setLastGenerated]   = useState<string | null>(null)
  const [extraContext, setExtraContext]     = useState('')
  const [addingGoals, setAddingGoals]       = useState(false)
  const [goalsAdded, setGoalsAdded]         = useState(false)
  const [debts, setDebts]             = useState<Debt[]>([])
  const [goals, setGoals]             = useState<Goal[]>([])

  const loadProfile = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) {
      setProfile(data)
      setProfileEdit(data)
      if (!data.annual_income || !data.age) setEditingProfile(true)
    } else {
      setEditingProfile(true)
    }
  }, [])

  const loadLiveData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const [{ data: d }, { data: g }] = await Promise.all([
      supabase.from('debts').select('*').eq('user_id', user.id).order('interest_rate', { ascending: false }),
      supabase.from('goals').select('*').eq('user_id', user.id).order('priority'),
    ])
    setDebts(d ?? [])
    setGoals(g ?? [])
  }, [])

  useEffect(() => {
    loadProfile()
    loadLiveData()
    async function loadCached() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('financial_plans').select('*')
        .eq('user_id', user.id)
        .order('generated_at', { ascending: false })
        .limit(1).single()
      if (data) {
        setPlan(data.plan_json as Plan)
        setLastGenerated(new Date(data.generated_at).toLocaleString())
      }
    }
    loadCached()
  }, [loadProfile, loadLiveData])

  async function saveProfile() {
    setSavingProfile(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSavingProfile(false); return }
    await supabase.from('profiles').upsert({
      id: user.id,
      full_name:         profileEdit.full_name         ?? '',
      age:               Number(profileEdit.age)        || null,
      annual_income:     Number(profileEdit.annual_income) || null,
      monthly_expenses:  Number(profileEdit.monthly_expenses) || null,
      risk_tolerance:    profileEdit.risk_tolerance     ?? 'moderate',
      retirement_age:    Number(profileEdit.retirement_age) || 65,
      tax_filing_status: profileEdit.tax_filing_status  ?? 'single',
      state:             profileEdit.state              ?? '',
    }, { onConflict: 'id' })
    await loadProfile()
    setSavingProfile(false)
    setEditingProfile(false)
    refreshContext()
  }

  async function generatePlan() {
    setLoading(true)
    setError('')
    setGoalsAdded(false)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in.'); setLoading(false); return }

    if (editingProfile) await saveProfile()

    const [{ data: prof }, { data: goalsData }, { data: debtsData }, { data: holdings }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('goals').select('*').eq('user_id', user.id),
      supabase.from('debts').select('*').eq('user_id', user.id),
      supabase.from('holdings').select('*').eq('user_id', user.id),
    ])

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const { data: txns } = await supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', startOfMonth)
    const budgetIncome   = txns?.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0) ?? 0
    const budgetExpenses = txns?.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0) ?? 0

    try {
      const res = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: prof, goals: goalsData, debts: debtsData,
          holdings, budget: { income: budgetIncome, expenses: budgetExpenses }, extraContext,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setPlan(data.plan)
      setLastGenerated(new Date().toLocaleString())
      await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })
      await supabase.from('financial_plans').insert({ user_id: user.id, plan_json: data.plan })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setError(`Failed to generate plan: ${msg}`)
    }
    setLoading(false)
  }

  async function addPlanGoals() {
    if (!plan) return
    setAddingGoals(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setAddingGoals(false); return }
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

    const goalTypes: Record<string, string> = {
      emergency: 'emergency_fund', retire: 'retirement', house: 'house',
      education: 'education', travel: 'travel',
    }
    const goalInserts = plan.priorities.slice(0, 5).map((p, i) => {
      const text = p.replace(/^\d+\.\s*/, '').slice(0, 80)
      const typeKey = Object.keys(goalTypes).find(k => text.toLowerCase().includes(k)) ?? 'other'
      return {
        user_id: user.id,
        name: text.split(':')[0].replace(/^[A-Z\s]+—\s*/, '').slice(0, 60).trim(),
        type: goalTypes[typeKey] ?? 'other',
        target_amount: null,
        current_amount: 0,
        priority: i + 1,
      }
    })
    await supabase.from('goals').insert(goalInserts)
    setAddingGoals(false)
    setGoalsAdded(true)
    refreshContext()
    loadLiveData()
  }

  const f = profileEdit
  const highInterestDebt  = debts.filter(d => d.interest_rate > 7)
  const totalDebtLocal    = debts.reduce((s, d) => s + d.balance, 0)
  const monthlySavings    = Math.max(0, (profile?.annual_income ?? 0) / 12 - (profile?.monthly_expenses ?? 0))
  // Budget-derived income: actual transactions this month × 12
  const budgetAnnualIncome = Math.round(budgetSummary.income * 12)
  const incomeMismatch     = budgetAnnualIncome > 0 && profile?.annual_income !== budgetAnnualIncome

  async function syncIncomeFromBudget() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ annual_income: budgetAnnualIncome }).eq('id', user.id)
    setProfileEdit(prev => ({ ...prev, annual_income: budgetAnnualIncome }))
    await loadProfile()
    refreshContext()
  }

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">AI Financial Plan</h1>
          {lastGenerated && <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>Last generated: {lastGenerated}</p>}
        </div>
        <button className="btn-primary" onClick={generatePlan} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Analyzing…
            </span>
          ) : plan ? '🔄 Regenerate Plan' : '🤖 Generate My Plan'}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {profile && (!profile.annual_income || !profile.age) && !editingProfile && (
        <div className="p-4 rounded-xl text-sm flex items-center gap-3"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: 'var(--yellow)' }}>
          <span className="text-lg">⚠️</span>
          <div>
            <strong>Your profile is incomplete.</strong> Add your age, income, and location so the AI can personalize your plan.{' '}
            <button onClick={() => setEditingProfile(true)} style={{ textDecoration: 'underline', color: 'var(--yellow)' }}>Fill it in →</button>
          </div>
        </div>
      )}

      {/* ── Live Financial Snapshot ── */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Your Financial Snapshot</h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
              Live data from all your modules — this is what the AI uses to build your plan
            </p>
          </div>
          <button className="btn-secondary text-sm py-1.5" onClick={() => { loadProfile(); loadLiveData(); }}>
            ↻ Refresh
          </button>
        </div>

        {/* Income sync banner */}
        {incomeMismatch && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 8, marginBottom: 14, background: 'var(--nx-warn-50)', border: '1px solid var(--nx-warn-100)' }}>
            <div style={{ fontSize: 13, color: 'var(--nx-warn-700)' }}>
              <strong>Income mismatch:</strong> Budget shows <strong>{fmt0(budgetSummary.income)}/mo</strong> ({fmt0(budgetAnnualIncome)}/yr) but your profile has <strong>{fmt0(profile?.annual_income ?? 0)}/yr</strong>.
            </div>
            <button onClick={syncIncomeFromBudget} style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6, background: 'var(--nx-warn-500)', color: '#fff', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', marginLeft: 12, fontFamily: 'var(--font-sans)' }}>
              Sync from budget
            </button>
          </div>
        )}

        {/* Top stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {/* Annual Income — shows budget vs profile */}
          <div className="p-3 rounded-xl" style={{ background: 'var(--background)', border: `1px solid ${incomeMismatch ? 'rgba(194,133,28,0.4)' : 'var(--card-border)'}` }}>
            <div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
              <span>💰</span><span>Annual Income</span>
            </div>
            <div className="font-bold text-lg" style={{ color: 'var(--green)' }}>
              {profile?.annual_income ? fmt0(profile.annual_income) : '—'}
            </div>
            {budgetSummary.income > 0 && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                Budget: {fmt0(budgetSummary.income)}/mo
              </div>
            )}
          </div>
          {[
            { label: 'Monthly Expenses', value: profile?.monthly_expenses ? fmt0(profile.monthly_expenses) : '—', color: 'var(--red)', icon: '📊', sub: budgetSummary.expenses > 0 ? `Budget: ${fmt0(budgetSummary.expenses)}/mo` : null },
            { label: 'Est. Monthly Savings', value: monthlySavings > 0 ? fmt0(monthlySavings) : '—', color: 'var(--accent)', icon: '💵', sub: null },
            { label: 'Portfolio Value', value: portfolioValue > 0 ? fmt0(portfolioValue) : '—', color: '#10b981', icon: '📈', sub: null },
          ].map(s => (
            <div key={s.label} className="p-3 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
              <div className="text-xs mb-1 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
                <span>{s.icon}</span><span>{s.label}</span>
              </div>
              <div className="font-bold text-lg" style={{ color: s.color }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Debt section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              🏦 Debt Overview
              {highInterestDebt.length > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(239,68,68,0.15)', color: 'var(--red)' }}>
                  {highInterestDebt.length} high-interest
                </span>
              )}
            </h3>
            <span className="text-sm font-bold" style={{ color: totalDebtLocal > 0 ? 'var(--red)' : 'var(--green)' }}>
              {totalDebtLocal > 0 ? fmt0(totalDebtLocal) + ' total' : 'Debt free! 🎉'}
            </span>
          </div>

          {debts.length === 0 ? (
            <p className="text-xs py-2" style={{ color: 'var(--muted)' }}>
              No debts on record.{' '}
              <a href="/debt" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Add debts in Debt Tracker →</a>
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {debts.map(d => (
                <div key={d.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg"
                  style={{ background: 'var(--background)', border: `1px solid ${d.interest_rate > 7 ? 'rgba(239,68,68,0.3)' : 'var(--card-border)'}` }}>
                  <div className="flex items-center gap-2">
                    {d.interest_rate > 7
                      ? <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
                      : <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--yellow)' }} />
                    }
                    <span className="font-medium">{d.name}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded font-mono"
                      style={{ background: d.interest_rate > 7 ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: d.interest_rate > 7 ? 'var(--red)' : 'var(--yellow)' }}>
                      {d.interest_rate}%
                    </span>
                  </div>
                  <span className="font-bold">{fmt0(d.balance)}</span>
                </div>
              ))}
              {highInterestDebt.length > 0 && (
                <div className="text-xs p-2 rounded-lg flex items-start gap-2"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
                  🔥 <span>The AI will prioritize paying off your high-interest debt ({highInterestDebt.map(d => d.name).join(', ')}) before recommending heavy investing.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goals & profile mini-row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Age</p>
            <p className="font-semibold">{profile?.age ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Retirement Age</p>
            <p className="font-semibold">{profile?.retirement_age ?? '65'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Risk Tolerance</p>
            <p className="font-semibold capitalize">{profile?.risk_tolerance ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Location</p>
            <p className="font-semibold">{profile?.state || '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Filing Status</p>
            <p className="font-semibold">{profile?.tax_filing_status?.replace(/_/g, ' ') ?? '—'}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Goals Tracking</p>
            <p className="font-semibold">{goalCount} goal{goalCount !== 1 ? 's' : ''}</p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>This Month Budget</p>
            <p className="font-semibold" style={{ color: budgetSummary.net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {budgetSummary.income > 0 ? (budgetSummary.net >= 0 ? '+' : '') + fmt0(budgetSummary.net) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Net Worth Est.</p>
            <p className="font-semibold" style={{ color: 'var(--accent)' }}>
              {(portfolioValue - totalDebt) !== 0 ? fmt0(portfolioValue - totalDebt) : '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid var(--card-border)' }}>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Update profile details on the{' '}
            <a href="/profile" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Profile page</a>
            {' '}· Add debts on the{' '}
            <a href="/debt" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Debt page</a>
          </p>
          {editingProfile ? (
            <div className="flex gap-2">
              <button className="btn-secondary text-sm py-1.5" onClick={() => { setEditingProfile(false); setProfileEdit(profile ?? {}) }}>Cancel</button>
              <button className="btn-primary text-sm py-1.5" onClick={saveProfile} disabled={savingProfile}>
                {savingProfile ? 'Saving…' : '✓ Save'}
              </button>
            </div>
          ) : (
            <button className="btn-secondary text-sm py-1.5" onClick={() => setEditingProfile(true)}>✏️ Edit Profile</button>
          )}
        </div>

        {/* Inline edit panel */}
        {editingProfile && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
            <h3 className="text-sm font-semibold mb-3">Edit Financial Profile</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Annual Income — with budget sync helper */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Annual Income</p>
                  {budgetSummary.income > 0 && (
                    <button onClick={() => setProfileEdit(p => ({ ...p, annual_income: budgetAnnualIncome }))}
                      style={{ fontSize: 10, fontWeight: 600, color: 'var(--nx-warn-700)', background: 'var(--nx-warn-50)', border: '1px solid var(--nx-warn-100)', borderRadius: 4, padding: '1px 6px', cursor: 'pointer', fontFamily: 'var(--font-sans)' }}>
                      Use budget ({fmt0(budgetSummary.income)}/mo)
                    </button>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>$</span>
                  <input className="input text-sm" style={{ paddingLeft: '1.5rem' }}
                    type="number" value={(f.annual_income as number | undefined) ?? ''}
                    onChange={e => setProfileEdit(p => ({ ...p, annual_income: Number(e.target.value) }))} />
                </div>
              </div>

              {[
                { label: 'Monthly Expenses', key: 'monthly_expenses', type: 'number', prefix: '$' },
                { label: 'Age', key: 'age', type: 'number' },
                { label: 'Retirement Age', key: 'retirement_age', type: 'number' },
              ].map(field => (
                <div key={field.key}>
                  <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{field.label}</p>
                  <div className="relative">
                    {field.prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--muted)' }}>{field.prefix}</span>}
                    <input className="input text-sm" style={{ paddingLeft: field.prefix ? '1.5rem' : undefined }}
                      type={field.type} value={(f as Record<string, unknown>)[field.key] as string ?? ''}
                      onChange={e => setProfileEdit(p => ({ ...p, [field.key]: e.target.value }))} />
                  </div>
                </div>
              ))}

              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Risk Tolerance</p>
                <select className="input text-sm" value={f.risk_tolerance ?? 'moderate'}
                  onChange={e => setProfileEdit(p => ({ ...p, risk_tolerance: e.target.value }))}>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Tax Filing Status</p>
                <select className="input text-sm" value={f.tax_filing_status ?? 'single'}
                  onChange={e => setProfileEdit(p => ({ ...p, tax_filing_status: e.target.value }))}>
                  <option value="single">Single</option>
                  <option value="married_filing_jointly">Married Filing Jointly</option>
                  <option value="married_filing_separately">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>State</p>
                <select className="input text-sm" value={f.state ?? ''}
                  onChange={e => setProfileEdit(p => ({ ...p, state: e.target.value }))}>
                  <option value="">Select state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div>
                <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Full Name</p>
                <input className="input text-sm" value={f.full_name ?? ''}
                  onChange={e => setProfileEdit(p => ({ ...p, full_name: e.target.value }))} placeholder="Your name" />
              </div>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              💡 Saving updates your profile everywhere — tax assistant and dashboard will reflect these changes automatically.
            </p>
          </div>
        )}
      </div>

      {/* Goals preview */}
      {goals.length > 0 && (
        <div className="card">
          <h2 className="font-semibold mb-3">🎯 Goals the AI Will Plan Around ({goals.length})</h2>
          <div className="flex flex-col gap-2">
            {goals.slice(0, 5).map(g => {
              const pct = g.target_amount ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
              return (
                <div key={g.id} className="flex items-center gap-3 text-sm p-2.5 rounded-lg"
                  style={{ background: 'var(--background)', border: '1px solid var(--card-border)' }}>
                  <span>{GOAL_ICONS[g.type] ?? '🎯'}</span>
                  <span className="font-medium flex-1">{g.name}</span>
                  {g.target_amount ? (
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--accent)' }} />
                      </div>
                      <span style={{ color: 'var(--muted)' }}>{Math.round(pct)}%</span>
                      <span className="font-bold">{fmt0(g.target_amount)}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>No target set</span>
                  )}
                </div>
              )
            })}
            {goals.length > 5 && (
              <p className="text-xs" style={{ color: 'var(--muted)' }}>+{goals.length - 5} more goals</p>
            )}
          </div>
        </div>
      )}

      {/* Extra context */}
      <div className="card">
        <h2 className="font-semibold mb-1">Tell the AI more about yourself</h2>
        <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
          e.g. "I have 2 kids, want to buy a house in 3 years, I'm self-employed, I have a pension"
        </p>
        <textarea className="input" rows={3} value={extraContext} onChange={e => setExtraContext(e.target.value)}
          placeholder="Life situation, upcoming expenses, inheritance, specific concerns…" style={{ resize: 'vertical' }} />
      </div>

      {!plan && !loading && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🤖</div>
          <h2 className="text-xl font-bold mb-2">Your personalized financial plan</h2>
          <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
            Claude analyzes your income, debts, goals, and portfolio to build a complete plan with ETF recommendations and allocation percentages.
          </p>
          <button className="btn-primary text-base px-8 py-3" onClick={generatePlan}>🤖 Generate My Plan</button>
        </div>
      )}

      {loading && (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4 animate-pulse">🤖</div>
          <h2 className="font-semibold mb-2">Analyzing your complete financial picture…</h2>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Reviewing your budget, debts, goals, and portfolio. Takes ~15 seconds.</p>
        </div>
      )}

      {plan && !loading && (
        <div className="flex flex-col gap-5">

          {/* Summary — navy card */}
          <div className="card-navy">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C9A437" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>
              </svg>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-gold-300)' }}>Nexus financial plan</span>
            </div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 17, lineHeight: 1.6, letterSpacing: '-0.005em', color: 'var(--nx-cream-50)' }}>{plan.summary}</p>
          </div>

          {/* Debt tip callout if present */}
          {plan.debtTip && (
            <div className="card flex items-start gap-3 py-4"
              style={{ background: 'rgba(239,68,68,0.06)', borderColor: 'rgba(239,68,68,0.25)' }}>
              <span className="text-xl">🏦</span>
              <div>
                <p className="font-semibold text-sm mb-1">Debt Strategy</p>
                <p className="text-sm" style={{ lineHeight: 1.7 }}>{plan.debtTip}</p>
              </div>
            </div>
          )}

          {/* Add to Goals banner */}
          {!goalsAdded ? (
            <div className="card flex items-center justify-between gap-4 py-3"
              style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
              <div>
                <p className="font-semibold text-sm">📋 Sync priorities to your Goals tracker</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                  Add the top action items from this plan as trackable goals
                </p>
              </div>
              <button className="btn-primary text-sm py-2 whitespace-nowrap" onClick={addPlanGoals} disabled={addingGoals}>
                {addingGoals ? 'Adding…' : '+ Add to Goals'}
              </button>
            </div>
          ) : (
            <div className="card flex items-center gap-3 py-3"
              style={{ background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.25)' }}>
              <span style={{ color: 'var(--green)' }}>✓</span>
              <p className="text-sm font-medium">Goals added! Check your <a href="/goals" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Goals page</a>.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Allocation */}
            <div className="card">
              <h2 className="font-semibold mb-4">Recommended Allocation</h2>
              <div className="flex flex-col gap-3">
                {plan.allocation.map((a, i) => (
                  <div key={a.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-medium">{a.label}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>{a.ticker}</span>
                      </span>
                      <span className="font-bold">{a.pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${a.pct}%`, background: COLORS[i % COLORS.length] }} />
                    </div>
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{a.rationale}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Priorities + savings target */}
            <div className="flex flex-col gap-4">
              <div className="card">
                <h2 className="font-semibold mb-3">Priority Action Items</h2>
                <div className="flex flex-col gap-2.5">
                  {plan.priorities.map((p, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 text-white"
                        style={{ background: 'var(--accent)' }}>{i + 1}</span>
                      <span style={{ lineHeight: 1.5 }}>{p.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="card">
                <h2 className="font-semibold mb-1">Monthly Savings Target</h2>
                <div className="text-3xl font-bold" style={{ color: 'var(--green)' }}>{fmt0(plan.monthlySavingsTarget)}</div>
                <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>per month toward investments</p>
              </div>
            </div>
          </div>

          {/* Projections */}
          <div className="card">
            <h2 className="font-semibold mb-4">Portfolio Growth Projection</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: 'var(--muted)' }}>
                    <th className="text-left pb-3 font-medium">Years from Now</th>
                    <th className="text-right pb-3 font-medium">Conservative</th>
                    <th className="text-right pb-3 font-medium">Base Case</th>
                    <th className="text-right pb-3 font-medium">Optimistic</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.projections.map(p => (
                    <tr key={p.year} style={{ borderTop: '1px solid var(--card-border)' }}>
                      <td className="py-3 font-medium">{p.year} years</td>
                      <td className="text-right py-3" style={{ color: 'var(--muted)' }}>{fmt0(p.lowValue)}</td>
                      <td className="text-right py-3 font-bold" style={{ color: 'var(--green)' }}>{fmt0(p.midValue)}</td>
                      <td className="text-right py-3" style={{ color: 'var(--accent)' }}>{fmt0(p.highValue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>
              Conservative = 5% return · Base = 7% · Optimistic = 10%. Hypothetical, not guaranteed.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <h2 className="font-semibold mb-3">💡 Tax Tip</h2>
              <p className="text-sm" style={{ lineHeight: 1.7 }}>{plan.taxTip}</p>
            </div>
            <div className="card">
              <h2 className="font-semibold mb-3">⚠️ Key Risks to Watch</h2>
              <ul className="flex flex-col gap-2">
                {plan.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span style={{ color: 'var(--yellow)' }}>•</span>
                    <span style={{ color: 'var(--muted)', lineHeight: 1.6 }}>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>{plan.disclaimer}</p>
        </div>
      )}
    </div>
  )
}
