import Link from 'next/link'

export default function TermsPage() {
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
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 48, fontWeight: 400, letterSpacing: '-0.03em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>Terms of Service</h1>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 48 }}>Last updated: May 2025</p>

        {[
          { title: 'Use of service', body: 'Nexus is a personal finance tool for educational and informational purposes only. By creating an account, you agree to use the service for lawful purposes only.' },
          { title: 'Not financial advice', body: 'Nothing in Nexus — including AI-generated plans, projections, or recommendations — constitutes financial, investment, tax, or legal advice. Always consult a licensed professional before making financial decisions.' },
          { title: 'Your account', body: 'You are responsible for maintaining the security of your account credentials. You are responsible for all activity that occurs under your account.' },
          { title: 'Your data', body: 'You retain full ownership of all data you enter into Nexus. We do not claim any rights to your personal financial information.' },
          { title: 'Service availability', body: 'We strive to keep Nexus available at all times but do not guarantee uninterrupted access. We reserve the right to modify or discontinue the service with reasonable notice.' },
          { title: 'Limitation of liability', body: 'Nexus is provided "as is" without warranties of any kind. We are not liable for any financial decisions made based on information presented in the app.' },
          { title: 'Contact', body: 'Questions about these terms? Email us at aaron@nexus.app.' },
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
