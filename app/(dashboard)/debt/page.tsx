'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserData } from '@/lib/context/UserDataContext'

type Debt = { id: string; name: string; type: string; balance: number; interest_rate: number; minimum_payment: number }
type DebtAutoPay = { debtId: string; amount: number; enabled: boolean; syncBudget: boolean }

const fmt  = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const DEBT_MONTH_KEY = () => new Date().toISOString().slice(0, 7)

function loadAutoPay(userId: string): DebtAutoPay[] {
  try { return JSON.parse(localStorage.getItem(`nexus_debt_autopay_${userId}`) ?? '[]') } catch { return [] }
}
function saveAutoPay(userId: string, list: DebtAutoPay[]) {
  localStorage.setItem(`nexus_debt_autopay_${userId}`, JSON.stringify(list))
}
function debtWasApplied(debtId: string): boolean {
  try { return JSON.parse(localStorage.getItem('nexus_debt_autopay_applied') ?? '{}')[`${debtId}_${DEBT_MONTH_KEY()}`] === true } catch { return false }
}
function markDebtApplied(debtId: string) {
  try {
    const obj = JSON.parse(localStorage.getItem('nexus_debt_autopay_applied') ?? '{}')
    obj[`${debtId}_${DEBT_MONTH_KEY()}`] = true
    localStorage.setItem('nexus_debt_autopay_applied', JSON.stringify(obj))
  } catch {}
}

function calcMonths(balance: number, rate: number, payment: number): number {
  if (balance <= 0) return 0
  if (payment <= 0) return Infinity
  if (rate <= 0) return Math.ceil(balance / payment)
  const monthlyRate = rate / 100 / 12
  if (payment <= balance * monthlyRate) return Infinity
  return Math.ceil(Math.log(payment / (payment - balance * monthlyRate)) / Math.log(1 + monthlyRate))
}

function totalInterestPaid(balance: number, rate: number, payment: number): number {
  const months = calcMonths(balance, rate, payment)
  if (!isFinite(months)) return Infinity
  return Math.max(0, payment * months - balance)
}

