'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'
import { useWorkspace } from '@/lib/context/WorkspaceContext'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

type Category = { id: string; name: string; type: string; color: string; monthly_budget: number; bucket: string }
type Transaction = { id: string; category_id: string | null; amount: number; type: string; description: string; date: string }
type RecurringPayment = { id: string; name: string; amount: number; type: 'expense' | 'income'; category_id: string; description: string; active: boolean }

const MONTH_KEY = () => new Date().toISOString().slice(0, 7) // "2026-05"

function loadRecurring(userId: string): RecurringPayment[] {
  try { return JSON.parse(localStorage.getItem(`nexus_recurring_${userId}`) ?? '[]') } catch { return [] }
}
function saveRecurring(userId: string, p: RecurringPayment[]) {
  localStorage.setItem(`nexus_recurring_${userId}`, JSON.stringify(p))
}
function wasApplied(id: string): boolean {
  try { return JSON.parse(localStorage.getItem('nexus_recurring_applied') ?? '{}')[`${id}_${MONTH_KEY()}`] === true } catch { return false }
}
function markApplied(id: string) {
  try {
    const obj = JSON.parse(localStorage.getItem('nexus_recurring_applied') ?? '{}')
    obj[`${id}_${MONTH_KEY()}`] = true
    localStorage.setItem('nexus_recurring_applied', JSON.stringify(obj))
  } catch {}
}

const fmt  = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const PRESET_FIXED: { name: string; icon: string }[] = [
  { name: 'Rent / Mortgage', icon: '🏠' }, { name: 'Car Payment', icon: '🚗' },
  { name: 'Car Insurance', icon: '🛡️' }, { name: 'Health Insurance', icon: '💊' },
  { name: 'Life Insurance', icon: '❤️' }, { name: 'Internet', icon: '📶' },
  { name: 'Phone Bill', icon: '📱' }, { name: 'Streaming Services', icon: '📺' },
  { name: 'Gym Membership', icon: '🏋️' }, { name: 'Student Loans', icon: '🎓' },
  { name: 'Subscriptions', icon: '🔁' }, { name: 'Storage Unit', icon: '📦' },
]
const PRESET_VARIABLE: { name: string; icon: string }[] = [
  { name: 'Groceries', icon: '🛒' }, { name: 'Dining Out', icon: '🍽️' },
  { name: 'Coffee', icon: '☕' }, { name: 'Gas', icon: '⛽' },
  { name: 'Rideshare / Parking', icon: '🚕' }, { name: 'Entertainment', icon: '🎬' },
  { name: 'Clothing', icon: '👕' }, { name: 'Personal Care', icon: '🪥' },
  { name: 'Household Supplies', icon: '🧹' }, { name: 'Gifts', icon: '🎁' },
  { name: 'Travel', icon: '✈️' }, { name: 'Medical / Copays', icon: '🏥' },
  { name: 'Pet Expenses', icon: '🐾' },
]
const PRESET_SAVINGS: { name: string; icon: string }[] = [
  { name: 'Emergency Fund', icon: '🛡️' }, { name: '401(k)', icon: '📊' },
  { name: 'Roth IRA', icon: '💼' }, { name: 'Brokerage', icon: '📈' },
  { name: 'House Down Payment', icon: '🏡' }, { name: 'Vacation Fund', icon: '✈️' },
]
const PRESET_INCOME: { name: string; icon: string }[] = [
  { name: 'Salary', icon: '💵' }, { name: 'Freelance', icon: '💻' },
  { name: 'Side Business', icon: '🏪' }, { name: 'Investments', icon: '📈' },
  { name: 'Rental Income', icon: '🏘️' }, { name: 'Other Income', icon: '💰' },
]

const BUCKET_COLORS: Record<string, string> = {
  fixed: '#5B6AF0', variable: '#f59e0b', income: '#22c55e', savings: '#10b981',
}
const PIE_COLORS = ['#5B6AF0', '#f59e0b', '#ef4444', '#8b5cf6', '#3b82f6', '#10b981', '#f97316', '#64748b', '#ec4899', '#14b8a6']

