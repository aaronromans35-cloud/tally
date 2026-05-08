'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

const FEATURES = [
  'Budget tracker with category breakdown',
  'AI-generated personalized investment plan',
  'Portfolio tracking with live market data',
  'Federal tax estimation & TLH opportunities',
  'Debt payoff planner with interest savings',
  'Goal tracker across all your finances',
]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

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
    setLoading(false)
    setConfirmed(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'var(--font-sans)' }}>

      {/* ── Left panel — navy ── */}
      <div style={{
        width: 440, flexShrink: 0,
        background: 'var(--nx-navy-800)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '36px 40px',
      }} className="hidden lg:flex">

        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, background: 'var(--nx-cream-50)', borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-cream-50)' }}>
            Nexus
          </span>
        </div>

        {/* Headline + feature list */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999, marginBottom: 20,
            background: 'rgba(201,164,55,0.12)', border: '1px solid rgba(201,164,55,0.2)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--nx-gold-300)' }}>Everything included</span>
          </div>

          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400,
            letterSpacing: '-0.03em', lineHeight: 1.25,
            color: 'var(--nx-cream-50)', marginBottom: 28,
          }}>
            Your complete<br />
            <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>financial life,</span><br />
            in one place.
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {FEATURES.map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ marginTop: 1, flexShrink: 0 }}>
                  <CheckIcon />
                </div>
                <span style={{ fontSize: 13.5, color: 'var(--nx-navy-200)', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: 12, color: 'var(--nx-navy-500)' }}>Free to start. No credit card required.</p>
      </div>

      {/* ── Right panel — cream ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--nx-cream-50)', padding: '40px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Mobile brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }} className="flex lg:hidden">
            <div style={{ width: 24, height: 24, background: 'var(--nx-navy-800)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-800)' }}>Nexus</span>
          </div>

          {confirmed ? (
            /* ── Email confirmation screen ── */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'var(--nx-navy-800)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>
                Check your email
              </h1>
              <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
                We sent a confirmation link to<br />
                <strong style={{ color: 'var(--nx-navy-900)' }}>{form.email}</strong>.<br /><br />
                Click the link in that email to verify your account and get started.
              </p>
              <div style={{
                padding: '14px 18px', borderRadius: 10, fontSize: 13,
                background: 'rgba(201,164,55,0.08)', border: '1px solid rgba(201,164,55,0.2)',
                color: 'var(--nx-navy-700)', lineHeight: 1.55, marginBottom: 28, textAlign: 'left',
              }}>
                <strong>📬 Don&apos;t see it?</strong> Check your spam folder. The email comes from <em>no-reply@mail.app.supabase.io</em>
              </div>
              <Link href="/login" style={{
                display: 'block', textAlign: 'center', fontSize: 14, fontWeight: 600,
                padding: '11px', borderRadius: 8, background: 'var(--nx-navy-800)',
                color: 'var(--nx-cream-50)', textDecoration: 'none',
              }}>
                Go to sign in →
              </Link>
            </div>
          ) : (
            /* ── Sign up form ── */
            <>
              <div style={{ marginBottom: 32 }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 6 }}>
                  Create your account
                </h1>
                <p style={{ fontSize: 14, color: 'var(--muted)' }}>Start your free financial journey today</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
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
                  <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13.5, background: 'var(--nx-neg-50)', color: 'var(--nx-neg-700)', border: '1px solid var(--nx-neg-100)' }}>
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary" disabled={loading}
                  style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14.5, marginTop: 2 }}>
                  {loading ? 'Creating account…' : 'Create free account'}
                </button>
              </form>

              <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted)', marginTop: 24 }}>
                Already have an account?{' '}
                <Link href="/login" style={{ color: 'var(--nx-gold-600)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
              </p>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 16, lineHeight: 1.5 }}>
                For educational purposes only. Not financial advice.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