function payoffDate(months: number): string {
  if (!isFinite(months)) return 'Never'
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function monthsLabel(months: number): string {
  if (!isFinite(months)) return '∞'
  const yrs = Math.floor(months / 12)
  const mos = months % 12
  if (yrs === 0) return `${mos}mo`
  if (mos === 0) return `${yrs}yr`
  return `${yrs}yr ${mos}mo`
}

const DEBT_ICONS: Record<string, string> = {
  credit_card: '💳', student_loan: '🎓', auto_loan: '🚗',
  personal_loan: '💵', mortgage: '🏠', medical: '🏥', other: '📄',
}

export default function DebtPage() {
  const { refresh } = useUserData()
  const [debts, setDebts]           = useState<Debt[]>([])
  const [strategy, setStrategy]     = useState<'avalanche' | 'snowball'>('avalanche')
  const [extraPayment, setExtraPayment] = useState(0)
  const [showAddModal, setShowAddModal]   = useState(false)
  const [showPayModal, setShowPayModal]   = useState<string | null>(null)
  const [payAmount, setPayAmount]         = useState('')
  const [form, setForm] = useState({ name: '', type: 'credit_card', balance: '', interest_rate: '', minimum_payment: '' })
  const [loading, setLoading] = useState(false)
  const [autoPayList, setAutoPayList]   = useState<DebtAutoPay[]>([])
  const [showAutoPayModal, setShowAutoPayModal] = useState<string | null>(null) // debt id
  const [autoPayForm, setAutoPayForm]   = useState({ amount: '', syncBudget: true })
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('debts').select('*').eq('user_id', user.id).order('interest_rate', { ascending: false })
    setDebts(data ?? [])
  }

  useEffect(() => { load() }, [])

  // ── Load auto-pay settings & auto-apply this month ──
  useEffect(() => {
    async function initAutoPay() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setCurrentUserId(user.id)
      const list = loadAutoPay(user.id)
      setAutoPayList(list)

      const toApply = list.filter(ap => ap.enabled && !debtWasApplied(ap.debtId))
      if (toApply.length === 0) return

      const { data: debtRows } = await supabase.from('debts').select('*').eq('user_id', user.id)
      if (!debtRows) return

      await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

      for (const ap of toApply) {
        const debt = debtRows.find(d => d.id === ap.debtId)
        if (!debt || debt.balance <= 0) continue
        const newBalance = Math.max(0, debt.balance - ap.amount)
        await supabase.from('debts').update({ balance: newBalance }).eq('id', ap.debtId)
        // Optionally sync as budget expense
        if (ap.syncBudget) {
          await supabase.from('transactions').insert({
            user_id: user.id,
            amount: ap.amount,
            type: 'expense',
            description: `Auto-pay: ${debt.name}`,
            category_id: null,
            date: new Date().toISOString().split('T')[0],
          })
        }
        markDebtApplied(ap.debtId)
      }
      if (toApply.length > 0) { load(); refresh() }
    }
    initAutoPay()
  }, [refresh])

  function saveAutoPayState(userId: string, list: DebtAutoPay[]) {
    setAutoPayList(list)
    saveAutoPay(userId, list)
  }

  function openAutoPayModal(debt: Debt) {
    const existing = autoPayList.find(ap => ap.debtId === debt.id)
    setAutoPayForm({ amount: String(existing?.amount ?? debt.minimum_payment), syncBudget: existing?.syncBudget ?? true })
    setShowAutoPayModal(debt.id)
  }

  function saveAutoPaySetting() {
    if (!currentUserId || !showAutoPayModal) return
    const amount = parseFloat(autoPayForm.amount)
    if (!amount || amount <= 0) return
    const existing = autoPayList.find(ap => ap.debtId === showAutoPayModal)
    let updated: DebtAutoPay[]
    if (existing) {
      updated = autoPayList.map(ap => ap.debtId === showAutoPayModal ? { ...ap, amount, syncBudget: autoPayForm.syncBudget, enabled: true } : ap)
    } else {
      updated = [...autoPayList, { debtId: showAutoPayModal, amount, syncBudget: autoPayForm.syncBudget, enabled: true }]
    }
    saveAutoPayState(currentUserId, updated)
    setShowAutoPayModal(null)
  }

  function toggleAutoPay(debtId: string) {
    if (!currentUserId) return
    const existing = autoPayList.find(ap => ap.debtId === debtId)
    if (!existing) return
    saveAutoPayState(currentUserId, autoPayList.map(ap => ap.debtId === debtId ? { ...ap, enabled: !ap.enabled } : ap))
  }

  function removeAutoPay(debtId: string) {
    if (!currentUserId) return
    saveAutoPayState(currentUserId, autoPayList.filter(ap => ap.debtId !== debtId))
  }

  async function applyDebtPaymentNow(debt: Debt, amount: number, syncBudget: boolean) {
    if (!currentUserId) return
    const supabase = createClient()
    const newBalance = Math.max(0, debt.balance - amount)
    await supabase.from('debts').update({ balance: newBalance }).eq('id', debt.id)
    if (syncBudget) {
      await supabase.from('transactions').insert({
        user_id: currentUserId, amount, type: 'expense',
        description: `Auto-pay: ${debt.name}`, category_id: null,
        date: new Date().toISOString().split('T')[0],
      })
    }
    markDebtApplied(debt.id)
    load(); refresh()
  }

  async function addDebt(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Ensure profile exists (FK)
    await supabase.from('profiles').upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

    await supabase.from('debts').insert({
      user_id: user.id,
      name: form.name,
      type: form.type,
      balance: parseFloat(form.balance),
      interest_rate: parseFloat(form.interest_rate),
      minimum_payment: parseFloat(form.minimum_payment),
    })
    setForm({ name: '', type: 'credit_card', balance: '', interest_rate: '', minimum_payment: '' })
    setLoading(false)
    setShowAddModal(false)
    load(); refresh()
  }

  async function logPayment(debtId: string) {
    const amount = parseFloat(payAmount)
    if (!amount || amount <= 0) return
    const supabase = createClient()
    const debt = debts.find(d => d.id === debtId)
    if (!debt) return
    const newBalance = Math.max(0, debt.balance - amount)
    await supabase.from('debts').update({ balance: newBalance }).eq('id', debtId)
    setShowPayModal(null)
    setPayAmount('')
    load(); refresh()
  }

  async function deleteDebt(id: string) {
    const supabase = createClient()
    await supabase.from('debts').delete().eq('id', id)
    load(); refresh()
  }

  const sorted = [...debts].sort((a, b) =>
    strategy === 'avalanche' ? b.interest_rate - a.interest_rate : a.balance - b.balance
  )

  const totalDebt        = debts.reduce((s, d) => s + d.balance, 0)
  const totalMinPayment  = debts.reduce((s, d) => s + d.minimum_payment, 0)
  const totalWithExtra   = totalMinPayment + extraPayment

  // Overall months to debt-free (cascade: when first debt done, add its payment to next)
  const overallMonths = (() => {
    if (sorted.length === 0) return 0
    let remaining = sorted.map(d => ({ ...d }))
    let rollingExtra = extraPayment
    let maxMonths = 0
    for (let i = 0; i < remaining.length; i++) {
      const d = remaining[i]
      const payment = d.minimum_payment + rollingExtra
      const months = calcMonths(d.balance, d.interest_rate, payment)
      if (!isFinite(months)) return Infinity
      maxMonths = Math.max(maxMonths, months)
      rollingExtra += d.minimum_payment // snowball: freed payment rolls to next
    }
    return maxMonths
  })()

  const totalInterest = sorted.reduce((s, d, i) => {
    const payment = d.minimum_payment + (i === 0 ? extraPayment : 0)
    const interest = totalInterestPaid(d.balance, d.interest_rate, payment)
    return s + (isFinite(interest) ? interest : 0)
  }, 0)

  return (
    <div className="flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title mb-0">Debt Payoff</h1>
          {debts.length > 0 && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
              Debt-free by <span style={{ color: 'var(--green)', fontWeight: 600 }}>{payoffDate(overallMonths)}</span>
              {' '}·{' '}{monthsLabel(overallMonths)} away
            </p>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {autoPayList.filter(ap => ap.enabled).length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: 'var(--nx-pos-50)', border: '1px solid var(--nx-pos-100)', fontSize: 13, color: 'var(--nx-pos-700)', fontWeight: 600 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>
              </svg>
              {autoPayList.filter(ap => ap.enabled).length} auto-pay active
            </div>
          )}
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Debt</button>
        </div>
      </div>

      {debts.length === 0 ? (
        <div className="card text-center py-14">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="font-semibold mb-2">No debts — nice!</h2>
          <p className="text-sm mb-5" style={{ color: 'var(--muted)' }}>Add your debts to build a payoff plan.</p>
          <button className="btn-primary" onClick={() => setShowAddModal(true)}>+ Add Your First Debt</button>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Debt',          value: fmt(totalDebt),           color: 'var(--red)',    sub: `${debts.length} account${debts.length !== 1 ? 's' : ''}` },
              { label: 'Monthly Payment',     value: fmt(totalWithExtra),      color: 'var(--foreground)', sub: `${fmt(totalMinPayment)} minimum` },
              { label: 'Est. Interest',        value: isFinite(totalInterest) ? fmt(totalInterest) : '—', color: 'var(--yellow)', sub: 'total cost' },
              { label: 'Debt-Free Date',      value: payoffDate(overallMonths), color: 'var(--green)', sub: monthsLabel(overallMonths) + ' away' },
            ].map(s => (
              <div key={s.label} className="card">
                <p className="text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{s.label}</p>
                <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{s.sub}</p>
              </div>
            ))}
          </div>

          {/* Strategy + extra payment */}
          <div className="card flex flex-col gap-4">
            <h2 className="font-semibold">Payoff Strategy</h2>
            <div className="flex gap-3">
              {(['avalanche', 'snowball'] as const).map(s => (
                <button key={s} onClick={() => setStrategy(s)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: strategy === s ? 'rgba(91,106,240,0.12)' : 'transparent',
                    color: strategy === s ? 'var(--accent)' : 'var(--muted)',
                    border: `1.5px solid ${strategy === s ? 'rgba(91,106,240,0.35)' : 'var(--border)'}`,
                  }}>
                  {s === 'avalanche' ? '🔥 Avalanche — highest rate first' : '⛄ Snowball — lowest balance first'}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-4">
              <div className="flex-1 max-w-xs">
                <label className="label">Extra monthly payment ($)</label>
                <input className="input" type="number" min="0" value={extraPayment || ''}
                  onChange={e => setExtraPayment(parseFloat(e.target.value) || 0)} placeholder="0" />
              </div>
              {extraPayment > 0 && (
                <div className="flex-1 p-3 rounded-xl text-sm" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  💡 Adding <strong>{fmt(extraPayment)}/mo</strong> extra gets you debt-free <strong style={{ color: 'var(--green)' }}>{monthsLabel(overallMonths)} from now</strong>
                </div>
              )}
            </div>
          </div>

          {/* Debt cards */}
          <div className="flex flex-col gap-3">
            <h2 className="font-semibold">Payoff Order — {strategy === 'avalanche' ? 'Highest Rate First' : 'Lowest Balance First'}</h2>
            {sorted.map((d, i) => {
              const payment  = d.minimum_payment + (i === 0 ? extraPayment : 0)
              const months   = calcMonths(d.balance, d.interest_rate, payment)
              const interest = totalInterestPaid(d.balance, d.interest_rate, payment)
              const pct      = d.balance > 0 ? Math.min(100, (d.balance / (debts.find(x => x.id === d.id)?.balance ?? d.balance)) * 100) : 0
              const isFocus  = i === 0

              return (
                <div key={d.id} className="card" style={{
                  borderColor: isFocus ? 'rgba(91,106,240,0.4)' : 'var(--border)',
                  background: isFocus ? 'rgba(91,106,240,0.03)' : 'var(--surface)',
                }}>
                  {/* Row 1: name + badges + delete */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                        style={{ background: isFocus ? 'rgba(91,106,240,0.12)' : 'var(--background)' }}>
                        {DEBT_ICONS[d.type] ?? '📄'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{d.name}</span>
                          {isFocus && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: 'rgba(91,106,240,0.15)', color: 'var(--accent)' }}>Focus here</span>}
                        </div>
                        <span className="text-xs" style={{ color: 'var(--muted)' }}>
                          {d.type.replace(/_/g, ' ')} · Priority #{i + 1}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteDebt(d.id)} className="text-xs w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ color: 'var(--muted)' }}>✕</button>
                  </div>

                  {/* Row 2: stats grid */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3 text-sm">
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Balance</div>
                      <div className="font-bold" style={{ color: 'var(--red)' }}>{fmt(d.balance)}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Rate</div>
                      <div className="font-bold">{d.interest_rate}%</div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Monthly</div>
                      <div className="font-bold" style={{ color: isFocus && extraPayment > 0 ? 'var(--green)' : undefined }}>{fmt(payment)}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Payoff</div>
                      <div className="font-bold" style={{ color: 'var(--yellow)' }}>{monthsLabel(months)}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-0.5" style={{ color: 'var(--muted)' }}>Debt-Free</div>
                      <div className="font-bold" style={{ color: 'var(--green)' }}>{payoffDate(months)}</div>
                    </div>
                  </div>

                  {/* Interest cost note */}
                  {isFinite(interest) && interest > 0 && (
                    <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>
                      Total interest: <span style={{ color: 'var(--yellow)' }}>{fmtD(interest)}</span>
                    </p>
                  )}

                  {/* Action buttons row */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => { setShowPayModal(d.id); setPayAmount(String(d.minimum_payment)) }}
                      className="btn-secondary text-sm py-2 flex-1 justify-center"
                      style={{ minWidth: 140 }}>
                      💳 Log a Payment
                    </button>
                    {(() => {
                      const ap = autoPayList.find(x => x.debtId === d.id)
                      const applied = debtWasApplied(d.id)
                      if (!ap) {
                        return (
                          <button
                            onClick={() => openAutoPayModal(d)}
                            className="btn-secondary text-sm py-2 justify-center"
                            style={{ minWidth: 160, color: 'var(--muted)' }}>
                            ↺ Set up auto-pay
                          </button>
                        )
                      }
                      return (
                        <div style={{ display: 'flex', gap: 6, flex: 1, minWidth: 240, alignItems: 'center', padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: ap.enabled ? 'rgba(34,197,94,0.05)' : 'var(--background)' }}>
                          <span style={{ flex: 1, fontSize: 13, color: ap.enabled ? 'var(--nx-pos-700, #15803d)' : 'var(--muted)', fontWeight: 500 }}>
                            {ap.enabled ? `↺ ${fmt(ap.amount)}/mo auto-pay` : '⏸ Auto-pay paused'}
                            {applied && ap.enabled && <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--nx-pos-500, #22c55e)', fontWeight: 600 }}>· Applied ✓</span>}
                          </span>
                          {ap.enabled && !applied && (
                            <button
                              onClick={() => applyDebtPaymentNow(d, ap.amount, ap.syncBudget)}
                              style={{ fontSize: 12, padding: '3px 8px', borderRadius: 5, border: '1px solid rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.1)', color: '#15803d', fontWeight: 600, cursor: 'pointer' }}>
                              Pay now
                            </button>
                          )}
                          <button onClick={() => toggleAutoPay(d.id)}
                            style={{ fontSize: 12, padding: '3px 8px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
                            {ap.enabled ? 'Pause' : 'Resume'}
                          </button>
                          <button onClick={() => openAutoPayModal(d)}
                            style={{ fontSize: 12, padding: '3px 6px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
                            ✏️
                          </button>
                          <button onClick={() => removeAutoPay(d.id)}
                            style={{ fontSize: 12, padding: '3px 6px', borderRadius: 5, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--muted)', cursor: 'pointer' }}>
                            ✕
                          </button>
                        </div>
                      )
                    })()}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* ── Add Debt Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowAddModal(false) }}>
          <div className="rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-semibold">Add a Debt</h2>
              <button onClick={() => setShowAddModal(false)} style={{ color: 'var(--muted)' }}>✕</button>
            </div>
            <form onSubmit={addDebt} className="p-5 flex flex-col gap-4">
              <div>
                <label className="label">Debt Name</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Chase Sapphire Card" />
              </div>
              <div>
                <label className="label">Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="credit_card">💳 Credit Card</option>
                  <option value="student_loan">🎓 Student Loan</option>
                  <option value="auto_loan">🚗 Auto Loan</option>
                  <option value="personal_loan">💵 Personal Loan</option>
                  <option value="mortgage">🏠 Mortgage</option>
                  <option value="medical">🏥 Medical</option>
                  <option value="other">📄 Other</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Balance ($)</label>
                  <input className="input" type="number" step="0.01" value={form.balance}
                    onChange={e => setForm(f => ({ ...f, balance: e.target.value }))} required placeholder="5000" />
                </div>
                <div>
                  <label className="label">Interest Rate (%)</label>
                  <input className="input" type="number" step="0.01" value={form.interest_rate}
                    onChange={e => setForm(f => ({ ...f, interest_rate: e.target.value }))} required placeholder="19.99" />
                </div>
              </div>
              <div>
                <label className="label">Minimum Monthly Payment ($)</label>
                <input className="input" type="number" step="0.01" value={form.minimum_payment}
                  onChange={e => setForm(f => ({ ...f, minimum_payment: e.target.value }))} required placeholder="150" />
              </div>
              {form.balance && form.interest_rate && form.minimum_payment && (() => {
                const m = calcMonths(parseFloat(form.balance), parseFloat(form.interest_rate), parseFloat(form.minimum_payment))
                return isFinite(m) ? (
                  <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(91,106,240,0.08)', border: '1px solid rgba(91,106,240,0.2)' }}>
                    📅 At minimum payment: paid off in <strong>{monthsLabel(m)}</strong> ({payoffDate(m)}) ·{' '}
                    <span style={{ color: 'var(--yellow)' }}>{fmtD(totalInterestPaid(parseFloat(form.balance), parseFloat(form.interest_rate), parseFloat(form.minimum_payment)))} in interest</span>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: 'var(--red)' }}>
                    ⚠️ Minimum payment doesn't cover interest — you'll never pay this off. Increase payment.
                  </div>
                )
              })()}
              <button type="submit" className="btn-primary justify-center py-3" disabled={loading}>
                {loading ? 'Saving…' : 'Add Debt'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Log Payment Modal ── */}
      {showPayModal && (() => {
        const debt = debts.find(d => d.id === showPayModal)
        if (!debt) return null
        const amount = parseFloat(payAmount) || 0
        const newBalance = Math.max(0, debt.balance - amount)
        const principalPaid = Math.max(0, amount - (debt.balance * debt.interest_rate / 100 / 12))
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={e => { if (e.target === e.currentTarget) { setShowPayModal(null); setPayAmount('') } }}>
            <div className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <h2 className="font-semibold">Log Payment — {debt.name}</h2>
                <button onClick={() => { setShowPayModal(null); setPayAmount('') }} style={{ color: 'var(--muted)' }}>✕</button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="label">Payment Amount ($)</label>
                  <input className="input text-lg font-bold" type="number" step="0.01" value={payAmount}
                    onChange={e => setPayAmount(e.target.value)} autoFocus placeholder={String(debt.minimum_payment)} />
                </div>

                {amount > 0 && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Current balance</span>
                      <span className="font-semibold" style={{ color: 'var(--red)' }}>{fmtD(debt.balance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Interest portion</span>
                      <span style={{ color: 'var(--yellow)' }}>{fmtD(Math.min(amount, debt.balance * debt.interest_rate / 100 / 12))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: 'var(--muted)' }}>Principal paid</span>
                      <span style={{ color: 'var(--green)' }}>{fmtD(Math.max(0, principalPaid))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2" style={{ borderColor: 'var(--border)' }}>
                      <span className="font-semibold">New balance</span>
                      <span className="font-bold" style={{ color: newBalance === 0 ? 'var(--green)' : 'var(--red)' }}>
                        {newBalance === 0 ? '🎉 PAID OFF!' : fmtD(newBalance)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={() => { setShowPayModal(null); setPayAmount('') }}
                    className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button onClick={() => logPayment(debt.id)} disabled={!amount || amount <= 0}
                    className="btn-primary flex-1 justify-center">
                    ✓ Confirm Payment
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Auto-Pay Modal ── */}
      {showAutoPayModal && (() => {
        const debt = debts.find(d => d.id === showAutoPayModal)
        if (!debt) return null
        const isEdit = autoPayList.some(ap => ap.debtId === showAutoPayModal)
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}
            onClick={e => { if (e.target === e.currentTarget) setShowAutoPayModal(null) }}>
            <div className="rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <h2 className="font-semibold">{isEdit ? 'Edit Auto-Pay' : 'Set Up Auto-Pay'}</h2>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{debt.name}</p>
                </div>
                <button onClick={() => setShowAutoPayModal(null)} style={{ color: 'var(--muted)' }}>✕</button>
              </div>
              <div className="p-5 flex flex-col gap-4">
                <div>
                  <label className="label">Monthly Payment Amount ($)</label>
                  <input className="input text-lg font-bold" type="number" step="0.01" min="1"
                    value={autoPayForm.amount}
                    onChange={e => setAutoPayForm(f => ({ ...f, amount: e.target.value }))}
                    autoFocus placeholder={String(debt.minimum_payment)} />
                  <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
                    Minimum payment: <strong>{fmt(debt.minimum_payment)}</strong>
                  </p>
                </div>

                {/* Sync to budget toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--background)' }}>
                  <div
                    onClick={() => setAutoPayForm(f => ({ ...f, syncBudget: !f.syncBudget }))}
                    style={{
                      width: 38, height: 22, borderRadius: 11, position: 'relative', cursor: 'pointer', flexShrink: 0,
                      background: autoPayForm.syncBudget ? 'var(--accent)' : 'var(--border)',
                      transition: 'background 0.15s',
                    }}>
                    <div style={{
                      position: 'absolute', top: 3, left: autoPayForm.syncBudget ? 19 : 3,
                      width: 16, height: 16, borderRadius: '50%', background: '#fff',
                      transition: 'left 0.15s',
                    }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium">Sync to Budget Tracker</div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>Log each payment as a budget expense automatically</div>
                  </div>
                </label>

                {/* Preview */}
                {autoPayForm.amount && parseFloat(autoPayForm.amount) > 0 && (() => {
                  const amt = parseFloat(autoPayForm.amount)
                  const m = calcMonths(debt.balance, debt.interest_rate, amt)
                  return (
                    <div className="p-3 rounded-xl text-sm" style={{ background: 'rgba(91,106,240,0.06)', border: '1px solid rgba(91,106,240,0.15)' }}>
                      {isFinite(m)
                        ? <>📅 At <strong>{fmt(amt)}/mo</strong> — paid off in <strong style={{ color: 'var(--accent)' }}>{monthsLabel(m)}</strong> ({payoffDate(m)})</>
                        : <span style={{ color: 'var(--red)' }}>⚠️ Payment too low to cover interest</span>
                      }
                    </div>
                  )
                })()}

                <div className="flex gap-2">
                  <button onClick={() => setShowAutoPayModal(null)} className="btn-secondary flex-1 justify-center">Cancel</button>
                  <button
                    onClick={saveAutoPaySetting}
                    disabled={!autoPayForm.amount || parseFloat(autoPayForm.amount) <= 0}
                    className="btn-primary flex-1 justify-center">
                    {isEdit ? '✓ Save Changes' : '↺ Enable Auto-Pay'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
