import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent clickjacking — stops the app being embedded in iframes
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers guessing content types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Don't leak referrer to external sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for 1 year
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Restrict browser feature access
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Legacy XSS protection
  { key: 'X-XSS-Protection', value: '1; mode=block' },
]

const nextConfig: NextConfig = {
  devIndicators: false,
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
