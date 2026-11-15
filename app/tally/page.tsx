import TallyApp from './TallyApp'
import { getTallyUser } from '@/lib/tally/session'

export const metadata = { title: 'Tally — Today' }
// Reads the session cookie, so this can never be statically cached.
export const dynamic = 'force-dynamic'

export default async function TallyPage() {
  const user = await getTallyUser()
  return <TallyApp user={user} />
}
