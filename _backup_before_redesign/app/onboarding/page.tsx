'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = ['Profile', 'Income & Expenses', 'Goals', 'Done']

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    risk_tolerance: 'moderate',
    retirement_age: '65',
    tax_filing_status: 'single',
    state: '',
  })
  const [income, setIncome] = useState({ annual_income: '', monthly_expenses: '' })
  const [goals, setGoals] = useState([
    { name: 'Retirement', type: 'retirement', target_amount: '', target_date: '' },
  ])

  function setP(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProfile(p => ({ ...p, [k]: e.target.value }))
  }
  function setI(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setIncome(i => ({ ...i, [k]: e.target.value }))
  }

  function addGoal() {
    setGoals(g => [...g, { name: '', type: 'other', target_amount: '', target_date: '' }])
  }

  function setGoal(i: number, k: string, v: string) {
    setGoals(g => g.map((goal, idx) => idx === i ? { ...goal, [k]: v } : goal))
  }

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      ...profile,
      age: parseInt(profile.age),
      retirement_age: parseInt(profile.retirement_age),
      annual_income: parseFloat(income.annual_income),
      monthly_expenses: parseFloat(income.monthly_expenses),
    })

    const validGoals = goals.filter(g => g.name).map(g => ({
      user_id: user.id,
      name: g.name,
      type: g.type,
      target_amount: g.target_amount ? parseFloat(g.target_amount) : null,
      target_date: g.target_date || null,
    }))
    if (validGoals.length > 0) {
      await supabase.from('goals').insert(validGoals)
    }

    // Seed default budget categories
    await supabase.from('budget_categories').insert([
      { user_id: user.id, name: 'Salary', type: 'income', color: '#22c55e', monthly_budget: parseFloat(income.annual_income) / 12 || 0 },
      { user_id: user.id, name: 'Housing', type: 'expense', color: '#6366f1', monthly_budget: 0 },
      { user_id: user.id, name: 'Food & Dining', type: 'expense', color: '#f59e0b', monthly_budget: 0 },
      { user_id: user.id, name: 'Transportation', type: 'expense', color: '#3b82f6', monthly_budget: 0 },
      { user_id: user.id, name: 'Healthcare', type: 'expense', color: '#ef4444', monthly_budget: 0 },
      { user_id: user.id, name: 'Entertainment', type: 'expense', color: '#8b5cf6', monthly_budget: 0 },
      { user_id: user.id, name: 'Savings & Investing', type: 'expense', color: '#10b981', monthly_budget: 0 },
      { user_id: user.id, name: 'Other', type: 'expense', color: '#64748b', monthly_budget: 0 },
    ])

    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--background)' }}>
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i <= step ? 'var(--accent)' : 'var(--card)',
                    border: `1px solid ${i <= step ? 'var(--accent)' : 'var(--card-border)'}`,
                    color: i <= step ? 'white' : 'var(--muted)',
                  }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className="text-xs hidden sm:block" style={{ color: i === step ? 'var(--foreground)' : 'var(--muted)' }}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < step ? 'var(--accent)' : 'var(--card-border)' }} />}
            </div>
          ))}
        </div>

        <div className="card">
          {/* Step 0 — Profile */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2">Tell us about yourself</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Full Name</label>
                  <input className="input" value={profile.full_name} onChange={setP('full_name')} placeholder="Jane Smith" />
                </div>
                <div>
                  <label className="label">Age</label>
                  <input className="input" type="number" value={profile.age} onChange={setP('age')} placeholder="30" min="18" max="90" />
                </div>
                <div>
                  <label className="label">Target Retirement Age</label>
                  <input className="input" type="number" value={profile.retirement_age} onChange={setP('retirement_age')} placeholder="65" />
                </div>
                <div>
                  <label className="label">Risk Tolerance</label>
                  <select className="input" value={profile.risk_tolerance} onChange={setP('risk_tolerance')}>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tax Filing Status</label>
                  <select className="input" value={profile.tax_filing_status} onChange={setP('tax_filing_status')}>
                    <option value="single">Single</option>
                    <option value="married_filing_jointly">Married Filing Jointly</option>
                    <option value="married_filing_separately">Married Filing Separately</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="label">State</label>
                  <select className="input" value={profile.state} onChange={setP('state')}>
                    <option value="">Select your state</option>
                    {['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut',
                      'Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa',
                      'Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan',
                      'Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire',
                      'New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio',
                      'Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota',
                      'Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
                      'Wisconsin','Wyoming','Washington DC'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 — Income */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2">Income & Expenses</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>This helps us calibrate your budget and investment plan.</p>
              <div>
                <label className="label">Annual Gross Income ($)</label>
                <input className="input" type="number" value={income.annual_income} onChange={setI('annual_income')} placeholder="75000" />
              </div>
              <div>
                <label className="label">Monthly Expenses ($)</label>
                <input className="input" type="number" value={income.monthly_expenses} onChange={setI('monthly_expenses')} placeholder="3500" />
              </div>
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                💡 Estimated monthly savings:{' '}
                <strong style={{ color: 'var(--accent)' }}>
                  ${Math.max(0, (parseFloat(income.annual_income) / 12 || 0) - (parseFloat(income.monthly_expenses) || 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </strong>
              </div>
            </div>
          )}

          {/* Step 2 — Goals */}
          {step === 2 && (
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold mb-2">Your Financial Goals</h2>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>What are you working toward? Your AI plan will be built around these.</p>
              {goals.map((g, i) => (
                <div key={i} className="p-3 rounded-lg flex flex-col gap-3" style={{ background: '#0f1117', border: '1px solid var(--card-border)' }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label">Goal Name</label>
                      <input className="input" value={g.name} onChange={e => setGoal(i, 'name', e.target.value)} placeholder="e.g. Buy a house" />
                    </div>
                    <div>
                      <label className="label">Type</label>
                      <select className="input" value={g.type} onChange={e => setGoal(i, 'type', e.target.value)}>
                        <option value="retirement">Retirement</option>
                        <option value="house">Buy a House</option>
                        <option value="education">Education</option>
                        <option value="emergency_fund">Emergency Fund</option>
                        <option value="travel">Travel</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Target Amount ($)</label>
                      <input className="input" type="number" value={g.target_amount} onChange={e => setGoal(i, 'target_amount', e.target.value)} placeholder="500000" />
                    </div>
                    <div>
                      <label className="label">Target Date</label>
                      <input className="input" type="date" value={g.target_date} onChange={e => setGoal(i, 'target_date', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addGoal} className="btn-secondary text-sm w-full justify-center">+ Add Another Goal</button>
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 3 && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div className="text-5xl">🎉</div>
              <h2 className="text-xl font-bold">You&apos;re all set!</h2>
              <p style={{ color: 'var(--muted)' }}>We&apos;ll use your profile to generate a personalized financial plan. You can update any of this anytime.</p>
            </div>
          )}

          {/* Nav Buttons */}
          <div className="flex justify-between mt-6 pt-4" style={{ borderTop: '1px solid var(--card-border)' }}>
            <button className="btn-secondary" onClick={() => setStep(s => s - 1)} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep(s => s + 1)}>
                Continue →
              </button>
            ) : (
              <button className="btn-primary" onClick={finish} disabled={loading}>
                {loading ? 'Setting up…' : 'Go to Dashboard →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
