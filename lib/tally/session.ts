import { createClient } from '@/lib/supabase/server'
import { initialsOf, type TallyUser } from './user'

export type { TallyUser }

function titleCase(s: string): string {
  return s
    .split(/[\s._-]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Resolve the current user on the server. Returns null for visitors, and also
 * when Supabase is unreachable — the app then falls back to demo mode instead
 * of crashing the page.
 */
export async function getTallyUser(): Promise<TallyUser | null> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()
    if (error || !data.user) return null
    const u = data.user
    const meta = (u.user_metadata ?? {}) as Record<string, unknown>
    const email = u.email ?? ''
    const raw =
      (typeof meta.display_name === 'string' && meta.display_name.trim()) ||
      (typeof meta.full_name === 'string' && meta.full_name.trim()) ||
      (typeof meta.name === 'string' && meta.name.trim()) ||
      titleCase(email.split('@')[0] ?? '') ||
      'You'
    const name = raw.slice(0, 60)
    const dob =
      typeof meta.dob === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(meta.dob) ? meta.dob : null
    return { id: u.id, email, name, initials: initialsOf(name), dob }
  } catch {
    return null
  }
}
