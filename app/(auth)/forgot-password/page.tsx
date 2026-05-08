'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (err) { setError(err.message); return }
    setSent(true)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)', padding: '40px 24px' }}>
      <div style={{ width: '100%', maxWidth: 360 }}>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', marginBottom: 40 }}>
          <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
        </Link>

        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--nx-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
            </div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>Check your email</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 28 }}>
              We sent a password reset link to<br />
              <strong style={{ color: 'var(--nx-navy-900)' }}>{email}</strong>
            </p>
            <div style={{ padding: '14px 18px', borderRadius: 10, fontSize: 13, background: 'rgba(201,164,55,0.08)', border: '1px solid rgba(201,164,55,0.2)', color: 'var(--nx-navy-700)', lineHeight: 1.55, marginBottom: 28, textAlign: 'left' }}>
              <strong>📬 Don&apos;t see it?</strong> Check your spam folder.
            </div>
            <Link href="/login" style={{ fontSize: 14, color: 'var(--nx-gold-600)', fontWeight: 600, textDecoration: 'none' }}>← Back to sign in</Link>
          </div>
        ) : (
          <>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 8 }}>Reset your password</h1>
            <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 32, lineHeight: 1.5 }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label className="label">Email address</label>
                <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" autoFocus />
              </div>

              {error && (
                <div style={{ padding: '10px 14px', borderRadius: 8, fontSize: 13.5, background: 'var(--nx-neg-50)', color: 'var(--nx-neg-700)', border: '1px solid var(--nx-neg-100)' }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14.5 }}>
                {loading ? 'Sending…' : 'Send reset link'}
              </button>
            </form>

            <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted)', marginTop: 24 }}>
              Remember it?{' '}
              <Link href="/login" style={{ color: 'var(--nx-gold-600)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
