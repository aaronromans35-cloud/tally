'use client'
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

export type Workspace = {
  id: string
  user_id: string
  name: string
  emoji: string
  is_default: boolean
  created_at: string
}

type WorkspaceContextType = {
  workspaces: Workspace[]
  activeWorkspaceId: string | null   // null = the "Me" default tab
  activeWorkspace: Workspace | null
  isDefaultWorkspace: boolean
  switchWorkspace: (id: string | null) => void
  addWorkspace: (name: string, emoji: string) => Promise<void>
  deleteWorkspace: (id: string) => Promise<void>
  renameWorkspace: (id: string, name: string, emoji: string) => Promise<void>
  wsLoading: boolean
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  workspaces: [],
  activeWorkspaceId: null,
  activeWorkspace: null,
  isDefaultWorkspace: true,
  switchWorkspace: () => {},
  addWorkspace: async () => {},
  deleteWorkspace: async () => {},
  renameWorkspace: async () => {},
  wsLoading: true,
})

const LS_KEY = 'nx-active-workspace'

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null)
  const [wsLoading, setWsLoading] = useState(true)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setWsLoading(false); return }

    const { data } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const list = data ?? []
    setWorkspaces(list)

    // Restore saved active workspace
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null
    if (saved && list.find(w => w.id === saved)) {
      setActiveWorkspaceId(saved)
    } else {
      setActiveWorkspaceId(null)
    }

    setWsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const switchWorkspace = useCallback((id: string | null) => {
    setActiveWorkspaceId(id)
    if (id) {
      localStorage.setItem(LS_KEY, id)
    } else {
      localStorage.removeItem(LS_KEY)
    }
  }, [])

  const addWorkspace = useCallback(async (name: string, emoji: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('workspaces')
      .insert({ user_id: user.id, name, emoji, is_default: false })
      .select()
      .single()

    if (data) {
      setWorkspaces(ws => [...ws, data])
      switchWorkspace(data.id)
    }
  }, [switchWorkspace])

  const deleteWorkspace = useCallback(async (id: string) => {
    const supabase = createClient()
    await supabase.from('workspaces').delete().eq('id', id)
    setWorkspaces(ws => ws.filter(w => w.id !== id))
    if (activeWorkspaceId === id) switchWorkspace(null)
  }, [activeWorkspaceId, switchWorkspace])

  const renameWorkspace = useCallback(async (id: string, name: string, emoji: string) => {
    const supabase = createClient()
    await supabase.from('workspaces').update({ name, emoji }).eq('id', id)
    setWorkspaces(ws => ws.map(w => w.id === id ? { ...w, name, emoji } : w))
  }, [])

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) ?? null

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      activeWorkspaceId,
      activeWorkspace,
      isDefaultWorkspace: activeWorkspaceId === null,
      switchWorkspace,
      addWorkspace,
      deleteWorkspace,
      renameWorkspace,
      wsLoading,
    }}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export const useWorkspace = () => useContext(WorkspaceContext)
