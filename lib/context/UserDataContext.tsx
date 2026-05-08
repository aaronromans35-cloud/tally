'use client'
import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Profile = {
  id: string
  full_name: string
  age: number
  annual_income: number
  monthly_expenses: number
  risk_tolerance: string
  retirement_age: number
  tax_filing_status: string
  state: string
}

type BudgetSummary = {
  income: number
  expenses: number
  net: number
  savingsRate: number
}

type UserData = {
  profile: Profile | null
  budgetSummary: BudgetSummary
  totalDebt: number
  portfolioValue: number
  goalCount: number
  loading: boolean
  refresh: () => void
}

const defaultBudget: BudgetSummary = { income: 0, expenses: 0, net: 0, savingsRate: 0 }

const UserDataContext = createContext<UserData>({
  profile: null,
  budgetSummary: defaultBudget,
  totalDebt: 0,
  portfolioValue: 0,
  goalCount: 0,
  loading: true,
  refresh: () => {},
})

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [budgetSummary, setBudgetSummary] = useState<BudgetSummary>(defaultBudget)
  const [totalDebt, setTotalDebt] = useState(0)
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [goalCount, setGoalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const channelsRef = useRef<ReturnType<typeof createClient>['channel'][]>([])

  const fetchAll = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

    const [{ data: prof }, { data: txns }, { data: debts }, { data: holdings }, { data: goals }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('transactions').select('amount,type').eq('user_id', user.id).gte('date', startOfMonth),
      supabase.from('debts').select('balance').eq('user_id', user.id),
      supabase.from('holdings').select('ticker,shares,avg_cost_basis').eq('user_id', user.id),
      supabase.from('goals').select('id').eq('user_id', user.id),
    ])

    if (prof) setProfile(prof)

    if (txns) {
      const income = txns.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
      const expenses = txns.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
      const net = income - expenses
      setBudgetSummary({ income, expenses, net, savingsRate: income > 0 ? (net / income) * 100 : 0 })
    }

    setTotalDebt(debts?.reduce((s, d) => s + d.balance, 0) ?? 0)

    // Compute portfolio value using live market prices (same as portfolio page)
    if (holdings && holdings.length > 0) {
      const uniqueTickers = [...new Set(holdings.map(h => h.ticker))]
      const priceMap: Record<string, number> = {}
      await Promise.all(uniqueTickers.map(async ticker => {
        try {
          const res = await fetch(`/api/quote?ticker=${ticker}&range=1M`)
          if (res.ok) {
            const q = await res.json()
            if (q.price) priceMap[ticker] = q.price
          }
        } catch { /* fall back to cost basis */ }
      }))
      const liveValue = holdings.reduce((s, h) => {
        const price = priceMap[h.ticker] ?? h.avg_cost_basis
        return s + h.shares * price
      }, 0)
      setPortfolioValue(liveValue)
    } else {
      setPortfolioValue(0)
    }

    setGoalCount(goals?.length ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Set up Supabase Realtime subscriptions
  useEffect(() => {
    const supabase = createClient()

    const tables = ['transactions', 'debts', 'holdings', 'profiles', 'goals', 'budget_categories']

    const channels = tables.map(table => {
      return supabase
        .channel(`realtime-${table}`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          fetchAll()
        })
        .subscribe()
    })

    // @ts-expect-error channel type mismatch
    channelsRef.current = channels

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [fetchAll])

  return (
    <UserDataContext.Provider value={{ profile, budgetSummary, totalDebt, portfolioValue, goalCount, loading, refresh: fetchAll }}>
      {children}
    </UserDataContext.Provider>
  )
}

export function useUserData() {
  return useContext(UserDataContext)
}
