'use client'
import { useEffect, useState, useCallback } from 'react'

type TourStep = {
  tourId: string
  title: string
  desc: string
}

const STEPS: TourStep[] = [
  {
    tourId: 'tour-networth',
    title: 'Your Net Worth',
    desc: 'This is your financial snapshot — total investments minus debt. It updates live as you add data.',
  },
  {
    tourId: 'tour-health',
    title: 'Financial Health Score',
    desc: 'Your score out of 100. Built from savings rate, debt, investing, and goals. Improve each area to raise it.',
  },
  {
    tourId: 'tour-budget',
    title: 'Budget Tracker',
    desc: 'Track every dollar in and out. Set spending limits by category and see exactly where your money goes.',
  },
  {
    tourId: 'tour-compound',
    title: 'Compound Calculator',
    desc: 'The most important tool here. Drag the slider and watch what starting at 16 vs 25 vs 35 is actually worth. It changes how you think about money.',
  },
  {
    tourId: 'tour-goals',
    title: 'Goals',
    desc: 'Set savings targets — car, college, emergency fund. Every dollar you add moves the bar. Progress in real time.',
  },
  {
    tourId: 'tour-plan',
    title: 'AI Financial Plan',
    desc: 'Tell Nexus your age, income, and goals and get a personalized step-by-step plan. First Roth IRA, first investments, all explained simply.',
  },
]

const PAD = 10

export function TourOverlay({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  const current = STEPS[step]

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour="${current.tourId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      setTimeout(() => setRect(el.getBoundingClientRect()), 350)
    }
  }, [current.tourId])

  useEffect(() => { updateRect() }, [updateRect])

  // Re-measure on resize
  useEffect(() => {
    window.addEventListener('resize', updateRect)
    return () => window.removeEventListener('resize', updateRect)
  }, [updateRect])

  function next() {
    if (step < STEPS.length - 1) setStep(s => s + 1)
    else onDone()
  }

  function prev() {
    if (step > 0) setStep(s => s - 1)
  }

  if (!rect) return null

  const spot = {
    top:    rect.top    - PAD,
    left:   rect.left   - PAD,
    width:  rect.width  + PAD * 2,
    height: rect.height + PAD * 2,
  }

  // Position tooltip: if element is in the sidebar (left ~240px), show tooltip to the right
  // Otherwise show below
  const inSidebar = rect.left < 280
  const tooltipWidth = 300

  let tooltipTop: number
  let tooltipLeft: number

  if (inSidebar) {
    tooltipTop  = Math.max(16, rect.top + rect.height / 2 - 80)
    tooltipLeft = rect.right + 16
  } else {
    tooltipTop  = spot.top + spot.height + 12
    tooltipLeft = Math.max(16, Math.min(spot.left, window.innerWidth - tooltipWidth - 16))
  }

  // Clamp tooltip to viewport
  if (tooltipTop + 200 > window.innerHeight) tooltipTop = spot.top - 200 - 12

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
      {/* Dark overlay with spotlight hole */}
      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        onClick={onDone}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spot.left} y={spot.top}
              width={spot.width} height={spot.height}
              rx="10" fill="black"
            />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tour-mask)" />
      </svg>

      {/* Spotlight border glow */}
      <div style={{
        position: 'absolute',
        top: spot.top, left: spot.left,
        width: spot.width, height: spot.height,
        borderRadius: 10,
        border: '2px solid var(--nx-gold-500)',
        boxShadow: '0 0 0 4px rgba(201,164,55,0.2)',
        pointerEvents: 'none',
        transition: 'all 300ms ease',
      }} />

      {/* Tooltip card */}
      <div style={{
        position: 'absolute',
        top: tooltipTop,
        left: tooltipLeft,
        width: tooltipWidth,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: '18px',
        boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
        zIndex: 10000,
        pointerEvents: 'all',
        transition: 'top 300ms ease, left 300ms ease',
      }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 6, height: 6, borderRadius: 999,
              background: i === step ? 'var(--nx-gold-500)' : i < step ? 'var(--accent)' : 'var(--card-border)',
              transition: 'all 250ms',
            }} />
          ))}
        </div>

        <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 6px', color: 'var(--foreground)' }}>
          {current.title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 16px' }}>
          {current.desc}
        </p>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {step > 0 && (
            <button onClick={prev} style={{
              fontSize: 13, padding: '7px 14px', borderRadius: 7,
              background: 'transparent', border: '1px solid var(--border)',
              cursor: 'pointer', color: 'var(--muted)',
            }}>
              ← Back
            </button>
          )}
          <button onClick={next} style={{
            flex: 1, fontSize: 13, fontWeight: 600, padding: '8px 16px', borderRadius: 7,
            background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
            border: 'none', cursor: 'pointer',
          }}>
            {step < STEPS.length - 1 ? 'Next →' : '🎉 Done!'}
          </button>
          <button onClick={onDone} style={{
            fontSize: 12, padding: '7px 10px', borderRadius: 7,
            background: 'transparent', border: '1px solid var(--border)',
            cursor: 'pointer', color: 'var(--muted)',
          }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  )
}
