import Link from 'next/link'

/* ── tiny inline sparkline svg ── */
function MiniSparkline({ color = '#C9A437' }: { color?: string }) {
  const pts = [0,8,5,12,10,7,15,4,20,6,25,2,30,0]
  const pairs = []
  for (let i = 0; i < pts.length; i += 2) pairs.push([pts[i], pts[i + 1]])
  const path = pairs.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const area = `${path} L30,20 L0,20 Z`
  return (
    <svg viewBox="0 0 30 20" style={{ width: '100%', height: 40 }} preserveAspectRatio="none">
      <path d={area} fill={color} fillOpacity={0.1} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── pill filter bar ── */
const MODULES = ['All', 'Budget', 'Portfolio', 'AI Plan', 'Debt', 'Tax', 'Goals']

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>

      {/* ══════ NAV ══════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'var(--nx-cream-50)',
        borderBottom: '1px solid var(--nx-cream-300)',
        height: 62,
        padding: '0 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
        </div>

        {/* Center links */}
        <div style={{ display: 'flex', gap: 36 }}>
          {[
            { label: 'Features', href: '#features' },
            { label: 'Pricing',  href: '/pricing' },
            { label: 'About',    href: '/about' },
            { label: 'Blog',     href: '/blog' },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{ fontSize: 14, color: 'var(--nx-ink-500)', fontWeight: 500, textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right CTAs */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--nx-ink-600)', textDecoration: 'none', padding: '7px 14px' }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 6,
            background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}>
            Get started
          </Link>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section style={{ padding: '72px 48px 0', minHeight: 'calc(100vh - 62px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, flex: 1, alignItems: 'flex-start' }}>

          {/* ── LEFT: headline + sub + CTAs ── */}
          <div style={{ paddingTop: 16, paddingRight: 48 }}>
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(52px, 6.5vw, 88px)',
              fontWeight: 400,
              letterSpacing: '-0.035em',
              lineHeight: 1.0,
              color: 'var(--nx-navy-900)',
              marginBottom: 28,
            }}>
              Build wealth,<br />
              on your<br />
              <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>own terms.</span>
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--nx-ink-500)', maxWidth: 420, marginBottom: 36 }}>
              Budget smarter, invest with confidence, and let AI build a personalized plan around your life — not someone else&rsquo;s.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <Link href="/signup" style={{
                fontSize: 15, fontWeight: 600, padding: '12px 28px', borderRadius: 6,
                background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                border: '1px solid var(--nx-gold-500)',
              }}>
                Get started free
              </Link>
              <Link href="/login" style={{
                fontSize: 15, fontWeight: 500, padding: '12px 28px', borderRadius: 6,
                background: 'transparent', color: 'var(--nx-navy-900)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                border: '1px solid var(--nx-navy-300)',
              }}>
                Sign in
              </Link>
            </div>

            <p style={{ fontSize: 13, color: 'var(--nx-ink-400)', marginTop: 18 }}>
              No credit card required &middot; Free to start
            </p>
          </div>

          {/* ── RIGHT: staggered card grid ── */}
          <div style={{ position: 'relative', height: 560 }}>

            {/* Card 1 — top center: net worth */}
            <div style={{
              position: 'absolute', top: 0, left: '28%',
              width: 240,
              background: 'var(--nx-navy-800)',
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 20px 60px rgba(11,31,58,0.22)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-navy-400)', marginBottom: 8 }}>Net Worth</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, color: 'var(--nx-cream-50)', letterSpacing: '-0.02em', lineHeight: 1 }}>$184,200</div>
              <div style={{ fontSize: 12, color: 'var(--nx-pos-500)', marginTop: 6, fontWeight: 600 }}>+$2,840 this month</div>
              <div style={{ marginTop: 12 }}>
                <MiniSparkline />
              </div>
            </div>

            {/* Card 2 — large center-right: portfolio */}
            <div style={{
              position: 'absolute', top: 100, left: 0,
              width: 300,
              background: 'var(--nx-white)',
              borderRadius: 16,
              padding: '22px 24px',
              border: '1px solid var(--nx-cream-300)',
              boxShadow: '0 24px 64px rgba(11,31,58,0.12)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>Portfolio</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--nx-navy-900)', letterSpacing: '-0.02em', lineHeight: 1 }}>$62,800</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--nx-pos-50)', color: 'var(--nx-pos-700)', fontSize: 12, fontWeight: 600 }}>
                  +12.4%
                </div>
              </div>
              {/* mini allocation bars */}
              {[
                { label: 'US Equity', pct: 60, color: 'var(--nx-navy-800)' },
                { label: 'Intl', pct: 25, color: 'var(--nx-gold-500)' },
                { label: 'Bonds', pct: 15, color: 'var(--nx-navy-400)' },
              ].map(r => (
                <div key={r.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{r.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--nx-navy-900)' }}>{r.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--nx-cream-200)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${r.pct}%`, background: r.color, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Card 3 — right side: AI plan insight */}
            <div style={{
              position: 'absolute', top: 80, right: -32,
              width: 260,
              background: 'var(--nx-navy-800)',
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 20px 60px rgba(11,31,58,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-gold-300)' }}>Nexus AI</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, lineHeight: 1.55, color: 'var(--nx-cream-50)', fontStyle: 'italic', marginBottom: 14 }}>
                Increasing your savings rate to <span style={{ color: 'var(--nx-gold-300)' }}>28%</span> would add <span style={{ color: 'var(--nx-gold-300)' }}>$180K</span> by retirement.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--nx-navy-700)' }}>
                  <div style={{ fontSize: 10, color: 'var(--nx-navy-400)', marginBottom: 3 }}>Savings Rate</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--nx-cream-50)' }}>24%</div>
                </div>
                <div style={{ flex: 1, padding: '8px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid var(--nx-navy-700)' }}>
                  <div style={{ fontSize: 10, color: 'var(--nx-navy-400)', marginBottom: 3 }}>Target</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--nx-gold-300)' }}>28%</div>
                </div>
              </div>
            </div>

            {/* Card 4 — bottom left: budget */}
            <div style={{
              position: 'absolute', bottom: 20, left: 20,
              width: 200,
              background: 'var(--nx-white)',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid var(--nx-cream-300)',
              boxShadow: '0 12px 40px rgba(11,31,58,0.10)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>This Month</div>
              {[
                { label: 'Income', value: '$6,200', color: 'var(--nx-pos-500)' },
                { label: 'Spent', value: '$4,710', color: 'var(--nx-neg-500)' },
                { label: 'Saved', value: '$1,490', color: 'var(--nx-navy-800)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-mono)', color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Card 5 — bottom right: goals */}
            <div style={{
              position: 'absolute', bottom: 40, right: 0,
              width: 220,
              background: 'var(--nx-white)',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid var(--nx-cream-300)',
              boxShadow: '0 12px 40px rgba(11,31,58,0.10)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Goals</div>
              {[
                { label: 'Emergency Fund', pct: 70 },
                { label: 'House Down Payment', pct: 38 },
              ].map(g => (
                <div key={g.label} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--nx-navy-900)', fontWeight: 500 }}>{g.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{g.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--nx-cream-200)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${g.pct}%`, background: 'var(--nx-navy-800)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── MODULE PILL FILTERS ── */}
        <div style={{ paddingTop: 52, paddingBottom: 40, borderTop: '1px solid var(--nx-cream-300)', marginTop: 40, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 14, color: 'var(--nx-ink-400)', fontWeight: 500, whiteSpace: 'nowrap' }}>
            Explore by module →
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Budget', href: '/budget' },
              { label: 'Portfolio', href: '/portfolio' },
              { label: 'AI Plan', href: '/plan' },
              { label: 'Debt', href: '/debt' },
              { label: 'Goals', href: '/goals' },
              { label: 'Tax', href: '/tax' },
            ].map((m, i) => (
              <Link key={m.label} href={`/signup`} style={{
                fontSize: 14, fontWeight: i === 0 ? 600 : 500,
                padding: '7px 18px', borderRadius: 999, cursor: 'pointer',
                background: i === 0 ? 'var(--nx-navy-800)' : 'transparent',
                color: i === 0 ? 'var(--nx-cream-50)' : 'var(--nx-ink-600)',
                border: i === 0 ? '1px solid var(--nx-navy-800)' : '1px solid var(--nx-cream-300)',
                transition: 'all 140ms', textDecoration: 'none',
              }}>
                {m.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FEATURES STRIP ══════ */}
      <section style={{ padding: '80px 48px', background: 'var(--nx-navy-800)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 56 }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-cream-50)', lineHeight: 1.1, maxWidth: 440 }}>
              One platform.<br />
              <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>Your complete financial life.</span>
            </h2>
            <Link href="/signup" style={{
              fontSize: 14, fontWeight: 600, padding: '10px 24px', borderRadius: 6,
              background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}>
              Get started free →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1 }}>
            {[
              { title: 'Budget Tracker', desc: 'Track every dollar by category. Live income vs spending with visual charts.', icon: '→' },
              { title: 'Portfolio & Markets', desc: 'Live stock prices, gain/loss tracking, and smart allocation insights.', icon: '→' },
              { title: 'AI Financial Plan', desc: 'Claude AI builds a personalized ETF roadmap based on your real data.', icon: '→' },
              { title: 'Debt Payoff Planner', desc: 'Avalanche or snowball strategy with exact payoff dates and interest saved.', icon: '→' },
              { title: 'Tax Assistant', desc: 'Federal tax estimation, loss harvesting opportunities, and deadline tracking.', icon: '→' },
              { title: 'Goal Tracking', desc: 'Set financial goals and watch every module work together to hit them.', icon: '→' },
            ].map((f, i) => (
              <div key={f.title} style={{
                padding: '32px 28px',
                borderTop: '1px solid var(--nx-navy-700)',
                borderLeft: i % 3 !== 0 ? '1px solid var(--nx-navy-700)' : 'none',
              }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nx-cream-50)', marginBottom: 10, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--nx-navy-300)', marginBottom: 18 }}>{f.desc}</p>
                <span style={{ fontSize: 13, color: 'var(--nx-gold-400)', fontWeight: 600 }}>Learn more →</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ QUOTE / SOCIAL PROOF ══════ */}
      <section style={{ padding: '96px 48px', background: 'var(--nx-cream-50)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 28 }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="var(--nx-gold-500)" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.35, color: 'var(--nx-navy-900)', marginBottom: 32, fontStyle: 'italic' }}>
            &ldquo;I finally understand where my money is going — and where it should be going. The AI plan changed everything.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--nx-gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--nx-navy-900)' }}>S</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-navy-900)' }}>Sarah M.</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Teacher · Phoenix, AZ</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ BOTTOM CTA ══════ */}
      <section style={{ padding: '80px 48px', background: 'var(--nx-navy-900)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-cream-50)', marginBottom: 20, lineHeight: 1.1 }}>
          Ready to start?
        </h2>
        <p style={{ fontSize: 17, color: 'var(--nx-navy-300)', marginBottom: 36 }}>
          Free to start. No credit card. No advisor fees.
        </p>
        <Link href="/signup" style={{
          fontSize: 16, fontWeight: 600, padding: '14px 36px', borderRadius: 7,
          background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
        }}>
          Create your free account →
        </Link>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ background: 'var(--nx-navy-900)', borderTop: '1px solid var(--nx-navy-800)', padding: '24px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: 'var(--nx-cream-50)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--nx-cream-200)' }}>Nexus</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--nx-navy-500)', textAlign: 'center' }}>
          For educational purposes only. Not financial advice. Always consult a licensed advisor.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Contact', href: 'mailto:aaronromans35@gmail.com' },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{ fontSize: 12, color: 'var(--nx-navy-500)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
