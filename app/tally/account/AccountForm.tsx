'use client'
/**
 * Tally — account & settings.
 *
 * Reached from the avatar in the app header. Everything here is real: the name
 * is saved to the account, the password is changed on the server (the session
 * cookie is httpOnly, so browser code can't do either itself), sign-out ends
 * the session server-side, and the data actions act on the cloud copy.
 */
import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { BODY, DISPLAY, MONO, css as c, sx } from '../lib'
import { clearLocalData, loadState } from '../storage'
import { MIN_PASSWORD } from '@/lib/tally/password'
import { initialsOf, type TallyUser } from '@/lib/tally/user'

const APP = '/tally'
const display = (x: string) => sx(c(x), { fontFamily: DISPLAY })
const mono = (x: string) => sx(c(x), { fontFamily: MONO })

const card = c('background:#ffffff;border:1px solid #e4e2d9;border-radius:22px;padding:26px 28px')
const label = mono('font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:7px;display:block')
const field = c(
  "width:100%;font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:12px 14px;border:1px solid #d6d3c8;border-radius:12px;background:#ffffff;color:#14140f;outline:none",
)
const readonlyField = sx(field, { background: '#f0eee6', color: '#6b6a60' })
const btnDark = sx(
  c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:none;border-radius:12px;background:#14140f;color:#f5f4ef;cursor:pointer"),
  {},
)
const btnGhost = sx(
  c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:1px solid #cac7bc;border-radius:12px;background:transparent;color:#14140f;cursor:pointer"),
  {},
)

function ageFrom(dob: string | null) {
  if (!dob) return null
  const d = new Date(dob + 'T00:00:00')
  if (Number.isNaN(d.getTime())) return null
  const now = new Date()
  let a = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--
  return a
}

type Msg = { kind: 'ok' | 'err'; text: string } | null

function Note({ msg }: { msg: Msg }) {
  if (!msg) return null
  return (
    <div
      role={msg.kind === 'err' ? 'alert' : 'status'}
      style={c('margin-top:12px;font-size:13px;line-height:1.5;color:' + (msg.kind === 'ok' ? '#1c6a48' : '#b8422a'))}
    >
      {msg.text}
    </div>
  )
}

