'use client'
/**
 * Shared Tally UI pieces used by BOTH the desktop and phone shells.
 *
 * Kept here rather than duplicated into each shell: these are the parts that
 * carry product meaning (recording money, hitting a plan limit), and two
 * drifting copies of a paywall is how a free tier quietly becomes unlimited.
 */
import { useRef, useState } from 'react'
import Link from 'next/link'
import { MONO, css as c, sx } from './lib'
import type { TallyModel } from './model'
import { PLANS, type Tier } from '@/lib/tally/tiers'

const mono = (x: string) => sx(c(x), { fontFamily: MONO })

const INK = '#14140f'
const GREEN = '#1c6a48'
const LIME = '#cdf06a'
const MUTED = '#6b6a60'
const LINE = '#e0ded4'

const field = c(
  "font-family:'IBM Plex Sans',sans-serif;font-size:15px;padding:11px 13px;border:1px solid #d6d3c8;border-radius:11px;background:#ffffff;color:#14140f;outline:none;width:100%",
)
const label = mono(
  'font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:#6b6a60;margin-bottom:6px;display:block',
)

/* ─────────────────────── Add a transaction ─────────────────────── */

/**
 * The verb Tally was missing. Without this the app could only ever describe a
 * budget it had been handed, never one you actually kept.
 */
