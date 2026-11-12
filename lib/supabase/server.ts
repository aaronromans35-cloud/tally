import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            // Supabase sets these itself, but we pin the security-relevant
            // flags explicitly rather than trusting defaults: httpOnly so
            // client JS can't read the session token (XSS blast-radius),
            // secure so it's never sent over plain HTTP, sameSite=lax so it
            // isn't attached to cross-site requests (CSRF) while still
            // following normal top-level navigations (e.g. email links).
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
              })
            )
          } catch {}
        },
      },
    }
  )
}
