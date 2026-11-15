import { redirect } from 'next/navigation'
import AccessForm from './AccessForm'
import { getTallyUser } from '@/lib/tally/session'

export const metadata = {
  title: 'Tally — Sign in',
  description: 'Create your Tally account or sign in.',
}
// Depends on the session cookie.
export const dynamic = 'force-dynamic'

type Mode = 'signup' | 'signin' | 'reset'

export default async function TallyAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const sp = await searchParams
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

  // Already signed in: the sign-in page has nothing to offer, so skip it.
  const user = await getTallyUser()
  if (user) redirect('/tally')

  const raw = one(sp.mode)
  const mode: Mode = raw === 'signin' || raw === 'reset' || raw === 'signup' ? raw : 'signup'
  return <AccessForm initialMode={mode} next={one(sp.next)} />
}
