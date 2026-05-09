'use client'
import { useUserData } from '@/lib/context/UserDataContext'

function scoreColor(score: number) {
  if (score >= 80) return 'var(--green)'
  if (score >= 60) return 'var(--accent)'
  if (score >= 40) return 'var(--yellow)'
  return 'var(--red)'
}
function scoreLabel(score: number) {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Needs Work'
}

export function FinancialHealthScore() {
  const { budgetSummary, totalDebt, portfolioValue, goalCount, profile } = useUserData()

  // Score components (each out of 25)
  const savingsScore  = Math.min(25, budgetSummary.savingsRate >= 20 ? 25 : Math.round(budgetSummary.savingsRate * 1.25))
  const debtScore     = Math.min(25, totalDebt === 0 ? 25 : totalDebt < 500 ? 20 : totalDebt < 2000 ? 12 : 5)
  const portfolioScore = Math.min(25, portfolioValue > 0 ? Math.min(25, Math.round(portfolioValue / 100)) : 0)
  const goalScore     = Math.min(25, goalCount > 0 ? Math.min(25, goalCount * 8) : 0)
  const total         = savingsScore + debtScore + portfolioScore + goalScore

  const color = scoreColor(total)
  const label = scoreLabel(total)

  const components = [
    { label: 'Savings Rate', score: savingsScore, tip: `${budgetSummary.savingsRate.toFixed(0)}% of income saved` },
    { label: 'Debt',         score: debtScore,    tip: totalDebt === 0 ? 'Debt-free!' : `$${totalDebt.toLocaleString()} total debt` },
    { label: 'Investing',    score: portfolioScore, tip: portfolioValue > 0 ? `$${portfolioValue.toFixed(0)} portfolio` : 'No investments yet' },
    { label: 'Goals',        score: goalScore,    tip: `${goalCount} goal${goalCount !== 1 ? 's' : ''} set` },
  ]

  // Circumference for SVG circle
  const R  = 36
  const C  = 2 * Math.PI * R
  const pct = total / 100

  return (
    <div className="card" data-tour="tour-health">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm">Financial Health Score</h2>
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: color + '22', color }}>
          {label}
        </span>
      </div>

      {/* Circle gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="44" cy="44" r={R} fill="none" stroke="var(--card-border)" strokeWidth={8} />
            <circle
              cx="44" cy="44" r={R} fill="none"
              stroke={color} strokeWidth={8}
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{total}</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>/ 100</span>
          </div>
        </div>

        {/* Component bars */}
        <div className="flex-1 flex flex-col gap-2">
          {components.map(c => (
            <div key={c.label}>
              <div className="flex justify-between text-xs mb-0.5">
                <span style={{ color: 'var(--muted)' }}>{c.label}</span>
                <span style={{ fontWeight: 600 }}>{c.score}/25</span>
              </div>
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--card-border)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.score / 25) * 100}%`, background: scoreColor(c.score * 4) }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="flex flex-col gap-1">
        {components.filter(c => c.score < 20).slice(0, 2).map(c => (
          <p key={c.label} className="text-xs" style={{ color: 'var(--muted)' }}>
            💡 <strong>{c.label}:</strong> {c.tip}
          </p>
        ))}
        {components.every(c => c.score >= 20) && (
          <p className="text-xs" style={{ color: 'var(--green)' }}>🎉 All areas looking great! Keep it up.</p>
        )}
      </div>
    </div>
  )
}
