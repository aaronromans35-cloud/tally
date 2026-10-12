import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import LegalClient from './LegalClient'
import { LEGAL_DOCS, LEGAL_SLUGS, isLegalDoc, type LegalDoc } from '../docs'

/**
 * Real URLs for the legal and policy documents.
 *
 * These existed only as client-side state inside TallySite, which meant the
 * privacy policy had no address you could link to. That breaks the things
 * that matter most for a product handling minors' financial data: app store
 * review, a Plaid production application, "see our privacy policy" links in
 * email footers, and any regulator or parent who wants to read it.
 */

export function generateStaticParams() {
  return LEGAL_SLUGS.map((doc) => ({ doc }))
}

// Next 16: `params` is a Promise and must be awaited.
export async function generateMetadata(props: {
  params: Promise<{ doc: string }>
}): Promise<Metadata> {
  const { doc } = await props.params
  const entry = LEGAL_DOCS[doc as LegalDoc]
  if (!entry) return { title: 'Not found — Tally' }
  return {
    title: `${entry.title} — Tally`,
    description: entry.description,
    alternates: { canonical: `/tally/legal/${doc}` },
  }
}

export default async function LegalDocPage(props: { params: Promise<{ doc: string }> }) {
  const { doc } = await props.params
  if (!isLegalDoc(doc)) notFound()
  return <LegalClient doc={doc} />
}
