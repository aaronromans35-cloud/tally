export default function TallyLoading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        background: '#f0eee6',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: '3px solid #e0ded4',
          borderTopColor: '#14140f',
          animation: 'tally-spin 0.7s linear infinite',
        }}
      />
      {/* prefers-reduced-motion is handled globally in app/globals.css (root layout wraps this page) */}
      <style>{`@keyframes tally-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
