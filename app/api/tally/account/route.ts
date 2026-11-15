import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limitHeaders, rateLimit } from '@/lib/tally/limiter'

export const runtime = 'nodejs'

/**
 * Account profile for the signed-in user.
 *
 * Runs on the server because the session cookie is httpOnly — browser code
 * cannot read it, so it cannot call `supabase.auth.updateUser` itself.
 */

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

export async function PATCH(req: Request) {
  let body: { displayName?: unknown }
  try {
    body = await req.json()
  } catch {
    return bad('Bad request.')
  }

  const raw = typeof body.displayName === 'string' ? body.displayName.trim() : ''
  if (!raw) return bad('Enter a name.')
  if (raw.length > 60) return bad('That name is too long (60 characters max).')
  // Names are rendered as text everywhere; still reject control characters.
  if (/[\u0000-\u001f\u007f]/.test(raw)) return bad('That name has characters we can’t use.')

  let supabase
  try {
    supabase = await createClient()
  } catch {
    return bad('Accounts aren’t available right now.', 503)
  }

  const { data: auth } = await supabase.auth.getUser()
  if (!auth.user) return bad('Sign in to change your profile.', 401)

  const limited = await rateLimit({
    key: `tally:account:${auth.user.id}`,
    limit: 20,
    windowMs: 10 * 60_000,
    onError: 'open',
  })
  if (!limited.success) {
    return NextResponse.json(
      { error: 'Too many changes. Try again in a few minutes.' },
      { status: 429, headers: limitHeaders(limited, 20) },
    )
  }

  const { error } = await supabase.auth.updateUser({ data: { display_name: raw } })
  if (error) return bad('Could not save your name. Please try again.', 502)
  return NextResponse.json({ ok: true, name: raw })
}