export default function AccountForm({ user }: { user: TallyUser }) {
  const router = useRouter()

  const [savedName, setSavedName] = useState(user.name)
  const [name, setName] = useState(user.name)
  const [nameBusy, setNameBusy] = useState(false)
  const [nameMsg, setNameMsg] = useState<Msg>(null)

  const [pw, setPw] = useState('')
  const [pw2, setPw2] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwMsg, setPwMsg] = useState<Msg>(null)

  const [dataBusy, setDataBusy] = useState(false)
  const [dataMsg, setDataMsg] = useState<Msg>(null)
  const [confirmErase, setConfirmErase] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const age = useMemo(() => ageFrom(user.dob), [user.dob])
  const minor = age !== null && age < 18
  const dirty = name.trim() !== savedName

  const saveName = useCallback(async () => {
    setNameMsg(null)
    const next = name.trim()
    if (!next) return setNameMsg({ kind: 'err', text: 'Enter a name.' })
    setNameBusy(true)
    try {
      const res = await fetch('/api/tally/account', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ displayName: next }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Could not save your name.')
      setSavedName(data.name ?? next)
      setName(data.name ?? next)
      setNameMsg({ kind: 'ok', text: 'Saved.' })
      router.refresh() // header and greeting read the name on the server
    } catch (e) {
      setNameMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Could not save your name.' })
    } finally {
      setNameBusy(false)
    }
  }, [name, router])

  const updatePassword = useCallback(async () => {
    setPwMsg(null)
    if (pw.length < MIN_PASSWORD) {
      return setPwMsg({ kind: 'err', text: `Password must be at least ${MIN_PASSWORD} characters.` })
    }
    if (pw !== pw2) return setPwMsg({ kind: 'err', text: 'The two passwords don’t match.' })
    setPwBusy(true)
    try {
      const res = await fetch('/api/tally/auth/password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error ?? 'Could not update the password.')
      setPwMsg({ kind: 'ok', text: 'Password updated.' })
      setPw('')
      setPw2('')
    } catch (e) {
      setPwMsg({ kind: 'err', text: e instanceof Error ? e.message : 'Could not update the password.' })
    } finally {
      setPwBusy(false)
    }
  }, [pw, pw2])

  const signOut = useCallback(async () => {
    setSigningOut(true)
    try {
      await fetch('/api/tally/auth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'signout' }),
      })
    } catch {
      /* cookies are cleared server-side even if the reply is lost */
    }
    clearLocalData()
    router.replace('/tally/access?mode=signin')
    router.refresh()
  }, [router])

  /** Download everything Tally holds for this account, as JSON. */
  const exportData = useCallback(async () => {
    setDataMsg(null)
    setDataBusy(true)
    try {
      const res = await fetch('/api/tally/state', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      // Fall back to this device's copy if the account has none yet.
      const state = data?.state ?? loadState()
      const blob = new Blob(
        [JSON.stringify({ exportedAt: new Date().toISOString(), email: user.email, budget: state }, null, 2)],
        { type: 'application/json' },
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'tally-export.json'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setDataMsg({ kind: 'ok', text: 'Your export downloaded.' })
    } catch {
      setDataMsg({ kind: 'err', text: 'Could not export your data. Try again.' })
    } finally {
      setDataBusy(false)
    }
  }, [user.email])

  /** Erase the budget (not the login) from the account and this device. */
  const eraseData = useCallback(async () => {
    setDataMsg(null)
    setDataBusy(true)
    try {
      const res = await fetch('/api/tally/state', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      clearLocalData()
      setConfirmErase(false)
      setDataMsg({ kind: 'ok', text: 'Your budget data was erased. Opening Tally will start you fresh.' })
    } catch {
      setDataMsg({ kind: 'err', text: 'Could not erase your data. Try again.' })
    } finally {
      setDataBusy(false)
    }
  }, [])

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
          <div
            aria-hidden="true"
            style={sx(c('width:32px;height:32px;border-radius:99px;background:#cdf06a;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#14140f'), { fontFamily: DISPLAY })}
          >
            {initialsOf(savedName)}
          </div>
        </div>

        <h1 style={display('font-size:32px;font-weight:700;letter-spacing:-0.03em;margin:0 0 4px')}>Account</h1>
        <p style={c('font-size:14px;color:#4a4941;margin:0 0 26px')}>
          {savedName}
          {age !== null ? ' · ' + age + ' years old' : ''} · {user.email}
        </p>

        {/* details */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 16px')}>Your details</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (dirty && !nameBusy) saveName()
            }}
          >
            <div style={c('display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px')}>
              <div style={c('grid-column:1 / -1')}>
                <label style={label} htmlFor="acct-name">Name</label>
                <input
                  id="acct-name"
                  value={name}
                  maxLength={60}
                  onChange={(e) => setName(e.target.value)}
                  style={field}
                  autoComplete="name"
                />
              </div>
              <div style={c('grid-column:1 / -1')}>
                <label style={label} htmlFor="acct-email">Email</label>
                <input id="acct-email" value={user.email} readOnly style={readonlyField} />
              </div>
              {user.dob && (
                <>
                  <div>
                    <label style={label} htmlFor="acct-dob">Date of birth</label>
                    <input id="acct-dob" value={user.dob} readOnly style={readonlyField} />
                  </div>
                  <div>
                    <label style={label} htmlFor="acct-age">Age</label>
                    <input id="acct-age" value={age !== null ? String(age) : '—'} readOnly style={readonlyField} />
                  </div>
                </>
              )}
            </div>
            <p style={c('font-size:12px;line-height:1.5;color:#6b6a60;margin:12px 0 0')}>
              Your email and date of birth are locked once an account exists — they decide how
              sign-in and age checks work. Email privacy@tally.app to change them.
            </p>

            {minor ? (
              <div style={c('margin-top:14px;background:#fcf8e9;border:1px solid #d9c477;border-radius:12px;padding:11px 13px;font-size:13px;line-height:1.55;color:#8a6a12')}>
                You’re under 18. Connecting a bank needs a parent or guardian on a Family plan.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!dirty || nameBusy}
              style={sx(btnDark, { marginTop: 16, opacity: !dirty || nameBusy ? 0.5 : 1, cursor: !dirty || nameBusy ? 'default' : 'pointer' })}
            >
              {nameBusy ? 'Saving…' : 'Save details'}
            </button>
            <Note msg={nameMsg} />
          </form>
        </div>

        {/* password */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 4px')}>Password</h2>
          <p style={c('font-size:13px;color:#4a4941;margin:0 0 16px')}>
            At least {MIN_PASSWORD} characters. You stay signed in on this device.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!pwBusy) updatePassword()
            }}
          >
            <div style={c('display:flex;flex-direction:column;gap:12px')}>
              <div>
                <label style={label} htmlFor="acct-pw">New password</label>
                <input id="acct-pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={field} autoComplete="new-password" />
              </div>
              <div>
                <label style={label} htmlFor="acct-pw2">Confirm new password</label>
                <input id="acct-pw2" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} style={field} autoComplete="new-password" />
              </div>
            </div>
            <Note msg={pwMsg} />
            <button type="submit" disabled={pwBusy || !pw} style={sx(btnDark, { marginTop: 16, opacity: pwBusy || !pw ? 0.5 : 1, cursor: pwBusy || !pw ? 'default' : 'pointer' })}>
              {pwBusy ? 'Working…' : 'Update password'}
            </button>
          </form>
        </div>

        {/* linked accounts */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 6px')}>Connected accounts</h2>
          <p style={c('font-size:13px;line-height:1.55;color:#4a4941;margin:0 0 14px')}>
            See which accounts are linked, and disconnect or reconnect them, from the Accounts tab.
          </p>
          <Link href={APP} style={sx(btnGhost, { display: 'inline-flex', alignItems: 'center', textDecoration: 'none' })}>
            Open Tally
          </Link>
        </div>

        {/* your data */}
        <div style={sx(card, { marginBottom: 16 })}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 6px')}>Your data</h2>
          <p style={c('font-size:13px;line-height:1.55;color:#4a4941;margin:0 0 14px')}>
            Download everything Tally stores for you, or erase your budget and start over. Erasing
            keeps your login.
          </p>
          <div style={c('display:flex;gap:10px;flex-wrap:wrap')}>
            <button type="button" onClick={exportData} disabled={dataBusy} style={sx(btnGhost, { opacity: dataBusy ? 0.6 : 1 })}>
              Export my data
            </button>
            {!confirmErase && (
              <button
                type="button"
                onClick={() => setConfirmErase(true)}
                style={sx(c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:1px solid #e7c3ba;border-radius:12px;background:transparent;color:#b8422a;cursor:pointer"), {})}
              >
                Erase my budget data
              </button>
            )}
          </div>
          {confirmErase && (
            <div role="alertdialog" aria-label="Erase budget data" style={c('margin-top:14px;background:#fbeae6;border:1px solid #e7c3ba;border-radius:12px;padding:14px 16px')}>
              <div style={c('font-size:13px;line-height:1.55;color:#b8422a;margin-bottom:12px')}>
                This permanently erases your buckets, transactions, goals and subscriptions from your
                account and this device. It can’t be undone. Download an export first if you want a copy.
              </div>
              <div style={c('display:flex;gap:10px;flex-wrap:wrap')}>
                <button type="button" onClick={() => setConfirmErase(false)} style={sx(btnGhost, { flex: '1 1 auto' })}>
                  Keep my data
                </button>
                <button
                  type="button"
                  onClick={eraseData}
                  disabled={dataBusy}
                  style={sx(c("font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:44px;padding:0 20px;border:none;border-radius:12px;background:#b8422a;color:#ffffff;cursor:pointer;flex:1 1 auto"), { opacity: dataBusy ? 0.6 : 1 })}
                >
                  {dataBusy ? 'Erasing…' : 'Erase everything'}
                </button>
              </div>
            </div>
          )}
          <Note msg={dataMsg} />
          <p style={c('font-size:12px;line-height:1.55;color:#6b6a60;margin:14px 0 0')}>
            To delete your login as well, email{' '}
            <a href="mailto:privacy@tally.app?subject=Delete%20my%20Tally%20account" style={{ color: '#1c6a48' }}>
              privacy@tally.app
            </a>{' '}
            from {user.email} and we’ll remove it within 30 days.
          </p>
        </div>

        {/* session */}
        <div style={card}>
          <h2 style={display('font-size:17px;font-weight:700;letter-spacing:-0.02em;margin:0 0 16px')}>Session</h2>
          <button type="button" onClick={signOut} disabled={signingOut} style={sx(btnGhost, { width: '100%', opacity: signingOut ? 0.6 : 1 })}>
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>

        <p style={c('text-align:center;font-size:12px;line-height:1.6;color:#9a988c;margin:20px auto 0;max-width:34em')}>
          Tally is read-only and is not a bank.
        </p>
      </div>
    </div>
  )
}
