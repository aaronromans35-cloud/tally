export const MIN_PASSWORD = 10

/**
 * Reject the passwords that actually get broken, without a dictionary file.
 * Length does the heavy lifting; this catches the lazy remainder.
 */
export function weakPassword(pw: string, email: string): string | null {
  if (pw.length < MIN_PASSWORD) return `Use at least ${MIN_PASSWORD} characters.`
  if (pw.length > 200) return 'That password is too long.'
  if (/^(.)\1+$/.test(pw)) return 'That password is a single repeated character.'
  if (/^(password|passw0rd|qwerty|letmein|welcome|iloveyou|admin)/i.test(pw)) {
    return 'That password is one of the most common ones. Pick another.'
  }
  if (/^\d+$/.test(pw)) return 'Use more than just numbers.'
  const local = email.split('@')[0]
  if (local.length > 2 && pw.toLowerCase().includes(local.toLowerCase())) {
    return 'Don’t put your email address in your password.'
  }
  return null
}
