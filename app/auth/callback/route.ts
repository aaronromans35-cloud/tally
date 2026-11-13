import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')

  const dest = request.nextUrl.clone()
  dest.search = ''

  if (!code) {
    dest.pathname = '/tally/access'
    return NextResponse.redirect(dest)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  dest.pathname = error ? '/tally/access' : '/tally'
  return NextResponse.redirect(dest)
}
