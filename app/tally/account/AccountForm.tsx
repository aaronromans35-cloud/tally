'use client'
/**
 * Tally — account & settings.
 *
 * Reached from the avatar in the app header. Profile details, password, notification
 * preferences, and account actions. Prototype: details and toggles are local state
 * with a mock "Jordan Rivera"; password change and sign-out use Supabase when a
 * session exists and degrade gracefully when it doesn't.
 */
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BODY, DISPLAY, MONO, css as c, sx } from '../lib'

const APP = '/tally'
const display = (x: string) => sx(c(x), { fontFamily: DISPLAY })
const mono = (x: string) => sx(c(x), { fontFamily: MONO })

const card = c('background:#ffffff;border:1px solid #e4e2d9;border-radius:22px;padding:26px 28px')
const label = mono('font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:7px;display:block')
const field = c(
  "width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:12px 14px;border:1px solid #d6d3c8;border-radius:12px;background:#ffffff;color:#14140f;outline:none",
)
const btnDark = sx(
  c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:none;border-radius:12px;background:#14140f;color:#f5f4ef;cursor:pointer"),
  {},
)
const btnGhost = sx(
  c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:1px solid #cac7bc;border-radius:12px;background:transparent;color:#14140f;cursor:pointer"),
  {},
)

function supa() {
  try {
    return createClient()
  } catch {
    return null
  }
}

function ageFrom(dob: string) {
  const d = new Date(dob)
  if (Number.isNaN(d.getTime())) return null
  const now = new Date('2026-09-02')
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--
  return a
}

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => set(!on)}
      style={c(
        'width:44px;height:26px;border-radius:999px;border:none;cursor:pointer;flex:none;position:relative;transition:background 140ms ease;background:' +
          (on ? '#1c6a48' : '#d3d0c5'),
      )}
    >
      <span
        style={c(
          'position:absolute;top:3px;left:' +
            (on ? '21px' : '3px') +
            ';width:20px;height:20px;border-radius:999px;background:#ffffff;transition:left 140ms ease',
        )}
      />
    </button>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={c('display:flex;justify-content:space-between;align-items:center;gap:16px;padding:12px 0;border-top:1px solid #f0eee5')}>
      {children}
    </div>
  )
}

