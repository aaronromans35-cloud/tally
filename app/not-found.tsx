import Link from 'next/link'

export default function NotFound() {
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
      <span className="eyebrow">404</span>
      <h1 className="page-title" style={{ marginBottom: 0 }}>
        We couldn&apos;t find that page
      </h1>
      <p style={{ color: 'var(--foreground-secondary)', maxWidth: 420 }}>
        The page you&apos;re looking for may have moved or no longer exists.
      </p>
      <Link href="/" className="btn-primary" style={{ marginTop: 8 }}>
        Back to home
      </Link>
    </div>
  )
}
