export default function DashboardLoading() {
  return (
    <div>
      <div className="skeleton" style={{ width: 160, height: 28, marginBottom: 24 }} />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ width: '60%', height: 12, marginBottom: 10 }} />
            <div className="skeleton" style={{ width: '40%', height: 22 }} />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton" style={{ width: '30%', height: 14, marginBottom: 16 }} />
        <div className="skeleton" style={{ width: '100%', height: 180 }} />
      </div>
    </div>
  )
}