export function AddTransaction({ m, compact = false }: { m: TallyModel; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [bucketId, setBucketId] = useState<string>('')
  const [income, setIncome] = useState(false)
  const [date, setDate] = useState(m.todayIso)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setName('')
    setAmount('')
    setIncome(false)
    setDate(m.todayIso)
    setError('')
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const res = m.addTxn({
      name,
      amount: Number(amount),
      bucketId: bucketId || null,
      date,
      income,
    })
    if (!res.ok) {
      setError(res.error ?? 'Could not add that.')
      return
    }
    setFlash(`Added ${name}`)
    reset()
    nameRef.current?.focus()
    window.setTimeout(() => setFlash(''), 2200)
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          window.setTimeout(() => nameRef.current?.focus(), 30)
        }}
        style={sx(
          c(
            "font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;min-height:48px;padding:0 22px;border-radius:13px;border:1px dashed #bdb9ab;background:transparent;color:#14140f;cursor:pointer;width:100%;display:flex;align-items:center;justify-content:center;gap:9px",
          ),
          {},
        )}
      >
        <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>
          +
        </span>
        Add a transaction
      </button>
    )
  }

  return (
    <form
      onSubmit={submit}
      style={c(
        `background:#ffffff;border:1px solid ${LINE};border-radius:${compact ? '18px' : '22px'};padding:${compact ? '18px' : '24px 26px'}`,
      )}
    >
      <div style={c('display:flex;justify-content:space-between;align-items:center;margin-bottom:16px')}>
        <strong style={c('font-size:16px')}>New transaction</strong>
        <button
          type="button"
          onClick={() => {
            setOpen(false)
            reset()
          }}
          style={c(`font-size:13px;font-weight:600;color:${MUTED};background:none;border:none;cursor:pointer;padding:4px`)}
        >
          Cancel
        </button>
      </div>

      {/* money in / money out */}
      <div style={c('display:flex;gap:6px;margin-bottom:14px')}>
        {[
          { lbl: 'Money out', val: false },
          { lbl: 'Money in', val: true },
        ].map((o) => (
          <button
            key={o.lbl}
            type="button"
            onClick={() => setIncome(o.val)}
            aria-pressed={income === o.val}
            style={c(
              `flex:1;font-family:'IBM Plex Sans',sans-serif;font-size:13px;font-weight:600;min-height:40px;border-radius:10px;cursor:pointer;border:1px solid ${income === o.val ? INK : '#ddd9cc'};background:${income === o.val ? INK : 'transparent'};color:${income === o.val ? '#f5f4ef' : MUTED}`,
            )}
          >
            {o.lbl}
          </button>
        ))}
      </div>

      <div style={c(compact ? 'display:flex;flex-direction:column;gap:12px' : 'display:grid;grid-template-columns:1.6fr 1fr;gap:12px')}>
        <div>
          <label style={label} htmlFor="txn-name">
            What was it
          </label>
          <input
            id="txn-name"
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Blue Line Coffee"
            maxLength={120}
            style={field}
          />
        </div>
        <div>
          <label style={label} htmlFor="txn-amount">
            Amount
          </label>
          <input
            id="txn-amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="5.40"
            style={field}
          />
        </div>
      </div>

      <div style={c(`${compact ? 'display:flex;flex-direction:column;gap:12px' : 'display:grid;grid-template-columns:1fr 1fr;gap:12px'};margin-top:12px`)}>
        {!income && (
          <div>
            <label style={label} htmlFor="txn-bucket">
              Bucket
            </label>
            <select
              id="txn-bucket"
              value={bucketId}
              onChange={(e) => setBucketId(e.target.value)}
              style={field}
            >
              <option value="">Let Tally guess</option>
              {m.bucketOptions.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label style={label} htmlFor="txn-date">
            Date
          </label>
          <input
            id="txn-date"
            type="date"
            value={date}
            max={m.todayIso}
            onChange={(e) => setDate(e.target.value)}
            style={field}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={c('font-size:13px;line-height:1.5;color:#b8422a;background:#fbeae6;border:1px solid #e7c3ba;border-radius:10px;padding:9px 11px;margin-top:13px')}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        style={c(
          `font-family:'IBM Plex Sans',sans-serif;font-size:15px;font-weight:600;min-height:46px;padding:0 20px;border-radius:12px;border:none;background:${GREEN};color:#f7fbf6;cursor:pointer;width:100%;margin-top:16px`,
        )}
      >
        Add it
      </button>

      <div aria-live="polite" style={mono(`font-size:11px;color:${GREEN};text-align:center;min-height:16px;margin-top:9px`)}>
        {flash}
      </div>
    </form>
  )
}

/* ─────────────────────── CSV import ─────────────────────── */

export function ImportCsv({ m }: { m: TallyModel }) {
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  if (!m.ent.csvImport) {
    return (
      <UpgradeNote
        m={m}
        need="starter"
        text="Import a bank CSV instead of typing every row."
      />
    )
  }

  const onFile = async (file: File | undefined) => {
    if (!file) return
    if (file.size > 2_000_000) {
      setErr(true)
      setMsg('That file is over 2MB — split it first.')
      return
    }
    const text = await file.text()
    const res = m.importCsv(text)
    setErr(!res.ok)
    setMsg(res.ok ? `Imported ${res.added} transaction${res.added === 1 ? '' : 's'}.` : (res.error ?? 'Import failed.'))
    if (input.current) input.current.value = ''
  }

  return (
    <div style={c(`background:#ffffff;border:1px solid ${LINE};border-radius:18px;padding:18px 20px`)}>
      <div style={c('display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap')}>
        <div>
          <strong style={c('font-size:15px')}>Import from your bank</strong>
          <div style={c(`font-size:13px;color:${MUTED};margin-top:3px`)}>
            Any CSV export with a description, an amount and a date.
          </div>
        </div>
        <label
          style={c(
            `font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:42px;padding:0 18px;border-radius:11px;border:1px solid ${INK};background:transparent;color:${INK};cursor:pointer;display:inline-flex;align-items:center`,
          )}
        >
          Choose file
          <input
            ref={input}
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => onFile(e.target.files?.[0])}
            style={{ display: 'none' }}
          />
        </label>
      </div>
      {msg && (
        <div
          aria-live="polite"
          style={mono(`font-size:12px;margin-top:11px;color:${err ? '#b8422a' : GREEN}`)}
        >
          {msg}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────── Paywall ─────────────────────── */

/**
 * Shown where a feature would be. Names the plan that unlocks it and what it
 * costs — a lock with no price is just a dead end.
 */
export function UpgradeNote({
  m,
  need,
  text,
}: {
  m: TallyModel
  need: Tier
  text: string
}) {
  const plan = PLANS.find((p) => p.tier === need)
  if (!plan) return null
  return (
    <div
      style={c(
        `background:#faf9f4;border:1px dashed #cfcbbd;border-radius:18px;padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap`,
      )}
    >
      <div>
        <div style={mono(`font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};margin-bottom:5px`)}>
          {plan.name} · ${plan.priceMonthly}/mo
        </div>
        <div style={c('font-size:14px;line-height:1.5;color:#4a4941;max-width:46ch')}>{text}</div>
      </div>
      <button
        type="button"
        onClick={() => m.setTier(need)}
        style={c(
          `font-family:'IBM Plex Sans',sans-serif;font-size:14px;font-weight:600;min-height:42px;padding:0 18px;border-radius:11px;border:none;background:${INK};color:#f5f4ef;cursor:pointer;flex:none`,
        )}
      >
        Try {plan.name}
      </button>
    </div>
  )
}

/* ─────────────────────── Plan switcher ─────────────────────── */

/**
 * Demo-only. Lets a visitor feel each tier rather than read a feature table —
 * drop to Free and watch buckets lock and history disappear.
 *
 * In account mode the server owns the tier, so this is not rendered.
 */
export function PlanSwitcher({ m }: { m: TallyModel }) {
  return (
    <div
      style={c(
        `background:#ffffff;border:1px solid ${LINE};border-radius:18px;padding:16px 18px;display:flex;align-items:center;gap:14px;flex-wrap:wrap`,
      )}
    >
      <div style={c('flex:1;min-width:190px')}>
        <div style={mono(`font-size:10px;letter-spacing:0.1em;text-transform:uppercase;color:${MUTED};margin-bottom:4px`)}>
          Demo · try any plan
        </div>
        <div style={c(`font-size:13px;line-height:1.45;color:#4a4941`)}>
          You‘re on <strong>{m.planName}</strong>
          {m.planPrice > 0 ? ` · $${m.planPrice}/mo` : ' · free'}. {m.historyNote}.
        </div>
      </div>
      <div style={c('display:flex;gap:5px;flex-wrap:wrap')}>
        {PLANS.map((p) => {
          const on = p.tier === m.tier
          return (
            <button
              key={p.tier}
              type="button"
              onClick={() => m.setTier(p.tier)}
              aria-pressed={on}
              style={c(
                `font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.05em;text-transform:uppercase;padding:8px 12px;border-radius:999px;cursor:pointer;border:1px solid ${on ? GREEN : '#ddd9cc'};background:${on ? GREEN : 'transparent'};color:${on ? '#f7fbf6' : MUTED}`,
              )}
            >
              {p.name}
            </button>
          )
        })}
      </div>
      <Link
        href="/tally/pricing"
        style={c(`font-size:13px;font-weight:600;color:${GREEN};text-decoration:none;flex:none`)}
      >
        Compare plans →
      </Link>
    </div>
  )
}

/* ─────────────────────── Locked-history strip ─────────────────────── */

export function HiddenHistory({ m }: { m: TallyModel }) {
  if (!m.hiddenByPlan) return null
  return (
    <UpgradeNote
      m={m}
      need={m.tier === 'free' ? 'starter' : 'plus'}
      text={`${m.hiddenByPlan} older transaction${m.hiddenByPlan === 1 ? ' is' : 's are'} hidden on ${m.planName}. They're kept, not deleted.`}
    />
  )
}

/** Small lime chip used to mark demo data. */
export function DemoChip() {
  return (
    <span
      style={mono(
        `font-size:10px;letter-spacing:0.08em;text-transform:uppercase;padding:4px 9px;border-radius:999px;background:${LIME};color:${INK}`,
      )}
    >
      Demo
    </span>
  )
}
