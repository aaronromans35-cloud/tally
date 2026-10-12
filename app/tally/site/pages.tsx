/**
 * Tally site — footer destination pages (Security, Supported banks, Careers,
 * Press, Contact, and the four Legal documents).
 *
 * The legal pages are good-faith drafts written to match how Tally actually
 * works (read-only Plaid access, not a bank, no money movement, users as young
 * as ~14). They are NOT a substitute for review by a licensed attorney — see the
 * notice banner on each. Placeholders in [brackets] must be filled before launch.
 */
import type { ReactNode } from 'react'
import { DISPLAY, MONO, css as c, sx } from '../lib'

const LAST_UPDATED = 'August 31, 2026'
const COUNSEL_NOTICE =
  'Working draft — not yet reviewed by legal counsel. This document must be reviewed and adapted by a qualified attorney licensed in the applicable jurisdiction before Tally is offered to the public. Bracketed items are placeholders.'

const wrapNarrow = (p = '') => c('max-width:780px;margin:0 auto;' + p)
const display = (x: string) => sx(c(x), { fontFamily: DISPLAY })
const mono = (x: string) => sx(c(x), { fontFamily: MONO })

function Notice({ children }: { children: ReactNode }) {
  return (
    <div style={c('background:#fcf8e9;border:1px solid #d9c477;border-radius:16px;padding:18px 20px;margin-bottom:32px;font-size:14px;line-height:1.6;color:#8a6a12')}>
      {children}
    </div>
  )
}

function DocShell({
  kicker,
  title,
  intro,
  updated,
  notice,
  children,
}: {
  kicker: string
  title: string
  intro?: string
  updated?: boolean
  notice?: boolean
  children: ReactNode
}) {
  return (
    <div>
      <section style={wrapNarrow('padding:64px 32px 28px')}>
        <div style={mono('font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#1c6a48;margin-bottom:16px')}>
          {kicker}
        </div>
        <h1 style={display('font-size:44px;line-height:1.05;letter-spacing:-0.03em;font-weight:700;margin:0 0 14px')}>
          {title}
        </h1>
        {intro ? (
          <p style={c('font-size:18px;line-height:1.6;color:#4a4941;margin:0 0 10px')}>{intro}</p>
        ) : null}
        {updated ? <div style={mono('font-size:12px;color:#6b6a60')}>Last updated {LAST_UPDATED}</div> : null}
      </section>
      <section style={wrapNarrow('padding:12px 32px 96px')}>
        {notice ? <Notice>{COUNSEL_NOTICE}</Notice> : null}
        {children}
      </section>
    </div>
  )
}

function Sec({ h, children }: { h: string; children: ReactNode }) {
  return (
    <div style={c('margin-bottom:26px')}>
      <h2 style={display('font-size:21px;font-weight:700;letter-spacing:-0.02em;margin:0 0 10px')}>{h}</h2>
      {children}
    </div>
  )
}

function P({ children }: { children: ReactNode }) {
  return <p style={c('font-size:16px;line-height:1.65;color:#4a4941;margin:0 0 10px')}>{children}</p>
}