// Custom pie label
function PieLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: { cx?: number; cy?: number; midAngle?: number; innerRadius?: number; outerRadius?: number; percent?: number; name?: string }) {
  if (!cx || !cy || midAngle === undefined || !innerRadius || !outerRadius || !percent) return null
  if (percent < 0.05 || !name) return null
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export default function BudgetPage() {
  const { refresh } = useUserData()
  const { activeWorkspaceId } = useWorkspace()
  const [categories, setCategories]     = useState<Category[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetVal, setBudgetVal]       = useState('')
  const [showTxModal, setShowTxModal]   = useState(false)
  const [showCatModal, setShowCatModal] = useState(false)
  const [customCat, setCustomCat]       = useState('')
  const [customBucket, setCustomBucket] = useState('variable')
  const [txForm, setTxForm]             = useState({ amount: '', type: 'expense', description: '', category_id: '', date: new Date().toISOString().split('T')[0] })
  const [saving, setSaving]             = useState(false)

  // ── Recurring payments ──
  const [recurringPayments, setRecurringPayments] = useState<RecurringPayment[]>([])
  const [showRecurringModal, setShowRecurringModal] = useState(false)
  const [editingRecurring, setEditingRecurring] = useState<RecurringPayment | null>(null)
  const [recurringForm, setRecurringForm] = useState({ name: '', amount: '', type: 'expense' as 'expense' | 'income', category_id: '', description: '' })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
    const catsQ = supabase.from('budget_categories').select('*').eq('user_id', user.id).order('created_at')
    const txnsQ = supabase.from('transactions').select('*').eq('user_id', user.id).gte('date', startOfMonth).order('date', { ascending: false })
    const [{ data: cats }, { data: txns }] = await Promise.all([
      activeWorkspaceId ? catsQ.eq('workspace_id', activeWorkspaceId) : catsQ.is('workspace_id', null),
      activeWorkspaceId ? txnsQ.eq('workspace_id', activeWorkspaceId) : txnsQ.is('workspace_id', null),
    ])
    setCategories((cats ?? []).map(c => ({ ...c, bucket: c.bucket ?? (c.type === 'income' ? 'income' : 'variable') })))
    setTransactions(txns ?? [])
  }, [activeWorkspaceId])

  useEffect(() => { load() }, [load])

  // ── Load recurring payments & auto-apply for this month ──
  useEffect(() => {
    async function initRecurring() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)

      const payments = loadRecurring(user.id)
      setRecurringPayments(payments)

      // Auto-apply any active payments not yet logged this month
      const toApply = payments.filter(p => p.active && !wasApplied(p.id))
      if (toApply.length === 0) return

      // Ensure profile row exists
      await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

      await Promise.all(toApply.map(async (p) => {
        const today = new Date().toISOString().split('T')[0]
        const { error } = await supabase.from('transactions').insert({
          user_id: user.id,
          workspace_id: activeWorkspaceId ?? null,
          amount: p.amount,
          type: p.type,
          description: p.description || p.name,
          category_id: p.category_id || null,
          date: today,
        })
        if (!error) markApplied(p.id)
      }))

      if (toApply.length > 0) { load(); refresh() }
    }
    initRecurring()
  }, [load, refresh])

  function saveRecurringState(userId: string, payments: RecurringPayment[]) {
    setRecurringPayments(payments)
    saveRecurring(userId, payments)
  }

  function openAddRecurring() {
    setEditingRecurring(null)
    setRecurringForm({ name: '', amount: '', type: 'expense', category_id: '', description: '' })
    setShowRecurringModal(true)
  }

  function openEditRecurring(p: RecurringPayment) {
    setEditingRecurring(p)
    setRecurringForm({ name: p.name, amount: String(p.amount), type: p.type, category_id: p.category_id, description: p.description })
    setShowRecurringModal(true)
  }

  function saveRecurringPayment() {
    if (!currentUserId || !recurringForm.name || !recurringForm.amount) return
    if (editingRecurring) {
      const updated = recurringPayments.map(p => p.id === editingRecurring.id
        ? { ...p, name: recurringForm.name, amount: parseFloat(recurringForm.amount), type: recurringForm.type, category_id: recurringForm.category_id, description: recurringForm.description }
        : p)
      saveRecurringState(currentUserId, updated)
    } else {
      const newPayment: RecurringPayment = {
        id: crypto.randomUUID(),
        name: recurringForm.name,
        amount: parseFloat(recurringForm.amount),
        type: recurringForm.type,
        category_id: recurringForm.category_id,
        description: recurringForm.description,
        active: true,
      }
      saveRecurringState(currentUserId, [...recurringPayments, newPayment])
    }
    setShowRecurringModal(false)
  }

  function deleteRecurringPayment(id: string) {
    if (!currentUserId) return
    saveRecurringState(currentUserId, recurringPayments.filter(p => p.id !== id))
  }

  function toggleRecurringPayment(id: string) {
    if (!currentUserId) return
    saveRecurringState(currentUserId, recurringPayments.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  function applyNow(p: RecurringPayment) {
    if (!currentUserId) return
    const supabase = createClient()
    const today = new Date().toISOString().split('T')[0]
    supabase.from('transactions').insert({
      user_id: currentUserId, workspace_id: activeWorkspaceId ?? null,
      amount: p.amount, type: p.type,
      description: p.description || p.name, category_id: p.category_id || null, date: today,
    }).then(() => { markApplied(p.id); load(); refresh() })
  }

  async function addCategory(name: string, bucket: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (categories.find(c => c.name === name)) return

    // Ensure profile row exists (all tables FK → profiles.id)
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

    const { error } = await supabase.from('budget_categories').insert({
      user_id: user.id, workspace_id: activeWorkspaceId ?? null, name,
      type: bucket === 'income' ? 'income' : 'expense',
      color: BUCKET_COLORS[bucket] ?? '#64748b',
      monthly_budget: 0, bucket,
    })
    if (error) console.error('addCategory error:', error.message)
    load(); refresh()
  }

  async function saveBudget(id: string) {
    const supabase = createClient()
    await supabase.from('budget_categories').update({ monthly_budget: parseFloat(budgetVal) || 0 }).eq('id', id)
    setEditingBudget(null); load(); refresh()
  }

  async function deleteCategory(id: string) {
    const supabase = createClient()
    await supabase.from('budget_categories').delete().eq('id', id)
    load(); refresh()
  }

  async function addTransaction(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    // Ensure profile row exists
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      workspace_id: activeWorkspaceId ?? null,
      amount: parseFloat(txForm.amount),
      type: txForm.type,
      description: txForm.description,
      category_id: txForm.category_id || null,
      date: txForm.date,
    })
    if (error) console.error('addTransaction error:', error.message)

    // Sync income to profile.annual_income if this is an income transaction
    if (txForm.type === 'income') {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      const { data: incomeTxns } = await supabase
        .from('transactions').select('amount')
        .eq('user_id', user.id).eq('type', 'income').gte('date', startOfMonth)
      const newMonthlyIncome = (incomeTxns ?? []).reduce((s, t) => s + t.amount, 0) + parseFloat(txForm.amount)
      await supabase.from('profiles').update({ annual_income: Math.round(newMonthlyIncome * 12) }).eq('id', user.id)
    }

    setTxForm({ amount: '', type: 'expense', description: '', category_id: '', date: new Date().toISOString().split('T')[0] })
    setSaving(false); setShowTxModal(false); load(); refresh()
  }

  async function deleteTx(id: string) {
    const supabase = createClient()
    await supabase.from('transactions').delete().eq('id', id)
    load(); refresh()
  }

  // Derived stats
  const income   = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
  const net      = income - expenses
  const savingsRate = income > 0 ? (net / income) * 100 : 0
  const totalBudgeted = categories.filter(c => c.type === 'expense').reduce((s, c) => s + c.monthly_budget, 0)

  function spentIn(catId: string) {
    return transactions.filter(t => t.category_id === catId).reduce((s, t) => s + t.amount, 0)
  }

  // Chart data
  const expenseCats = categories.filter(c => c.type === 'expense')
  const pieData = expenseCats
    .map(c => ({ name: c.name, value: spentIn(c.id) }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  const barData = expenseCats
    .filter(c => c.monthly_budget > 0 || spentIn(c.id) > 0)
    .map(c => ({ name: c.name.length > 12 ? c.name.slice(0, 12) + '…' : c.name, Budget: c.monthly_budget, Spent: spentIn(c.id) }))
    .sort((a, b) => b.Spent - a.Spent)
    .slice(0, 8)

  const addedNames = new Set(categories.map(c => c.name))
  const allCats = [
    { label: 'Income', bucket: 'income', presets: PRESET_INCOME },
    { label: 'Fixed Expenses', bucket: 'fixed', presets: PRESET_FIXED },
    { label: 'Variable Expenses', bucket: 'variable', presets: PRESET_VARIABLE },
    { label: 'Savings', bucket: 'savings', presets: PRESET_SAVINGS },
  ]

  const bucketGroups = [
    { bucket: 'income', label: 'Income', color: BUCKET_COLORS.income, cats: categories.filter(c => c.bucket === 'income') },
    { bucket: 'fixed', label: 'Fixed Expenses', color: BUCKET_COLORS.fixed, cats: categories.filter(c => c.bucket === 'fixed') },
    { bucket: 'variable', label: 'Variable Expenses', color: BUCKET_COLORS.variable, cats: categories.filter(c => c.bucket === 'variable') },
    { bucket: 'savings', label: 'Savings & Investing', color: BUCKET_COLORS.savings, cats: categories.filter(c => c.bucket === 'savings') },
  ]

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">Budget Tracker</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
            {new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={() => setShowCatModal(true)}>+ Add Category</button>
          <button className="btn-secondary" onClick={openAddRecurring} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
            </svg>
            Recurring
          </button>
          <button className="btn-primary"   onClick={() => setShowTxModal(true)}>+ Log Transaction</button>
        </div>
      </div>

      {/* ── Top Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Monthly Income',    value: fmt(income),   color: 'var(--nx-pos-500)',  sub: `${categories.filter(c=>c.bucket==='income').length} sources` },
          { label: 'Total Expenses',    value: fmt(expenses), color: 'var(--nx-neg-500)',  sub: `${fmt(totalBudgeted)} budgeted` },
          { label: 'Net Savings',       value: fmt(net),      color: net >= 0 ? 'var(--nx-pos-500)' : 'var(--nx-neg-500)', sub: net >= 0 ? 'On track' : 'Over budget' },
          { label: 'Savings Rate',      value: `${Math.round(savingsRate)}%`, color: savingsRate >= 20 ? 'var(--nx-pos-500)' : savingsRate >= 10 ? 'var(--nx-warn-500)' : 'var(--nx-neg-500)', sub: savingsRate >= 20 ? 'Excellent' : savingsRate >= 10 ? 'Good' : 'Needs work' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 8 }}>{s.label}</div>
            <div className="num-display" style={{ fontSize: 28, lineHeight: 1, color: s.color, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Savings rate bar */}
      {income > 0 && (
        <div className="card py-3">
          <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--muted)' }}>
            <span>Monthly spending progress</span>
            <span style={{ color: expenses > income ? 'var(--red)' : 'var(--green)' }}>{fmt(expenses)} of {fmt(income)}</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--nx-cream-200)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, income > 0 ? (expenses/income)*100 : 0)}%`, background: expenses > income ? 'var(--nx-neg-500)' : 'var(--nx-navy-800)' }} />
          </div>
        </div>
      )}

      {/* ── Charts Row ── */}
      {(pieData.length > 0 || barData.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pie chart */}
          {pieData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-4">Spending Breakdown</h2>
              <div className="flex gap-4 items-center">
                <div style={{ width: 180, height: 180, flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={85}
                        dataKey="value" labelLine={false}
                        label={(props) => <PieLabel {...props} />}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: unknown) => [fmtD(Number(v)), 'Spent']}
                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                  {pieData.slice(0, 7).map((d, i) => (
                    <div key={d.name} className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-xs truncate" style={{ color: 'var(--foreground-secondary)' }}>{d.name}</span>
                      </div>
                      <span className="text-xs font-semibold shrink-0">{fmt(d.value)}</span>
                    </div>
                  ))}
                  {pieData.length > 7 && <p className="text-xs" style={{ color: 'var(--muted)' }}>+{pieData.length - 7} more</p>}
                </div>
              </div>
            </div>
          )}

          {/* Bar chart — budget vs actual */}
          {barData.length > 0 && (
            <div className="card">
              <h2 className="font-semibold mb-4">Budget vs Actual</h2>
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--muted)' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} width={36} />
                    <Tooltip formatter={(v: unknown) => [fmtD(Number(v))]}
                      contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Budget" fill="#5B6AF044" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Spent"  fill="#5B6AF0"   radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Category Table ── */}
      {categories.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold">Budget Categories</h2>
            <button className="text-sm" style={{ color: 'var(--accent)' }} onClick={() => setShowCatModal(true)}>+ Add category</button>
          </div>

          {bucketGroups.map(group => {
            if (group.cats.length === 0) return null
            const groupSpent     = group.cats.reduce((s, c) => s + spentIn(c.id), 0)
            const groupBudgeted  = group.cats.reduce((s, c) => s + c.monthly_budget, 0)
            return (
              <div key={group.bucket}>
                {/* Group header */}
                <div className="px-5 py-2 flex items-center justify-between"
                  style={{ background: group.color + '12', borderBottom: '1px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: group.color }} />
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: group.color }}>{group.label}</span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>({group.cats.length})</span>
                  </div>
                  <div className="text-xs font-semibold" style={{ color: group.color }}>
                    {fmt(groupSpent)}{groupBudgeted > 0 ? ` / ${fmt(groupBudgeted)}` : ''}
                  </div>
                </div>

                {/* Category rows */}
                {group.cats.map(cat => {
                  const spent = spentIn(cat.id)
                  const budget = cat.monthly_budget
                  const pct  = budget > 0 ? Math.min(100, (spent / budget) * 100) : 0
                  const over = budget > 0 && spent > budget
                  const remaining = budget > 0 ? budget - spent : null
                  return (
                    <div key={cat.id} className="px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center gap-3">
                        {/* Name */}
                        <div className="w-4 h-4 rounded-full shrink-0" style={{ background: group.color + '33', border: `2px solid ${group.color}` }} />
                        <span className="text-sm font-medium flex-1">{cat.name}</span>

                        {/* Spent */}
                        <span className="text-sm w-24 text-right" style={{ color: over ? 'var(--red)' : 'var(--foreground)' }}>{fmt(spent)}</span>

                        {/* Budget (editable) */}
                        <div className="w-28 text-right">
                          {editingBudget === cat.id ? (
                            <form onSubmit={e => { e.preventDefault(); saveBudget(cat.id) }} className="flex gap-1 justify-end">
                              <input className="input text-xs py-0.5 px-2 w-20 text-right" type="number" value={budgetVal}
                                onChange={e => setBudgetVal(e.target.value)} autoFocus placeholder="0" />
                              <button type="submit" className="text-xs px-2 py-1 rounded-lg text-white" style={{ background: 'var(--accent)' }}>✓</button>
                              <button type="button" className="text-xs px-1 py-1 rounded-lg" style={{ color: 'var(--muted)' }} onClick={() => setEditingBudget(null)}>✕</button>
                            </form>
                          ) : (
                            <button onClick={() => { setEditingBudget(cat.id); setBudgetVal(String(cat.monthly_budget || '')) }}
                              className="text-sm" style={{ color: budget > 0 ? 'var(--foreground-secondary)' : 'var(--accent)', textDecoration: budget > 0 ? 'none' : 'underline dotted' }}>
                              {budget > 0 ? fmt(budget) : 'Set budget'}
                            </button>
                          )}
                        </div>

                        {/* Remaining */}
                        <span className="text-xs w-20 text-right" style={{ color: over ? 'var(--red)' : 'var(--muted)' }}>
                          {remaining !== null ? (over ? `${fmt(Math.abs(remaining))} over` : `${fmt(remaining)} left`) : '—'}
                        </span>

                        {/* Progress bar */}
                        <div className="w-24 hidden lg:block">
                          {budget > 0 ? (
                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                              <div className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, background: over ? 'var(--red)' : group.color }} />
                            </div>
                          ) : <div className="h-1.5 rounded-full" style={{ background: 'var(--card-border)' }} />}
                        </div>

                        {/* % */}
                        <span className="text-xs w-10 text-right hidden lg:block" style={{ color: over ? 'var(--red)' : 'var(--muted)' }}>
                          {budget > 0 ? `${Math.round(pct)}%` : '—'}
                        </span>

                        {/* Delete */}
                        <button onClick={() => deleteCategory(cat.id)} className="text-xs ml-1 w-5 h-5 rounded-full flex items-center justify-center hover:bg-red-50"
                          style={{ color: 'var(--muted)' }}>✕</button>
                      </div>

                      {/* Mobile progress bar */}
                      {budget > 0 && (
                        <div className="mt-2 lg:hidden">
                          <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: over ? 'var(--red)' : group.color }} />
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}

          {/* Table totals footer */}
          <div className="px-5 py-3 flex items-center gap-3" style={{ background: 'var(--surface)' }}>
            <span className="text-sm font-semibold flex-1">Total</span>
            <span className="text-sm font-bold w-24 text-right">{fmt(expenses)}</span>
            <span className="text-sm font-semibold w-28 text-right" style={{ color: 'var(--muted)' }}>{fmt(totalBudgeted)}</span>
            <span className="text-xs w-20 text-right" style={{ color: net >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {net >= 0 ? `${fmt(net)} saved` : `${fmt(Math.abs(net))} over`}
            </span>
            <div className="w-24 hidden lg:block" />
            <div className="w-10 hidden lg:block" />
            <div className="w-5 ml-1" />
          </div>
        </div>
      ) : (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">💰</div>
          <h2 className="font-semibold mb-2">No categories yet</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Add budget categories to start tracking your spending.</p>
          <button className="btn-primary" onClick={() => setShowCatModal(true)}>+ Add Your First Category</button>
        </div>
      )}

      {/* ── Recurring Payments ── */}
      {recurringPayments.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-500)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
              <h2 className="font-semibold">Recurring Payments</h2>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 999, background: 'var(--nx-gold-100)', color: '#6B5318' }}>
                {recurringPayments.filter(p => p.active).length} active
              </span>
            </div>
            <button className="btn-secondary text-sm py-1.5" onClick={openAddRecurring}>+ Add</button>
          </div>
          <div>
            {recurringPayments.map((p, i) => {
              const applied = wasApplied(p.id)
              const cat = categories.find(c => c.id === p.category_id)
              return (
                <div key={p.id} className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: i < recurringPayments.length - 1 ? '1px solid var(--border)' : 'none', opacity: p.active ? 1 : 0.5 }}>
                  {/* Icon */}
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: p.type === 'income' ? 'var(--nx-pos-50)' : 'var(--nx-cream-200)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={p.type === 'income' ? 'var(--nx-pos-500)' : 'var(--nx-ink-500)'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                    </svg>
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--nx-navy-900)' }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>
                      {cat?.name ?? 'No category'} · Monthly
                      {applied && <span style={{ marginLeft: 8, color: 'var(--nx-pos-500)', fontWeight: 600 }}>✓ Applied this month</span>}
                    </div>
                  </div>
                  {/* Amount */}
                  <span className="num" style={{ fontSize: 14, fontWeight: 600, color: p.type === 'income' ? 'var(--nx-pos-500)' : 'var(--nx-navy-900)', marginRight: 8 }}>
                    {p.type === 'income' ? '+' : '−'}{fmt(p.amount)}
                  </span>
                  {/* Apply now button */}
                  {p.active && !applied && (
                    <button onClick={() => applyNow(p)} style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 6, background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', whiteSpace: 'nowrap', marginRight: 6 }}>
                      Log now
                    </button>
                  )}
                  {/* Toggle active */}
                  <button onClick={() => toggleRecurringPayment(p.id)} title={p.active ? 'Pause' : 'Resume'} style={{ width: 32, height: 18, borderRadius: 999, border: 'none', cursor: 'pointer', background: p.active ? 'var(--nx-pos-500)' : 'var(--nx-cream-300)', position: 'relative', flexShrink: 0, marginRight: 4 }}>
                    <span style={{ position: 'absolute', top: 2, left: p.active ? 16 : 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left 140ms' }} />
                  </button>
                  {/* Edit */}
                  <button onClick={() => openEditRecurring(p)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px 6px' }}>✏️</button>
                  {/* Delete */}
                  <button onClick={() => deleteRecurringPayment(p.id)} style={{ color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '4px 6px' }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Recent Transactions ── */}
      {transactions.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
            <h2 className="font-semibold">Recent Transactions</h2>
            <button className="btn-secondary text-sm py-1.5" onClick={() => setShowTxModal(true)}>+ Log</button>
          </div>
          <div>
            {transactions.slice(0, 12).map(t => {
              const cat = categories.find(c => c.id === t.category_id)
              return (
                <div key={t.id} className="flex items-center gap-3 px-5 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                    style={{ background: t.type === 'income' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.1)' }}>
                    {t.type === 'income' ? '↑' : '↓'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{t.description || cat?.name || 'Transaction'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{cat?.name ?? 'Uncategorized'} · {t.date}</p>
                  </div>
                  <span className="font-semibold text-sm shrink-0" style={{ color: t.type === 'income' ? 'var(--green)' : 'var(--red)' }}>
                    {t.type === 'income' ? '+' : '-'}{fmtD(t.amount)}
                  </span>
                  <button onClick={() => deleteTx(t.id)} className="text-xs w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ color: 'var(--muted)' }}>✕</button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Add Category Modal ── */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowCatModal(false) }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold">Add Budget Category</h2>
              <button onClick={() => setShowCatModal(false)} style={{ color: 'var(--muted)' }}>✕</button>
            </div>
            <div className="overflow-y-auto p-5 flex flex-col gap-5">
              {allCats.map(group => {
                const available = group.presets.filter(p => !addedNames.has(p.name))
                if (available.length === 0) return null
                return (
                  <div key={group.bucket}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-2"
                      style={{ color: BUCKET_COLORS[group.bucket] }}>{group.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {available.map(p => (
                        <button key={p.name}
                          onClick={() => { addCategory(p.name, group.bucket) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
                          style={{ background: BUCKET_COLORS[group.bucket] + '18', color: 'var(--foreground)', border: `1px solid ${BUCKET_COLORS[group.bucket]}44` }}>
                          <span>{p.icon}</span> {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}

              {/* Custom category */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Custom Category</p>
                <form onSubmit={e => { e.preventDefault(); if (customCat.trim()) { addCategory(customCat.trim(), customBucket); setCustomCat('') } }}
                  className="flex gap-2">
                  <input className="input flex-1" value={customCat} onChange={e => setCustomCat(e.target.value)} placeholder="Category name" />
                  <select className="input w-36" value={customBucket} onChange={e => setCustomBucket(e.target.value)}>
                    <option value="income">Income</option>
                    <option value="fixed">Fixed</option>
                    <option value="variable">Variable</option>
                    <option value="savings">Savings</option>
                  </select>
                  <button type="submit" className="btn-primary px-4">Add</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Log Transaction Modal ── */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowTxModal(false) }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold">Log a Transaction</h2>
              <button onClick={() => setShowTxModal(false)} style={{ color: 'var(--muted)' }}>✕</button>
            </div>
            <form onSubmit={addTransaction} className="p-5 flex flex-col gap-4">
              <div className="flex gap-2">
                {['expense', 'income'].map(t => (
                  <button key={t} type="button" onClick={() => setTxForm(f => ({ ...f, type: t }))}
                    className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                    style={{
                      background: txForm.type === t ? (t === 'income' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.1)') : 'var(--background)',
                      color: txForm.type === t ? (t === 'income' ? 'var(--green)' : 'var(--red)') : 'var(--muted)',
                      border: `1.5px solid ${txForm.type === t ? (t === 'income' ? '#86efac' : '#fca5a5') : 'var(--border)'}`,
                    }}>
                    {t === 'income' ? '↑ Income' : '↓ Expense'}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount ($)</label>
                  <input className="input" type="number" step="0.01" value={txForm.amount}
                    onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} required placeholder="0.00" />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input className="input" type="date" value={txForm.date}
                    onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input className="input" value={txForm.description}
                  onChange={e => setTxForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Whole Foods run" />
              </div>
              <div>
                <label className="label">Category</label>
                <select className="input" value={txForm.category_id} onChange={e => setTxForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">No category</option>
                  {categories.filter(c => c.type === txForm.type).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <button type="submit" className="btn-primary justify-center py-3" disabled={saving}>
                {saving ? 'Saving…' : 'Save Transaction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Recurring Payment Modal ── */}
      {showRecurringModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowRecurringModal(false) }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-500)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
                </svg>
                <h2 className="font-semibold">{editingRecurring ? 'Edit Recurring Payment' : 'Add Recurring Payment'}</h2>
              </div>
              <button onClick={() => setShowRecurringModal(false)} style={{ color: 'var(--muted)' }}>✕</button>
            </div>
            <div className="p-5 flex flex-col gap-4">
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Recurring payments are automatically logged on the 1st of each month.
              </p>
              <div>
                <label className="label">Payment name</label>
                <input className="input" placeholder="e.g. Rent, Netflix, Gym" value={recurringForm.name}
                  onChange={e => setRecurringForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Amount ($)</label>
                  <input className="input" type="number" step="0.01" min="0.01" placeholder="0.00" value={recurringForm.amount}
                    onChange={e => setRecurringForm(f => ({ ...f, amount: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Type</label>
                  <select className="input" value={recurringForm.type} onChange={e => setRecurringForm(f => ({ ...f, type: e.target.value as 'expense' | 'income' }))}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Category (optional)</label>
                <select className="input" value={recurringForm.category_id} onChange={e => setRecurringForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">No category</option>
                  {categories.filter(c => c.type === recurringForm.type).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Description (optional)</label>
                <input className="input" placeholder="e.g. Monthly rent payment" value={recurringForm.description}
                  onChange={e => setRecurringForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button className="btn-secondary flex-1 justify-center" onClick={() => setShowRecurringModal(false)}>Cancel</button>
                <button className="btn-primary flex-1 justify-center" onClick={saveRecurringPayment}
                  disabled={!recurringForm.name || !recurringForm.amount}>
                  {editingRecurring ? 'Save changes' : 'Add recurring payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
