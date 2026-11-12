'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Logged client-side only; no error monitoring service is wired up yet
    // (see SECURITY.md / Phase 3 notes — tracked as a follow-up).
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
        background: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      <span className="eyebrow">Something went wrong</span>
      <h1 className="page-title" style={{ marginBottom: 0 }}>
        We hit a snag
      </h1>
      <p style={{ color: 'var(--foreground-secondary)', maxWidth: 420 }}>
        An unexpected error occurred. Your data is safe — try again, and if
        it keeps happening, let us know what you were doing.
      </p>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
        <a className="btn-secondary" href="/">
          Back to home
        </a>
      </div>
    </div>
  )
}
