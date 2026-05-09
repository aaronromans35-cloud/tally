'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'
import { useWorkspace } from '@/lib/context/WorkspaceContext'

type Goal = { id: string; name: string; type: string; target_amount: number; current_amount: number; target_date: string; priority: number }

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const GOAL_ICONS: Record<string, string> = {
  retirement: '🏖️', house: '🏠', education: '🎓',
  emergency_fund: '🛡️', travel: '✈️', other: '🎯',
}

export default function GoalsPage() {
  const { refresh } = useUserData()
  const { activeWorkspaceId } = useWorkspace()
  const [goals, setGoals] = useState<Goal[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', type: 'retirement', target_amount: '', current_amount: '', target_date: '' })
  const [loading, setLoading] = useState(false)
  const [updateId, setUpdateId] = useState<string | null>(null)
  const [updateAmount, setUpdateAmount] = useState('')

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const q = supabase.from('goals').select('*').eq('user_id', user.id).order('priority')
    const { data } = await (activeWorkspaceId ? q.eq('workspace_id', activeWorkspaceId) : q.is('workspace_id', null))
    setGoals(data ?? [])
  }

  useEffect(() => { load() }, [activeWorkspaceId])

  async function addGoal(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('goals').insert({
      user_id: user!.id,
      workspace_id: activeWorkspaceId ?? null,
      name: form.name,
      type: form.type,
      target_amount: form.target_amount ? parseFloat(form.target_amount) : null,
      current_amount: form.current_amount ? parseFloat(form.current_amount) : 0,
      target_date: form.target_date || null,
    })
    setForm({ name: '', type: 'retirement', target_amount: '', current_amount: '', target_date: '' })
    setLoading(false)
    setShowForm(false)
    load()
    refresh()
  }

  async function addDeposit(id: string) {
    const amount = parseFloat(updateAmount)
    if (!amount || amount <= 0) return
    const supabase = createClient()
    const goal = goals.find(g => g.id === id)
    if (!goal) return
    const newAmount = (goal.current_amount ?? 0) + amount
    await supabase.from('goals').update({ current_amount: newAmount }).eq('id', id)
    setUpdateId(null)
    setUpdateAmount('')
    load()
    refresh()
  }

  async function deleteGoal(id: string) {
    const supabase = createClient()
    await supabase.from('goals').delete().eq('id', id)
    load()
    refresh()
  }

  function daysUntil(dateStr: string): number | null {
    if (!dateStr) return null
    return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Goals</h1>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? '← Back' : '+ Add Goal'}
        </button>
      </div>

      {showForm && (
        <div className="card max-w-lg mb-6">
          <h2 className="font-semibold mb-4">New Goal</h2>
          <form onSubmit={addGoal} className="flex flex-col gap-4">
            <div>
              <label className="label">Goal Name</label>
              <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Buy a house in Austin" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="retirement">🏖️ Retirement</option>
                  <option value="house">🏠 Buy a House</option>
                  <option value="education">🎓 Education</option>
                  <option value="emergency_fund">🛡️ Emergency Fund</option>
                  <option value="travel">✈️ Travel</option>
                  <option value="other">🎯 Other</option>
                </select>
              </div>
              <div>
                <label className="label">Target Date</label>
                <input className="input" type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
              </div>
              <div>
                <label className="label">Target Amount ($)</label>
                <input className="input" type="number" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} placeholder="500000" />
              </div>
              <div>
                <label className="label">Current Amount ($)</label>
                <input className="input" type="number" value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <button type="submit" className="btn-primary justify-center" disabled={loading}>
              {loading ? 'Saving…' : 'Add Goal'}
            </button>
          </form>
        </div>
      )}

      {goals.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🎯</div>
          <h2 className="font-semibold mb-2">No goals yet</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Set your first financial goal to get started.</p>
          <button className="btn-primary" onClick={() => setShowForm(true)}>+ Add Your First Goal</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map(g => {
            const pct       = g.target_amount ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0
            const pctRound  = Math.round(pct)
            const days      = g.target_date ? daysUntil(g.target_date) : null
            const remaining = g.target_amount ? Math.max(0, g.target_amount - g.current_amount) : null
            const done      = pct >= 100
            const barColor  = done ? 'var(--green)' : pct >= 66 ? 'var(--accent)' : pct >= 33 ? 'var(--yellow)' : 'var(--red)'
            const deposit   = parseFloat(updateAmount) || 0

            return (
              <div key={g.id} className="card flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                      style={{ background: done ? 'rgba(34,197,94,0.12)' : 'var(--background)' }}>
                      {done ? '🎉' : (GOAL_ICONS[g.type] ?? '🎯')}
                    </div>
                    <div>
                      <div className="font-semibold">{g.name}</div>
                      <div className="text-xs capitalize" style={{ color: 'var(--muted)' }}>
                        {g.type.replace(/_/g, ' ')}
                        {days !== null && (
                          <span style={{ color: days < 30 && days > 0 ? 'var(--yellow)' : 'var(--muted)' }}>
                            {' · '}{days > 0 ? `${days}d left` : days === 0 ? 'Due today' : 'Past due'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="text-xs w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ color: 'var(--muted)' }}>✕</button>
                </div>

                {/* Progress bar */}
                {g.target_amount ? (
                  <div>
                    {/* Amount labels */}
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-lg font-bold" style={{ color: barColor }}>
                        {fmt(g.current_amount)}
                      </span>
                      <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>
                        of {fmt(g.target_amount)}
                      </span>
                    </div>

                    {/* Bar track */}
                    <div className="relative w-full h-4 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                      {/* Filled portion */}
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: barColor }} />
                      {/* Preview of deposit */}
                      {updateId === g.id && deposit > 0 && pct < 100 && (
                        <div className="absolute top-0 h-full rounded-r-full opacity-40"
                          style={{
                            left: `${pct}%`,
                            width: `${Math.min(100 - pct, (deposit / g.target_amount) * 100)}%`,
                            background: barColor,
                          }} />
                      )}
                      {/* % label inside bar */}
                      {pct > 15 && (
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                          {pctRound}%
                        </span>
                      )}
                    </div>

                    {/* Bottom labels */}
                    <div className="flex justify-between text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                      <span>{pctRound}% complete</span>
                      {done
                        ? <span style={{ color: 'var(--green)', fontWeight: 600 }}>Goal reached! 🎉</span>
                        : remaining !== null && <span>{fmt(remaining)} to go</span>}
                    </div>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>No target amount set</p>
                )}

                {/* Add money */}
                {updateId === g.id ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2 items-center">
                      <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>+$</span>
                      <input className="input flex-1" type="number" step="0.01" min="0.01"
                        value={updateAmount} onChange={e => setUpdateAmount(e.target.value)}
                        autoFocus placeholder="Amount to add" />
                    </div>
                    {deposit > 0 && g.target_amount && (
                      <p className="text-xs" style={{ color: 'var(--muted)' }}>
                        New total: <strong style={{ color: 'var(--foreground)' }}>{fmt((g.current_amount ?? 0) + deposit)}</strong>
                        {' '}({Math.min(100, Math.round(((g.current_amount + deposit) / g.target_amount) * 100))}%)
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button className="btn-secondary flex-1 justify-center text-sm"
                        onClick={() => { setUpdateId(null); setUpdateAmount('') }}>Cancel</button>
                      <button className="btn-primary flex-1 justify-center text-sm"
                        onClick={() => addDeposit(g.id)} disabled={!deposit || deposit <= 0}>
                        + Add Money
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="btn-secondary text-sm w-full justify-center"
                    onClick={() => { setUpdateId(g.id); setUpdateAmount('') }}>
                    + Add Money
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
