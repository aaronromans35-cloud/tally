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
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 48 }}>Last updated: July 2026</p>

        <Section title="Acceptance of Terms">
          <P>These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the Nexus financial literacy platform (&ldquo;Service&rdquo;) operated by Nexus (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;).</P>
          <P>By creating an account or using the Service, you agree to be bound by these Terms. If you are under 18, your parent, guardian, or authorized school representative must also agree to these Terms on your behalf. If you do not agree to these Terms, do not use the Service.</P>
          <P>For school or district deployments, the educator or administrator who sets up the classroom accepts these Terms on behalf of the institution and its students.</P>
        </Section>

        <Section title="Eligibility & Age Requirements">
          <P>You must be at least 13 years old to use Nexus. Users under 13 may only use the Service through a school or district deployment where the school has obtained appropriate parental consents as required by COPPA and applicable law.</P>
          <P>By using the Service, you represent that you meet the age requirements above, or that you are a school or district that has obtained the necessary authorizations for student use.</P>
          <P>We reserve the right to terminate accounts that we determine are held by users who do not meet these requirements.</P>
        </Section>

        <Section title="Educational Purpose Only — Not Financial Advice">
          <p style={{ marginBottom: 12, fontWeight: 600, color: 'var(--nx-navy-900)' }}>IMPORTANT: Nexus is an educational tool only. Nothing in the Service — including AI-generated financial plans, investment projections, stock analyses, portfolio suggestions, debt payoff recommendations, or any other content — constitutes financial, investment, tax, or legal advice.</p>
          <P>Specifically:</P>
          <UL items={[
            'AI-generated financial plans are illustrative and educational. They are not personalized financial advice from a licensed professional.',
            'Stock analyses and market data are for educational purposes only. They are not buy, sell, or hold recommendations.',
            'Investment projections and compound interest calculations are hypothetical estimates, not guarantees of future performance.',
            'Debt payoff strategies shown in the app are mathematical models, not professional debt counseling.',
            'All financial data shown (stock prices, market caps, etc.) may be delayed and may not reflect real-time market conditions.',
          ]} />
          <P>Always consult a licensed financial advisor, tax professional, or attorney before making any real financial decisions. Past performance does not guarantee future results. All investments involve risk, including the possible loss of principal.</P>
        </Section>

        <Section title="Simulation — No Real Money">
          <P>The stock market simulation feature within Nexus uses simulated money only. No real currency, securities, or financial instruments are involved. Trades executed within the simulation have no effect on real markets and do not constitute actual investment activity.</P>
          <P>Nexus is not a broker-dealer and is not registered with the SEC, FINRA, or any other financial regulatory body. The simulation is a classroom learning tool only.</P>
        </Section>

        <Section title="School & Educator Use">
          <P>Teachers and school administrators who create classrooms on Nexus agree to:</P>
          <UL items={[
            'Use the Service only for legitimate educational purposes within their institution.',
            'Obtain any required parental consents before enrolling students under 13.',
            'Provide students and parents with appropriate notice of student use of Nexus, consistent with FERPA obligations.',
            'Not share student account credentials or class join codes beyond the intended student population.',
            'Promptly notify us at aaronromans35@gmail.com if they become aware of any unauthorized access or privacy concern.',
            'Not use student data accessed through the teacher dashboard for any purpose other than educational guidance.',
          ]} />
          <P>Schools that wish to enter into a formal Data Processing Agreement (DPA) or Student Data Privacy Agreement (SDPA) should contact us at aaronromans35@gmail.com. We are committed to supporting schools in meeting their compliance obligations.</P>
        </Section>

        <Section title="Acceptable Use">
          <P>You agree to use Nexus only for lawful, educational purposes. You must not:</P>
          <UL items={[
            'Attempt to access another user\'s account or data without authorization.',
            'Upload, post, or transmit any content that is unlawful, harmful, threatening, abusive, defamatory, or otherwise objectionable.',
            'Attempt to reverse engineer, decompile, or circumvent any security measures of the Service.',
            'Use the Service to collect or harvest personal information about other users.',
            'Use automated scripts, bots, or scrapers to access the Service.',
            'Attempt to overload or disrupt the Service through denial-of-service attacks or excessive API requests.',
            'Misrepresent your identity, age, or affiliation when creating an account.',
            'Use the Service for any commercial purpose other than as explicitly permitted.',
          ]} />
        </Section>

        <Section title="Your Data & Content">
          <P>You retain full ownership of all financial data and content you enter into Nexus. We do not claim any intellectual property rights over your personal financial information.</P>
          <P>By using the Service, you grant us a limited, non-exclusive license to store and process your data solely as necessary to provide the Service to you. This license ends when you delete your account.</P>
          <P>For school deployments, the school or district retains rights over student education records as defined under FERPA. Our use of that data is limited to operating the educational service.</P>
        </Section>

        <Section title="Account Security">
          <P>You are responsible for maintaining the confidentiality of your account credentials. You are responsible for all activity that occurs under your account.</P>
          <P>You agree to notify us immediately at aaronromans35@gmail.com if you suspect unauthorized access to your account. We are not liable for losses resulting from unauthorized use of your account due to your failure to secure your credentials.</P>
          <P>We recommend using a strong, unique password and not sharing your login credentials with anyone.</P>
        </Section>

        <Section title="Service Availability & Modifications">
          <P>We strive to keep Nexus available at all times but do not guarantee uninterrupted or error-free access. The Service is provided on an &ldquo;as available&rdquo; basis.</P>
          <P>We reserve the right to modify, suspend, or discontinue the Service or any feature at any time. For school customers relying on the Service for classroom instruction, we will make reasonable efforts to provide advance notice of material changes or discontinuation.</P>
          <P>We may update these Terms from time to time. We will notify users of material changes by updating the &ldquo;Last updated&rdquo; date. Continued use of the Service after changes take effect constitutes acceptance of the updated Terms.</P>
        </Section>

        <Section title="Disclaimer of Warranties">
          <P>THE SERVICE IS PROVIDED &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</P>
          <P>We do not warrant that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We do not warrant the accuracy, completeness, or timeliness of any financial data, AI-generated content, or stock information provided through the Service.</P>
        </Section>

        <Section title="Limitation of Liability">
          <P>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEXUS AND ITS OPERATORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF PROFITS, DATA, OR GOODWILL, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.</P>
          <P>IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU EXCEED THE AMOUNT YOU PAID TO USE THE SERVICE IN THE TWELVE MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER IS GREATER.</P>
          <P>NEXUS IS NOT LIABLE FOR ANY FINANCIAL DECISIONS, INVESTMENTS, OR ACTIONS TAKEN BY ANY USER BASED ON CONTENT PROVIDED THROUGH THE SERVICE. THE EDUCATIONAL CONTENT IN NEXUS IS NOT A SUBSTITUTE FOR PROFESSIONAL FINANCIAL ADVICE.</P>
          <P>Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so some of the above limitations may not apply to you.</P>
        </Section>

        <Section title="Indemnification">
          <P>You agree to indemnify and hold harmless Nexus and its operators from any claims, damages, losses, or expenses (including reasonable legal fees) arising from your use of the Service, your violation of these Terms, or your violation of any third-party rights.</P>
        </Section>

        <Section title="Governing Law">
          <P>These Terms are governed by the laws of the United States and the State of Illinois, without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts of Illinois, and you consent to personal jurisdiction in that venue.</P>
          <P>For users in jurisdictions that require local law to apply, we comply with applicable local law to the extent required.</P>
        </Section>

        <Section title="Contact">
          <P>For questions about these Terms, to report a violation, or to request a school Data Processing Agreement:</P>
          <P><strong>Email:</strong> aaronromans35@gmail.com</P>
          <P>We aim to respond to all inquiries within 5 business days.</P>
        </Section>
      </div>
    </div>
  )
}
