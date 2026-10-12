import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { accountLimit, authLimit, clientIp, limitHeaders } from '@/lib/tally/limiter'
import { MIN_AGE, ageFromDob, isAdultDob } from '@/lib/tally/tiers'

export const runtime = 'nodejs'

/**
 * Tally auth, server-side.
 *
 * Why this route exists at all: the sign-in form used to call
 * `supabase.auth.signInWithPassword` straight from the browser. That works,
 * but it means every brute-force protection we own is bypassed — the attacker
 * talks to Supabase directly and our rate limiter never runs. Routing auth
 * through here puts a limiter in front of it that we control.
 *
 * Two independent limits, because either alone is trivially defeated:
 *   • per IP      — stops one host hammering many accounts
 *   • per account — stops a botnet hammering one account from many hosts
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MIN_PASSWORD = 10

/** Generic on purpose — never reveal whether an email is registered. */
const GENERIC_SIGNIN_ERROR = 'That email and password don’t match.'

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

/**
 * Supabase being unreachable (paused project, deleted project, network blip)
 * surfaces as a raw `fetch failed`. Showing that to a teenager trying to sign
 * up is both confusing and a small information leak about our stack.
 */
const UNREACHABLE =
  'Accounts are temporarily unavailable. The demo works without one — try it while we sort this out.'

function isNetworkError(e: unknown): boolean {
  const msg = (e as { message?: string })?.message?.toLowerCase() ?? ''
  return (
    msg.includes('fetch failed') ||
    msg.includes('network') ||
    msg.includes('enotfound') ||
    msg.includes('econnrefused') ||
    msg.includes('timeout')
  )
}

/**
 * Reject the passwords that actually get broken, without a dictionary file.
 * Length does the heavy lifting; this catches the lazy remainder.
 */
function weakPassword(pw: string, email: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  if (pw.length > 200) return 'That password is too long.'
  if (/^(.)\1+$/.test(pw)) return 'That password is a single repeated character.'
  if (/^(password|passw0rd|qwerty|letmein|welcome|iloveyou|admin)/i.test(pw)) {
    return 'That password is one of the most common ones. Pick another.'
  }
  if (/^\d+$/.test(pw)) return 'Use more than just numbers.'
  const local = email.split('@')[0]
  if (local.length > 2 && pw.toLowerCase().includes(local.toLowerCase())) {
    return 'Don’t put your email address in your password.'
  }
  return null
}

export async function POST(req: Request) {
  let body: {
    action?: string
    email?: string
    password?: string
    dob?: string
    displayName?: string
  }
  try {
    body = await req.json()
  } catch {
    return bad('Bad request.')
  }

  const action = body.action
  const email = (body.email ?? '').trim().toLowerCase()
  const password = body.password ?? ''

  if (!['signin', 'signup', 'reset'].includes(action ?? '')) return bad('Unknown action.')
  if (!EMAIL_RE.test(email) || email.length > 254) return bad('Enter a valid email address.')

  const ip = clientIp(req)

  const byIp = await authLimit(ip)
  if (!byIp.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a few minutes and try again.' },
      { status: 429, headers: limitHeaders(byIp, 8) },
    )
  }
  const byAccount = await accountLimit(email)
  if (!byAccount.success) {
    return NextResponse.json(
      { error: 'Too many attempts on this account. Wait a few minutes and try again.' },
      { status: 429, headers: limitHeaders(byAccount, 10) },
    )
  }

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return NextResponse.json(
      { error: 'Accounts aren’t available on this deployment yet. The demo still works.' },
      { status: 503 },
    )
  }

  const origin = new URL(req.url).origin

  /* ─────────────────────────── sign in ─────────────────────────── */
  if (action === 'signin') {
    if (!password) return bad('Enter your password.')
    let error
    try {
      ;({ error } = await supabase.auth.signInWithPassword({ email, password }))
    } catch (e) {
      return bad(isNetworkError(e) ? UNREACHABLE : 'Could not sign you in.', 503)
    }
    if (error) {
      // Supabase returns transport failures as a value rather than throwing,
      // so this check has to happen here too. Without it an unreachable
      // backend tells the user their password is wrong — sending them off to
      // reset a password that was never the problem.
      if (isNetworkError(error)) return bad(UNREACHABLE, 503)
      const msg = error.message?.toLowerCase() ?? ''
      // The one case worth distinguishing: the account exists but is
      // unverified. Telling them that is not an enumeration risk, because
      // they already proved they know the password.
      if (msg.includes('not confirmed') || msg.includes('confirm')) {
        return bad('Confirm your email first — check your inbox for the link.', 403)
      }
      return bad(GENERIC_SIGNIN_ERROR, 401)
    }
    return NextResponse.json({ ok: true })
  }

  /* ─────────────────────────── reset ─────────────────────────── */
  if (action === 'reset') {
    try {
      await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/tally/access/reset`,
      })
    } catch (e) {
      if (isNetworkError(e)) return bad(UNREACHABLE, 503)
      // Any other failure is still answered identically, so this endpoint
      // can't be used to discover which addresses are registered.
    }
    // Always the same answer, whether or not the account exists.
    return NextResponse.json({ ok: true, sent: true })
  }

  /* ─────────────────────────── sign up ─────────────────────────── */
  const dob = (body.dob ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob)) return bad('Enter your date of birth.')

  const age = ageFromDob(dob)
  if (!Number.isFinite(age) || age < 0 || age > 120) return bad('That date of birth isn’t valid.')

  // The age gate. Mirrored by a trigger on tally_profiles so it holds even if
  // someone calls the database directly — see supabase/migrations/tally_core.sql.
  if (age < MIN_AGE) {
    return NextResponse.json(
      {
        error: `Tally isn’t available under ${MIN_AGE}. We’re not able to create an account or keep any information you’ve entered.`,
        underAge: true,
      },
      { status: 403 },
    )
  }

  const weak = weakPassword(password, email)
  if (weak) return bad(weak)

  const isAdult = isAdultDob(dob)

  let error
  try {
    ;({ error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/tally`,
      data: {
        // Read by a DB trigger/route to seed tally_profiles. Never trust these
        // for entitlements — tier lives server-side only.
        dob,
        display_name: (body.displayName ?? '').slice(0, 60),
        role: isAdult ? 'adult' : 'teen',
      },
    },
    }))
  } catch (e) {
    return bad(isNetworkError(e) ? UNREACHABLE : 'Could not create that account.', 503)
  }

  if (error) {
    if (isNetworkError(error)) return bad(UNREACHABLE, 503)
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('already') || msg.includes('registered')) {
      // Don't confirm the address exists. Supabase still emails the real owner.
      return NextResponse.json({ ok: true, verify: true })
    }
    return bad(error.message || 'Could not create that account.')
  }

  return NextResponse.json({
    ok: true,
    verify: true,
    isAdult,
    // Drives the "a guardian needs to link the bank" explanation in the UI.
    needsGuardian: !isAdult,
  })
}
