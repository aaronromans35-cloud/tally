import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authLimit, clientIp, limitHeaders } from '@/lib/tally/limiter'
import { weakPassword } from '@/lib/tally/password'

export const runtime = 'nodejs'

/**
 * Set a new password for the signed-in (or recovery-session) user.
 *
 * Done server-side because session cookies are httpOnly (lib/supabase/server.ts),
 * so the browser client cannot see the recovery session that /auth/callback
 * established and could not call `updateUser` itself.
 */
export async function POST(req: Request) {
  const byIp = await authLimit(clientIp(req))
  if (!byIp.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Wait a few minutes and try again.' },
      { status: 429, headers: limitHeaders(byIp, 8) },
    )
  }

  let password = ''
  try {
    password = String((await req.json())?.password ?? '')
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
    return NextResponse.json(
      { error: 'This reset link has expired or was already used. Request a new one.' },
      { status: 401 },
    )
  }

  const weak = weakPassword(password, data.user.email ?? '')
  if (weak) return NextResponse.json({ error: weak }, { status: 400 })

  const { error } = await supabase.auth.updateUser({ password })
  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('different from the old')) {
      return NextResponse.json({ error: 'Pick a password you haven’t used before.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Could not update the password. Try again.' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
