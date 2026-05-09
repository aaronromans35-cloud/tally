import { NextRequest, NextResponse } from 'next/server'
import { authLimiter, getIP } from '@/lib/ratelimit'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 10 minutes per IP
  const ip = getIP(req)
  const { success, remaining, reset } = await authLimiter.limit(ip)
  if (!success) {
    const waitSecs = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: `Too many login attempts. Please wait ${Math.ceil(waitSecs / 60)} minute(s) and try again.` },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'Retry-After': String(waitSecs) } }
    )
  }

  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return NextResponse.json(
      { error: error.message, remaining },
      { status: 401 }
    )
  }

  return NextResponse.json({ user: data.user?.id }, { status: 200 })
}
