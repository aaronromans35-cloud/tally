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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
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
          <blockquote className="text-white text-xl font-medium leading-snug mb-4" style={{ letterSpacing: '-0.02em' }}>
            &ldquo;I finally understand where my money is going — and where it should be going.&rdquo;
          </blockquote>
          <p className="text-sm" style={{ color: '#9CA3AF' }}>— Sarah M., Teacher · Phoenix, AZ</p>
        </div>
        <div className="flex gap-2">
          {['Budget', 'Invest', 'Plan', 'Tax'].map(t => (
            <span key={t} className="chip text-xs" style={{ background: 'rgba(255,255,255,0.08)', color: '#9CA3AF', border: '1px solid rgba(255,255,255,0.1)' }}>{t}</span>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-1" style={{ letterSpacing: '-0.03em' }}>Welcome back</h1>
            <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Sign in to your Nexus account</p>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="label">Email address</label>
              <input className="input" type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && (
              <div className="px-3 py-2.5 rounded-lg text-sm" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
                {error}
              </div>
            )}
            <button type="submit" className="btn-primary w-full justify-center py-3" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
          <p className="text-center text-sm mt-6" style={{ color: 'var(--foreground-secondary)' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
