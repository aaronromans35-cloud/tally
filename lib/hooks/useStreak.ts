'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type StreakData = {
  current: number
  longest: number
  lastActive: string | null
}

export function useStreak() {
  const [streak, setStreak] = useState<StreakData>({ current: 0, longest: 0, lastActive: null })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('streaks').select('*').eq('user_id', user.id).single()
      if (data) setStreak({ current: data.current_streak, longest: data.longest_streak, lastActive: data.last_active_date })
    }
    load()
  }, [])

  return streak
}
