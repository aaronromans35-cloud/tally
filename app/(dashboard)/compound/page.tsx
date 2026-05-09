'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

// ── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function calcFutureValue(monthly: number, annualRate: number, years: number): number {
  if (years <= 0) return 0
  const r = annualRate / 100 / 12
  if (r === 0) return monthly * 12 * years
  return monthly * (((1 + r) ** (years * 12) - 1) / r)
}

// Build a growth curve: array of { year, value } from year 0 to maxYears
function growthCurve(monthly: number, annualRate: number, startAge: number, endAge: number) {
  const totalYears = endAge - startAge
  return Array.from({ length: totalYears + 1 }, (_, i) => ({
    year: i,
    value: calcFutureValue(monthly, annualRate, i),
  }))
}

// ── SVG Bar Chart ─────────────────────────────────────────────────────────────

interface BarData {
  label: string
  sublabel: string
  futureValue: number
  totalInvested: number
  color: string
  investedColor: string
  isHighlight: boolean
}

function BarChart({ bars }: { bars: BarData[] }) {
  const maxVal = Math.max(...bars.map(b => b.futureValue), 1)
  const W = 600
  const H = 220
  const barW = 80
  const gap = (W - bars.length * barW) / (bars.length + 1)
  const topPad = 30
  const botPad = 48

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, height: 'auto', overflow: 'visible' }}
      aria-label="Comparison bar chart showing future values by starting age"
    >
      {bars.map((bar, i) => {
        const x = gap + i * (barW + gap)
        const totalH = H - topPad - botPad
        const barH = (bar.futureValue / maxVal) * totalH
        const investedH = (bar.totalInvested / maxVal) * totalH
        const y = topPad + totalH - barH

        return (
          <g key={bar.label}>
            {/* Full bar (interest earned portion) */}
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={6}
              fill={bar.color}
              opacity={bar.isHighlight ? 1 : 0.72}
            />
            {/* Invested portion overlay */}
            <rect
              x={x}
              y={topPad + totalH - investedH}
              width={barW}
              height={investedH}
              rx={6}
              fill={bar.investedColor}
              opacity={0.55}
            />
            {/* Value label on top */}
            <text
              x={x + barW / 2}
              y={y - 8}
              textAnchor="middle"
              fontSize={10}
              fontWeight={700}
              fill={bar.isHighlight ? 'var(--nx-gold-500)' : 'var(--foreground)'}
              fontFamily="var(--font-sans)"
            >
              {fmt(bar.futureValue)}
            </text>
            {/* Age label */}
            <text
              x={x + barW / 2}
              y={H - botPad + 16}
              textAnchor="middle"
              fontSize={11}
              fontWeight={700}
              fill={bar.isHighlight ? 'var(--nx-navy-800)' : 'var(--foreground)'}
              fontFamily="var(--font-sans)"
            >
              {bar.label}
            </text>
            <text
              x={x + barW / 2}
              y={H - botPad + 30}
              textAnchor="middle"
              fontSize={9.5}
              fill="var(--muted)"
              fontFamily="var(--font-sans)"
            >
              {bar.sublabel}
            </text>
          </g>
        )
      })}

      {/* Legend */}
      <rect x={10} y={H - 14} width={10} height={10} rx={2} fill="var(--nx-navy-600)" opacity={0.55} />
      <text x={24} y={H - 5} fontSize={9} fill="var(--muted)" fontFamily="var(--font-sans)">
        Amount invested
      </text>
      <rect x={120} y={H - 14} width={10} height={10} rx={2} fill="var(--nx-gold-500)" />
      <text x={134} y={H - 5} fontSize={9} fill="var(--muted)" fontFamily="var(--font-sans)">
        Interest earned
      </text>
    </svg>
  )
}

// ── Growth Line Chart ─────────────────────────────────────────────────────────

interface LineData {
  label: string
  color: string
  points: { year: number; value: number }[]
}

