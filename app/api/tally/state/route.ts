import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { limitHeaders, rateLimit } from '@/lib/tally/limiter'
import { TALLY_STATE_VERSION } from '@/app/tally/types'

export const runtime = 'nodejs'

/**
 * Cloud copy of a signed-in user's budget.
 *
 * One JSON document per user in `tally_user_state`, protected by row-level
 * security (`user_id = auth.uid()`), so this route can only ever read or write
 * the caller's own row — the database enforces that, not just this code.
 *
 * The document is validated for shape and size before it is stored; it is the
 * user's own data, but an unbounded blob is still a storage-abuse vector.
 */

const MAX_BYTES = 600_000
const MAX_ROWS = 6_000
const PUT_LIMIT = 90 // writes per minute per user — the client debounces well below this

/** Postgres/PostgREST codes meaning "the table isn't there yet". */
const MISSING_TABLE = new Set(['42P01', 'PGRST205', 'PGRST200'])

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

function isStateShape(x: unknown): boolean {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  const arrays = ['buckets', 'txns', 'goals', 'subs', 'reviewedOn'] as const
  for (const k of arrays) {
    if (!Array.isArray(s[k]) || (s[k] as unknown[]).length > MAX_ROWS) return false
  }
  return typeof s.checkingCents === 'number' && Number.isFinite(s.checkingCents)
}

async function authed() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    return { supabase, userId: data.user.id }
  } catch {
    return null
  }
}

export async function GET() {
  const a = await authed()
  if (!a) return bad('Sign in to sync your budget.', 401)

  const { data, error } = await a.supabase
    .from('tally_user_state')
    .select('state, version, updated_at')
    .eq('user_id', a.userId)
    .maybeSingle()

  if (error) {
    if (error.code && MISSING_TABLE.has(error.code)) {
      return NextResponse.json({ state: null, unavailable: true })
    }
    console.error('[tally/state] read failed', error.code)
    return bad('Could not load your saved budget.', 502)
  }

  // A save from an older, incompatible app version is ignored rather than
  // trusted — the client falls back to its local copy and overwrites it.
  if (!data || data.version !== TALLY_STATE_VERSION) {
    return NextResponse.json({ state: null })
  }
  return NextResponse.json({ state: data.state, updatedAt: data.updated_at })
}

export async function PUT(req: Request) {
  const a = await authed()
  if (!a) return bad('Sign in to sync your budget.', 401)

  const limited = await rateLimit({
    key: `tally:state:${a.userId}`,
    limit: PUT_LIMIT,
    windowMs: 60_000,
    onError: 'open',
  })
  if (!limited.success) {
    return NextResponse.json(
      { error: 'Saving too quickly. Your changes will sync in a moment.' },
      { status: 429, headers: limitHeaders(limited, PUT_LIMIT) },
    )
  }

  let text: string
  try {
    text = await req.text()
  } catch {
    return bad('Bad request.')
  }
  if (text.length > MAX_BYTES) return bad('That budget is too large to sync.', 413)

  let body: { state?: unknown }
  try {
    body = JSON.parse(text)
  } catch {
    return bad('Bad request.')
  }
  if (!isStateShape(body.state)) return bad('That budget could not be read.')

  const { error } = await a.supabase.from('tally_user_state').upsert(
    {
      user_id: a.userId,
      state: body.state,
      version: TALLY_STATE_VERSION,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )

  if (error) {
    if (error.code && MISSING_TABLE.has(error.code)) {
      return NextResponse.json({ ok: false, unavailable: true })
    }
    console.error('[tally/state] write failed', error.code)
    return bad('Could not save your budget.', 502)
  }
  return NextResponse.json({ ok: true })
}

/** Erase the signed-in user's cloud budget. Their login is untouched. */
export async function DELETE() {
  const a = await authed()
  if (!a) return bad('Sign in first.', 401)
  const { error } = await a.supabase.from('tally_user_state').delete().eq('user_id', a.userId)
  if (error && !(error.code && MISSING_TABLE.has(error.code))) {
    console.error('[tally/state] delete failed', error.code)
    return bad('Could not delete your data.', 502)
  }
  return NextResponse.json({ ok: true })
}
