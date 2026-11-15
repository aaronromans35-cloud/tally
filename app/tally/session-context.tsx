'use client'
import { createContext, useContext } from 'react'
import type { TallyUser } from '@/lib/tally/user'

/**
 * How the current data is being kept:
 *  • demo    — no account; saved in this browser only
 *  • saving  — signed in, a change is on its way to the server
 *  • saved   — signed in, the server has the latest copy
 *  • offline — signed in, but the last save failed; will retry
 *  • local   — signed in, but cloud sync isn't set up on this deployment
 */
export type SyncStatus = 'demo' | 'saving' | 'saved' | 'offline' | 'local'

export interface TallySession {
  user: TallyUser | null
  sync: SyncStatus
  /** Ends the session on the server, clears this device's copy, returns to sign-in. */
  signOut: () => Promise<void>
}

const DEMO: TallySession = { user: null, sync: 'demo', signOut: async () => {} }

export const SessionContext = createContext<TallySession>(DEMO)
export const useSession = () => useContext(SessionContext)

export function syncLabel(sync: SyncStatus): { text: string; dot: string } {
  switch (sync) {
    case 'saving':
      return { text: 'Saving…', dot: '#8a6a12' }
    case 'saved':
      return { text: 'Saved to your account', dot: '#1c6a48' }
    case 'offline':
      return { text: 'Offline — will retry', dot: '#b8422a' }
    case 'local':
      return { text: 'Saved on this device', dot: '#1c6a48' }
    default:
      return { text: 'Demo · saved on this device', dot: '#8a6a12' }
  }
}
