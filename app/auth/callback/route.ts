import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/** Only same-site absolute paths; never `//host` or `/\host` open redirects. */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return '/tally'
  return raw
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const next = safeNext(searchParams.get('next'))

  const dest = request.nextUrl.clone()
  dest.search = ''

  if (!code) {
    dest.pathname = '/tally/access'
    return NextResponse.redirect(dest)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  // A failed exchange on the reset path lands on the reset page, which shows
  // the "expired link" message; anywhere else goes back to sign-in.
  dest.pathname = error ? (next.startsWith('/tally/access/reset') ? next : '/tally/access') : next
  return NextResponse.redirect(dest)
}
