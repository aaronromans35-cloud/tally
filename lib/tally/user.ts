/** Client-safe user types. The server-only lookup lives in `session.ts`. */

/** The signed-in person, as far as the UI needs to know. Never includes tokens. */
export interface TallyUser {
  id: string
  email: string
  /** What to call them. Falls back to the part of the email before the @. */
  name: string
  initials: string
  /** ISO date from sign-up, used only to show age. Null for Google sign-ins. */
  dob: string | null
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
