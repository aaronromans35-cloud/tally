'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(k: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error: signupError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    })
    if (signupError) { setError(signupError.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, full_name: form.name })
    }
    router.push('/onboarding')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--background)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-[420px] shrink-0 p-10"
        style={{ background: 'var(--nav)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--accent)' }}>N</div>
          <span className="text-white text-lg font-bold tracking-tight">Nexus</span>
        </div>
        <div>
          <h2 className="text-white text-2xl font-bold mb-4 leading-snug" style={{ letterSpacing: '-0.03em' }}>
            Your complete<br />financial life,<br />in one place.
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { icon: '💰', text: 'Budget tracker with category breakdown' },
              { icon: '🤖', text: 'AI-generated personalized investment plan' },
              { icon: '📈', text: 'Portfolio tracking with live market data' },
              { icon: '🧾', text: 'Federal tax estimation & TLH opportunities' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-sm" style={{ color: '#D1D5DB' }}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs" style={{ color: '#6B7280' }}>Free to start. No credit card required.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>Create your account</h1>
            <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Start your free financial journey</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" type="text" value={form.name} onChange={set('name')} required placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" value={form.email} onChange={set('email')} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={set('password')} required placeholder="At least 8 characters" minLength={8} />
            </div>
            {error && (
              <div className="px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: 'var(--foreground-secondary)' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Sign in</Link>
          </p>
          <p className="text-center text-xs mt-4" style={{ color: 'var(--muted)' }}>
            For educational purposes only. Not financial advice.
          </p>
        </div>
      </div>
    </div>
  )
}
