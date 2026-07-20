'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState({
    full_name: '', age: '', annual_income: '', monthly_expenses: '',
    risk_tolerance: 'moderate', retirement_age: '65',
    tax_filing_status: 'single', state: '',
  })
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setEmail(user.email ?? '')
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (data) {
        setProfile({
          full_name: data.full_name ?? '',
          age: data.age ? String(data.age) : '',
          annual_income: data.annual_income ? String(data.annual_income) : '',
          monthly_expenses: data.monthly_expenses ? String(data.monthly_expenses) : '',
          risk_tolerance: data.risk_tolerance ?? 'moderate',
          retirement_age: data.retirement_age ? String(data.retirement_age) : '65',
          tax_filing_status: data.tax_filing_status ?? 'single',
          state: data.state ?? '',
        })
      }
    }
    load()
  }, [])

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setProfile(p => ({ ...p, [k]: e.target.value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').upsert({
      id: user!.id,
      ...profile,
      age: parseInt(profile.age) || null,
      retirement_age: parseInt(profile.retirement_age) || 65,
      annual_income: parseFloat(profile.annual_income) || null,
      monthly_expenses: parseFloat(profile.monthly_expenses) || null,
      updated_at: new Date().toISOString(),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="max-w-2xl">
      <h1 className="page-title">Profile & Settings</h1>

      <form onSubmit={save} className="flex flex-col gap-6">
        {/* Account */}
        <div className="card">
          <h2 className="font-semibold mb-4">Account</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Email</label>
              <div className="input" style={{ opacity: 0.6, cursor: 'not-allowed' }}>{email}</div>
            </div>
            <div>
              <label className="label">First Name</label>
              <input className="input" value={profile.full_name} onChange={set('full_name')} placeholder="Jordan" />
            </div>
          </div>
        </div>

        {/* Financial Profile */}
        <div className="card">
          <h2 className="font-semibold mb-4">Financial Profile</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Age</label>
              <input className="input" type="number" value={profile.age} onChange={set('age')} placeholder="30" />
            </div>
            <div>
              <label className="label">Target Retirement Age</label>
              <input className="input" type="number" value={profile.retirement_age} onChange={set('retirement_age')} />
            </div>
            <div>
              <label className="label">Annual Gross Income ($)</label>
              <input className="input" type="number" value={profile.annual_income} onChange={set('annual_income')} placeholder="75000" />
            </div>
            <div>
              <label className="label">Monthly Expenses ($)</label>
              <input className="input" type="number" value={profile.monthly_expenses} onChange={set('monthly_expenses')} placeholder="3500" />
            </div>
            <div>
              <label className="label">Risk Tolerance</label>
              <select className="input" value={profile.risk_tolerance} onChange={set('risk_tolerance')}>
                <option value="conservative">Conservative</option>
                <option value="moderate">Moderate</option>
                <option value="aggressive">Aggressive</option>
              </select>
            </div>
            <div>
              <label className="label">Tax Filing Status</label>
              <select className="input" value={profile.tax_filing_status} onChange={set('tax_filing_status')}>
                <option value="single">Single</option>
                <option value="married_filing_jointly">Married Filing Jointly</option>
                <option value="married_filing_separately">Married Filing Separately</option>
                <option value="head_of_household">Head of Household</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">State</label>
              <select className="input" value={profile.state} onChange={set('state')}>
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

        <div className="flex items-center gap-3">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm" style={{ color: 'var(--green)' }}>Profile updated</span>}
        </div>
      </form>

      {/* Danger zone */}
      <div className="card mt-8" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
        <h2 className="font-semibold mb-2" style={{ color: 'var(--red)' }}>Sign Out</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>You can sign back in anytime.</p>
        <button onClick={signOut} className="btn-danger">Sign Out</button>
      </div>
    </div>
  )
}
