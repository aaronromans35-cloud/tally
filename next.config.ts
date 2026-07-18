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
      // Next.js needs unsafe-inline for its injected scripts; unsafe-eval for dev HMR
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
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
      ].join(' '),
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
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
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
