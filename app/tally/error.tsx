'use client'

import { useEffect } from 'react'

export default function TallyError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
        textAlign: 'center',
        background: '#f0eee6',
        color: '#14140f',
        fontFamily: 'var(--tally-body)',
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 600, color: '#6b6a60', letterSpacing: '0.04em' }}>
        Something went wrong
      </span>
      <h1 style={{ fontFamily: 'var(--tally-display)', fontSize: 28, fontWeight: 600, margin: 0 }}>
        We hit a snag
      </h1>
      <p style={{ color: '#4a4941', maxWidth: 380 }}>
        An unexpected error occurred. Your data is safe — try again.
      </p>
      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          onClick={() => reset()}
          style={{
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 22px',
            border: 'none',
            borderRadius: 999,
            background: '#14140f',
            color: '#f5f4ef',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/tally"
          style={{
            fontSize: 14,
            fontWeight: 600,
            padding: '12px 22px',
            border: '1px solid #14140f',
            borderRadius: 999,
            background: 'transparent',
            color: '#14140f',
            textDecoration: 'none',
          }}
        >
          Back to Tally
        </a>
      </div>
    </div>
  )
}
