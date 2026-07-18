import Link from 'next/link'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid var(--nx-cream-300)' }}>
    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 400, letterSpacing: '-0.015em', color: 'var(--nx-navy-900)', marginBottom: 12 }}>{title}</h2>
    <div style={{ fontSize: 15, lineHeight: 1.8, color: 'var(--muted)' }}>{children}</div>
  </div>
)

const P = ({ children }: { children: React.ReactNode }) => (
  <p style={{ marginBottom: 12 }}>{children}</p>
)

const UL = ({ items }: { items: string[] }) => (
  <ul style={{ paddingLeft: 20, marginBottom: 12 }}>
    {items.map((item, i) => <li key={i} style={{ marginBottom: 6 }}>{item}</li>)}
  </ul>
)

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
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 48 }}>Last updated: July 2026</p>

        <Section title="Introduction">
          <P>Nexus (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) operates a financial literacy platform designed for educational use in high school classrooms. This Privacy Policy explains how we collect, use, and protect information about students, teachers, and other users of our service at nexus-app.vercel.app.</P>
          <P>Because Nexus is used by minors in school settings, we take privacy extremely seriously. We comply with the Family Educational Rights and Privacy Act (FERPA), the Children&rsquo;s Online Privacy Protection Act (COPPA), the Student Online Personal Information Protection Act (SOPIPA), and applicable state student privacy laws.</P>
          <P>If you have questions about this policy, contact us at: <strong>aaronromans35@gmail.com</strong></P>
        </Section>

        <Section title="Age Requirements & Parental Consent (COPPA)">
          <P>Nexus is intended for students aged 13 and older. We do not knowingly collect personal information from children under 13 without verifiable parental consent.</P>
          <P><strong>School-based use:</strong> When Nexus is deployed by a school or district, the school acts as the agent of the parents under COPPA. By authorizing student use of Nexus, the school represents that it has obtained any necessary parental consents or that consent is not required under applicable law. Schools should provide parents with notice of student use of Nexus consistent with their obligations under FERPA and COPPA.</P>
          <P>If we learn we have collected personal information from a child under 13 without proper authorization, we will delete that information promptly. Contact us at aaronromans35@gmail.com to report any such concern.</P>
        </Section>

        <Section title="Information We Collect">
          <P><strong>Account information:</strong> When you create an account, we collect your email address and a hashed password. We do not collect your real name, phone number, home address, or any government-issued ID.</P>
          <P><strong>Financial data you enter:</strong> Nexus stores the financial information you voluntarily enter, including:</P>
          <UL items={[
            'Budget categories and monthly spending entries',
            'Transaction records (descriptions, amounts, dates, categories)',
            'Savings goals (name, target amount, target date)',
            'Debt records (name, balance, interest rate)',
            'Investment portfolio holdings (ticker, shares, cost basis)',
            'Financial profile data (age, income, expenses, risk tolerance — used for AI plan generation)',
          ]} />
          <P><strong>Class and teacher data:</strong> If you are a teacher, we store the classes you create and their associated join codes. Student accounts can be associated with a class. Teachers can view the financial dashboard data of students enrolled in their classes for educational purposes.</P>
          <P><strong>Class messages:</strong> Messages posted by teachers to a class message board are stored and visible to enrolled students.</P>
          <P><strong>Usage and technical data:</strong> We collect IP addresses for rate-limiting purposes (to prevent abuse of our API). We do not build behavioral profiles from this data. Supabase (our database provider) and Vercel (our hosting provider) may log standard server access data per their own policies.</P>
          <P><strong>Stock searches:</strong> When you search a stock ticker, that ticker symbol is sent to Yahoo Finance&rsquo;s public API to retrieve price data. No personal information is included in these requests.</P>
        </Section>

        <Section title="How We Use Your Information">
          <P>We use the information we collect solely to:</P>
          <UL items={[
            'Provide and operate the Nexus educational platform',
            'Display your personal financial dashboard and tools',
            'Allow teachers to view student progress for educational purposes',
            'Generate AI-powered financial education content personalized to your entered data',
            'Rate-limit API requests to prevent abuse',
            'Respond to your support requests',
            'Improve the educational features of the platform',
          ]} />
          <P><strong>We do not use student data for any of the following:</strong></P>
          <UL items={[
            'Targeted advertising of any kind',
            'Creating advertising profiles',
            'Selling, renting, or leasing student information to any third party',
            'Building profiles for non-educational purposes',
            'Any commercial purpose unrelated to the educational service',
          ]} />
          <P>This commitment applies regardless of whether the user is a student or an adult.</P>
        </Section>

        <Section title="How We Share Information">
          <P><strong>We do not sell your data. Ever.</strong></P>
          <P><strong>Teacher access:</strong> If you are a student enrolled in a class, your teacher can view your financial dashboard data (budget, goals, debts, transactions, portfolio) for the purpose of providing educational guidance. This is analogous to a teacher reviewing a student&rsquo;s worksheet.</P>
          <P><strong>AI processing (Anthropic):</strong> When you request an AI financial plan or stock analysis, a structured summary of your relevant financial data is sent to Anthropic&rsquo;s Claude API. This includes data such as age, income range, expenses, goals, and debts — but not your email or account credentials. Anthropic processes this data to generate educational responses. Per Anthropic&rsquo;s API terms, data sent via the API is not used to train their models. See <strong>anthropic.com/privacy</strong> for Anthropic&rsquo;s privacy policy.</P>
          <P><strong>Legal requirements:</strong> We may disclose information if required by law, court order, or to protect the safety of users or the public.</P>
          <P><strong>No other sharing:</strong> We do not share your information with any other third parties.</P>
        </Section>

        <Section title="Third-Party Services We Use">
          <P>Nexus is built on the following third-party services. Each processes data only as necessary to operate the platform:</P>
          <UL items={[
            'Supabase (supabase.com) — Authentication and database hosting. Stores all account and financial data with row-level security. Data is stored in the United States.',
            'Anthropic (anthropic.com) — Claude AI API used to generate financial education content. Receives anonymized financial summaries only.',
            'Vercel (vercel.com) — Hosts the Nexus web application. May log standard web server access data.',
            'Upstash (upstash.com) — Redis database used for rate limiting. Temporarily stores IP addresses to prevent API abuse. No personal financial data is stored here.',
            'Yahoo Finance (public API) — Used to retrieve real-time stock price data. No user data is sent to Yahoo Finance.',
          ]} />
        </Section>

        <Section title="FERPA Compliance">
          <P>When Nexus is used in a school setting, the student data stored in Nexus may constitute &ldquo;education records&rdquo; under FERPA. In that context:</P>
          <UL items={[
            'We operate as a "school official" with a legitimate educational interest, as defined under FERPA.',
            'We use student data only for the purpose of providing the educational service contracted by the school.',
            'We do not disclose student education records to third parties without school authorization, except as required by law.',
            'We support schools in fulfilling their FERPA obligations, including providing access to and deletion of student records upon request.',
            'Schools retain control over student education records at all times.',
          ]} />
          <P>Schools wishing to execute a formal Data Processing Agreement (DPA) or Student Data Privacy Agreement should contact us at aaronromans35@gmail.com.</P>
        </Section>

        <Section title="Data Security">
          <P>We implement the following security measures to protect your data:</P>
          <UL items={[
            'All data is encrypted in transit using TLS/HTTPS.',
            'Supabase database uses Row Level Security (RLS) — database-enforced policies ensure users can only access their own data.',
            'API endpoints require authenticated sessions and are rate-limited.',
            'All sensitive API keys and credentials are stored as server-side environment variables and are never exposed to the browser.',
            'HTTP security headers including Content Security Policy, HSTS, X-Frame-Options, and others are applied to all responses.',
            'Passwords are hashed by Supabase Auth and never stored in plaintext.',
          ]} />
          <P>Despite these measures, no system is 100% secure. We encourage users to use strong, unique passwords and to contact us immediately if they suspect unauthorized account access.</P>
        </Section>

        <Section title="Data Retention & Deletion">
          <P>We retain your data for as long as your account is active or as needed to provide the service.</P>
          <P><strong>Account deletion:</strong> You may request deletion of your account and all associated data by emailing aaronromans35@gmail.com. We will permanently delete your data within 30 days of a verified request.</P>
          <P><strong>School-initiated deletion:</strong> Schools may request deletion of student data at any time by contacting us. We will fulfill such requests within 30 days.</P>
          <P><strong>Rate-limiting data:</strong> IP addresses stored in Upstash for rate limiting are retained for the duration of the rate-limiting window (maximum 1 hour) and are not persisted beyond that.</P>
        </Section>

        <Section title="Student & Parent Rights">
          <P>Students and their parents or guardians have the following rights regarding personal information:</P>
          <UL items={[
            'Right to access: Request a copy of the data we hold about you.',
            'Right to correction: Request correction of inaccurate data.',
            'Right to deletion: Request permanent deletion of all your data.',
            'Right to opt out: Withdraw from using the service at any time.',
          ]} />
          <P>To exercise any of these rights, email aaronromans35@gmail.com. For students in a school-managed deployment, requests may also be submitted through the school or district.</P>
        </Section>

        <Section title="Changes to This Policy">
          <P>We may update this Privacy Policy from time to time. When we make material changes, we will update the &ldquo;Last updated&rdquo; date at the top of this page. We encourage users to review this policy periodically. Continued use of the service after changes constitutes acceptance of the updated policy.</P>
          <P>For school customers, material changes that affect student data practices will be communicated directly via email before taking effect.</P>
        </Section>

        <Section title="Contact">
          <P>For privacy questions, data requests, or to execute a school Data Processing Agreement:</P>
          <P><strong>Email:</strong> aaronromans35@gmail.com</P>
          <P>We aim to respond to all privacy-related inquiries within 5 business days.</P>
        </Section>
      </div>
    </div>
  )
}
