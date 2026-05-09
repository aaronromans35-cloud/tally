'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STEPS = [
  { label: 'About You',  desc: 'Quick intro' },
  { label: 'Your Money', desc: 'Income & spending' },
  { label: 'Goals',      desc: "What you're saving for" },
  { label: 'All Set!',   desc: 'Take the tour' },
]

const INCOME_SOURCES = [
  { value: 'job',       label: '💼 Part-time job' },
  { value: 'allowance', label: '🏠 Allowance from parents' },
  { value: 'hustle',    label: '🚀 Side hustle / freelance' },
  { value: 'multiple',  label: '💰 Multiple sources' },
  { value: 'none',      label: "🎓 None yet — I'm just learning" },
]

const TEEN_GOALS = [
  { name: '🚗 Save for a car',        type: 'savings' },
  { name: '🎓 College fund',           type: 'savings' },
  { name: '💻 Tech / gadgets',         type: 'savings' },
  { name: '🏦 Emergency fund',         type: 'emergency_fund' },
  { name: '📈 Start investing',        type: 'investment' },
  { name: '✈️ Travel / experiences',   type: 'savings' },
  { name: '👟 Clothes / personal',     type: 'savings' },
  { name: '🏠 Move out someday',       type: 'savings' },
]

const TOUR_SLIDES = [
  {
    emoji: '🏠',
    title: 'Your Dashboard',
    desc: "This is your financial home base. See everything at a glance — your budget, goals, and what's coming up. You can customize which widgets show here.",
    href: '/dashboard',
    color: 'var(--nx-navy-800)',
  },
  {
    emoji: '💰',
    title: 'Budget Tracker',
    desc: 'Track every dollar in and out. Set spending limits by category. See exactly where your money goes — no more mystery disappearing cash.',
    href: '/budget',
    color: '#1a5c3a',
  },
  {
    emoji: '🧮',
    title: 'Compound Calculator',
    desc: "This is the one that changes everything. Slide the controls and watch what starting NOW vs. waiting 10 years means in real dollars. Spoiler: it's wild.",
    href: '/compound',
    color: '#6b3a1a',
  },
  {
    emoji: '📈',
    title: 'Portfolio',
    desc: 'Track your investments with live prices. Even if you only have $50 in an index fund — this is where you watch it grow. Every dollar counts.',
    href: '/portfolio',
    color: '#1a3a5c',
  },
  {
    emoji: '✨',
    title: 'AI Financial Plan',
    desc: "Tell Nexus your age, income, and goals — get a real, personalized step-by-step plan. First Roth IRA, first investment, first budget. All explained clearly.",
    href: '/plan',
    color: '#3a1a5c',
  },
  {
    emoji: '🎯',
    title: 'Goals',
    desc: "Set goals for anything you're saving toward — a car, college, emergency fund. Every dollar you save moves you closer. You'll see progress in real time.",
    href: '/goals',
    color: '#5c1a1a',
  },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<'student' | 'teacher' | 'personal'>('personal')
  const [profile, setProfile] = useState({
    full_name: '',
    age: '',
    income_source: '',
    risk_tolerance: 'moderate',
    retirement_age: '65',
    tax_filing_status: 'single',
    state: '',
  })
  const [income, setIncome] = useState({ annual_income: '', monthly_expenses: '' })
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [customGoal, setCustomGoal] = useState('')

  const setP = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setProfile(p => ({ ...p, [k]: e.target.value }))
  const setI = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setIncome(i => ({ ...i, [k]: e.target.value }))

  const toggleGoal = (name: string) =>
    setSelectedGoals(g => g.includes(name) ? g.filter(x => x !== name) : [...g, name])

  const monthlyIncome = (parseFloat(income.annual_income) / 12) || 0
  const monthlyExpenses = parseFloat(income.monthly_expenses) || 0
  const monthlySavings = Math.max(0, monthlyIncome - monthlyExpenses)
  const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  // Compound interest preview (just for onboarding wow-moment)
  const age = parseInt(profile.age) || 17
  const monthly = Math.max(10, monthlySavings)
  const r = 0.07 / 12, n = (65 - age) * 12
  const futureValue = n > 0 ? Math.round(monthly * (((1 + r) ** n - 1) / r)) : 0

  async function finish() {
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      full_name: profile.full_name,
      age: parseInt(profile.age) || null,
      account_type: accountType,
      risk_tolerance: profile.risk_tolerance,
      retirement_age: parseInt(profile.retirement_age) || 65,
      tax_filing_status: profile.tax_filing_status,
      state: profile.state || null,
      annual_income: parseFloat(income.annual_income) || 0,
      monthly_expenses: parseFloat(income.monthly_expenses) || 0,
    })

    // Build goals from selected + custom
    const allGoalNames = [...selectedGoals, ...(customGoal.trim() ? [customGoal.trim()] : [])]
    const goalsToInsert = allGoalNames.map(name => {
      const template = TEEN_GOALS.find(g => g.name === name)
      return {
        user_id: user.id,
        name: name.replace(/^[^\w\s]*\s*/, ''), // strip emoji
        type: template?.type ?? 'savings',
        target_amount: null,
        target_date: null,
      }
    })
    if (goalsToInsert.length > 0) await supabase.from('goals').insert(goalsToInsert)

    // Seed budget categories (teen-friendly)
    await supabase.from('budget_categories').insert([
      { user_id: user.id, name: 'Job / Income', type: 'income', color: '#22c55e', monthly_budget: parseFloat(income.annual_income) / 12 || 0 },
      { user_id: user.id, name: 'Food & Drinks', type: 'expense', color: '#f59e0b', monthly_budget: 0 },
      { user_id: user.id, name: 'Transportation', type: 'expense', color: '#3b82f6', monthly_budget: 0 },
      { user_id: user.id, name: 'Entertainment', type: 'expense', color: '#8b5cf6', monthly_budget: 0 },
      { user_id: user.id, name: 'Clothes / Personal', type: 'expense', color: '#ec4899', monthly_budget: 0 },
      { user_id: user.id, name: 'Subscriptions', type: 'expense', color: '#64748b', monthly_budget: 0 },
      { user_id: user.id, name: 'Savings & Investing', type: 'expense', color: '#10b981', monthly_budget: 0 },
      { user_id: user.id, name: 'Other', type: 'expense', color: '#94a3b8', monthly_budget: 0 },
    ])

    setLoading(false)
    if (accountType === 'teacher') {
      router.push('/teacher')
    } else {
      router.push('/dashboard?tour=1')
    }
  }


  /* ── Onboarding Form ── */
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      fontFamily: 'var(--font-sans)',
      background: 'var(--background)',
    }}>
      {/* ── Left panel ── */}
      <div style={{
        width: 380, flexShrink: 0,
        background: 'var(--nx-navy-800)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px',
      }} className="hidden lg:flex">

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: 'var(--nx-cream-50)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-cream-50)' }}>Nexus</span>
        </div>

        {/* Step list */}
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--nx-cream-50)', letterSpacing: '-0.02em', lineHeight: 1.3, marginBottom: 32 }}>
            Let&apos;s build your<br/>
            <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>money foundation.</span>
          </div>
          {STEPS.map((s, i) => {
            const done    = i < step
            const current = i === step
            return (
              <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, paddingBottom: i < STEPS.length - 1 ? 20 : 0, position: 'relative' }}>
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: 'absolute', left: 14, top: 28, bottom: 0,
                    width: 1, background: done ? 'var(--nx-gold-500)' : 'var(--nx-navy-600)',
                    transition: 'background 300ms',
                  }} />
                )}
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
                <div style={{ paddingTop: 3 }}>
                  <div style={{ fontSize: 13, fontWeight: current ? 600 : 400, color: current ? 'var(--nx-cream-50)' : done ? 'var(--nx-navy-300)' : 'var(--nx-navy-500)' }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--nx-navy-500)', marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Compound preview */}
        {step >= 1 && futureValue > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '16px 18px', border: '1px solid var(--nx-navy-700)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-gold-400)', marginBottom: 8 }}>Your Compound Estimate</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--nx-cream-50)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              {fmt(futureValue)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--nx-navy-400)', lineHeight: 1.5 }}>
              If you save {fmt(monthly)}/mo starting at age {age}, at 7% average return by age 65.
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel — form ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(24px,5vw,64px)' }}>
        <div style={{ width: '100%', maxWidth: 480 }}>

          {/* Step 0: About You */}
          {step === 0 && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-gold-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of 4</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--foreground)', marginBottom: 10, lineHeight: 1.1 }}>
                  Hey! Tell us a bit<br/>about yourself.
                </h1>
                <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Takes about 2 minutes. We use this to personalize your plan.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Account type selector */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 8 }}>I am a…</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                    {([
                      { value: 'personal', emoji: '👤', label: 'Personal', sub: 'Just for me' },
                      { value: 'student',  emoji: '🎓', label: 'Student',  sub: 'In a class' },
                      { value: 'teacher',  emoji: '📚', label: 'Teacher',  sub: 'Running a class' },
                    ] as const).map(opt => (
                      <button key={opt.value} type="button" onClick={() => setAccountType(opt.value)}
                        style={{
                          padding: '14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                          border: `2px solid ${accountType === opt.value ? 'var(--nx-gold-500)' : 'var(--border)'}`,
                          background: accountType === opt.value ? 'var(--nx-gold-50)' : 'var(--surface)',
                          transition: 'all 120ms',
                        }}>
                        <div style={{ fontSize: 22, marginBottom: 4 }}>{opt.emoji}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{opt.label}</div>
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{opt.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>Your first name</label>
                  <input className="input" placeholder="Jordan" value={profile.full_name} onChange={setP('full_name')} />
                </div>
                {accountType !== 'teacher' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>How old are you?</label>
                  <input className="input" type="number" placeholder="17" min={13} max={65} value={profile.age} onChange={setP('age')} />
                </div>
                )}
                {accountType === 'student' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>Where does your money come from?</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {INCOME_SOURCES.map(src => (
                      <label key={src.value} style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 14px', borderRadius: 8,
                        border: `1px solid ${profile.income_source === src.value ? 'var(--nx-gold-400)' : 'var(--border)'}`,
                        background: profile.income_source === src.value ? 'var(--nx-gold-50)' : 'var(--surface)',
                        cursor: 'pointer', transition: 'all 120ms',
                      }}>
                        <input
                          type="radio" name="income_source" value={src.value}
                          checked={profile.income_source === src.value}
                          onChange={setP('income_source')}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: 18, height: 18, borderRadius: '50%', border: `2px solid ${profile.income_source === src.value ? 'var(--nx-gold-500)' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          {profile.income_source === src.value && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--nx-gold-500)' }} />}
                        </div>
                        <span style={{ fontSize: 14, color: 'var(--foreground)' }}>{src.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                )}
              </div>

              <button
                onClick={() => setStep(1)}
                disabled={!profile.full_name || !profile.age}
                style={{
                  marginTop: 28, width: '100%',
                  padding: '13px', borderRadius: 8, border: 'none',
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  background: profile.full_name && profile.age ? 'var(--nx-navy-800)' : 'var(--nx-navy-300)',
                  color: 'var(--nx-cream-50)',
                  transition: 'background 200ms',
                }}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 1: Your Money */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-gold-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of 4</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--foreground)', marginBottom: 10, lineHeight: 1.1 }}>
                  Your money,<br/>in &amp; out.
                </h1>
                <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>
                  Rough estimates are totally fine — you can update this anytime.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>Monthly income (after taxes)</label>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Add up your job, allowance, and any side hustle money</p>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>$</span>
                    <input
                      className="input" type="number" placeholder="500"
                      value={income.annual_income ? String(parseFloat(income.annual_income) / 12) : ''}
                      onChange={e => setI('annual_income')({ target: { value: String(parseFloat(e.target.value || '0') * 12) } } as React.ChangeEvent<HTMLInputElement>)}
                      style={{ paddingLeft: 28 }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 4 }}>Monthly spending</label>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Food, transport, subscriptions, clothes — everything you spend</p>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)', fontWeight: 600 }}>$</span>
                    <input className="input" type="number" placeholder="350" value={income.monthly_expenses} onChange={setI('monthly_expenses')} style={{ paddingLeft: 28 }} />
                  </div>
                </div>

                {/* Live preview */}
                {monthlyIncome > 0 && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Monthly snapshot</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Income</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-pos-500)' }}>{fmt(monthlyIncome)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: 'var(--muted)' }}>Spending</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-neg-500)' }}>−{fmt(monthlyExpenses)}</span>
                    </div>
                    <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--foreground)' }}>Available to save</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: monthlySavings > 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)' }}>
                        {fmt(monthlySavings)}
                      </span>
                    </div>
                    {futureValue > 0 && monthlySavings > 0 && (
                      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--nx-gold-50)', border: '1px solid var(--nx-gold-200)' }}>
                        <div style={{ fontSize: 12, color: 'var(--nx-gold-700)' }}>
                          💡 Saving {fmt(monthlySavings)}/mo starting at age {age} could grow to{' '}
                          <strong>{fmt(Math.max(0, (parseFloat(income.annual_income) / 12 || 0) > 0 ? Math.round(monthlySavings * (((1 + 0.07/12) ** ((65 - age) * 12) - 1) / (0.07/12))) : 0))}</strong>{' '}
                          by retirement.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button onClick={() => setStep(0)} style={{ padding: '13px 20px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontWeight: 500, background: 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(2)} style={{ flex: 1, padding: '13px', borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)' }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Goals */}
          {step === 2 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-gold-600)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 4</div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px,4vw,40px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--foreground)', marginBottom: 10, lineHeight: 1.1 }}>
                  What are you<br/>saving for?
                </h1>
                <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.6 }}>Pick everything that applies. You can always add more later.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
                {TEEN_GOALS.map(g => {
                  const selected = selectedGoals.includes(g.name)
                  return (
                    <button
                      key={g.name}
                      onClick={() => toggleGoal(g.name)}
                      style={{
                        padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                        border: `1px solid ${selected ? 'var(--nx-gold-400)' : 'var(--border)'}`,
                        background: selected ? 'var(--nx-gold-50)' : 'var(--surface)',
                        fontSize: 13, color: 'var(--foreground)', cursor: 'pointer',
                        fontWeight: selected ? 600 : 400, transition: 'all 120ms',
                      }}
                    >
                      {g.name}
                      {selected && <span style={{ float: 'right', color: 'var(--nx-gold-500)' }}>✓</span>}
                    </button>
                  )
                })}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', marginBottom: 6 }}>Something else?</label>
                <input className="input" placeholder="Custom goal..." value={customGoal} onChange={e => setCustomGoal(e.target.value)} />
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
                <button onClick={() => setStep(1)} style={{ padding: '13px 20px', borderRadius: 8, border: '1px solid var(--border)', fontSize: 14, fontWeight: 500, background: 'transparent', color: 'var(--foreground)', cursor: 'pointer' }}>← Back</button>
                <button onClick={() => setStep(3)} style={{ flex: 1, padding: '13px', borderRadius: 8, border: 'none', fontSize: 15, fontWeight: 600, cursor: 'pointer', background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)' }}>
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Ready */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 72, marginBottom: 20 }}>🚀</div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--foreground)', marginBottom: 16, lineHeight: 1.1 }}>
                You&apos;re set up,{' '}
                <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>{profile.full_name.split(' ')[0]}!</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 32, maxWidth: 380, margin: '0 auto 32px' }}>
                Your Nexus account is ready. Want a quick 60-second tour of what you can do?
              </p>

              {/* Summary card */}
              {monthlyIncome > 0 && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', marginBottom: 28, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Your setup</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {[
                      { label: 'Monthly income', value: fmt(monthlyIncome) },
                      { label: 'Monthly savings', value: fmt(monthlySavings) },
                      { label: 'Goals set', value: `${selectedGoals.length + (customGoal ? 1 : 0)}` },
                      ...(futureValue > 0 ? [{ label: 'Retirement projection', value: fmt(futureValue) }] : []),
                    ].map(s => (
                      <div key={s.label} style={{ flex: '1 1 120px', padding: '10px 12px', borderRadius: 8, background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)' }}>
                        <div style={{ fontSize: 10, color: 'var(--nx-navy-400)', marginBottom: 4 }}>{s.label}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={finish}
                  disabled={loading}
                  style={{
                    padding: '14px', borderRadius: 8, border: 'none', fontSize: 16, fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
                  }}
                >
                  {loading ? 'Setting up...' : '✨ Take the feature tour'}
                </button>
                <button
                  onClick={async () => { await finish(); router.push('/dashboard') }}
                  disabled={loading}
                  style={{
                    padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 500,
                    border: '1px solid var(--border)', background: 'transparent', color: 'var(--foreground)', cursor: 'pointer',
                  }}
                >
                  Skip tour — go to dashboard
                </button>
              </div>

              <button onClick={() => setStep(2)} style={{ marginTop: 16, background: 'none', border: 'none', fontSize: 13, color: 'var(--muted)', cursor: 'pointer' }}>← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
