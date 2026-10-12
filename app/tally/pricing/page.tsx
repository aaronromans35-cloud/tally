import type { Metadata } from 'next'
import Link from 'next/link'
import { PLANS, limitLabel, ENTITLEMENTS } from '@/lib/tally/tiers'

export const metadata: Metadata = {
  title: 'Pricing — Tally',
  description:
    'Tally plans: a free tier that actually works, and paid tiers from $5 that add history, bank linking and a guardian view.',
}

const INK = '#14140f'
const GREEN = '#1c6a48'
const LIME = '#cdf06a'
const MUTED = '#6b6a60'
const LINE = '#e0ded4'
const CREAM = '#f5f4ef'

const BODY = "'IBM Plex Sans', system-ui, sans-serif"
const MONO = "'IBM Plex Mono', ui-monospace, monospace"

/** Rows of the comparison table, read from the single entitlements source. */
const ROWS: { label: string; get: (t: keyof typeof ENTITLEMENTS) => string }[] = [
  { label: 'Spending buckets', get: (t) => limitLabel(ENTITLEMENTS[t].maxBuckets) },
  { label: 'Savings goals', get: (t) => limitLabel(ENTITLEMENTS[t].maxGoals) },
  {
    label: 'History kept',
    get: (t) =>
      ENTITLEMENTS[t].historyMonths > 1000
        ? 'Everything'
        : `${ENTITLEMENTS[t].historyMonths} month${ENTITLEMENTS[t].historyMonths === 1 ? '' : 's'}`,
  },
  { label: 'Add transactions by hand', get: () => 'Yes' },
  { label: 'Import a bank CSV', get: (t) => (ENTITLEMENTS[t].csvImport ? 'Yes' : '—') },
  { label: 'Subscription + trial tracker', get: (t) => (ENTITLEMENTS[t].subscriptionTracking ? 'Yes' : '—') },
  { label: 'Cash-flow forecast', get: (t) => (ENTITLEMENTS[t].forecast ? 'Yes' : '—') },
  { label: 'Connect a bank (18+)', get: (t) => (ENTITLEMENTS[t].bankLinking ? 'Yes' : '—') },
  { label: 'Off-pace alerts', get: (t) => (ENTITLEMENTS[t].spendAlerts ? 'Yes' : '—') },
  {
    label: 'AI coach messages',
    get: (t) => (ENTITLEMENTS[t].aiMessagesPerMonth ? `${ENTITLEMENTS[t].aiMessagesPerMonth}/mo` : '—'),
  },
  { label: 'Linked teen profiles', get: (t) => (ENTITLEMENTS[t].guardianSeats ? String(ENTITLEMENTS[t].guardianSeats) : '—') },
  { label: 'Weekly family digest', get: (t) => (ENTITLEMENTS[t].weeklyDigest ? 'Yes' : '—') },
]