function GrowthLineChart({ lines, endAge }: { lines: LineData[]; endAge: number }) {
  const allValues = lines.flatMap(l => l.points.map(p => p.value))
  const maxVal = Math.max(...allValues, 1)
  const maxYears = Math.max(...lines.flatMap(l => l.points.map(p => p.year)), 1)

  const W = 560
  const H = 200
  const padL = 12
  const padR = 12
  const padT = 12
  const padB = 28

  const toX = (year: number) => padL + (year / maxYears) * (W - padL - padR)
  const toY = (val: number) => padT + (1 - val / maxVal) * (H - padT - padB)

  const yticks = [0, 0.25, 0.5, 0.75, 1].map(f => ({
    val: f * maxVal,
    y: padT + (1 - f) * (H - padT - padB),
  }))

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 'auto' }}
      aria-label="Growth curve showing compound interest over time for each starting age"
    >
      {/* Grid lines */}
      {yticks.map(({ val, y }) => (
        <g key={val}>
          <line x1={padL} y1={y} x2={W - padR} y2={y} stroke="var(--border)" strokeWidth={1} />
          <text x={padL} y={y - 3} fontSize={8} fill="var(--muted)" fontFamily="var(--font-sans)">
            {val >= 1000000
              ? `$${(val / 1000000).toFixed(1)}M`
              : val >= 1000
              ? `$${(val / 1000).toFixed(0)}k`
              : `$${val.toFixed(0)}`}
          </text>
        </g>
      ))}

      {/* Age x-axis ticks */}
      {[0, Math.round(maxYears * 0.25), Math.round(maxYears * 0.5), Math.round(maxYears * 0.75), maxYears].map(yr => (
        <text
          key={yr}
          x={toX(yr)}
          y={H - 4}
          fontSize={8}
          textAnchor="middle"
          fill="var(--muted)"
          fontFamily="var(--font-sans)"
        >
          Age {endAge - maxYears + yr}
        </text>
      ))}

      {/* Lines */}
      {lines.map(line => {
        const d = line.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.year)},${toY(p.value)}`)
          .join(' ')
        return (
          <path
            key={line.label}
            d={d}
            fill="none"
            stroke={line.color}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )
      })}

      {/* End dots */}
      {lines.map(line => {
        const last = line.points[line.points.length - 1]
        return (
          <circle
            key={line.label + '-dot'}
            cx={toX(last.year)}
            cy={toY(last.value)}
            r={4}
            fill={line.color}
          />
        )
      })}
    </svg>
  )
}

// ── Comparison Card ───────────────────────────────────────────────────────────

interface CompCardProps {
  startAge: number
  endAge: number
  monthlyAmount: number
  returnRate: number
  highlight?: boolean
  badge?: string
}

function ComparisonCard({ startAge, endAge, monthlyAmount, returnRate, highlight, badge }: CompCardProps) {
  const years = Math.max(endAge - startAge, 0)
  const futureValue = calcFutureValue(monthlyAmount, returnRate, years)
  const totalInvested = monthlyAmount * 12 * years
  const interestEarned = futureValue - totalInvested
  const multiplier = totalInvested > 0 ? (futureValue / totalInvested).toFixed(1) : '0.0'

  const cardStyle: React.CSSProperties = highlight
    ? {
        background: 'var(--nx-navy-800)',
        borderRadius: 14,
        padding: '1.5rem',
        boxShadow: '0 8px 24px rgba(11,31,58,0.22)',
        border: '2px solid var(--nx-gold-500)',
        color: 'var(--nx-cream-50)',
        flex: 1,
        minWidth: 0,
        position: 'relative',
      }
    : {
        background: 'var(--surface)',
        borderRadius: 14,
        padding: '1.5rem',
        boxShadow: 'var(--card-shadow)',
        border: '1px solid var(--border)',
        flex: 1,
        minWidth: 0,
        position: 'relative',
      }

  const labelColor = highlight ? 'rgba(255,255,255,0.55)' : 'var(--muted)'
  const valueColor = highlight ? 'var(--nx-cream-50)' : 'var(--foreground)'
  const goldColor = highlight ? 'var(--nx-gold-400)' : 'var(--nx-gold-600)'

  return (
    <div style={cardStyle}>
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -14,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--nx-gold-500)',
            color: 'var(--nx-navy-900)',
            fontSize: '0.6875rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '0.2rem 0.75rem',
            borderRadius: 20,
            whiteSpace: 'nowrap',
          }}
        >
          {badge}
        </div>
      )}

      <p className="eyebrow" style={{ color: labelColor, marginBottom: '0.25rem' }}>
        Start at {startAge}
      </p>
      <p
        className="num-display"
        style={{
          fontSize: '2rem',
          color: highlight ? 'var(--nx-gold-400)' : 'var(--nx-gold-600)',
          lineHeight: 1.1,
          marginBottom: '1rem',
        }}
      >
        {fmt(futureValue)}
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', color: labelColor }}>You invest</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: valueColor }} className="num">
            {fmt(totalInvested)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', color: labelColor }}>Interest earned</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: goldColor }} className="num">
            {fmt(interestEarned)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8125rem', color: labelColor }}>Years investing</span>
          <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: valueColor }}>
            {years} yrs
          </span>
        </div>
        <div
          style={{
            marginTop: '0.25rem',
            paddingTop: '0.5rem',
            borderTop: highlight ? '1px solid rgba(255,255,255,0.12)' : '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.8125rem', color: labelColor }}>Money grows</span>
          <span
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: highlight ? 'var(--nx-gold-300)' : 'var(--nx-gold-600)',
            }}
          >
            {multiplier}×
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Slider Input ──────────────────────────────────────────────────────────────

interface SliderInputProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
  suffix?: string
}

function SliderInput({ label, value, min, max, step, onChange, format, suffix }: SliderInputProps) {
  const display = format ? format(value) : `${value}${suffix ?? ''}`
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <label className="label">{label}</label>
        <span
          className="num-display"
          style={{ fontSize: '1.125rem', color: 'var(--nx-gold-600)', fontWeight: 600 }}
        >
          {display}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{
          width: '100%',
          accentColor: 'var(--nx-gold-500)',
          cursor: 'pointer',
          height: 4,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.6875rem',
          color: 'var(--muted)',
        }}
      >
        <span>{format ? format(min) : `${min}${suffix ?? ''}`}</span>
        <span>{format ? format(max) : `${max}${suffix ?? ''}`}</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CompoundPage() {
  const [monthlyAmount, setMonthlyAmount] = useState(100)
  const [startAge, setStartAge] = useState(16)
  const [returnRate, setReturnRate] = useState(7)
  const [endAge, setEndAge] = useState(65)

  // Clamp so startAge is always < endAge
  const safeEndAge = Math.max(endAge, startAge + 1)

  // Card 1 moves with the slider. Cards 2 & 3 are fixed comparison points.
  const age1 = startAge
  const COMPARE_AGE2 = 25
  const COMPARE_AGE3 = 35

  const age1FV = calcFutureValue(monthlyAmount, returnRate, Math.max(safeEndAge - age1, 0))
  const age2FV = calcFutureValue(monthlyAmount, returnRate, Math.max(safeEndAge - COMPARE_AGE2, 0))
  const age3FV = calcFutureValue(monthlyAmount, returnRate, Math.max(safeEndAge - COMPARE_AGE3, 0))

  const gainVs25 = age1FV - age2FV
  const gainVs35 = age1FV - age3FV

  const bars = useMemo<BarData[]>(() => {
    const makeBar = (sa: number, color: string, investedColor: string, isHighlight: boolean): BarData => {
      const years = Math.max(safeEndAge - sa, 0)
      const fv = calcFutureValue(monthlyAmount, returnRate, years)
      const inv = monthlyAmount * 12 * years
      return {
        label: `Age ${sa}`,
        sublabel: years > 0 ? `${years} yrs` : 'past',
        futureValue: fv,
        totalInvested: inv,
        color,
        investedColor,
        isHighlight,
      }
    }
    return [
      makeBar(age1,         'var(--nx-gold-500)', 'var(--nx-gold-700)', true),
      makeBar(COMPARE_AGE2, 'var(--nx-navy-600)', 'var(--nx-navy-800)', false),
      makeBar(COMPARE_AGE3, 'var(--nx-ink-300)',  'var(--nx-ink-500)',  false),
    ]
  }, [monthlyAmount, returnRate, safeEndAge, age1])

  const growthLines = useMemo<LineData[]>(() => {
    // All lines share the same x-axis — years starting from age1
    const pad = (curve: { year: number; value: number }[], offsetYears: number) => {
      if (offsetYears < 0) return curve.map(p => ({ ...p, year: p.year + offsetYears })).filter(p => p.year >= 0)
      const padded = Array.from({ length: offsetYears }, (_, i) => ({ year: i, value: 0 }))
      return [...padded, ...curve.map(p => ({ year: p.year + offsetYears, value: p.value }))]
    }

    const curve1    = growthCurve(monthlyAmount, returnRate, age1, safeEndAge)
    const curve2raw = growthCurve(monthlyAmount, returnRate, COMPARE_AGE2, safeEndAge)
    const curve3raw = growthCurve(monthlyAmount, returnRate, COMPARE_AGE3, safeEndAge)

    return [
      { label: `Start at ${age1}`,         color: 'var(--nx-gold-500)', points: curve1 },
      { label: `Start at ${COMPARE_AGE2}`, color: 'var(--nx-navy-500)', points: pad(curve2raw, COMPARE_AGE2 - age1) },
      { label: `Start at ${COMPARE_AGE3}`, color: 'var(--nx-ink-300)',  points: pad(curve3raw, COMPARE_AGE3 - age1) },
    ].filter(l => l.points.length > 0)
  }, [monthlyAmount, returnRate, safeEndAge, age1])

  return (
    <div
      style={{
        maxWidth: 860,
        margin: '0 auto',
        padding: '2rem 1rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      {/* ── Header ── */}
      <div>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>
          Compound Interest
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
            color: 'var(--foreground)',
            margin: '0 0 0.625rem',
            lineHeight: 1.15,
          }}
        >
          The most powerful force in finance.
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '1rem', margin: 0 }}>
          See why starting at 16 beats starting at 25 — every single time.
        </p>
      </div>

      {/* ── Input Controls ── */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <p
          className="eyebrow"
          style={{ marginBottom: '-0.5rem', color: 'var(--nx-navy-600)' }}
        >
          Your assumptions
        </p>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.5rem',
          }}
        >
          <SliderInput
            label="Monthly investment"
            value={monthlyAmount}
            min={25}
            max={1000}
            step={25}
            onChange={setMonthlyAmount}
            format={v => fmt(v).replace('.00', '')}
          />
          <SliderInput
            label="Start investing at age"
            value={startAge}
            min={13}
            max={64}
            step={1}
            onChange={v => setStartAge(Math.min(v, safeEndAge - 1))}
            suffix=""
            format={v => `Age ${v}`}
          />
          <SliderInput
            label="Annual return rate"
            value={returnRate}
            min={1}
            max={15}
            step={0.5}
            onChange={setReturnRate}
            suffix="%"
            format={v => `${v}%`}
          />
          <SliderInput
            label="See results at age"
            value={safeEndAge}
            min={30}
            max={80}
            step={1}
            onChange={v => setEndAge(Math.max(v, startAge + 1))}
            suffix=""
            format={v => `Age ${v}`}
          />
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>
          Default 7% return = historical S&P 500 average (inflation-adjusted). Results are illustrative, not a guarantee.
        </p>
      </div>

      {/* ── Comparison Cards ── */}
      <div>
        <p className="eyebrow" style={{ marginBottom: '1.25rem' }}>
          What happens if you start at…
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            paddingTop: '1rem', // room for badge
          }}
        >
          <ComparisonCard
            startAge={age1}
            endAge={safeEndAge}
            monthlyAmount={monthlyAmount}
            returnRate={returnRate}
            highlight
            badge="Start now ✦"
          />
          <ComparisonCard
            startAge={COMPARE_AGE2}
            endAge={safeEndAge}
            monthlyAmount={monthlyAmount}
            returnRate={returnRate}
          />
          <ComparisonCard
            startAge={COMPARE_AGE3}
            endAge={safeEndAge}
            monthlyAmount={monthlyAmount}
            returnRate={returnRate}
          />
        </div>
      </div>

      {/* ── Bar Chart ── */}
      <div className="card">
        <p className="eyebrow" style={{ marginBottom: '1rem' }}>
          Side-by-side comparison
        </p>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap',
              fontSize: '0.8125rem',
              color: 'var(--muted)',
              marginBottom: '0.5rem',
              width: '100%',
            }}
          >
            {[
              { color: 'var(--nx-gold-500)', label: `Start at ${age1}` },
              { color: 'var(--nx-navy-600)', label: `Start at ${COMPARE_AGE2}` },
              { color: 'var(--nx-ink-300)', label: `Start at ${COMPARE_AGE3}` },
            ].map(d => (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    background: d.color,
                    flexShrink: 0,
                  }}
                />
                <span>{d.label}</span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', maxWidth: 600 }}>
            <BarChart bars={bars} />
          </div>
        </div>
      </div>

      {/* ── Growth Line Chart ── */}
      <div className="card">
        <p className="eyebrow" style={{ marginBottom: '0.375rem' }}>
          Growth over time
        </p>
        <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginBottom: '1rem' }}>
          Watch how an early start widens the gap every year.
        </p>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            fontSize: '0.8125rem',
            color: 'var(--muted)',
            marginBottom: '0.75rem',
          }}
        >
          {growthLines.map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
              <div style={{ width: 24, height: 3, borderRadius: 2, background: l.color, flexShrink: 0 }} />
              <span>{l.label}</span>
            </div>
          ))}
        </div>
        <GrowthLineChart lines={growthLines} endAge={safeEndAge} />
      </div>

      {/* ── "What This Means" ── */}
      <div
        style={{
          background: 'var(--nx-gold-50)',
          border: '1px solid var(--nx-gold-200)',
          borderRadius: 14,
          padding: '1.5rem',
        }}
      >
        <p className="eyebrow" style={{ color: 'var(--nx-gold-700)', marginBottom: '0.75rem' }}>
          What this means for you
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {gainVs25 > 0 && (
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
              If you start at <strong>{age1}</strong>, you earn{' '}
              <strong style={{ color: 'var(--nx-gold-700)' }}>{fmt(gainVs25)} more</strong> than
              someone who starts at <strong>{COMPARE_AGE2}</strong> — just by starting{' '}
              <strong>{COMPARE_AGE2 - age1} years earlier</strong>, investing the same {fmt(monthlyAmount)}/month.
            </p>
          )}
          {gainVs35 > 0 && (
            <p style={{ margin: 0, fontSize: '1rem', color: 'var(--foreground)', lineHeight: 1.6 }}>
              Versus someone who waits until <strong>{COMPARE_AGE3}</strong>, you come out{' '}
              <strong style={{ color: 'var(--nx-gold-700)' }}>{fmt(gainVs35)} ahead</strong> —
              that&apos;s the price of waiting {COMPARE_AGE3 - age1} years.
            </p>
          )}
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--nx-ink-600)', lineHeight: 1.6 }}>
            Compound interest rewards patience and punishes delay. The money you invest in your teens does more
            work than money invested in your 30s — because it has more time to grow on itself.
          </p>
        </div>

        {/* Quick stat pills */}
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            flexWrap: 'wrap',
            marginTop: '1.25rem',
          }}
        >
          {[
            {
              label: `Start at ${age1}`,
              value: fmt(age1FV),
              highlight: true,
            },
            {
              label: `Vs. starting at ${COMPARE_AGE2}`,
              value: `+${fmt(gainVs25)}`,
              highlight: false,
            },
            {
              label: `Vs. starting at ${COMPARE_AGE3}`,
              value: `+${fmt(gainVs35)}`,
              highlight: false,
            },
          ].map(pill => (
            <div
              key={pill.label}
              style={{
                background: pill.highlight ? 'var(--nx-gold-500)' : 'var(--nx-gold-100)',
                borderRadius: 8,
                padding: '0.5rem 0.875rem',
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: '0.6875rem',
                  color: pill.highlight ? 'var(--nx-navy-900)' : 'var(--nx-gold-700)',
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {pill.label}
              </p>
              <p
                className="num-display"
                style={{
                  margin: 0,
                  fontSize: '1.125rem',
                  color: pill.highlight ? 'var(--nx-navy-900)' : 'var(--nx-gold-700)',
                  fontWeight: 700,
                }}
              >
                {pill.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.875rem',
          textAlign: 'center',
          paddingTop: '0.5rem',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '1.125rem',
            color: 'var(--foreground)',
            fontWeight: 500,
          }}
        >
          Ready to put compound interest to work?
        </p>
        <Link href="/portfolio" className="btn-gold" style={{ fontSize: '1rem', padding: '0.75rem 1.75rem' }}>
          Start tracking your investments →
        </Link>
        <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--muted)' }}>
          Track real investments and watch your actual growth.
        </p>
      </div>
    </div>
  )
}
