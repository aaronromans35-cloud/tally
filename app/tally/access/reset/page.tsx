import { createClient } from '@/lib/supabase/server'
import ResetForm from './ResetForm'

export const metadata = { title: 'Tally — Set a new password' }
export const dynamic = 'force-dynamic'

export default async function TallyResetPage() {
  let ready = false
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    ready = Boolean(data.user)
  } catch {}
  return <ResetForm ready={ready} />
}
