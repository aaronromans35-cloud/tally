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
        {[{ label: 'Features', href: '/#features' }, { label: 'Pricing', href: '/pricing' }, { label: 'About', href: '/about' }, { label: 'Blog', href: '/blog' }].map(l => (
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

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Everything you need to get started building better financial habits.',
    cta: 'Start for free',
    href: '/signup',
    highlight: false,
    features: [
      'Budget tracker (unlimited categories)',
      'Log up to 50 transactions/month',
      'Portfolio tracking (up to 5 holdings)',
      'Goal tracking (up to 3 goals)',
      'Basic tax estimate',
      'Debt payoff calculator',
    ],
  },
  {
    name: 'Pro',
    price: '$9',
    period: 'per month',
    desc: 'AI-powered planning and unlimited everything for serious wealth builders.',
    cta: 'Start Pro free for 14 days',
    href: '/signup',
    highlight: true,
    features: [
      'Everything in Free',
      'Unlimited transactions & holdings',
      'AI Financial Plan (Claude-powered)',
      'Unlimited goals',
      'Advanced tax assistant + TLH',
      'Portfolio rebalancing suggestions',
      'Priority support',
      'Plan history & regeneration',
    ],
  },
  {
    name: 'Family',
    price: '$19',
    period: 'per month',
    desc: 'Up to 5 household members sharing one powerful financial dashboard.',
    cta: 'Get Family plan',
    href: '/signup',
    highlight: false,
    features: [
      'Everything in Pro',
      'Up to 5 member accounts',
      'Shared goal tracking',
      'Household net worth dashboard',
      'Combined tax overview',
      'Dedicated onboarding call',
    ],
  },
]

const FAQS = [
  { q: 'Is my financial data secure?', a: 'Yes. All data is encrypted at rest and in transit. We use Supabase with row-level security — your data is only ever accessible by you.' },
  { q: 'Does Nexus connect to my bank?', a: 'Not currently. You log transactions manually, which keeps you in control and aware of every dollar. Bank sync is on our roadmap.' },
  { q: 'Can I cancel anytime?', a: 'Absolutely. No long-term commitments. Cancel from your settings page and you keep access until the end of your billing period.' },
  { q: 'Is the AI plan real financial advice?', a: 'Nexus is for educational and planning purposes only. The AI builds personalized strategies based on your data, but it is not a licensed financial advisor.' },
  { q: 'What AI model powers the plan?', a: 'Nexus uses Claude by Anthropic — the same model behind Claude.ai — to analyze your full financial picture and generate your plan.' },
]

export default function PricingPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)' }}>
      <NavBar />

      {/* Hero */}
      <section style={{ padding: '80px 48px 64px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 14px', borderRadius: 999, marginBottom: 20, background: 'var(--nx-gold-100)', border: '1px solid var(--nx-gold-200)' }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B5318' }}>Simple pricing</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-navy-900)', marginBottom: 18, lineHeight: 1.1 }}>
          Free to start.<br />
          <span style={{ color: 'var(--nx-gold-500)', fontStyle: 'italic' }}>Powerful when you need it.</span>
        </h1>
        <p style={{ fontSize: 18, color: 'var(--muted)', maxWidth: 480, margin: '0 auto' }}>
          No hidden fees. No advisor commissions. Cancel anytime.
        </p>
      </section>

      {/* Plans */}
      <section style={{ padding: '0 48px 80px', maxWidth: 1080, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {PLANS.map(plan => (
            <div key={plan.name} style={{
              borderRadius: 16,
              padding: '32px 28px',
              background: plan.highlight ? 'var(--nx-navy-800)' : 'var(--nx-white)',
              border: plan.highlight ? 'none' : '1px solid var(--nx-cream-300)',
              boxShadow: plan.highlight ? '0 24px 64px rgba(11,31,58,0.22)' : '0 2px 8px rgba(11,31,58,0.06)',
              position: 'relative',
            }}>
              {plan.highlight && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', padding: '4px 16px', borderRadius: 999, background: 'var(--nx-gold-500)', color: 'var(--nx-navy-900)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  Most Popular
                </div>
              )}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: plan.highlight ? 'var(--nx-gold-300)' : 'var(--muted)', marginBottom: 12 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 52, fontWeight: 400, letterSpacing: '-0.03em', lineHeight: 1, color: plan.highlight ? 'var(--nx-cream-50)' : 'var(--nx-navy-900)' }}>{plan.price}</span>
                  <span style={{ fontSize: 14, color: plan.highlight ? 'var(--nx-navy-300)' : 'var(--muted)' }}>/{plan.period}</span>
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: plan.highlight ? 'var(--nx-navy-300)' : 'var(--muted)' }}>{plan.desc}</p>
              </div>

              <Link href={plan.href} style={{
                display: 'block', textAlign: 'center',
                fontSize: 14, fontWeight: 600, padding: '11px 0', borderRadius: 7,
                background: plan.highlight ? 'var(--nx-gold-500)' : 'transparent',
                color: plan.highlight ? 'var(--nx-navy-900)' : 'var(--nx-navy-800)',
                border: plan.highlight ? 'none' : '1px solid var(--nx-navy-300)',
                textDecoration: 'none', marginBottom: 28,
              }}>
                {plan.cta}
              </Link>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={plan.highlight ? 'var(--nx-gold-400)' : 'var(--nx-pos-500)'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}>
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    <span style={{ fontSize: 13.5, color: plan.highlight ? 'var(--nx-navy-200)' : 'var(--nx-ink-600)', lineHeight: 1.45 }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '72px 48px', background: 'var(--nx-white)', borderTop: '1px solid var(--nx-cream-300)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 36, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-navy-900)', marginBottom: 48, textAlign: 'center' }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQS.map((faq, i) => (
              <div key={faq.q} style={{ padding: '24px 0', borderTop: i === 0 ? '1px solid var(--nx-cream-300)' : '1px solid var(--nx-cream-300)', borderBottom: i === FAQS.length - 1 ? '1px solid var(--nx-cream-300)' : 'none' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--nx-navy-900)', marginBottom: 8 }}>{faq.q}</h3>
                <p style={{ fontSize: 14.5, lineHeight: 1.65, color: 'var(--muted)' }}>{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section style={{ padding: '80px 48px', background: 'var(--nx-navy-800)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 44, fontWeight: 400, letterSpacing: '-0.025em', color: 'var(--nx-cream-50)', marginBottom: 16, lineHeight: 1.1 }}>
          Start free today.
        </h2>
        <p style={{ fontSize: 16, color: 'var(--nx-navy-300)', marginBottom: 32 }}>No credit card required. Upgrade when you&apos;re ready.</p>
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
