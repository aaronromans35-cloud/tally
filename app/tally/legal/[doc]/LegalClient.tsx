'use client'
/**
 * Client half of the legal routes.
 *
 * The document components in ../../site/pages build their styles through
 * `css()` from ../../lib, which is a client module — calling it during a
 * server render throws "Attempted to call css() from the server". So the
 * route's page.tsx stays a server component (it owns metadata and
 * generateStaticParams, neither of which a client component may export) and
 * delegates the actual rendering here.
 */
import Link from 'next/link'
import {
  AccessibilityPage,
  BanksPage,
  ContactPage,
  DataPage,
  PrivacyPage,
  SecurityPage,
  TermsPage,
} from '../../site/pages'
import { LEGAL_DOCS, LEGAL_SLUGS, type LegalDoc } from '../docs'



const RENDER: Record<LegalDoc, () => React.ReactElement> = {
  privacy: () => <PrivacyPage />,
  terms: () => <TermsPage />,
  data: () => <DataPage />,
  accessibility: () => <AccessibilityPage />,
  security: () => <SecurityPage />,
  banks: () => <BanksPage />,
  contact: () => <ContactPage />,
}

export default function LegalClient({ doc }: { doc: LegalDoc }) {
  const others = LEGAL_SLUGS.filter((d) => d !== doc)
  return (
    <div style={{ background: '#f5f4ef', minHeight: '100vh' }}>
      <div
        style={{
          maxWidth: 780,
          margin: '0 auto',
          padding: '20px 20px 0',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'baseline',
        }}
      >
        <Link
          href="/tally/site"
          style={{ fontSize: 14, fontWeight: 600, color: '#1c6a48', textDecoration: 'none' }}
        >
          ← Tally
        </Link>
        <nav
          aria-label="Other policies"
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginLeft: 'auto' }}
        >
          {others.map((d) => (
            <Link
              key={d}
              href={`/tally/legal/${d}`}
              style={{ fontSize: 13, color: '#6b6a60', textDecoration: 'none' }}
            >
              {LEGAL_DOCS[d].title}
            </Link>
          ))}
        </nav>
      </div>
      {RENDER[doc]()}
    </div>
  )
}
