'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const fmt = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const fmtD = (n: number) => n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

// 2024 tax brackets (single)
const SINGLE_BRACKETS = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
]

const MFJ_BRACKETS = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
]

function calcTax(income: number, filingStatus: string): { tax: number; effectiveRate: number; marginalRate: number } {
  const brackets = filingStatus === 'married_filing_jointly' ? MFJ_BRACKETS : SINGLE_BRACKETS
  const standardDeduction = filingStatus === 'married_filing_jointly' ? 29200 : 14600
  const taxableIncome = Math.max(0, income - standardDeduction)
  let tax = 0
  let marginalRate = 0
  for (const b of brackets) {
    if (taxableIncome > b.min) {
      const taxable = Math.min(taxableIncome, b.max) - b.min
      tax += taxable * b.rate
      marginalRate = b.rate
    }
  }
  return { tax, effectiveRate: income > 0 ? tax / income : 0, marginalRate }
}

// Long-term capital gains rates (2024)
function ltcgRate(income: number, filingStatus: string): number {
  if (filingStatus === 'married_filing_jointly') {
    if (income <= 94050) return 0
    if (income <= 583750) return 0.15
    return 0.20
  }
  if (income <= 47025) return 0
  if (income <= 518900) return 0.15
  return 0.20
}

export default function TaxPage() {
  const [profile, setProfile] = useState<{ annual_income: number; tax_filing_status: string } | null>(null)
  const [holdings, setHoldings] = useState<{ ticker: string; shares: number; avg_cost_basis: number; account_type: string }[]>([])
  const [customIncome, setCustomIncome] = useState('')
  const [realizedGains, setRealizedGains] = useState({ shortTerm: '', longTerm: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [{ data: p }, { data: h }] = await Promise.all([
        supabase.from('profiles').select('annual_income, tax_filing_status').eq('id', user.id).single(),
        supabase.from('holdings').select('*').eq('user_id', user.id).eq('account_type', 'taxable'),
      ])
      setProfile(p)
      setHoldings(h ?? [])
      if (p?.annual_income) setCustomIncome(String(p.annual_income))
    }
    load()
  }, [])

  const income = parseFloat(customIncome) || profile?.annual_income || 0
  const filingStatus = profile?.tax_filing_status ?? 'single'
  const { tax, effectiveRate, marginalRate } = calcTax(income, filingStatus)
  const ltcg = ltcgRate(income, filingStatus)

  const stGains = parseFloat(realizedGains.shortTerm) || 0
  const ltGains = parseFloat(realizedGains.longTerm) || 0

  const stTax = stGains * marginalRate // ST gains taxed as ordinary income
  const ltTax = ltGains * ltcg
  const totalCapGainsTax = stTax + ltTax

  // Quarterly estimated tax (if self-employed or significant cap gains)
  const totalTaxEstimate = tax + totalCapGainsTax
  const quarterlyPayment = totalTaxEstimate / 4

  // Retirement contribution room
  const k401Max = 23000
  const iraMax = 7000
  const hsaMax = 4150

  const standardDeduction = filingStatus === 'married_filing_jointly' ? 29200 : 14600
  const taxableIncome = Math.max(0, income - standardDeduction)

  // Tax-loss harvesting opportunities from taxable holdings
  const tlhCandidates = holdings.filter(h => {
    // We don't have live prices, so flag holdings where user might want to check
    return h.account_type === 'taxable'
  })

  return (
    <div>
      <h1 className="page-title">Tax Assistant</h1>
      <p className="text-sm mb-6 -mt-4" style={{ color: 'var(--muted)' }}>
        Estimated figures based on 2024 federal tax brackets. State taxes not included. Not tax advice — consult a CPA.
      </p>

      {/* Income Input */}
      <div className="card mb-6">
        <h2 className="font-semibold mb-4">Your Tax Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">Annual Gross Income ($)</label>
            <input className="input" type="number" value={customIncome} onChange={e => setCustomIncome(e.target.value)} placeholder={String(profile?.annual_income ?? 75000)} />
          </div>
          <div>
            <label className="label">Filing Status</label>
            <div className="input flex items-center" style={{ opacity: 0.7, cursor: 'not-allowed' }}>
              {filingStatus.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>(update in Profile)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Est. Federal Tax', value: fmt(tax), color: 'var(--red)' },
          { label: 'Effective Rate', value: `${(effectiveRate * 100).toFixed(1)}%`, color: 'var(--yellow)' },
          { label: 'Marginal Rate', value: `${(marginalRate * 100).toFixed(0)}%`, color: 'var(--yellow)' },
          { label: 'LT Cap Gains Rate', value: `${(ltcg * 100).toFixed(0)}%`, color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{s.label}</div>
            <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Capital Gains Tracker */}
        <div className="card">
          <h2 className="font-semibold mb-4">Capital Gains Tracker</h2>
          <div className="flex flex-col gap-4">
            <div>
              <label className="label">Realized Short-Term Gains YTD ($) <span style={{ color: 'var(--muted)' }}>— taxed as ordinary income</span></label>
              <input className="input" type="number" value={realizedGains.shortTerm} onChange={e => setRealizedGains(r => ({ ...r, shortTerm: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <label className="label">Realized Long-Term Gains YTD ($) <span style={{ color: 'var(--muted)' }}>— held 1+ year</span></label>
              <input className="input" type="number" value={realizedGains.longTerm} onChange={e => setRealizedGains(r => ({ ...r, longTerm: e.target.value }))} placeholder="0" />
            </div>

            {(stGains > 0 || ltGains > 0) && (
              <div className="p-3 rounded-lg text-sm flex flex-col gap-1" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                {stGains > 0 && <div className="flex justify-between"><span>Short-term gains tax ({(marginalRate * 100).toFixed(0)}%)</span><span style={{ color: 'var(--red)' }}>{fmtD(stTax)}</span></div>}
                {ltGains > 0 && <div className="flex justify-between"><span>Long-term gains tax ({(ltcg * 100).toFixed(0)}%)</span><span style={{ color: 'var(--yellow)' }}>{fmtD(ltTax)}</span></div>}
                <div className="flex justify-between font-bold pt-1" style={{ borderTop: '1px solid var(--border)' }}>
                  <span>Total cap gains tax</span><span style={{ color: 'var(--red)' }}>{fmtD(totalCapGainsTax)}</span>
                </div>
              </div>
            )}

            {quarterlyPayment > 0 && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                ⏰ <strong>Quarterly estimated tax:</strong>{' '}
                <span style={{ color: 'var(--yellow)' }}>{fmt(quarterlyPayment)}</span> per quarter
                <div className="mt-1" style={{ color: 'var(--muted)' }}>Due: Apr 15 · Jun 17 · Sep 16 · Jan 15</div>
              </div>
            )}
          </div>
        </div>

        {/* Contribution Room */}
        <div className="card">
          <h2 className="font-semibold mb-4">2024 Tax-Advantaged Contribution Room</h2>
          <div className="flex flex-col gap-4">
            {[
              { label: '401(k) / 403(b)', max: k401Max, note: '+$7,500 if age 50+', color: '#6366f1' },
              { label: 'IRA (Traditional or Roth)', max: iraMax, note: '+$1,000 if age 50+', color: '#3b82f6' },
              { label: 'HSA (if on HDHP)', max: hsaMax, note: 'Family: $8,300', color: '#22c55e' },
            ].map(a => (
              <div key={a.label} className="p-3 rounded-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-sm">{a.label}</span>
                  <span className="font-bold text-sm" style={{ color: a.color }}>{fmt(a.max)}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>{a.note}</div>
              </div>
            ))}

            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
              💡 Max all accounts = <strong style={{ color: 'var(--green)' }}>{fmt(k401Max + iraMax + hsaMax)}</strong> in tax-advantaged savings per year.
              At your {(marginalRate * 100).toFixed(0)}% bracket, that saves up to{' '}
              <strong style={{ color: 'var(--green)' }}>{fmt((k401Max + iraMax + hsaMax) * marginalRate)}</strong> in taxes.
            </div>
          </div>
        </div>

        {/* Tax-Loss Harvesting */}
        <div className="card">
          <h2 className="font-semibold mb-1">Tax-Loss Harvesting</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--foreground-secondary)' }}>
            Sell losing positions to offset gains and reduce your tax bill — then immediately buy a similar fund to stay invested.
          </p>
          {tlhCandidates.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Add taxable holdings in Portfolio to see your positions here.</p>
          ) : (
            <div className="flex flex-col gap-2 mb-4">
              {tlhCandidates.map(h => (
                <div key={h.ticker} className="p-3 rounded-xl text-sm" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="flex justify-between mb-1">
                    <span className="font-semibold">{h.ticker}</span>
                    <span className="font-semibold">{fmt(h.shares * h.avg_cost_basis)} total basis</span>
                  </div>
                  <div className="flex justify-between" style={{ color: 'var(--foreground-secondary)' }}>
                    <span>{h.shares} shares · cost {fmtD(h.avg_cost_basis)}/sh</span>
                    <span>Check live price in Portfolio →</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="p-4 rounded-xl text-sm flex flex-col gap-2" style={{ background: 'var(--accent-light)', border: '1px solid rgba(91,106,240,0.2)' }}>
            <div className="font-semibold" style={{ color: 'var(--accent)' }}>How it works — 3 steps</div>
            <div style={{ color: 'var(--foreground-secondary)' }}>
              <strong>1. Find a loser</strong> — Look for taxable positions where current price is below your cost basis.<br />
              <strong>2. Sell &amp; replace</strong> — Sell it, then immediately buy a similar fund (e.g. sell SPY → buy IVV). Wait 30+ days before buying the original back.<br />
              <strong>3. Claim the loss</strong> — Report on your taxes. Losses offset gains first, then up to $3,000 of ordinary income. Excess carries forward.<br />
              <span className="text-xs mt-1 block" style={{ color: 'var(--muted)' }}>At your {(marginalRate * 100).toFixed(0)}% bracket: a $10,000 harvested loss saves ~<strong>{fmt(10000 * marginalRate)}</strong></span>
            </div>
          </div>
        </div>

        {/* Where to file */}
        <div className="card">
          <h2 className="font-semibold mb-4">Where to File & Get Help</h2>
          <div className="flex flex-col gap-3">
            {[
              { name: 'TurboTax', url: 'turbotax.intuit.com', desc: 'Best for most people. Step-by-step guidance, imports W-2s and 1099s automatically.', badge: 'Most Popular', color: 'var(--accent)' },
              { name: 'H&R Block', url: 'hrblock.com', desc: 'Great online or in-person. Strong for complex situations like self-employment or rental income.', badge: 'In-Person Option', color: 'var(--green)' },
              { name: 'FreeTaxUSA', url: 'freetaxusa.com', desc: 'Free federal filing, ~$15 state. Great value for straightforward returns.', badge: 'Best Value', color: 'var(--yellow)' },
              { name: 'IRS Free File', url: 'irs.gov/freefile', desc: 'Completely free if income under $79,000. Powered by TurboTax or H&R Block depending on eligibility.', badge: 'Free', color: 'var(--mint-text)' },
              { name: 'Find a CPA', url: 'cpaverify.org', desc: 'Best for self-employed, rental properties, stock options, or significant life changes. Worth the cost.', badge: 'Complex Situations', color: '#8b5cf6' },
            ].map(s => (
              <div key={s.name} className="p-3 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm">{s.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,0,0,0.06)', color: s.color }}>{s.badge}</span>
                </div>
                <p className="text-xs" style={{ color: 'var(--foreground-secondary)' }}>{s.desc}</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{s.url}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tax Timeline */}
        <div className="card">
          <h2 className="font-semibold mb-4">2025 Tax Calendar</h2>
          <div className="flex flex-col gap-3">
            {[
              { date: 'Jan 15, 2025', label: 'Q4 2024 estimated tax due' },
              { date: 'Apr 15, 2025', label: '2024 return due · Q1 estimated tax due · IRA contribution deadline' },
              { date: 'Jun 16, 2025', label: 'Q2 estimated tax due' },
              { date: 'Sep 15, 2025', label: 'Q3 estimated tax due' },
              { date: 'Oct 15, 2025', label: 'Extended return deadline' },
              { date: 'Dec 31, 2025', label: 'Last day for 401(k) contributions · TLH deadline' },
            ].map(e => (
              <div key={e.date} className="flex gap-3 text-sm py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-semibold text-xs whitespace-nowrap" style={{ color: 'var(--accent)', minWidth: 110 }}>{e.date}</span>
                <span style={{ color: 'var(--foreground-secondary)' }}>{e.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--muted)' }}>
        Tax estimates use 2024 federal brackets. Does not include state tax, FICA, or AMT. Always consult a licensed CPA for your actual tax situation.
      </p>
    </div>
  )
}
