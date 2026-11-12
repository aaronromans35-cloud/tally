import Link from 'next/link'

export default function TallyNotFound() {
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
        404
      </span>
      <h1 style={{ fontFamily: 'var(--tally-display)', fontSize: 28, fontWeight: 600, margin: 0 }}>
        We couldn&apos;t find that page
      </h1>
      <p style={{ color: '#4a4941', maxWidth: 380 }}>
        The page you&apos;re looking for may have moved or no longer exists.
      </p>
      <Link
        href="/tally"
        style={{
          fontSize: 14,
          fontWeight: 600,
          padding: '12px 22px',
          border: 'none',
          borderRadius: 999,
          background: '#14140f',
          color: '#f5f4ef',
          textDecoration: 'none',
          marginTop: 4,
        }}
      >
        Back to Tally
      </Link>
    </div>
  )
}
