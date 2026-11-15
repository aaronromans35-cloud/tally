import { redirect } from 'next/navigation'
import AccountForm from './AccountForm'
import { getTallyUser } from '@/lib/tally/session'

export const metadata = { title: 'Tally — Account' }
// Depends on the session cookie.
export const dynamic = 'force-dynamic'

export default async function TallyAccountPage() {
  const user = await getTallyUser()
  // There is no account to manage without one.
  if (!user) redirect('/tally/access?mode=signin&next=/tally/account')
  return <AccountForm user={user} />
}