function UL({ items }: { items: ReactNode[] }) {
  return (
    <ul style={c('margin:6px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:8px')}>
      {items.map((it, i) => (
        <li key={i} style={c('display:flex;gap:10px;font-size:16px;line-height:1.6;color:#4a4941')}>
          <span style={c('width:6px;height:6px;border-radius:99px;background:#1c6a48;margin-top:9px;flex:none')} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  )
}

const Mail = ({ a }: { a: string }) => (
  <a href={`mailto:${a}`} style={c('color:#1c6a48;font-weight:500')}>
    {a}
  </a>
)

/* ─────────────────────────── Security ─────────────────────────── */

export function SecurityPage() {
  return (
    <DocShell
      kicker="Security"
      title="How Tally protects your data"
      intro="Tally is designed so that the worst-case outcome of a breach is limited: there is no ability to move your money, and we never hold your bank login."
      updated
    >
      <Sec h="Read-only by design">
        <P>
          Tally connects through Plaid and requests only transaction and balance history. The
          connection has no capability to move, send, or withdraw money — the permission is never
          granted, so it cannot be misused by us or by an attacker.
        </P>
      </Sec>
      <Sec h="Your bank credentials never reach us">
        <P>
          You authenticate with your bank inside Plaid&apos;s flow. Tally receives an access token,
          never your username or password. We cannot see, store, or recover them.
        </P>
      </Sec>
      <Sec h="Encryption">
        <P>
          Data is encrypted in transit with TLS 1.2 or higher and at rest with AES-256. Plaid access
          tokens are held in an isolated secrets store, separate from the application database.
        </P>
      </Sec>
      <Sec h="Access controls">
        <P>
          Employee access to production data is restricted, logged, and granted only when needed to
          provide support you have asked for.
        </P>
      </Sec>
      <Sec h="Data minimization and deletion">
        <P>
          We store the transaction fields needed to run buckets, recurring-charge detection, goals,
          and recaps. Disconnect an account and the stored history for it is deleted within 30 days,
          except limited records we must keep for legal or security reasons.
        </P>
      </Sec>
      <Sec h="Sub-processors">
        <P>
          Our core sub-processors are Plaid (account connectivity) and our cloud hosting provider. We
          do not sell data or share it for advertising.
        </P>
      </Sec>
      <Sec h="Reporting a vulnerability">
        <P>
          Email <Mail a="security@tally.app" />. We aim to acknowledge within three business days. We
          will not pursue legal action against good-faith research that respects user privacy, avoids
          service disruption, and gives us reasonable time to fix an issue before disclosure.
        </P>
      </Sec>
      <Sec h="What we are still building">
        <P>
          Tally is pre-launch. Independent penetration testing and a SOC&nbsp;2 Type&nbsp;II
          examination are planned before general availability. This page will be updated when they
          are complete.
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Supported banks ─────────────────────────── */

export function BanksPage() {
  return (
    <DocShell
      kicker="Supported banks"
      title="Which banks work with Tally"
      intro="If you can connect it in another budgeting app, you can almost certainly connect it in Tally."
    >
      <Sec h="Coverage">
        <P>
          Tally works with any financial institution supported by Plaid — thousands of banks and
          credit unions across the United States, including national and regional banks, credit
          unions, campus banks, and most popular online checking accounts.
        </P>
      </Sec>
      <Sec h="Commonly connected">
        <P>
          Chase, Bank of America, Wells Fargo, Capital One, Citi, U.S. Bank, PNC, Truist, Ally, Chime,
          SoFi, and the large majority of credit unions.
        </P>
      </Sec>
      <Sec h="Account types">
        <P>
          Checking and savings accounts today. Credit cards and other account types are on the
          roadmap.
        </P>
      </Sec>
      <Sec h="If your bank isn't listed">
        <P>
          Plaid adds institutions regularly. Tell us at <Mail a="support@tally.app" /> and we&apos;ll
          flag it and let you know when support lands.
        </P>
      </Sec>
      <Sec h="A note on reliability">
        <P>
          Connection quality depends on each bank&apos;s Plaid integration. A small number of
          institutions occasionally ask you to re-authenticate; Tally will prompt you when that
          happens.
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Careers ─────────────────────────── */

export function CareersPage() {
  return (
    <DocShell
      kicker="Careers"
      title="Working at Tally"
      intro="We're a small team building the first version of the product."
    >
      <Sec h="Where we are">
        <P>
          Tally is early-stage and is not running a formal hiring process right now. When we open
          roles, they will be listed on this page.
        </P>
      </Sec>
      <Sec h="Open roles">
        <P>None currently.</P>
      </Sec>
      <Sec h="Interested anyway?">
        <P>
          Send a short note and a link to your work to <Mail a="careers@tally.app" />. We read
          everything and keep promising notes on file.
        </P>
      </Sec>
      <Sec h="How we work">
        <P>
          Small team, remote-friendly, direct communication, and a bias toward shipping something
          honest over something flashy. The product principles on our About page are the ones we
          hire against.
        </P>
      </Sec>
      <Sec h="Equal opportunity">
        <P>
          Tally, Inc. is an equal-opportunity employer. We do not discriminate on the basis of race,
          color, religion, sex, sexual orientation, gender identity, national origin, age, disability,
          veteran status, or any other characteristic protected by law.
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Press ─────────────────────────── */

export function PressPage() {
  return (
    <DocShell kicker="Press" title="Press & media" intro="For interviews, fact-checks, and brand assets.">
      <Sec h="Media contact">
        <P>
          <Mail a="press@tally.app" /> — we&apos;re happy to fact-check details before publication.
        </P>
      </Sec>
      <Sec h="About Tally (boilerplate)">
        <P>
          Tally is a personal-finance app for people roughly 14 to 24 years old. It connects
          read-only to a bank account the user already has, sorts spending into four budget buckets,
          flags recurring charges and free-trial conversions, tracks savings goals, and builds a
          daily habit streak. Tally is not a bank and cannot move money. Account connectivity is
          provided by Plaid.
        </P>
      </Sec>
      <Sec h="Company">
        <P>Tally, Inc. Founded 2026. [Headquarters city, state.]</P>
      </Sec>
      <Sec h="Brand assets">
        <P>
          Logo files and usage guidelines are available on request. Please do not modify the mark, or
          imply partnership or endorsement, without written permission.
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Contact ─────────────────────────── */

export function ContactPage() {
  return (
    <DocShell kicker="Contact" title="Get in touch" intro="The fastest route depends on what you need.">
      <Sec h="Support">
        <P>
          <Mail a="support@tally.app" /> — account questions, a connection problem, or a bug. We aim
          to reply within two business days.
        </P>
      </Sec>
      <Sec h="Privacy requests">
        <P>
          <Mail a="privacy@tally.app" /> — access, correction, or deletion of your data. See the
          Privacy Policy for what we can do and how quickly.
        </P>
      </Sec>
      <Sec h="Security">
        <P>
          <Mail a="security@tally.app" /> — report a vulnerability or a suspected incident.
        </P>
      </Sec>
      <Sec h="Press">
        <P>
          <Mail a="press@tally.app" />
        </P>
      </Sec>
      <Sec h="Mail">
        <P>Tally, Inc., [street address], [city, state ZIP], United States. [Confirm before publishing.]</P>
      </Sec>
      <Sec h="Not a channel for moving money">
        <P>
          Tally cannot transfer, hold, or refund funds. For anything involving your actual balance,
          contact your bank directly.
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Terms of Service ─────────────────────────── */

export function TermsPage() {
  return (
    <DocShell kicker="Legal" title="Terms of Service" updated notice>
      <Sec h="1. Agreement to these terms">
        <P>
          By creating a Tally account or using the service you agree to these Terms and to the
          Privacy Policy. If you do not agree, do not use Tally.
        </P>
      </Sec>
      <Sec h="2. Who may use Tally">
        <P>
          You must be at least 13 years old. If you are under the age of majority where you live
          (typically 18), you may use Tally only with the involvement and consent of a parent or
          legal guardian, who agrees to these Terms on your behalf. You must have the right to
          connect any financial account you link.
        </P>
      </Sec>
      <Sec h="3. What Tally is">
        <P>
          Tally is a read-only budgeting and financial-habit tool. It connects to accounts you
          already hold at third-party financial institutions through Plaid, reads transaction and
          balance information, and presents budgeting insights, subscription detection, goal
          tracking, and a habit streak.
        </P>
      </Sec>
      <Sec h="4. What Tally is not">
        <P>
          Tally is not a bank, money transmitter, broker-dealer, investment adviser, or credit-repair
          organization. Tally does not hold, move, send, receive, invest, or lend funds, and cannot
          do so. Nothing in the service is financial, investment, tax, or legal advice. Decisions
          about your money are yours.
        </P>
      </Sec>
      <Sec h="5. Third-party services">
        <P>
          Account connectivity is provided by Plaid Inc. and is subject to Plaid&apos;s end-user
          privacy policy and terms. Your financial institutions are not parties to these Terms and
          set their own rules for account access. Tally is not responsible for the acts or omissions
          of these third parties.
        </P>
      </Sec>
      <Sec h="6. Your responsibilities">
        <P>
          Provide accurate information, keep your login secure, use Tally only for lawful personal
          purposes, and do not attempt to disrupt, probe, or reverse-engineer the service except as
          permitted by our security policy. You are responsible for activity under your account.
        </P>
      </Sec>
      <Sec h="7. Accuracy of information">
        <P>
          Tally&apos;s figures are derived from data provided by third parties and may be delayed,
          incomplete, or miscategorized. Verify anything important against your bank before acting on
          it.
        </P>
      </Sec>
      <Sec h="8. Fees">
        <P>
          The core features described at sign-up are currently free. If we introduce paid features,
          we will describe them and obtain your agreement before charging you.
        </P>
      </Sec>
      <Sec h="9. Intellectual property">
        <P>
          Tally and its content are owned by Tally, Inc. and its licensors. You receive a limited,
          revocable, non-transferable licence to use the service for personal purposes. Your data
          remains yours.
        </P>
      </Sec>
      <Sec h="10. Disclaimers">
        <P>
          The service is provided &quot;as is&quot; and &quot;as available&quot; without warranties
          of any kind, to the fullest extent permitted by law.
        </P>
      </Sec>
      <Sec h="11. Limitation of liability">
        <P>
          To the fullest extent permitted by law, Tally, Inc. and its team will not be liable for
          indirect, incidental, special, consequential, or punitive damages, or for lost profits or
          data. Our total liability for any claim relating to the service will not exceed the greater
          of the amount you paid Tally in the 12 months before the claim or US$50. [Confirm cap and
          any consumer-law carve-outs.]
        </P>
      </Sec>
      <Sec h="12. Indemnification">
        <P>
          You agree to indemnify Tally, Inc. against claims arising from your misuse of the service or
          violation of these Terms, to the extent permitted by law.
        </P>
      </Sec>
      <Sec h="13. Suspension and termination">
        <P>
          You may stop using Tally and disconnect your accounts at any time. We may suspend or end
          access if you violate these Terms or to protect users or the service.
        </P>
      </Sec>
      <Sec h="14. Changes">
        <P>
          We may update these Terms. Material changes will be posted here with a new &quot;last
          updated&quot; date and, where required, notified to you. Continued use after changes take
          effect means you accept them.
        </P>
      </Sec>
      <Sec h="15. Governing law and disputes">
        <P>
          These Terms are governed by the laws of the State of [Delaware], United States, without
          regard to conflict-of-laws rules, and disputes will be resolved in the state or federal
          courts located there, except where applicable law gives you the right to bring a claim
          elsewhere. [Confirm jurisdiction, and decide whether arbitration / class-action-waiver
          language is wanted.]
        </P>
      </Sec>
      <Sec h="16. Contact">
        <P>
          <Mail a="legal@tally.app" />
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Privacy Policy ─────────────────────────── */

export function PrivacyPage() {
  return (
    <DocShell
      kicker="Legal"
      title="Privacy Policy"
      intro="Tally connects read-only to accounts you already have, uses that data to show you budgeting insights, and does not sell it. You can disconnect and delete at any time."
      updated
      notice
    >
      <Sec h="1. Who we are">
        <P>
          Tally, Inc. is the controller of the personal information described here. Contact:{' '}
          <Mail a="privacy@tally.app" />.
        </P>
      </Sec>
      <Sec h="2. Information we collect">
        <UL
          items={[
            'Account-connection data via Plaid: account names and types, masked account numbers, balances, and transaction history (dates, amounts, descriptions, merchant names, categories).',
            'Information you provide: email address, budget limits, goals, category corrections, and support messages.',
            'Automatically: basic device and log data needed to run and secure the service.',
          ]}
        />
        <P>We do not receive or store your bank username or password.</P>
      </Sec>
      <Sec h="3. How we use it">
        <P>
          To categorize spending, detect recurring charges and trials, calculate safe-to-spend and
          weekly recaps, track goals and streaks, provide support, secure the service, and comply
          with law. We do not use your financial data for advertising.
        </P>
      </Sec>
      <Sec h="4. Legal bases (where GDPR / UK GDPR applies)">
        <P>
          Performance of our contract with you; your consent (to connect accounts, which you can
          withdraw); and our legitimate interests in operating and securing the service.
        </P>
      </Sec>
      <Sec h="5. How we share it">
        <P>
          With Plaid (to connect accounts); with our cloud hosting and infrastructure providers
          acting as processors under contract; when required by law or to protect rights and safety;
          and in connection with a merger or acquisition. We do not sell personal information, and we
          do not &quot;share&quot; it for cross-context behavioral advertising as those terms are
          defined under US state privacy laws.
        </P>
      </Sec>
      <Sec h="6. Retention and deletion">
        <P>
          We keep connected-account data while the account is linked and your Tally account is
          active. When you disconnect an account or delete your Tally account, we delete the
          associated transaction data within 30 days, except limited records we must keep for legal
          or security reasons.
        </P>
      </Sec>
      <Sec h="7. Security">
        <P>
          See the Security page. No method of transmission or storage is perfectly secure, but we use
          encryption, access controls, and data minimization.
        </P>
      </Sec>
      <Sec h="8. Your rights">
        <P>
          Depending on where you live, you may have rights to access, correct, delete, port, or
          restrict processing of your personal information, and to withdraw consent. US state-law
          residents also have the right to opt out of &quot;sale&quot; / &quot;sharing&quot; (Tally
          does neither) and not to be discriminated against for exercising rights. Email{' '}
          <Mail a="privacy@tally.app" />; we will verify your request and respond within the time the
          applicable law requires (generally 30–45 days).
        </P>
      </Sec>
      <Sec h="9. Minors">
        <P>
          Tally is intended for users 13 and older. Users under the age of majority must have a
          parent or guardian&apos;s involvement and consent. We do not knowingly collect data from
          children under 13; if you believe a child under 13 has connected an account, contact{' '}
          <Mail a="privacy@tally.app" /> and we will delete it. [Confirm approach to 13–17 users and
          any state-specific requirements.]
        </P>
      </Sec>
      <Sec h="10. International users">
        <P>
          Tally is operated from the United States. If you use it from elsewhere, you understand your
          information will be processed in the US.
        </P>
      </Sec>
      <Sec h="11. Cookies">
        <P>
          The Tally web app uses only the cookies and local storage necessary to keep you signed in
          and remember your settings. We do not use advertising cookies or third-party analytics
          trackers.
        </P>
      </Sec>
      <Sec h="12. Changes">
        <P>
          We will post updates here with a new date and, for material changes, provide additional
          notice.
        </P>
      </Sec>
      <Sec h="13. Contact">
        <P>
          <Mail a="privacy@tally.app" />, or Tally, Inc., [mailing address].
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Data & permissions ─────────────────────────── */

function PermRow({ scope, fields, use }: { scope: string; fields: string; use: string }) {
  return (
    <div style={c('border:1px solid #e4e2d9;border-radius:16px;padding:18px 20px;background:#ffffff;margin-bottom:12px')}>
      <div style={display('font-size:16px;font-weight:700;letter-spacing:-0.01em;margin-bottom:6px')}>{scope}</div>
      <div style={mono('font-size:12px;color:#6b6a60;margin-bottom:8px')}>{fields}</div>
      <div style={c('font-size:15px;line-height:1.55;color:#4a4941')}>
        <strong style={c('color:#14140f')}>Used for:</strong> {use}
      </div>
    </div>
  )
}

export function DataPage() {
  return (
    <DocShell
      kicker="Legal"
      title="Data & permissions"
      intro="A plain-language companion to the Privacy Policy: exactly what Tally asks for, what it never asks for, and how to take it back."
      updated
    >
      <Sec h="What Tally asks Plaid for">
        <PermRow
          scope="Transactions"
          fields="dates · amounts · descriptions · merchant · category"
          use="buckets, recurring-charge and free-trial detection, weekly recaps, spending insights"
        />
        <PermRow
          scope="Balances"
          fields="current and available balance per account"
          use="safe-to-spend, the connected-accounts list"
        />
        <PermRow
          scope="Account basics"
          fields="account name · type · last 4 digits (mask)"
          use="showing which account is which"
        />
      </Sec>
      <Sec h="What Tally never asks for or receives">
        <UL
          items={[
            'Your bank username or password.',
            'The ability to move, send, or withdraw money.',
            'The ability to open accounts or issue a card.',
            'Your full account or card numbers, or your Social Security number.',
          ]}
        />
      </Sec>
      <Sec h="Where the data goes">
        <P>
          Tally&apos;s servers and its processors (cloud hosting, Plaid). Not to advertisers, and not
          for sale.
        </P>
      </Sec>
      <Sec h="How to revoke access">
        <P>
          In Tally, open <strong style={c('color:#14140f')}>Accounts → Disconnect</strong>. You can
          also revoke Tally from your bank&apos;s connected-apps settings, or through Plaid&apos;s
          portal at{' '}
          <a href="https://my.plaid.com" style={c('color:#1c6a48;font-weight:500')}>
            my.plaid.com
          </a>
          . Revoking stops new data immediately; stored history is deleted within 30 days.
        </P>
      </Sec>
      <Sec h="If a permission ever needs to change">
        <P>
          If a future feature requires a broader Plaid scope, Tally will explain why and ask you
          before requesting it.
        </P>
      </Sec>
    </DocShell>
  )
}

/* ─────────────────────────── Accessibility ─────────────────────────── */

export function AccessibilityPage() {
  return (
    <DocShell
      kicker="Legal"
      title="Accessibility"
      intro="We want Tally to be usable by everyone, including people who rely on screen readers, keyboard navigation, or larger text."
      updated
    >
      <Sec h="Target standard">
        <P>
          We are working toward conformance with the Web Content Accessibility Guidelines (WCAG) 2.1
          Level AA.
        </P>
      </Sec>
      <Sec h="Known limitations (being honest)">
        <UL
          items={[
            'The current build is optimized for larger screens and does not yet have a dedicated small-screen layout.',
            'Some color-coded status information is still being paired with clear text labels.',
            'Charts need better non-visual descriptions for screen-reader users.',
          ]}
        />
        <P>These are tracked and on the roadmap.</P>
      </Sec>
      <Sec h="Assistive-technology support">
        <P>
          Tally aims to work with current versions of the major screen readers and browsers. If you
          use an older configuration and hit a problem, tell us — we&apos;ll try to help.
        </P>
      </Sec>
      <Sec h="Reporting a barrier">
        <P>
          Email <Mail a="accessibility@tally.app" /> with the page and what happened. We treat access
          issues as bugs and will tell you our plan to fix them.
        </P>
      </Sec>
      <Sec h="Updates">
        <P>This statement will be revised as our conformance work progresses.</P>
      </Sec>
    </DocShell>
  )
}
