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

  const [showTax101, setShowTax101] = useState(true)
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  const tax101Cards = [
    {
      id: 'w2',
      emoji: '📄',
      title: 'What is a W-2?',
      short: 'The form your employer sends you every January showing how much you earned and how much tax was withheld.',
      detail: `Your employer sends you a W-2 by January 31st each year. It shows:\n\n• Box 1: Your total wages (what you actually earned)\n• Box 2: Federal income tax your employer withheld from your paychecks\n• Boxes 3-6: Social Security & Medicare taxes (called FICA)\n\nYou use this form when filing your tax return. If you had multiple jobs, you get a W-2 from each one. Keep this safe — it's important!`,
    },
    {
      id: 'fica',
      emoji: '💸',
      title: 'What is FICA?',
      short: 'Taxes automatically taken from every paycheck for Social Security (6.2%) and Medicare (1.45%). Your employer matches it.',
      detail: `FICA stands for Federal Insurance Contributions Act. It's automatically deducted from every paycheck, no matter what.\n\n• Social Security tax: 6.2% of your wages (up to $168,600/year)\n• Medicare tax: 1.45% of your wages (no limit)\n• Total: 7.65% of every paycheck\n\nHere's the thing: your employer also pays another 7.65% on top of that — so the total is 15.3%. FICA pays for Social Security and Medicare programs that you'll benefit from later in life.\n\nIf you're self-employed (freelance, side hustle), you pay both the employee AND employer share — that's why self-employment tax is 15.3%.`,
    },
    {
      id: 'brackets',
      emoji: '📊',
      title: 'How Tax Brackets Work',
      short: 'You only pay higher rates on the money ABOVE each threshold — not on everything you earn. Most teens pay 10% or 12%.',
      detail: `Tax brackets work like steps — you only pay each rate on the income in that range, not on all your income.\n\nExample: If you earn $20,000:\n• First $14,600: $0 tax (standard deduction for 2024)\n• Next $5,400 taxed at 10% = $540\n• Total tax owed: $540 — that's an effective rate of 2.7%!\n\nMost teens and young adults earning under $47,150 are in the 10-12% bracket. That's actually great news because Roth IRA contributions are taxed at this low rate now, then grow completely tax-free.`,
    },
    {
      id: 'file',
      emoji: '🗂️',
      title: 'Do I Need to File Taxes?',
      short: 'If you earned more than $14,600 (2024), yes. If less, you might still want to — you could get a refund!',
      detail: `You MUST file if you earned more than:\n• $14,600 as a single filer (the standard deduction)\n• Any amount if you're self-employed and made $400+\n\nYou SHOULD file even if you earned less because:\n• If your employer withheld federal tax (check Box 2 on your W-2), you'll get it back as a refund\n• To claim the Earned Income Tax Credit if eligible\n• To build a tax history (helpful later for loans, apartments, etc.)\n\nHow to file for FREE:\n• IRS Free File (income under $79,000): irs.gov/freefile\n• FreeTaxUSA — free federal, small fee for state\n• Tax help at your school's VITA (Volunteer Income Tax Assistance) program`,
    },
    {
      id: 'roth',
      emoji: '🏦',
      title: 'Roth IRA: The Teen Superpower',
      short: 'Invest after-tax dollars now at your low tax rate. Then never pay tax on that money again — even if it grows to $1M.',
      detail: `A Roth IRA is the single best financial tool available to teenagers. Here's why:\n\n• You contribute money you've already paid tax on\n• It grows completely tax-free\n• You withdraw it tax-free in retirement — even the growth!\n\nThe math is incredible: $1,000 invested at 17 in a Roth IRA could be worth $20,000+ at 65 — and you'd owe $0 in taxes on any of that growth.\n\nRules to know:\n• You must have earned income (job, freelance, etc.)\n• Max contribution: $7,000/year (or your total earned income, whichever is less)\n• Your parent or guardian can open a "custodial Roth IRA" for you\n• Best places to open one: Fidelity or Charles Schwab (no minimums)\n\nBottom line: If you have any job income at all, open a Roth IRA and invest every dollar you can.`,
    },
    {
      id: '1099',
      emoji: '🧾',
      title: 'What is a 1099?',
      short: 'If you freelance, babysit, do odd jobs, or sell stuff online, you might get a 1099 instead of a W-2.',
      detail: `A 1099 is used when you're paid as an independent contractor (not an employee).\n\nCommon situations for teens:\n• Freelance work (design, tutoring, coding)\n• Babysitting, lawn mowing, odd jobs\n• Selling on Etsy, eBay, or other platforms\n• Gig apps (if you earn enough)\n\nKey difference from W-2:\n• No employer withholds taxes for you\n• You owe self-employment tax (15.3%) PLUS income tax\n• If you earned $400+ from freelance work, you must file a tax return\n\nPro tip: Set aside about 25-30% of every freelance payment for taxes. And keep records of any expenses (equipment, supplies) — they reduce your taxable income.`,
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div className="eyebrow" style={{ marginBottom: 8 }}>Tax year 2026</div>
        <h1 className="page-title" style={{ marginBottom: 4 }}>Tax 101 + Assistant</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Estimated figures based on 2024 federal tax brackets. State taxes not included. Not tax advice — consult a CPA.
        </p>
      </div>

      {/* Tax 101 Intro */}
      <div className="card mb-6" style={{ border: '1px solid var(--nx-gold-200)', background: 'var(--nx-gold-50)' }}>
        <button
          onClick={() => setShowTax101(v => !v)}
          style={{
            width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>🧾</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--nx-navy-900)' }}>Tax 101 — Start Here</div>
              <div style={{ fontSize: 13, color: 'var(--nx-gold-700)' }}>Everything you need to know about taxes as a teen or young adult</div>
            </div>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-700)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: showTax101 ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {showTax101 && (
          <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {tax101Cards.map(card => (
              <div
                key={card.id}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10,
                  overflow: 'hidden', cursor: 'pointer',
                }}
                onClick={() => setExpandedCard(expandedCard === card.id ? null : card.id)}
              >
                <div style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 20, flexShrink: 0, marginTop: 1 }}>{card.emoji}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--foreground)', marginBottom: 4 }}>{card.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{card.short}</div>
                    </div>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: expandedCard === card.id ? 'rotate(180deg)' : 'none', transition: 'transform 200ms', flexShrink: 0, marginTop: 4 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                {expandedCard === card.id && (
                  <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)' }}>
                    <div style={{ paddingTop: 14, fontSize: 13, color: 'var(--foreground)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                      {card.detail}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Free filing resources */}
            <div style={{ background: 'var(--nx-navy-800)', borderRadius: 10, padding: '14px 16px', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--nx-gold-400)', marginBottom: 10 }}>📎 Free Filing Resources</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { name: 'IRS Free File', url: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free', desc: 'Official IRS program — free if income < $79K' },
                  { name: 'FreeTaxUSA', url: 'https://www.freetaxusa.com', desc: 'Free federal return, low-cost state' },
                  { name: 'VITA Program', url: 'https://www.irs.gov/vita', desc: 'Free tax prep help from IRS-certified volunteers' },
                  { name: 'Cash App Taxes', url: 'https://cash.app/taxes', desc: 'Completely free, even state returns' },
                ].map(r => (
                  <a
                    key={r.name}
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    style={{
                      display: 'flex', flexDirection: 'column', flex: '1 1 180px',
                      padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.06)', border: '1px solid var(--nx-navy-700)',
                      textDecoration: 'none',
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-cream-50)', marginBottom: 3 }}>{r.name} ↗</span>
                    <span style={{ fontSize: 11, color: 'var(--nx-navy-400)', lineHeight: 1.4 }}>{r.desc}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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

      {/* Tax Summary — simplified for teens */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Est. Federal Tax', value: fmt(tax), color: 'var(--nx-neg-500)', note: 'for the year' },
          { label: 'Effective Rate', value: `${(effectiveRate * 100).toFixed(1)}%`, color: 'var(--nx-warn-500)', note: 'of your total income' },
          { label: 'Tax Bracket', value: `${(marginalRate * 100).toFixed(0)}%`, color: 'var(--nx-navy-700)', note: 'on income above threshold' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '18px 20px' }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>{s.label}</div>
            <div className="num-display" style={{ fontSize: 28, lineHeight: 1, color: s.color, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>{s.note}</div>
          </div>
        ))}
      </div>

      {/* What does this mean — plain English */}
      {income > 0 && (
        <div className="card mb-6" style={{ background: 'var(--nx-navy-800)', border: '1px solid var(--nx-navy-700)' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-gold-400)', marginBottom: 10 }}>
            What this means for you
          </div>
          <p style={{ fontSize: 14, color: 'var(--nx-navy-200)', lineHeight: 1.7, margin: 0 }}>
            On <strong style={{ color: 'var(--nx-cream-50)' }}>{fmt(income)}/year</strong> of income, you&apos;re estimated to owe{' '}
            <strong style={{ color: 'var(--nx-neg-400)' }}>{fmt(tax)}</strong> in federal taxes.
            Your effective rate is <strong style={{ color: 'var(--nx-cream-50)' }}>{(effectiveRate * 100).toFixed(1)}%</strong> — that&apos;s the percentage of your total income that goes to taxes (not the bracket rate, which only applies to the income above the threshold).
            {marginalRate <= 0.12 && (
              <> <span style={{ color: 'var(--nx-gold-400)' }}>💡 You&apos;re in a low tax bracket right now — perfect timing to contribute to a Roth IRA and lock in these low rates.</span></>
            )}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Roth IRA — the teen power move */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 className="font-semibold">🏦 Roth IRA — Your Best Move</h2>
          </div>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            The single most powerful tax move for teens and young adults. Contribute now at a low tax rate, grow tax-free, withdraw tax-free in retirement.
          </p>
          <div className="flex flex-col gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">2024 Roth IRA limit</span>
                <span className="font-bold text-sm" style={{ color: 'var(--nx-gold-600)' }}>{fmt(iraMax)}/year</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Or your total earned income — whichever is less</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
              <div className="flex justify-between mb-1">
                <span className="font-medium text-sm">Monthly to max it out</span>
                <span className="font-bold text-sm" style={{ color: 'var(--nx-gold-600)' }}>{fmt(Math.round(iraMax / 12))}/month</span>
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Even $50/month is a great start</div>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'rgba(201,164,55,0.1)', border: '1px solid var(--nx-gold-200)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--nx-gold-700)', marginBottom: 6 }}>Requirements to contribute</div>
              <div style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.7 }}>
                ✓ You must have earned income (job, freelance, babysitting)<br/>
                ✓ Income below ~$146,000/year (not an issue for most teens)<br/>
                ✓ Open an account at Fidelity, Charles Schwab, or Vanguard<br/>
                ✓ Under 18? A parent opens a <strong>custodial Roth IRA</strong> for you<br/>
              </div>
            </div>
            {income > 0 && (
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--nx-pos-50)', border: '1px solid var(--nx-pos-200)' }}>
                <div style={{ fontSize: 12, color: 'var(--nx-pos-700)' }}>
                  💚 Based on your income, you can contribute up to{' '}
                  <strong>{fmt(Math.min(iraMax, income))}</strong> to a Roth IRA this year.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* How to file */}
        <div className="card">
          <h2 className="font-semibold mb-4">📁 How to File (For Free)</h2>
          <div className="flex flex-col gap-3">
            {[
              { name: 'IRS Free File', url: 'https://www.irs.gov/filing/free-file-do-your-federal-taxes-for-free', desc: 'Free if income < $79K. Official IRS program, powered by major tax software.', badge: '🆓 Free', color: 'var(--nx-pos-600)' },
              { name: 'Cash App Taxes', url: 'https://cash.app/taxes', desc: 'Completely free — federal AND state. Great for simple W-2 returns.', badge: '🆓 Free', color: 'var(--nx-pos-600)' },
              { name: 'FreeTaxUSA', url: 'https://www.freetaxusa.com', desc: 'Free federal, ~$15 state. Simple interface, great for first-time filers.', badge: '💲 Low cost', color: 'var(--nx-warn-600)' },
              { name: 'VITA Program', url: 'https://www.irs.gov/vita', desc: 'Free in-person tax prep from IRS-certified volunteers. Great for students.', badge: '🙋 In-Person', color: 'var(--nx-navy-600)' },
            ].map(s => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div className="p-3 rounded-xl" style={{ background: 'var(--background)', border: '1px solid var(--border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{s.name} ↗</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(0,0,0,0.05)', color: s.color }}>{s.badge}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{s.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Key dates */}
        <div className="card">
          <h2 className="font-semibold mb-4">📅 Key Dates to Know</h2>
          <div className="flex flex-col gap-3">
            {[
              { date: 'Jan 31', label: 'W-2 deadline', desc: 'Your employer must send your W-2 by this date', emoji: '📄' },
              { date: 'Apr 15', label: 'Tax filing deadline', desc: 'File your return or request a 6-month extension', emoji: '🗂️' },
              { date: 'Apr 15', label: 'Roth IRA contribution deadline', desc: 'Last day to contribute to your Roth IRA for the previous tax year', emoji: '🏦' },
              { date: 'Oct 15', label: 'Extended return deadline', desc: 'If you filed for an extension, this is the final deadline', emoji: '⏳' },
            ].map(e => (
              <div key={e.date + e.label} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>{e.emoji}</span>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span className="font-bold text-xs" style={{ color: 'var(--nx-gold-600)', minWidth: 48 }}>{e.date}</span>
                    <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>{e.label}</span>
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted)', margin: 0 }}>{e.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* First job checklist */}
        <div className="card">
          <h2 className="font-semibold mb-2">✅ First Job Tax Checklist</h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Starting your first job? Here&apos;s what you need to do.</p>
          <div className="flex flex-col gap-2">
            {[
              { text: 'Fill out your W-4 form (tells your employer how much to withhold)', tip: 'Claim 0 allowances to withhold more — avoids owing at tax time' },
              { text: 'Get a Social Security card if you don\'t have one', tip: 'SSA.gov — free, takes a few weeks' },
              { text: 'Save your pay stubs to verify your W-2 in January', tip: 'Take a photo on your phone, keep for 1 year' },
              { text: 'Set aside ~25% of any freelance/side hustle income', tip: 'Freelance income has no withholding — you owe it yourself' },
              { text: 'Open a Roth IRA once you have earned income', tip: 'Even $25/month is a great start' },
              { text: 'File your return by April 15 — even if you don\'t owe', tip: 'You might get a refund from over-withheld taxes!' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--nx-pos-50)', border: '1px solid var(--nx-pos-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <span style={{ fontSize: 10, color: 'var(--nx-pos-700)', fontWeight: 700 }}>{i + 1}</span>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)', lineHeight: 1.4, marginBottom: 2 }}>{item.text}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>💡 {item.tip}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-xs mt-6 text-center" style={{ color: 'var(--muted)' }}>
        Tax estimates use 2024 federal brackets. Does not include state tax, FICA, or AMT. For educational purposes only — not tax advice.
      </p>
    </div>
  )
}
