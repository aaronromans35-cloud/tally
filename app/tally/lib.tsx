'use client'
/**
 * Tally — shared primitives.
 *
 * Ported from the "Tally App v5.dc.html" design reference. The design authored
 * every style as an inline CSS string (`style="color:#14140f;..."`); `css()`
 * turns those strings into the style objects React expects so the port can stay
 * line-for-line with the source. Font families come from `next/font` CSS vars
 * wired up in `layout.tsx`.
 */
import { useState, type CSSProperties, type ReactNode } from 'react'

export const DISPLAY = "var(--tally-display), 'Space Grotesk', system-ui, sans-serif"
export const BODY = "var(--tally-body), 'IBM Plex Sans', system-ui, sans-serif"
export const MONO = "var(--tally-mono), 'IBM Plex Mono', ui-monospace, monospace"

/** Parse a `prop:value;prop:value` CSS string into a React style object. */
export function css(input?: string): CSSProperties {
  const out: Record<string, string> = {}
  if (!input) return out
  for (const decl of input.split(';')) {
    const i = decl.indexOf(':')
    if (i === -1) continue
    const rawKey = decl.slice(0, i).trim()
    const value = decl.slice(i + 1).trim()
    if (!rawKey || !value) continue
    const key = rawKey.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
    out[key] = value
  }
  return out as CSSProperties
}

/** Merge helper — later objects win. */
export function sx(...parts: (CSSProperties | undefined)[]): CSSProperties {
  return Object.assign({}, ...parts)
}

export const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US')

export const cash = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** "1st", "2nd", "3rd", "11th"… with the 11/12/13 exception. */
export const ordinal = (d: number) => {
  const v = d % 100
  if (v >= 11 && v <= 13) return d + 'th'
  return d + (['th', 'st', 'nd', 'rd'][d % 10] || 'th')
}

/** Card / button that swaps in a hover style — replaces the design's `style-hover` attr. */
export function Hover({
  as = 'div',
  base,
  hover,
  onClick,
  title,
  children,
}: {
  as?: 'div' | 'button'
  base: CSSProperties
  hover?: CSSProperties
  onClick?: () => void
  title?: string
  children?: ReactNode
}) {
  const [on, setOn] = useState(false)
  const style = on && hover ? sx(base, hover) : base
  const shared = {
    style,
    title,
    onClick,
    onMouseEnter: () => setOn(true),
    onMouseLeave: () => setOn(false),
  }
  if (as === 'button') {
    return (
      <button type="button" {...shared}>
        {children}
      </button>
    )
  }
  return <div {...shared}>{children}</div>
}
