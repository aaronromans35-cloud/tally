import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--nx-cream-50)', fontFamily: 'var(--font-sans)' }}>
      <nav style={{ position: 'sticky', top: 0, zIndex: 50, background: 'var(--nx-cream-50)', borderBottom: '1px solid var(--nx-cream-300)', height: 62, padding: '0 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none' }}>
          <div style={{ width: 26, height: 26, background: 'var(--nx-navy-800)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14, color: 'var(--nx-cream-50)', lineHeight: 1 }}>N</span>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 500, letterSpacing: '-0.04em', color: 'var(--nx-navy-900)' }}>Nexus</span>
        </Link>
      </nav>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '72px 48px' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>Privacy Policy</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 48 }}>Last updated: May 2025</p>

        {[
          { title: 'What we collect', body: 'We collect the information you provide when creating an account (email address) and the financial data you enter into Nexus (transactions, budgets, goals, holdings, debts). We do not collect any data beyond what you explicitly enter.' },
          { title: 'How we use it', body: 'Your data is used solely to power your personal Nexus dashboard and generate AI-driven financial insights. We do not use your data for advertising, and we do not sell or share it with third parties.' },
          { title: 'Data storage', body: 'Your data is stored securely in Supabase (PostgreSQL) with row-level security enforced — meaning only you can access your own data. All connections are encrypted via TLS.' },
          { title: 'AI processing', body: 'When you generate an AI financial plan, a summary of your financial data is sent to Anthropic\'s Claude API to generate personalized recommendations. This data is not stored or used to train AI models.' },
          { title: 'Your rights', body: 'You can delete your account and all associated data at any time by contacting us. We will permanently remove all your data within 30 days of your request.' },
          { title: 'Contact', body: 'If you have any questions about this policy, email us at aaron@nexus.app.' },
        ].map(s => (
          <div key={s.title} style={{ marginBottom: 36, paddingBottom: 36, borderBottom: '1px solid var(--nx-cream-300)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', color: 'var(--nx-navy-900)', marginBottom: 10 }}>{s.title}</h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: 'var(--muted)' }}>{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
