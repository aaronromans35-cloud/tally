import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      {/* Nav — dark bar like the design */}
      <nav style={{ background: 'var(--nav)' }} className="px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'var(--accent)' }}>N</div>
          <span className="text-white text-lg font-bold tracking-tight">Nexus</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Features</span>
          <span className="text-sm" style={{ color: '#9CA3AF' }}>Pricing</span>
          <span className="text-sm" style={{ color: '#9CA3AF' }}>About</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login"
            className="text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            style={{ color: '#9CA3AF' }}>
            Sign in
          </Link>
          <Link href="/signup"
            className="btn-primary text-sm">
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24" style={{ background: 'var(--background)' }}>
        {/* Pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium"
          style={{ background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(91,106,240,0.2)' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />
          AI-Powered · Built for Everyday Americans
        </div>

        <h1 className="text-6xl font-bold mb-5 max-w-2xl leading-tight tracking-tight" style={{ color: 'var(--foreground)', letterSpacing: '-0.04em' }}>
          Your finances,<br />
          <span style={{ color: 'var(--accent)' }}>simplified.</span>
        </h1>
        <p className="text-xl mb-10 max-w-lg leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>
          Smart tools for everyday people to manage, grow, and understand their money.
        </p>
        <div className="flex gap-3 items-center">
          <Link href="/signup" className="btn-primary text-base px-7 py-3">
            Start for free
          </Link>
          <Link href="#features"
            className="text-base font-medium px-7 py-3 rounded-xl transition-colors"
            style={{ color: 'var(--mint-text)', background: 'var(--mint)', border: '1px solid rgba(26,122,94,0.15)' }}>
            See how it works
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-sm mt-8" style={{ color: 'var(--muted)' }}>
          No credit card required · Free forever on basic plan
        </p>
      </section>

      {/* Feature Grid */}
      <section id="features" className="px-8 pb-24 max-w-5xl mx-auto w-full">
        <p className="section-title text-center mb-8">Everything you need</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '💰', title: 'Budget Tracker', desc: 'Track income and expenses by category. See exactly where your money goes each month.', badge: 'Popular' },
            { icon: '📈', title: 'Portfolio & Markets', desc: 'Monitor holdings, track performance, and get smart rebalancing alerts.', badge: null },
            { icon: '🤖', title: 'AI Financial Plan', desc: 'Claude AI analyzes your full picture and builds a personalized ETF roadmap.', badge: 'New' },
            { icon: '🏦', title: 'Debt Payoff', desc: 'Avalanche or snowball strategy with a clear timeline and interest savings.', badge: null },
            { icon: '🧾', title: 'Tax Assistant', desc: 'Estimate federal taxes, find harvesting opportunities, and stay on top of deadlines.', badge: null },
            { icon: '🎯', title: 'Goal Tracking', desc: 'Set goals and watch every module work together to help you reach them.', badge: null },
          ].map(f => (
            <div key={f.title} className="card card-hover" style={{ textDecoration: 'none' }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ background: 'var(--background)' }}>
                  {f.icon}
                </div>
                {f.badge && <span className="badge-accent">{f.badge}</span>}
              </div>
              <h3 className="font-semibold mb-1.5" style={{ color: 'var(--foreground)', letterSpacing: '-0.02em' }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground-secondary)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-8 mb-20 rounded-2xl px-10 py-12 text-center" style={{ background: 'var(--nav)' }}>
        <h2 className="text-3xl font-bold text-white mb-3 tracking-tight" style={{ letterSpacing: '-0.03em' }}>
          Ready to take control?
        </h2>
        <p className="mb-6" style={{ color: '#9CA3AF' }}>Join thousands building smarter financial futures.</p>
        <Link href="/signup" className="btn-primary text-base px-8 py-3">
          Create your free account →
        </Link>
      </section>

      <footer className="text-center py-6 text-xs border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)' }}>
        Nexus is for educational purposes only. Not financial advice. Always consult a licensed advisor.
      </footer>
    </main>
  )
}
