'use client'
/**
 * Tally — early-access / sign-in.
 *
 * Three modes: create an account (early access), sign in, and reset password.
 * Auth is backed by Supabase (already configured in this repo). "Continue with
 * Google" uses Supabase OAuth and degrades gracefully if the Google provider
 * isn't enabled for the project. There is always a "skip into the demo" exit so
 * the flow is never a dead end.
 */
import { useCallback, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BODY, DISPLAY, MONO, css as c, Hover, sx } from '../lib'

type Mode = 'signup' | 'signin' | 'reset'
const APP = '/tally'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Must match the server. Length is the control that actually matters. */
const MIN_PASSWORD = 10

const display = (x: string) => sx(c(x), { fontFamily: DISPLAY })
const mono = (x: string) => sx(c(x), { fontFamily: MONO })

function supa() {
  try {
    return createClient()
  } catch {
    return null
  }
}

function TallyMark() {
  return (
    <div style={c('display:flex;align-items:center;gap:10px;justify-content:center')}>
      <div style={c('width:26px;height:26px;background:#1c6a48;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.5px;flex:none')}>
        <div style={c('width:11px;height:3px;border-radius:3px;background:#cdf06a')} />
        <div style={c('width:14px;height:3px;border-radius:3px;background:#9fd35a')} />
        <div style={c('width:17px;height:3px;border-radius:3px;background:#f5f4ef')} />
      </div>
      <span style={display('font-weight:700;font-size:20px;letter-spacing:-0.02em')}>Tally</span>
    </div>
  )
}

const field = c(
  "width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:13px 15px;border:1px solid #d6d3c8;border-radius:12px;background:#ffffff;color:#14140f;outline:none",
)
const label = mono('font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:7px;display:block')
const primaryBtn = sx(
  c("width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;min-height:48px;padding:0 20px;border:none;border-radius:12px;background:#1c6a48;color:#f7fbf6;cursor:pointer"),
  {},
)

