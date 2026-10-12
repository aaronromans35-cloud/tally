import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers guessing content types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak referrer to external sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 1 year
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
  // Restrict browser feature access
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Legacy XSS protection
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // Content Security Policy — restricts what the browser can load
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Next.js needs unsafe-inline for its injected scripts; unsafe-eval for dev HMR.
      // cdn.plaid.com serves link-initialize.js, which Plaid Link requires.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.plaid.com",
      // Inline styles used throughout (style={{ }} props)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs for SVG/chart gradients
      "img-src 'self' data: blob:",
      "font-src 'self'",
      // API calls the browser makes directly
      [
        "connect-src 'self'",
        'https://*.supabase.co',
        'wss://*.supabase.co',
        'https://query1.finance.yahoo.com',
        'https://query2.finance.yahoo.com',
        // Plaid Link posts events + fetches config while the modal is open
        'https://*.plaid.com',
      ].join(' '),
      // Plaid Link renders its bank-login UI inside an iframe it injects
      "frame-src 'self' https://*.plaid.com",
      // Block embedding this app in any iframe
      "frame-ancestors 'none'",
      // Only allow forms to submit to same origin
      "form-action 'self'",
      // Block <base> tag hijacking
      "base-uri 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  devIndicators: false,
  // Type errors fail the build on purpose. This app handles money and minors'
  // data; a green build should mean something. (Next 16 dropped the `eslint`
  // config key — linting runs via the ESLint CLI in `npm run lint`.)
  typescript: { ignoreBuildErrors: false },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig;
