/**
 * Shared metadata for the legal routes.
 *
 * Deliberately a plain module with no 'use client' directive: values exported
 * from a client module become client references when a server component
 * imports them, so `doc in LEGAL_DOCS` silently failed and every policy page
 * 404'd. Both halves of the route import this instead.
 */

export const LEGAL_DOCS = {
  privacy: {
    title: 'Privacy Policy',
    description:
      'How Tally collects, uses and protects your information, including the extra care taken with users under 18.',
  },
  terms: {
    title: 'Terms of Service',
    description: 'The agreement covering your use of Tally.',
  },
  data: {
    title: 'Data & Permissions',
    description: 'Exactly what Tally reads from a connected bank account, and what it never does.',
  },
  accessibility: {
    title: 'Accessibility',
    description: 'Tally’s accessibility commitments and known gaps.',
  },
  security: {
    title: 'Security',
    description: 'How Tally protects accounts and financial data.',
  },
  banks: {
    title: 'Supported Banks',
    description: 'Which institutions Tally can connect to, and what to do if yours is missing.',
  },
  contact: {
    title: 'Contact',
    description: 'How to reach the Tally team, including privacy and security requests.',
  },
} as const

export type LegalDoc = keyof typeof LEGAL_DOCS

export const LEGAL_SLUGS = Object.keys(LEGAL_DOCS) as LegalDoc[]

export const isLegalDoc = (s: string): s is LegalDoc => s in LEGAL_DOCS
