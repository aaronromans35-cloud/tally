'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { label: 'Profile',     desc: 'Tell us about yourself' },
  { label: 'Finances',    desc: 'Income & expenses' },
  { label: 'Goals',       desc: 'What are you saving for?' },
  { label: 'Ready',       desc: 'All set!' },
]

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware',
  'Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky',
  'Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi',
  'Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico',
  'New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania',
  'Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont',
  'Virginia','Washington','West Virginia','Wisconsin','Wyoming','Washington DC',
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({
    full_name: '', age: '', risk_tolerance: 'moderate',
    retirement_age: '65', tax_filing_status: 'single', state: '',
  })
  const [income, setIncome] = useState({ annual_income: '', monthly_expenses: '' })
  const [goals, setGoals] = useState([
    { name: 'Retirement', type: 'retirement', target_amount: '', target_date: '' },
  ])

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile(p => ({ ...p, [k]: e.target.value }))
  const setI = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setIncome(i => ({ ...i, [k]: e.target.value }))
  const setGoal = (i: number, k: string, v: string) =>
    setGoals(g => g.map((goal, idx) => idx === i ? { ...goal, [k]: v } : goal))
  const addGoal = () =>
    setGoals(g => [...g, { name: '', type: 'other', target_amount: '', target_date: '' }])
  const removeGoal = (i: number) =>
    setGoals(g => g.filter((_, idx) => idx !== i))

  const monthlySavings = Math.max(0, (parseFloat(income.annual_income) / 12 || 0) - (parseFloat(income.monthly_expenses) || 0))
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').upsert({
      id: user.id, ...profile,
      age: parseInt(profile.age) || null,
      retirement_age: parseInt(profile.retirement_age) || 65,
      annual_income: parseFloat(income.annual_income) || 0,
      monthly_expenses: parseFloat(income.monthly_expenses) || 0,
    })

    const validGoals = goals.filter(g => g.name).map(g => ({
      user_id: user.id, name: g.name, type: g.type,
      target_amount: g.target_amount ? parseFloat(g.target_amount) : null,
      target_date: g.target_date || null,
    }))
    if (validGoals.length > 0) await supabase.from('goals').insert(validGoals)

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
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'var(--font-sans)',
      background: 'var(--background)',
    }}>
      {/* ── Left panel — navy ── */}
      <div style={{
        width: 400, flexShrink: 0,
        background: 'var(--nx-navy-800)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 40px',
      }} className="hidden lg:flex">

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--nx-cream-50)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-cream-50)' }}>Nexus</span>
        </div>

        {/* Step list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--nx-cream-50)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 32 }}>
            Let's build your<br/>
            <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>financial foundation.</span>
          </div>
          {STEPS.map((s, i) => {
            const done    = i < step
            const current = i === step
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < STEPS.length - 1 ? 20 : 0, position: 'relative' }}>
                {/* Connector line */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 14, top: 28, bottom: 0,
                    width: 1, background: done ? 'var(--nx-gold-500)' : 'var(--nx-navy-600)',
                    transition: 'background 300ms',
                  }} />
                )}
                {/* Circle */}
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--nx-gold-500)' : current ? 'rgba(201,164,55,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${done ? 'var(--nx-gold-500)' : current ? 'var(--nx-gold-500)' : 'var(--nx-navy-600)'}`,
                  transition: 'all 300ms', zIndex: 1,
                }}>
                  {done ? (
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--nx-navy-900)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 700, color: current ? 'var(--nx-gold-400)' : 'var(--nx-navy-500)' }}>{i + 1}</span>
                  )}
                </div>
                {/* Label */}
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: current ? 'var(--nx-cream-50)' : done ? 'var(--nx-gold-400)' : 'var(--nx-navy-500)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--nx-navy-500)', marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div style={{ fontSize: 12, color: 'var(--nx-navy-500)', lineHeight: 1.5 }}>
          Your data is encrypted and never sold.<br />You can update any of this later in Settings.
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--nx-cream-50)', padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>

          {/* Mobile brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }} className="flex lg:hidden">
            <div style={{ width: 24, height: 24, background: 'var(--nx-navy-800)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-800)' }}>Nexus</span>
          </div>

          {/* Mobile step indicator */}
          <div className="flex lg:hidden" style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 3, borderRadius: 999,
                background: i <= step ? 'var(--nx-gold-500)' : 'var(--nx-cream-300)',
                transition: 'background 300ms',
              }} />
            ))}
          </div>

          {/* Step 0 — Profile */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Step 1 of 4</p>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 6 }}>Tell us about yourself</h1>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>This helps us personalize your financial plan.</p>
              </div>

              <div>
                <label className="label">Full name</label>
                <input className="input" value={profile.full_name} onChange={setP('full_name')} placeholder="Jane Smith" autoFocus />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Your age</label>
                  <input className="input" type="number" value={profile.age} onChange={setP('age')} placeholder="30" min="18" max="90" />
                </div>
                <div>
                  <label className="label">Retire at</label>
                  <input className="input" type="number" value={profile.retirement_age} onChange={setP('retirement_age')} placeholder="65" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label className="label">Risk tolerance</label>
                  <select className="input" value={profile.risk_tolerance} onChange={setP('risk_tolerance')}>
                    <option value="conservative">Conservative</option>
                    <option value="moderate">Moderate</option>
                    <option value="aggressive">Aggressive</option>
                  </select>
                </div>
                <div>
                  <label className="label">Tax filing status</label>
                  <select className="input" value={profile.tax_filing_status} onChange={setP('tax_filing_status')}>
                    <option value="single">Single</option>
                    <option value="married_filing_jointly">Married Jointly</option>
                    <option value="married_filing_separately">Married Separately</option>
                    <option value="head_of_household">Head of Household</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">State</label>
                <select className="input" value={profile.state} onChange={setP('state')}>
                  <option value="">Select your state</option>
                  {US_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Step 1 — Finances */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Step 2 of 4</p>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 6 }}>Income & expenses</h1>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>We use this to calibrate your budget and savings plan.</p>
              </div>

              <div>
                <label className="label">Annual gross income</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)' }}>$</span>
                  <input className="input" type="number" value={income.annual_income} onChange={setI('annual_income')} placeholder="75,000" style={{ paddingLeft: 24 }} />
                </div>
              </div>

              <div>
                <label className="label">Monthly expenses (estimate)</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)' }}>$</span>
                  <input className="input" type="number" value={income.monthly_expenses} onChange={setI('monthly_expenses')} placeholder="3,500" style={{ paddingLeft: 24 }} />
                </div>
              </div>

              {income.annual_income && (
                <div style={{
                  padding: '16px 18px', borderRadius: 10,
                  background: monthlySavings > 0 ? 'rgba(45,138,92,0.08)' : 'rgba(199,62,62,0.08)',
                  border: `1px solid ${monthlySavings > 0 ? 'rgba(45,138,92,0.2)' : 'rgba(199,62,62,0.2)'}`,
                }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Estimated monthly savings</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: monthlySavings > 0 ? 'var(--nx-pos-700)' : 'var(--nx-neg-700)' }}>
                    {fmt(monthlySavings)}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                    {monthlySavings > 0
                      ? `That's ${fmt(monthlySavings * 12)}/year going toward your goals.`
                      : 'Your expenses exceed your income — let\'s fix that with a budget.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2 — Goals */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ marginBottom: 4 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Step 3 of 4</p>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 6 }}>Your financial goals</h1>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>Your AI plan will be built around these. You can add more later.</p>
              </div>

              {goals.map((g, i) => (
                <div key={i} style={{
                  padding: '16px', borderRadius: 10,
                  background: 'var(--nx-cream-100)', border: '1px solid var(--nx-cream-300)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>Goal {i + 1}</span>
                    {goals.length > 1 && (
                      <button onClick={() => removeGoal(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 18, padding: 0, lineHeight: 1 }}>×</button>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="label">Goal name</label>
                        <input className="input" value={g.name} onChange={e => setGoal(i, 'name', e.target.value)} placeholder="Buy a house" />
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
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <div>
                        <label className="label">Target amount</label>
                        <input className="input" type="number" value={g.target_amount} onChange={e => setGoal(i, 'target_amount', e.target.value)} placeholder="500,000" />
                      </div>
                      <div>
                        <label className="label">Target date</label>
                        <input className="input" type="date" value={g.target_date} onChange={e => setGoal(i, 'target_date', e.target.value)} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <button onClick={addGoal} className="btn-secondary" style={{ justifyContent: 'center', fontSize: 13.5 }}>
                + Add another goal
              </button>
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 20 }}>🎉</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>
                You&apos;re all set!
              </h1>
              <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
                Your personalized financial plan is ready.<br />
                Everything updates automatically as you log data.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 280, margin: '0 auto', textAlign: 'left' }}>
                {[
                  'AI-powered financial plan',
                  'Budget & expense tracking',
                  'Debt payoff strategy',
                  'Goal progress tracking',
                ].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: 'var(--nx-navy-700)' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--nx-gold-100)', border: '1px solid var(--nx-gold-300)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-700)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--nx-cream-300)' }}>
            <button
              className="btn-secondary"
              onClick={() => setStep(s => s - 1)}
              style={{ visibility: step === 0 ? 'hidden' : 'visible' }}
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button className="btn-primary" onClick={() => setStep(s => s + 1)} style={{ padding: '10px 28px', fontSize: 14.5 }}>
                Continue →
              </button>
            ) : (
              <button className="btn-primary" onClick={finish} disabled={loading} style={{ padding: '10px 28px', fontSize: 14.5 }}>
                {loading ? 'Setting up…' : 'Go to my dashboard →'}
              </button>
            )}
          </div>

          <p style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', marginTop: 16 }}>
            You can update all of this anytime in Settings.
          </p>
        </div>
      </div>
    </div>
  )
}