export default function AccountForm() {
  const router = useRouter()

  const [name, setName] = useState('Jordan Rivera')
  const [dob, setDob] = useState('2007-03-02')
  const [email, setEmail] = useState('jordan.rivera@campus.edu')
  const [username, setUsername] = useState('jordanr')
  const [phone, setPhone] = useState('')
  const [detailsSaved, setDetailsSaved] = useState(false)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  const [nRecap, setNRecap] = useState(true)
  const [nTrial, setNTrial] = useState(true)
  const [nStreak, setNStreak] = useState(false)
  const [nNews, setNNews] = useState(false)

  const [confirmDelete, setConfirmDelete] = useState(false)

  const age = useMemo(() => ageFrom(dob), [dob])
  const minor = age !== null && age < 18

  const saveDetails = () => {
    setDetailsSaved(true)
    setTimeout(() => setDetailsSaved(false), 1800)
  }

  const updatePassword = useCallback(async () => {
    setPwMsg('')
    if (pw.length < 8) return setPwMsg('Password must be at least 8 characters.')
    if (pw !== pw2) return setPwMsg('The two passwords don’t match.')
    const client = supa()
    if (!client) return setPwMsg('Sign-in service is unavailable right now.')
    setPwBusy(true)
    try {
      const { error } = await client.auth.updateUser({ password: pw })
      if (error) throw error
      setPwMsg('Password updated.')
      setPw('')
      setPw2('')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message?.toLowerCase() ?? ''
      setPwMsg(
        msg.includes('session') || msg.includes('logged') || msg.includes('auth')
          ? 'Sign in first to change your password.'
          : (err as { message?: string })?.message || 'Could not update the password.',
      )
    } finally {
      setPwBusy(false)
    }
  }, [pw, pw2])

  const signOut = useCallback(async () => {
    const client = supa()
    try {
      await client?.auth.signOut()
    } catch {
      /* ignore */
    }
    router.push('/tally/access')
  }, [router])

  return (
    <div
      style={sx(
        c('min-height:100vh;background:#f5f4ef;color:#14140f;padding:32px 20px 64px'),
        { fontFamily: BODY },
      )}
    >
      <div style={c('max-width:560px;margin:0 auto')}>
        <div style={c('display:flex;align-items:center;gap:12px;margin-bottom:24px')}>
          <Link href={APP} style={mono('font-size:12px;letter-spacing:0.06em;text-transform:uppercase;color:#6b6a60')}>
            ← Tally
          </Link>
          <span style={c('flex:1')} />
          <div style={sx(c('width:30px;height:30px;border-radius:99px;background:#cdf06a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#14140f'), { fontFamily: DISPLAY })}>
            {name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
          </div>
        </div>

        <h1 style={display('font-size:32px;font-weight:700;letter-spacing:-0.03em;margin:0 0 4px')}>Account</h1>
        <p style={c('font-size:14px;color:#4a4941;margin:0 0 26px')}>
          {name}
          {age !== null ? ' · ' + age + ' years old' : ''} · {email}
        </p>

        {/* details */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 16px')}>Your details</h2>

          <div style={c('display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px')}>
            <div style={c('grid-column:1 / -1')}>
              <label style={label}>Full name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} style={field} autoComplete="name" />
            </div>
            <div>
              <label style={label}>Date of birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={field} />
            </div>
            <div>
              <label style={label}>Age</label>
              <input value={age !== null ? String(age) : '—'} readOnly style={sx(field, { background: '#f0eee6', color: '#6b6a60' })} />
            </div>
            <div style={c('grid-column:1 / -1')}>
              <label style={label}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={field} autoComplete="email" />
            </div>
            <div>
              <label style={label}>Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} style={field} />
            </div>
            <div>
              <label style={label}>Phone (optional)</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" style={field} autoComplete="tel" />
            </div>
          </div>

          {minor ? (
            <div style={c('margin-top:14px;background:#fcf8e9;border:1px solid #d9c477;border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.55;color:#8a6a12')}>
              You’re under 18. Connecting a bank and changing your email need a parent or guardian’s
              approval — see Data &amp; permissions.
            </div>
          ) : null}

          <button type="button" onClick={saveDetails} style={sx(btnDark, { marginTop: 16 })}>
            {detailsSaved ? 'Saved ✓' : 'Save details'}
          </button>
        </div>

        {/* password */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 4px')}>Password</h2>
          <p style={c('font-size:13px;color:#4a4941;margin:0 0 16px')}>At least 8 characters. You stay signed in on this device.</p>
          <div style={c('display:flex;flex-direction:column;gap:12px')}>
            <div>
              <label style={label}>New password</label>
              <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={field} autoComplete="new-password" />
            </div>
            <div>
              <label style={label}>Confirm new password</label>
              <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={field} autoComplete="new-password" />
            </div>
          </div>
          {pwMsg ? (
            <div style={c('margin-top:12px;font-size:13px;line-height:1.5;color:' + (pwMsg === 'Password updated.' ? '#1c6a48' : '#b8422a'))}>
              {pwMsg}
            </div>
          ) : null}
          <button type="button" onClick={updatePassword} disabled={pwBusy} style={sx(btnDark, { marginTop: 16, opacity: pwBusy ? 0.6 : 1 })}>
            {pwBusy ? 'Working…' : 'Update password'}
          </button>
        </div>

        {/* notifications */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 6px')}>Notifications</h2>
          <Row>
            <div>
              <div style={c('font-size:14px;font-weight:500')}>Weekly recap email</div>
              <div style={c('font-size:12px;color:#6b6a60')}>Your Sunday summary, in your inbox.</div>
            </div>
            <Toggle on={nRecap} set={setNRecap} />
          </Row>
          <Row>
            <div>
              <div style={c('font-size:14px;font-weight:500')}>Free-trial alerts</div>
              <div style={c('font-size:12px;color:#6b6a60')}>Two days before any trial converts to paid.</div>
            </div>
            <Toggle on={nTrial} set={setNTrial} />
          </Row>
          <Row>
            <div>
              <div style={c('font-size:14px;font-weight:500')}>Streak reminder</div>
              <div style={c('font-size:12px;color:#6b6a60')}>A nudge in the evening if you haven’t checked in.</div>
            </div>
            <Toggle on={nStreak} set={setNStreak} />
          </Row>
          <Row>
            <div>
              <div style={c('font-size:14px;font-weight:500')}>Product news</div>
              <div style={c('font-size:12px;color:#6b6a60')}>Occasional updates on what’s new. No marketing.</div>
            </div>
            <Toggle on={nNews} set={setNNews} />
          </Row>
        </div>

        {/* linked data */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 6px')}>Connected accounts</h2>
          <p style={c('font-size:13px;line-height:1.55;color:#4a4941;margin:0 0 14px')}>
            2 banks connected read-only through Plaid. Manage them, or disconnect, from the Accounts
            tab.
          </p>
          <Link href={`${APP}`} style={sx(btnGhost, { display: 'inline-flex', alignItems: 'center', textDecoration: 'none' })}>
            Open Accounts
          </Link>
        </div>

        {/* account actions */}
        <div style={c('background:#ffffff;border:1px solid #e4e2d9;border-radius:22px;padding:26px 28px')}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 16px')}>Account</h2>
          <button type="button" onClick={signOut} style={sx(btnGhost, { width: '100%', marginBottom: 12 })}>
            Sign out
          </button>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              style={sx(c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;width:100%;border:1px solid #e7c3ba;border-radius:12px;background:transparent;color:#b8422a;cursor:pointer"), {})}
            >
              Delete account and data
            </button>
          ) : (
            <div style={c('background:#fbeae6;border:1px solid #e7c3ba;border-radius:12px;padding:14px 16px')}>
              <div style={c('font-size:13px;line-height:1.55;color:#b8422a;margin-bottom:12px')}>
                This permanently deletes your account and the transaction history Tally stored, within
                30 days. Your bank accounts are not affected. This can’t be undone.
              </div>
              <div style={c('display:flex;gap:10px;flex-wrap:wrap')}>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={sx(btnGhost, { flex: '1 1 auto' })}
                >
                  Keep my account
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  style={sx(c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:none;border-radius:12px;background:#b8422a;color:#ffffff;cursor:pointer;flex:1 1 auto"), {})}
                >
                  Delete everything
                </button>
              </div>
            </div>
          )}
        </div>

        <p style={c('text-align:center;font-size:12px;line-height:1.6;color:#9a988c;margin:20px auto 0;max-width:34em')}>
          Prototype — details and toggles aren’t persisted. Tally is read-only and is not a bank.
        </p>
      </div>
    </div>
  )
}
