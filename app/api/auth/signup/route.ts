import { NextRequest, NextResponse } from 'next/server'
import { authLimiter, getIP } from '@/lib/ratelimit'
import { createClient } from '@/lib/supabase/server'
import { parseBody, validateAuthInput, sanitizeString } from '@/lib/validate'

export async function POST(req: NextRequest) {
  // Rate limit: 5 attempts per 10 minutes per IP
  const ip = getIP(req)
  const { success, remaining, reset } = await authLimiter.limit(ip)
  if (!success) {
    const waitSecs = Math.ceil((reset - Date.now()) / 1000)
    return NextResponse.json(
      { error: `Too many signup attempts. Please wait ${Math.ceil(waitSecs / 60)} minute(s) and try again.` },
      { status: 429, headers: { 'X-RateLimit-Remaining': '0', 'Retry-After': String(waitSecs) } }
    )
  }

  // Parse and size-check body (max 2KB for signup)
  const { data, error: parseError } = await parseBody(req, 2_000)
  if (parseError) return NextResponse.json({ error: parseError }, { status: 400 })

  const body = data as Record<string, unknown>
  const email = sanitizeString(body.email, 254)
  const password = sanitizeString(body.password, 128)

  const validationError = validateAuthInput(email, password)
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

  const supabase = await createClient()
  const { data: authData, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return NextResponse.json({ error: error.message, remaining }, { status: 400 })
  }

  return NextResponse.json({ user: authData.user?.id }, { status: 200 })
}
