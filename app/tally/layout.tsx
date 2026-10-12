import type { Metadata } from 'next'
import { IBM_Plex_Mono, IBM_Plex_Sans, Space_Grotesk } from 'next/font/google'

/**
 * Tally runs outside the Nexus dashboard shell — its own header, its own type.
 * Fonts are self-hosted by `next/font` (the app CSP is `font-src 'self'`).
 */
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--tally-display',
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--tally-body',
  display: 'swap',
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--tally-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tally',
  description: 'Money habits, one day at a time. Read-only budgeting with a daily streak.',
}

export default function TallyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${spaceGrotesk.variable} ${plexSans.variable} ${plexMono.variable}`}>
      <style>{`::selection{background:#cdf06a}`}</style>
      {children}
    </div>
  )
}
