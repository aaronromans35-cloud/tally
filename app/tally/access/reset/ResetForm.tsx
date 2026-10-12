'use client'
/**
 * Tally — set a new password.
 *
 * Landing page for the Supabase password-recovery link. The link puts the user
 * in a temporary recovery session; `updateUser({ password })` sets the new one.
 */
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BODY, DISPLAY, MONO, css as c, sx } from '../../lib'

const APP = '/tally'
const display = (x: string) => sx(c(x), { fontFamily: DISPLAY })
const mono = (x: string) => sx(c(x), { fontFamily: MONO })
const field = c(
  "width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:13px 15px;border:1px solid #d6d3c8;border-radius:12px;background:#ffffff;color:#14140f;outline:none",
)

export default function ResetForm() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let client: ReturnType<typeof createClient> | null = null
    try {
      client = createClient()
    } catch {
      setError('Sign-in service is unavailable right now.')
      return
    }
    client.auth.getSession().then(({ data }) => {
      setReady(Boolean(data.session))
      if (!data.session) {
        setError('This reset link has expired or was already used. Request a new one.')
      }
    })
  }, [])

  const submit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      if (password.length < 8) {
        setError('Password must be at least 8 characters.')
        return
      }
      if (password !== confirm) {
        setError('The two passwords don’t match.')
        return
      }
      setBusy(true)
      try {
        const client = createClient()
        const { error: err } = await client.auth.updateUser({ password })
        if (err) throw err
        setDone(true)
        setTimeout(() => router.push(APP), 1400)
      } catch (err: unknown) {
        setError((err as { message?: string })?.message || 'Could not update the password. Try again.')
      } finally {
        setBusy(false)
      }
    },
    [password, confirm, router],
  )

  return (
    <div
      style={sx(
        c('min-height:100vh;background:#f5f4ef;color:#14140f;display:flex;align-items:center;justify-content:center;padding:48px 20px'),
        { fontFamily: BODY },
      )}
    >
      <div style={c('width:100%;max-width:420px')}>
        <div style={c('display:flex;align-items:center;gap:10px;justify-content:center;margin-bottom:26px')}>
          <div style={c('width:26px;height:26px;background:#1c6a48;border-radius:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2.5px;flex:none')}>
            <div style={c('width:11px;height:3px;border-radius:3px;background:#cdf06a')} />
            <div style={c('width:14px;height:3px;border-radius:3px;background:#9fd35a')} />
            <div style={c('width:17px;height:3px;border-radius:3px;background:#f5f4ef')} />
          </div>
          <span style={display('font-weight:700;font-size:20px;letter-spacing:-0.02em')}>Tally</span>
        </div>

        <div style={c('background:#ffffff;border:1px solid #e4e2d9;border-radius:24px;padding:32px')}>
          {done ? (
            <>
              <h1 style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 10px')}>
                Password updated
              </h1>
              <p style={c('font-size:15px;line-height:1.6;color:#4a4941;margin:0')}>Taking you into Tally…</p>
            </>
          ) : (
            <>
              <h1 style={display('font-size:24px;font-weight:700;letter-spacing:-0.02em;margin:0 0 8px')}>
                Set a new password
              </h1>
              <p style={c('font-size:14px;line-height:1.55;color:#4a4941;margin:0 0 22px')}>
                Pick something at least 8 characters long.
              </p>
              <form onSubmit={submit}>
                <div style={c('margin-bottom:14px')}>
                  <label style={mono('font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:7px;display:block')}>
                    New password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={field}
                    disabled={!ready}
                  />
                </div>
                <div style={c('margin-bottom:14px')}>
                  <label style={mono('font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:7px;display:block')}>
                    Confirm password
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    style={field}
                    disabled={!ready}
                  />
                </div>
                {error && (
                  <div style={c('font-size:13px;line-height:1.5;color:#b8422a;background:#fbeae6;border:1px solid #e7c3ba;border-radius:10px;padding:10px 12px;margin-bottom:14px')}>
                    {error}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy || !ready}
                  style={sx(
                    c("width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;min-height:48px;border:none;border-radius:12px;background:#1c6a48;color:#f7fbf6;cursor:pointer"),
                    busy || !ready ? { opacity: 0.6, cursor: 'default' } : {},
                  )}
                >
                  {busy ? 'Saving…' : 'Update password'}
                </button>
              </form>
            </>
          )}
        </div>

        <div style={c('text-align:center;margin-top:18px')}>
          <Link
            href={`${APP}/access`}
            style={mono('font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6a60')}
          >
            ← Back to sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