export default function TallyPricing() {
  return (
    <div style={{ background: '#f0eee6', color: INK, minHeight: '100vh', fontFamily: BODY }}>
      <header
        style={{
          borderBottom: `1px solid #ddd9cc`,
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          maxWidth: 1100,
          margin: '0 auto',
        }}
      >
        <Link href="/tally/site" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'inherit', textDecoration: 'none' }}>
          <span
            style={{
              width: 26,
              height: 26,
              background: GREEN,
              borderRadius: 8,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2.5,
              flex: 'none',
            }}
          >
            <span style={{ width: 11, height: 3, borderRadius: 3, background: LIME }} />
            <span style={{ width: 14, height: 3, borderRadius: 3, background: '#9fd35a' }} />
            <span style={{ width: 17, height: 3, borderRadius: 3, background: CREAM }} />
          </span>
          <strong style={{ fontSize: 19, letterSpacing: '-0.02em' }}>Tally</strong>
        </Link>
        <Link href="/tally" style={{ marginLeft: 'auto', fontSize: 14, fontWeight: 600, color: GREEN, textDecoration: 'none' }}>
          Open the demo →
        </Link>
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '44px 20px 90px' }}>
        <h1 style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.035em', margin: '0 0 10px' }}>
          Pricing
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.6, color: '#4a4941', margin: '0 0 8px', maxWidth: '58ch' }}>
          The free plan is a real plan — buckets, a streak, and manual entry, forever. Paying
          buys you memory, automation, and a way for a parent to help without taking over.
        </p>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: MUTED, margin: '0 0 36px', maxWidth: '58ch' }}>
          Under 18? Bank linking isn‘t available on your own account — Plaid, who powers it,
          requires account holders to be 18 or over. A guardian can link theirs and share the
          view with you.
        </p>

        {/* plan cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: 16,
            marginBottom: 56,
          }}
        >
          {PLANS.map((p) => (
            <div
              key={p.tier}
              style={{
                background: p.highlight ? INK : '#ffffff',
                color: p.highlight ? CREAM : INK,
                border: `1px solid ${p.highlight ? INK : LINE}`,
                borderRadius: 24,
                padding: '26px 24px',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <strong style={{ fontSize: 17 }}>{p.name}</strong>
                {p.highlight && (
                  <span
                    style={{
                      fontFamily: MONO,
                      fontSize: 10,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: LIME,
                      color: INK,
                    }}
                  >
                    Most picked
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, marginBottom: 6 }}>
                <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.04em' }}>
                  ${p.priceMonthly}
                </span>
                <span style={{ fontSize: 14, color: p.highlight ? '#a8a69b' : MUTED }}>/month</span>
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.5, color: p.highlight ? '#cfccc2' : '#4a4941', margin: '0 0 16px' }}>
                {p.tagline}
              </p>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {p.features.map((f) => (
                  <li key={f} style={{ fontSize: 14, lineHeight: 1.45, display: 'flex', gap: 9 }}>
                    <span aria-hidden="true" style={{ color: p.highlight ? LIME : GREEN, flex: 'none' }}>
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <p
                style={{
                  fontFamily: MONO,
                  fontSize: 11,
                  lineHeight: 1.5,
                  color: p.highlight ? '#a8a69b' : MUTED,
                  margin: '0 0 18px',
                  marginTop: 'auto',
                }}
              >
                {p.bestFor}
              </p>

              <Link
                href="/tally/access"
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  minHeight: 46,
                  borderRadius: 12,
                  background: p.highlight ? LIME : 'transparent',
                  color: p.highlight ? INK : INK,
                  border: p.highlight ? 'none' : `1px solid ${INK}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                {p.priceMonthly === 0 ? 'Start free' : `Choose ${p.name}`}
              </Link>
            </div>
          ))}
        </div>

        {/* comparison */}
        <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 18px' }}>
          Everything, side by side
        </h2>
        <div style={{ overflowX: 'auto', border: `1px solid ${LINE}`, borderRadius: 20, background: '#ffffff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 580 }}>
            <thead>
              <tr>
                <th
                  scope="col"
                  style={{ textAlign: 'left', padding: '16px 20px', fontSize: 13, color: MUTED, fontWeight: 600, borderBottom: `1px solid ${LINE}` }}
                >
                  Feature
                </th>
                {PLANS.map((p) => (
                  <th
                    key={p.tier}
                    scope="col"
                    style={{ textAlign: 'left', padding: '16px 20px', fontSize: 14, borderBottom: `1px solid ${LINE}` }}
                  >
                    {p.name}
                    <span style={{ display: 'block', fontFamily: MONO, fontSize: 11, color: MUTED, fontWeight: 400 }}>
                      ${p.priceMonthly}/mo
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row, i) => (
                <tr key={row.label} style={{ background: i % 2 ? '#faf9f4' : 'transparent' }}>
                  <th
                    scope="row"
                    style={{ textAlign: 'left', padding: '13px 20px', fontSize: 14, fontWeight: 400, color: '#4a4941' }}
                  >
                    {row.label}
                  </th>
                  {PLANS.map((p) => {
                    const v = row.get(p.tier)
                    return (
                      <td
                        key={p.tier}
                        style={{
                          padding: '13px 20px',
                          fontFamily: MONO,
                          fontSize: 13,
                          color: v === '—' ? '#b3afa2' : INK,
                        }}
                      >
                        {v}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section style={{ marginTop: 52, maxWidth: '64ch' }}>
          <h2 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', margin: '0 0 16px' }}>
            Questions worth answering
          </h2>
          {[
            {
              q: 'Can Tally move my money?',
              a: 'No. Tally is read-only and is not a bank. Bank connections only ever read balances and transactions — there is no path in the product that moves funds.',
            },
            {
              q: 'I‘m 15. Can I connect my bank account?',
              a: 'Not on your own account. Plaid, the service that powers bank connections, requires account holders to be 18 or over. You can use every other part of Tally by adding transactions yourself or importing a CSV, and a guardian can link their account on a Family plan.',
            },
            {
              q: 'Who pays?',
              a: 'An adult. Under 18s generally can‘t enter a binding subscription, so billing always sits on a guardian‘s account — that is a legal requirement, not a product preference.',
            },
            {
              q: 'What happens to my old transactions if I downgrade?',
              a: 'Nothing is deleted. History outside your plan‘s window is hidden from view and comes straight back if you upgrade again.',
            },
            {
              q: 'Can my parent see everything?',
              a: 'They can see your budget — buckets, goals, transactions — and they cannot edit it. Your conversations with the AI coach stay private.',
            },
          ].map((f) => (
            <div key={f.q} style={{ paddingBottom: 18, marginBottom: 18, borderBottom: `1px solid ${LINE}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 6px' }}>{f.q}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4a4941', margin: 0 }}>{f.a}</p>
            </div>
          ))}
        </section>

        <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED, marginTop: 36, lineHeight: 1.6 }}>
          Tally is in early access. Prices are in USD and may change before general release.
        </p>
      </main>
    </div>
  )
}
