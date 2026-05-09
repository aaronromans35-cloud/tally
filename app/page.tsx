import Link from 'next/link'

/* ── tiny inline sparkline ── */
function MiniSparkline({ color = '#C9A437' }: { color?: string }) {
  const pts = [0, 14, 5, 11, 10, 13, 15, 8, 20, 10, 25, 4, 30, 0]
  const pairs: [number, number][] = []
  for (let i = 0; i < pts.length; i += 2) pairs.push([pts[i], pts[i + 1]])
  const path = pairs.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(' ')
  const area = `${path} L30,20 L0,20 Z`
  return (
    <svg viewBox="0 0 30 20" style={{ width: '100%', height: 38 }} preserveAspectRatio="none">
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ── compound bar mini ── */
function CompoundBar({ age, value, max, color }: { age: number; value: number; max: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
        ${value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : `${Math.round(value / 1000)}K`}
      </div>
      <div style={{ width: '100%', height: 80, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        <div style={{ width: '100%', height: `${pct}%`, background: color, borderRadius: '4px 4px 0 0' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--nx-navy-400)' }}>Age {age}</div>
    </div>
  )
}

export default function LandingPage() {
  // Compound interest preview: $100/mo, 7% return, retire at 65
  const fv = (start: number) => {
    const r = 0.07 / 12, n = (65 - start) * 12
    return 100 * (((1 + r) ** n - 1) / r)
  }
  const fv16 = Math.round(fv(16))
  const fv22 = Math.round(fv(22))
  const fv30 = Math.round(fv(30))
  const maxFV = fv16

  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>

      {/* ══════ NAV ══════ */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(253,251,246,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--nx-cream-300)',
        height: 62,
        padding: '0 clamp(20px, 5vw, 48px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
        </div>

        <div style={{ display: 'flex', gap: 32 }} className="desktop-nav-links">
          {[
            { label: 'Features', href: '#features' },
            { label: 'For Educators', href: '#educators' },
            { label: 'Blog', href: '/blog' },
          ].map(l => (
            <Link key={l.label} href={l.href} style={{ fontSize: 14, color: 'var(--nx-ink-500)', fontWeight: 500, textDecoration: 'none' }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--nx-ink-600)', textDecoration: 'none', padding: '7px 14px' }}>
            Sign in
          </Link>
          <Link href="/signup" style={{
            fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 6,
            background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)',
            textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
          }}>
            Start free
          </Link>
        </div>
      </nav>

      {/* ══════ HERO ══════ */}
      <section style={{ padding: 'clamp(40px,6vw,80px) clamp(20px,5vw,48px) 0', minHeight: 'calc(100vh - 62px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0, flex: 1, alignItems: 'flex-start', maxWidth: 1200, margin: '0 auto', width: '100%' }}>

          {/* ── LEFT ── */}
          <div style={{ paddingTop: 16, paddingRight: 'clamp(0px,3vw,48px)' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '5px 14px', borderRadius: 999,
              background: 'var(--nx-gold-50)', border: '1px solid var(--nx-gold-200)',
              marginBottom: 24,
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--nx-gold-500)" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--nx-gold-700)', letterSpacing: '0.02em' }}>Free for students &amp; educators</span>
            </div>

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(44px, 5.5vw, 80px)',
              fontWeight: 400,
              letterSpacing: '-0.035em',
              lineHeight: 1.0,
              color: 'var(--nx-navy-900)',
              marginBottom: 28,
            }}>
              Money skills<br />
              they won&rsquo;t<br />
              teach you<br />
              <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>in school.</span>
            </h1>

            <p style={{ fontSize: 18, lineHeight: 1.65, color: 'var(--nx-ink-500)', maxWidth: 420, marginBottom: 36 }}>
              Learn to budget your first paycheck, see the insane power of compound interest, and let AI build a plan for your real life — not your parents&rsquo;.
            </p>

            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link href="/signup" style={{
                fontSize: 15, fontWeight: 600, padding: '13px 30px', borderRadius: 6,
                background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                border: '1px solid var(--nx-gold-500)',
              }}>
                Get started — it&rsquo;s free
              </Link>
              <Link href="#compound" style={{
                fontSize: 15, fontWeight: 500, padding: '13px 28px', borderRadius: 6,
                background: 'transparent', color: 'var(--nx-navy-900)',
                textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
                border: '1px solid var(--nx-navy-300)',
              }}>
                See the math ↓
              </Link>
            </div>

            <p style={{ fontSize: 13, color: 'var(--nx-ink-400)', marginTop: 16 }}>
              No credit card &middot; No experience needed &middot; Takes 2 minutes
            </p>
          </div>

          {/* ── RIGHT: hero cards ── */}
          <div style={{ position: 'relative', height: 540, minHeight: 400 }}>

            {/* Card 1 — compound interest */}
            <div style={{
              position: 'absolute', top: 0, left: '22%',
              width: 240,
              background: 'var(--nx-navy-800)',
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 20px 60px rgba(11,31,58,0.25)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-gold-400)', marginBottom: 4 }}>If you start at 16</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 400, color: 'var(--nx-cream-50)', letterSpacing: '-0.02em', lineHeight: 1 }}>
                ${(fv16 / 1000000).toFixed(2)}M
              </div>
              <div style={{ fontSize: 11, color: 'var(--nx-navy-400)', marginTop: 4 }}>by retirement · $100/mo</div>
              <div style={{ marginTop: 12 }}>
                <MiniSparkline color="#C9A437" />
              </div>
              <div style={{ fontSize: 10, color: 'var(--nx-pos-400)', fontWeight: 600, marginTop: 6 }}>vs. $82K if you wait until 30 →</div>
            </div>

            {/* Card 2 — first paycheck budget */}
            <div style={{
              position: 'absolute', top: 110, left: 0,
              width: 290,
              background: 'var(--nx-white)',
              borderRadius: 16,
              padding: '20px 22px',
              border: '1px solid var(--nx-cream-300)',
              boxShadow: '0 24px 64px rgba(11,31,58,0.10)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 5 }}>This Month</div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 400, color: 'var(--nx-navy-900)', letterSpacing: '-0.02em', lineHeight: 1 }}>$840</div>
                  <div style={{ fontSize: 11, color: 'var(--nx-ink-400)', marginTop: 2 }}>first paycheck 🎉</div>
                </div>
                <div style={{ padding: '4px 10px', borderRadius: 999, background: 'var(--nx-pos-50)', color: 'var(--nx-pos-700)', fontSize: 11, fontWeight: 600 }}>On track</div>
              </div>
              {[
                { label: 'Saved (20%)', value: '$168', color: 'var(--nx-pos-500)' },
                { label: 'Car fund', value: '$84', color: 'var(--nx-gold-600)' },
                { label: 'Spent', value: '$520', color: 'var(--nx-neg-500)' },
                { label: 'Left over', value: '$68', color: 'var(--nx-ink-400)' },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)', color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>

            {/* Card 3 — AI plan */}
            <div style={{
              position: 'absolute', top: 72, right: -20,
              width: 250,
              background: 'var(--nx-navy-800)',
              borderRadius: 16,
              padding: '20px 22px',
              boxShadow: '0 20px 60px rgba(11,31,58,0.25)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--nx-gold-400)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3l1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/>
                </svg>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-gold-300)' }}>Nexus AI</span>
              </div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, lineHeight: 1.6, color: 'var(--nx-cream-50)', fontStyle: 'italic', marginBottom: 14 }}>
                Open a Roth IRA now. Even <span style={{ color: 'var(--nx-gold-300)' }}>$50/month</span> could grow to <span style={{ color: 'var(--nx-gold-300)' }}>$260K+</span> tax-free by retirement.
              </div>
              <div style={{ fontSize: 11, color: 'var(--nx-navy-400)', borderTop: '1px solid var(--nx-navy-700)', paddingTop: 10 }}>
                Personalized for your age, income &amp; goals
              </div>
            </div>

            {/* Card 4 — goals */}
            <div style={{
              position: 'absolute', bottom: 20, left: 16,
              width: 210,
              background: 'var(--nx-white)',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid var(--nx-cream-300)',
              boxShadow: '0 12px 40px rgba(11,31,58,0.08)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 12 }}>Savings Goals</div>
              {[
                { label: '🚗 Used Car', pct: 62 },
                { label: '🎓 College Fund', pct: 29 },
                { label: '💻 MacBook', pct: 88 },
              ].map(g => (
                <div key={g.label} style={{ marginBottom: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: 'var(--nx-navy-900)', fontWeight: 500 }}>{g.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{g.pct}%</span>
                  </div>
                  <div style={{ height: 5, background: 'var(--nx-cream-200)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${g.pct}%`, background: 'var(--nx-navy-800)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Card 5 — portfolio mini */}
            <div style={{
              position: 'absolute', bottom: 30, right: 0,
              width: 200,
              background: 'var(--nx-white)',
              borderRadius: 16,
              padding: '18px 20px',
              border: '1px solid var(--nx-cream-300)',
              boxShadow: '0 12px 40px rgba(11,31,58,0.08)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>My Portfolio</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 400, color: 'var(--nx-navy-900)', letterSpacing: '-0.02em', lineHeight: 1, marginBottom: 4 }}>$1,240</div>
              <div style={{ fontSize: 11, color: 'var(--nx-pos-500)', fontWeight: 600, marginBottom: 10 }}>+$94 (8.2%) 📈</div>
              <div style={{ fontSize: 11, color: 'var(--nx-ink-400)', lineHeight: 1.5 }}>
                3 index funds<br />started at 17
              </div>
            </div>
          </div>
        </div>

        {/* ── MODULE LINKS ── */}
        <div style={{ paddingTop: 48, paddingBottom: 40, borderTop: '1px solid var(--nx-cream-300)', marginTop: 40, maxWidth: 1200, margin: '40px auto 0', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: 'var(--nx-ink-400)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              Explore →
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                { label: '💰 Budget', href: '/budget' },
                { label: '📈 Portfolio', href: '/portfolio' },
                { label: '✨ AI Plan', href: '/plan' },
                { label: '🧮 Compound Calc', href: '/compound' },
                { label: '🎯 Goals', href: '/goals' },
                { label: '🧾 Tax 101', href: '/tax' },
              ].map((m, i) => (
                <Link key={m.label} href="/signup" style={{
                  fontSize: 13, fontWeight: i === 0 ? 600 : 500,
                  padding: '7px 16px', borderRadius: 999, cursor: 'pointer',
                  background: i === 0 ? 'var(--nx-navy-800)' : 'transparent',
                  color: i === 0 ? 'var(--nx-cream-50)' : 'var(--nx-ink-600)',
                  border: i === 0 ? '1px solid var(--nx-navy-800)' : '1px solid var(--nx-cream-300)',
                  textDecoration: 'none',
                }}>
                  {m.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════ COMPOUND INTEREST WOW ══════ */}
      <section id="compound" style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,48px)', background: 'var(--nx-navy-800)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-gold-400)', marginBottom: 14 }}>The Number That Changes Everything</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4.5vw,58px)', fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-cream-50)', lineHeight: 1.1, marginBottom: 18 }}>
              $100/month.<br />
              <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>Three very different futures.</span>
            </h2>
            <p style={{ fontSize: 16, color: 'var(--nx-navy-300)', maxWidth: 520, margin: '0 auto' }}>
              Investing just $100 a month at a 7% average return. The only difference? When you start.
            </p>
          </div>

          {/* three comparison cards */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 48 }}>
            {[
              { age: 16, fv: fv16, highlight: true, badge: '🏆 Start now', label: 'High school' },
              { age: 22, fv: fv22, highlight: false, badge: null, label: 'After college' },
              { age: 30, fv: fv30, highlight: false, badge: null, label: 'Age 30' },
            ].map(c => (
              <div key={c.age} style={{
                flex: '1 1 220px', maxWidth: 280,
                background: c.highlight ? 'linear-gradient(145deg, var(--nx-navy-700), var(--nx-navy-900))' : 'rgba(255,255,255,0.04)',
                borderRadius: 16,
                padding: '28px 24px',
                border: c.highlight ? '1px solid var(--nx-gold-500)' : '1px solid var(--nx-navy-700)',
                position: 'relative',
              }}>
                {c.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
                    fontSize: 11, fontWeight: 700, padding: '3px 14px', borderRadius: 999,
                    whiteSpace: 'nowrap',
                  }}>{c.badge}</div>
                )}
                <div style={{ fontSize: 11, fontWeight: 600, color: c.highlight ? 'var(--nx-gold-300)' : 'var(--nx-navy-400)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Start at {c.age} · {c.label}
                </div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 400, letterSpacing: '-0.02em', color: c.highlight ? 'var(--nx-cream-50)' : 'var(--nx-navy-300)', lineHeight: 1, marginBottom: 6 }}>
                  ${c.fv >= 1000000 ? `${(c.fv / 1000000).toFixed(2)}M` : `${Math.round(c.fv / 1000)}K`}
                </div>
                <div style={{ fontSize: 12, color: c.highlight ? 'var(--nx-navy-400)' : 'var(--nx-navy-600)', marginBottom: 16 }}>
                  by age 65
                </div>
                {/* mini bar */}
                <div style={{ height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round((c.fv / maxFV) * 100)}%`, background: c.highlight ? 'var(--nx-gold-500)' : 'var(--nx-navy-600)', borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 11, color: c.highlight ? 'var(--nx-navy-400)' : 'var(--nx-navy-700)', marginTop: 8 }}>
                  You invest: ${(c.fv >= 1000000 ? (65 - c.age) * 1200 : (65 - c.age) * 1200).toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* bar chart */}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', height: 120, padding: '0 16px', marginBottom: 28 }}>
            <CompoundBar age={16} value={fv16} max={maxFV} color="#C9A437" />
            <CompoundBar age={22} value={fv22} max={maxFV} color="#4A7FB5" />
            <CompoundBar age={30} value={fv30} max={maxFV} color="#2A4A70" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: 'var(--nx-navy-300)', marginBottom: 24 }}>
              Starting at 16 vs. 30 makes a difference of <strong style={{ color: 'var(--nx-gold-400)' }}>${(fv16 - fv30).toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> — from the exact same $100/month.
            </p>
            <Link href="/signup" style={{
              display: 'inline-flex', alignItems: 'center',
              fontSize: 15, fontWeight: 600, padding: '12px 28px', borderRadius: 6,
              background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)', textDecoration: 'none',
            }}>
              Try the full calculator →
            </Link>
          </div>
        </div>
      </section>

      {/* ══════ FEATURES ══════ */}
      <section id="features" style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,48px)', background: 'var(--nx-cream-50)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-gold-600)', marginBottom: 14 }}>Everything you need</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(36px,4.5vw,54px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-navy-900)', lineHeight: 1.1 }}>
              Built for real life.<br />
              <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>Yours, specifically.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 1, border: '1px solid var(--nx-cream-300)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              {
                emoji: '💰', title: 'Budget Tracker',
                desc: 'See exactly where your paycheck goes. Set spending limits, track every purchase, and never wonder "where did my money go?" again.',
                tag: 'Great for first jobs',
              },
              {
                emoji: '📈', title: 'Portfolio & Investments',
                desc: 'Track stocks and index funds with live prices. Learn what each holding actually does. See your gains grow in real time.',
                tag: 'No experience needed',
              },
              {
                emoji: '✨', title: 'AI Financial Plan',
                desc: 'Tell Nexus your age, income, and goals — get a real step-by-step plan. First Roth IRA, first index fund, first budget. All explained.',
                tag: 'Personalized for teens',
              },
              {
                emoji: '🧮', title: 'Compound Interest Calc',
                desc: 'See the exact dollar difference of starting to invest at 16 vs 25 vs 35. The numbers are wild. Adjust sliders and watch the gap grow.',
                tag: 'The wow moment',
              },
              {
                emoji: '🧾', title: 'Tax 101 + Assistant',
                desc: 'Understand your W-2, what FICA is, when you need to file, and how to do it free. Then ask the AI any tax question you have.',
                tag: 'Plain English only',
              },
              {
                emoji: '🎯', title: 'Goal Tracking',
                desc: 'Set goals for a car, college, emergency fund, or anything else. Watch every dollar you save move you closer to it.',
                tag: 'Your timeline',
              },
            ].map((f, i) => (
              <div key={f.title} style={{
                padding: '32px 28px',
                background: 'var(--nx-white)',
                borderRight: (i + 1) % 2 === 0 ? 'none' : '1px solid var(--nx-cream-300)',
                borderBottom: i < 4 ? '1px solid var(--nx-cream-300)' : 'none',
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.emoji}</div>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--nx-navy-900)', marginBottom: 8, letterSpacing: '-0.01em' }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--nx-ink-500)', marginBottom: 14 }}>{f.desc}</p>
                <div style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 999, background: 'var(--nx-gold-50)', color: 'var(--nx-gold-700)', display: 'inline-block', border: '1px solid var(--nx-gold-200)' }}>
                  {f.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ SOCIAL PROOF / QUOTE ══════ */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,48px)', background: 'var(--nx-navy-900)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 28 }}>
            {[1,2,3,4,5].map(i => (
              <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="var(--nx-gold-500)" stroke="none">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            ))}
          </div>
          <blockquote style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px,3.5vw,34px)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.35, color: 'var(--nx-cream-50)', marginBottom: 32, fontStyle: 'italic' }}>
            &ldquo;I opened my first Roth IRA at 17 after using Nexus. The compound interest calculator literally changed how I think about money.&rdquo;
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'var(--nx-gold-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 17, color: 'var(--nx-navy-900)' }}>J</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--nx-cream-50)' }}>Jordan T.</div>
              <div style={{ fontSize: 13, color: 'var(--nx-navy-400)' }}>High school junior · Denver, CO</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginTop: 56, flexWrap: 'wrap' }}>
            {[
              { num: '10K+', label: 'Students using Nexus' },
              { num: '$0', label: 'Cost to start' },
              { num: '2 min', label: 'To set up your plan' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-gold-400)', marginBottom: 4 }}>{s.num}</div>
                <div style={{ fontSize: 13, color: 'var(--nx-navy-400)' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ FOR EDUCATORS ══════ */}
      <section id="educators" style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,48px)', background: 'var(--nx-cream-50)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 48, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-gold-600)', marginBottom: 14 }}>For Educators</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px,4vw,48px)', fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-navy-900)', lineHeight: 1.1, marginBottom: 20 }}>
              Bring financial literacy<br />
              <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>into your classroom.</span>
            </h2>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--nx-ink-500)', marginBottom: 28 }}>
              Nexus is built to be used in high school personal finance, economics, and life skills classes. Students learn by doing — with real budgets, real compound interest math, and real AI-powered advice.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
              {[
                'Compound interest calculator perfect for in-class demos',
                'Students track budgets and savings goals all semester',
                'AI plan teaches investing fundamentals step by step',
                'Tax 101 module explains W-2s, FICA, and filing basics',
              ].map(item => (
                <div key={item} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--nx-pos-50)', border: '1px solid var(--nx-pos-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--nx-pos-600)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <span style={{ fontSize: 14, color: 'var(--nx-ink-600)', lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
            <Link href="mailto:aaronromans35@gmail.com" style={{
              fontSize: 14, fontWeight: 600, padding: '11px 24px', borderRadius: 6,
              background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
            }}>
              Contact us for classroom access →
            </Link>
          </div>

          {/* educator feature card */}
          <div style={{ background: 'var(--nx-navy-800)', borderRadius: 20, padding: '32px 28px', boxShadow: '0 24px 60px rgba(11,31,58,0.18)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--nx-gold-400)', marginBottom: 20 }}>Class Demo Mode</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--nx-cream-50)', fontWeight: 400, letterSpacing: '-0.02em', marginBottom: 24, lineHeight: 1.3 }}>
              &ldquo;What if every student in this room invested $50/month starting today?&rdquo;
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <CompoundBar age={16} value={fv16} max={maxFV} color="#C9A437" />
              <CompoundBar age={22} value={fv22} max={maxFV} color="#4A7FB5" />
              <CompoundBar age={30} value={fv30} max={maxFV} color="#2A4A70" />
            </div>
            <p style={{ fontSize: 13, color: 'var(--nx-navy-400)', lineHeight: 1.6 }}>
              Drag the sliders live in class. Students see compound interest in real time — the numbers make the lesson unforgettable.
            </p>
          </div>
        </div>
      </section>

      {/* ══════ BOTTOM CTA ══════ */}
      <section style={{ padding: 'clamp(60px,8vw,100px) clamp(20px,5vw,48px)', background: 'var(--nx-navy-900)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px,5vw,64px)', fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-cream-50)', marginBottom: 20, lineHeight: 1.05 }}>
          The best time to start<br />
          <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>is right now.</span>
        </h2>
        <p style={{ fontSize: 17, color: 'var(--nx-navy-300)', marginBottom: 36, maxWidth: 440, margin: '0 auto 36px' }}>
          Free forever. No credit card. No jargon. Just the money skills you actually need.
        </p>
        <Link href="/signup" style={{
          fontSize: 16, fontWeight: 600, padding: '14px 40px', borderRadius: 7,
          background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)',
          textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
        }}>
          Create your free account →
        </Link>
        <p style={{ fontSize: 13, color: 'var(--nx-navy-600)', marginTop: 16 }}>Takes 2 minutes &middot; No experience needed</p>
      </section>

      {/* ══════ FOOTER ══════ */}
      <footer style={{ background: 'var(--nx-navy-900)', borderTop: '1px solid var(--nx-navy-800)', padding: '24px clamp(20px,5vw,48px)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 22, height: 22, background: 'var(--nx-cream-50)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--nx-cream-200)' }}>Nexus</span>
        </div>
        <p style={{ fontSize: 12, color: 'var(--nx-navy-500)', textAlign: 'center' }}>
          For educational purposes only. Not financial advice.
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
