import Link from 'next/link'

function NavBar() {
  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--nx-cream-50)',
      borderBottom: '1px solid var(--nx-cream-300)',
      height: 62, padding: '0 48px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    }}>
      <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
        <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
        </div>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
      </Link>
      <div style={{ display: 'flex', gap: 36 }}>
        {[{ label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/pricing' }, { label: 'About', href: '/about' }].map(l => (
          <Link key={l.label} href={l.href} style={{ fontSize: 14, color: 'var(--nx-ink-500)', fontWeight: 500, textDecoration: 'none' }}>{l.label}</Link>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: 'var(--nx-ink-600)', textDecoration: 'none', padding: '7px 14px' }}>Sign in</Link>
        <Link href="/signup" style={{ fontSize: 14, fontWeight: 600, padding: '8px 20px', borderRadius: 6, background: 'var(--nx-navy-800)', color: 'var(--nx-cream-50)', textDecoration: 'none' }}>Get started</Link>
      </div>
    </nav>
  )
}

const VALUES = [
  {
    title: 'Clarity over complexity',
    desc: 'Finance is already complicated enough. We cut the jargon, surface what matters, and make your numbers easy to act on.',
  },
  {
    title: 'AI that actually knows you',
    desc: 'Unlike generic advice columns, Nexus AI reads your real data — your income, debt, goals, and risk tolerance — before saying a word.',
  },
  {
    title: 'Your data stays yours',
    desc: 'We never sell your data. No ad targeting, no broker referrals. We make money when you upgrade, not by monetizing your financial life.',
  },
  {
    title: 'Built for regular people',
    desc: "You don't need a $500K portfolio to deserve good financial tools. Nexus is built for teachers, freelancers, and first-generation investors.",
  },
]

const TEAM = [
  { initials: 'AR', name: 'Aaron Romans', role: 'Founder & Owner', bio: 'Built Nexus after realizing most financial apps were designed for people who already had money. Passionate about democratizing financial planning for everyone.' },
]

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)' }}>
      <NavBar />

      {/* Hero */}
      <section style={{ padding: '96px 48px 80px', maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', borderRadius: 999, marginBottom: 20, background: 'var(--nx-gold-100)', border: '1px solid var(--nx-gold-200)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B5318' }}>Our mission</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-navy-900)', marginBottom: 24, lineHeight: 1.1 }}>
          Good financial tools<br />
          shouldn&apos;t require a<br />
          <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>financial advisor.</span>
        </h1>
        <p style={{ fontSize: 18, lineHeight: 1.7, color: 'var(--muted)', maxWidth: 580, margin: '0 auto' }}>
          Nexus was built on a simple idea: the same quality of financial planning that wealthy families pay thousands of dollars for should be available to everyone — powered by AI, designed for real life.
        </p>
      </section>

      {/* Origin story */}
      <section style={{ background: 'var(--nx-navy-800)', padding: '80px 48px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--nx-gold-300)', marginBottom: 16 }}>The story</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-cream-50)', marginBottom: 20, lineHeight: 1.2 }}>
              Built out of frustration.<br />
              <span style={{ color: 'var(--nx-gold-400)', fontStyle: 'italic' }}>Refined with purpose.</span>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--nx-navy-300)', marginBottom: 16 }}>
              After years of using spreadsheets, three different budgeting apps, and paying for advice that felt generic, we realized the problem wasn&apos;t the user — it was the tools.
            </p>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--nx-navy-300)' }}>
              So we built Nexus: one platform where your budget, investments, debt, taxes, and goals all talk to each other — and where an AI that reads all of it can actually give you a plan worth following.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { value: '12,000+', label: 'Plans generated' },
              { value: '$2.4M+', label: 'Net worth tracked' },
              { value: '4.9★', label: 'Average user rating' },
              { value: '2025', label: 'Founded' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--nx-navy-700)' }}>
                <span style={{ fontSize: 13, color: 'var(--nx-navy-400)' }}>{s.label}</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 400, color: 'var(--nx-gold-300)', letterSpacing: '-0.02em' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '80px 48px', maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 38, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-navy-900)' }}>
            What we believe
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {VALUES.map((v, i) => (
            <div key={v.title} style={{
              padding: '36px 32px',
              borderTop: '1px solid var(--nx-cream-300)',
              borderLeft: i % 2 !== 0 ? '1px solid var(--nx-cream-300)' : 'none',
            }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>{v.title}</h3>
              <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--muted)' }}>{v.desc}</p>
            </div>
          ))}
          <div style={{ borderBottom: '1px solid var(--nx-cream-300)', gridColumn: '1 / -1' }} />
        </div>
      </section>

      {/* Founder */}
      <section style={{ padding: '72px 48px', background: 'var(--nx-white)', borderTop: '1px solid var(--nx-cream-300)' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-navy-900)', marginBottom: 36, textAlign: 'center' }}>
            The person behind it
          </h2>
          {TEAM.map(m => (
            <div key={m.name} style={{ padding: '36px 40px', borderRadius: 16, border: '1px solid var(--nx-cream-300)', background: 'var(--nx-cream-50)', display: 'flex', gap: 28, alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--nx-navy-800)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, color: 'var(--nx-gold-400)', flexShrink: 0 }}>
                {m.initials}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--nx-navy-900)', marginBottom: 4 }}>{m.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--nx-gold-600)', marginBottom: 14 }}>{m.role}</div>
                <p style={{ fontSize: 14.5, lineHeight: 1.7, color: 'var(--muted)' }}>{m.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '80px 48px', background: 'var(--nx-navy-800)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-cream-50)', marginBottom: 16, lineHeight: 1.1 }}>
          Join us.
        </h2>
        <p style={{ fontSize: 16, color: 'var(--nx-navy-300)', marginBottom: 32 }}>
          Start building a smarter financial future today — it&apos;s free.
        </p>
        <Link href="/signup" style={{ fontSize: 15, fontWeight: 600, padding: '12px 32px', borderRadius: 7, background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)', textDecoration: 'none', display: 'inline-flex' }}>
          Create your free account →
        </Link>
      </section>

      <footer style={{ background: 'var(--nx-navy-900)', borderTop: '1px solid var(--nx-navy-800)', padding: '22px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 22, height: 22, background: 'var(--nx-cream-50)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 12, color: 'var(--nx-navy-800)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--nx-cream-200)' }}>Nexus</span>
        </Link>
        <p style={{ fontSize: 12, color: 'var(--nx-navy-500)' }}>For educational purposes only. Not financial advice.</p>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Contact', href: 'mailto:aaronromans35@gmail.com' }].map(l => (
            <Link key={l.label} href={l.href} style={{ fontSize: 12, color: 'var(--nx-navy-500)', textDecoration: 'none' }}>{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}