export default function AccessForm() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState<null | 'confirm' | 'reset'>(null)
  /** True when the new account belongs to someone under 18. */
  const [guardianNote, setGuardianNote] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  const reset = () => {
    setError('')
    setSent(null)
  }

  const switchMode = (m: Mode) => {
    setMode(m)
    setPassword('')
    reset()
  }

  const google = useCallback(async () => {
    reset()
    const client = supa()
    if (!client) {
      setError('Sign-in service is unavailable right now. Use email below, or continue to the demo.')
      return
    }
    setBusy(true)
    const { error: err } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${origin}${APP}` },
    })
    if (err) {
      setBusy(false)
      setError(
        'Google sign-in isn’t enabled for this project yet. Use email below, or continue to the demo.',
      )
    }
    // on success the browser redirects to Google; no further code runs
  }, [origin])

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      reset()
      if (!EMAIL_RE.test(email)) {
        setError('Enter a valid email address.')
        return
      }
      if (mode !== 'reset' && password.length < MIN_PASSWORD) {
        setError(`Password must be at least ${MIN_PASSWORD} characters.`)
        return
      }
      if (mode === 'signup' && !dob) {
        setError('Enter your date of birth.')
        return
      }

      setBusy(true)
      try {
        /**
         * Goes through our own route rather than calling Supabase from the
         * browser. Direct client calls skip every rate limit we own, which
         * made password guessing free; the route applies per-IP and
         * per-account limits before Supabase ever sees the attempt.
         */
        const res = await fetch('/api/tally/auth', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ action: mode, email, password, dob }),
        })
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          setError(data?.error ?? 'Something went wrong. Please try again.')
          return
        }

        if (mode === 'signin') {
          router.push(APP)
          return
        }
        if (mode === 'signup') {
          setGuardianNote(Boolean(data?.needsGuardian))
          setSent('confirm')
        } else {
          setSent('reset')
        }
      } catch {
        setError('Could not reach the server. Check your connection and try again.')
      } finally {
        setBusy(false)
      }
    },
    [email, password, dob, mode, router],
  )

  const heading =
    mode === 'signup' ? 'Get early access' : mode === 'signin' ? 'Welcome back' : 'Reset your password'
  const sub =
    mode === 'signup'
      ? 'Tally is in early access. Create an account to connect a bank and start a streak.'
      : mode === 'signin'
        ? 'Sign in to pick up your buckets, goals, and streak.'
        : 'We’ll email you a link to set a new password.'

  return (
    <div
      style={sx(
        c('min-height:100vh;background:#f5f4ef;color:#14140f;display:flex;align-items:center;justify-content:center;padding:48px 20px'),
        { fontFamily: BODY },
      )}
    >
      <style>{`.tally-access a{color:#1c6a48;text-decoration:none}.tally-access a:hover{color:#14140f}`}</style>
      <div className="tally-access" style={c('width:100%;max-width:420px')}>
        <div style={c('margin-bottom:26px')}>
          <TallyMark />
        </div>

        <div style={c('background:#ffffff;border:1px solid #e4e2d9;border-radius:24px;padding:32px')}>
          {sent ? (
            <div>
              <h1 style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 10px')}>
                Check your email
              </h1>
              <p style={c('font-size:15px;line-height:1.6;color:#4a4941;margin:0 0 8px')}>
                {sent === 'confirm'
                  ? `We sent a confirmation link to ${email}. Click it to finish setting up your account.`
                  : `If an account exists for ${email}, a password-reset link is on its way.`}
              </p>
              <p style={mono('font-size:12px;color:#6b6a60;margin:0 0 16px')}>
                No email in a few minutes? Check spam, or try a different address.
              </p>
              {guardianNote && (
                <div style={c('font-size:13px;line-height:1.6;color:#4a4941;background:#faf9f4;border:1px solid #e4e2d9;border-radius:12px;padding:12px 14px;margin:0 0 20px')}>
                  <strong>One more thing.</strong> Because you‘re under 18, connecting a bank
                  needs a guardian on a Family plan — the service that powers bank connections
                  requires account holders to be 18 or over. Everything else works now: buckets,
                  goals, streaks, and adding transactions yourself.
                </div>
              )}
              <button
                type="button"
                onClick={() => switchMode('signin')}
                style={sx(
                  c("width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;min-height:46px;border:1px solid #cac7bc;border-radius:12px;background:transparent;color:#14140f;cursor:pointer"),
                  {},
                )}
              >
                Back to sign in
              </button>
            </div>
          ) : (
            <>
              <h1 style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px')}>
                {heading}
              </h1>
              <p style={c('font-size:14px;line-height:1.55;color:#4a4941;margin:0 0 22px')}>{sub}</p>

              {mode !== 'reset' && (
                <>
                  <Hover
                    as="button"
                    onClick={google}
                    base={sx(
                      c("width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;min-height:46px;display:flex;align-items:center;justify-content:center;gap:10px;border:1px solid #d6d3c8;border-radius:12px;background:#ffffff;color:#14140f;cursor:pointer;margin-bottom:16px"),
                      {},
                    )}
                    hover={{ background: '#f0eee6' }}
                  >
                    <GoogleG />
                    Continue with Google
                  </Hover>
                  <div style={c('display:flex;align-items:center;gap:12px;margin-bottom:16px')}>
                    <div style={c('flex:1;height:1px;background:#e4e2d9')} />
                    <span style={mono('font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#9a988c')}>
                      or
                    </span>
                    <div style={c('flex:1;height:1px;background:#e4e2d9')} />
                  </div>
                </>
              )}

              <form onSubmit={submit}>
                <div style={c('margin-bottom:14px')}>
                  <label style={label} htmlFor="tally-email">
                    Email
                  </label>
                  <input
                    id="tally-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    style={field}
                  />
                </div>

                {mode !== 'reset' && (
                  <div style={c('margin-bottom:14px')}>
                    <label style={label} htmlFor="tally-password">
                      Password
                    </label>
                    <input
                      id="tally-password"
                      type="password"
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? `At least ${MIN_PASSWORD} characters` : 'Your password'}
                      style={field}
                    />
                  </div>
                )}

                {mode === 'signup' && (
                  <div style={c('margin-bottom:14px')}>
                    <label style={label} htmlFor="tally-dob">
                      Date of birth
                    </label>
                    <input
                      id="tally-dob"
                      type="date"
                      autoComplete="bday"
                      value={dob}
                      max={new Date().toISOString().slice(0, 10)}
                      onChange={(e) => setDob(e.target.value)}
                      style={field}
                    />
                    {/*
                      Collected for age assurance only — it decides whether bank
                      linking is available and whether a guardian is required.
                      It is the minimum datum for that job; don't add more
                      identity fields here.
                    */}
                    <p style={c('font-size:12px;line-height:1.5;color:#6b6a60;margin:7px 0 0')}>
                      Used to check your age. Under 18 can use all of Tally, but bank linking
                      needs a guardian — Plaid requires account holders to be 18+.
                    </p>
                  </div>
                )}

                {error && (
                  <div style={c('font-size:13px;line-height:1.5;color:#b8422a;background:#fbeae6;border:1px solid #e7c3ba;border-radius:10px;padding:10px 12px;margin-bottom:14px')}>
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy} style={sx(primaryBtn, busy ? { opacity: 0.6, cursor: 'default' } : {})}>
                  {busy
                    ? 'Working…'
                    : mode === 'signup'
                      ? 'Create account'
                      : mode === 'signin'
                        ? 'Sign in'
                        : 'Email me a reset link'}
                </button>
              </form>

              <div style={c('margin-top:16px;font-size:13px;line-height:1.7;color:#4a4941')}>
                {mode === 'signin' && (
                  <>
                    <button type="button" onClick={() => switchMode('reset')} style={linkish}>
                      Forgot your password?
                    </button>
                    <br />
                    New here?{' '}
                    <button type="button" onClick={() => switchMode('signup')} style={linkish}>
                      Get early access
                    </button>
                  </>
                )}
                {mode === 'signup' && (
                  <>
                    Already have an account?{' '}
                    <button type="button" onClick={() => switchMode('signin')} style={linkish}>
                      Sign in
                    </button>
                  </>
                )}
                {mode === 'reset' && (
                  <button type="button" onClick={() => switchMode('signin')} style={linkish}>
                    Back to sign in
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        <div style={c('text-align:center;margin-top:18px')}>
          <Link href={APP} style={mono('font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6a60')}>
            Skip — explore the demo →
          </Link>
        </div>
        <p style={c('text-align:center;font-size:12px;line-height:1.6;color:#9a988c;margin:14px auto 0;max-width:34em')}>
          Tally is read-only and is not a bank. By continuing you agree to the{' '}
          <Link href={`${APP}/legal/terms`}>Terms</Link> and{' '}
          <Link href={`${APP}/legal/privacy`}>Privacy Policy</Link>.
        </p>
      </div>
    </div>
  )
}

const linkish = sx(
  c("font-family:'IBM Plex Sans',sans-serif;font-size:13px;font-weight:600;color:#1c6a48;background:none;border:none;padding:0;cursor:pointer"),
  {},
)

function GoogleG() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  )
}
