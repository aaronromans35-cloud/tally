'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const timeout = new Promise<{ error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ error: { message: 'timeout' } }), 12_000)
    )

    try {
      const { error } = await Promise.race([
        supabase.auth.signInWithPassword({ email, password }),
        timeout,
      ])

      if (error) {
        const msg = error.message?.toLowerCase() ?? ''
        setError(
          error.message === 'timeout'
            ? 'Sign in is taking longer than expected. Check your connection and try again.'
            : msg.includes('email not confirmed') || msg.includes('not confirmed')
            ? 'Please confirm your email first — check your inbox for a link from Supabase and click it, then try signing in again.'
            : msg.includes('invalid login') || msg.includes('invalid credentials') || msg.includes('invalid email or password')
            ? 'Invalid email or password. Double-check and try again.'
            : error.message || 'Something went wrong. Please try again.'
        )
        setLoading(false)
      } else {
        window.location.href = '/dashboard'
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
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

        {/* Quote */}
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999, marginBottom: 20,
            background: 'rgba(201,164,55,0.12)', border: '1px solid rgba(201,164,55,0.2)',
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>
            </svg>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.10em', textTransform: 'uppercase', color: 'var(--nx-gold-300)' }}>Nexus AI</span>
          </div>
          <blockquote style={{
            fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400,
            letterSpacing: '-0.02em', lineHeight: 1.45,
            color: 'var(--nx-cream-50)', marginBottom: 16, fontStyle: 'italic',
          }}>
            &ldquo;I finally understand where my money is going — and where it should be going.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--nx-gold-500)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 13, color: 'var(--nx-navy-900)',
            }}>S</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--nx-cream-50)' }}>Sarah M.</div>
              <div style={{ fontSize: 11, color: 'var(--nx-navy-400)' }}>Teacher · Phoenix, AZ</div>
            </div>
          </div>
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['Budget', 'Invest', 'AI Plan', 'Tax'].map(t => (
            <span key={t} style={{
              fontSize: 12, fontWeight: 500, padding: '4px 12px', borderRadius: 999,
              background: 'rgba(255,255,255,0.07)', color: 'var(--nx-navy-300)',
              border: '1px solid var(--nx-navy-700)',
            }}>{t}</span>
          ))}
        </div>
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

          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, letterSpacing: '-0.02em', color: 'var(--nx-navy-900)', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ fontSize: 14, color: 'var(--muted)' }}>Sign in to your Nexus account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
              />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label className="label" style={{ margin: 0 }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--nx-gold-600)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
              </div>
              <input
                className="input"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, fontSize: 13.5,
                background: 'var(--nx-neg-50)', color: 'var(--nx-neg-700)',
                border: '1px solid var(--nx-neg-100)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', padding: '11px', fontSize: 14.5, marginTop: 2 }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 13.5, color: 'var(--muted)', marginTop: 24 }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--nx-gold-600)', fontWeight: 600, textDecoration: 'none' }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
