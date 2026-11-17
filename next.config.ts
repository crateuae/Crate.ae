import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const isProd = process.env.NODE_ENV === 'production'

// Content-Security-Policy. What the site actually loads:
//   scripts  : its own bundles + inline (Next bootstrap, the Google tag snippet, JSON-LD) + Google tag/GA/Ads hosts
//   connect  : own API, Supabase (auth in the browser), Google Analytics/Ads beacons
//   images   : own, data/blob (scanner preview, label SVG), any https image (product/partner image URLs)
//   fonts    : next/font self-hosts them
//   camera   : getUserMedia for the Smart Scanner is not a CSP matter (see Permissions-Policy below)
// Inline scripts stay allowed ('unsafe-inline') because a nonce would force every page to render dynamically;
// everything else (object/embed, foreign frames, form posts elsewhere, <base> hijack) is closed.
const GOOGLE_SCRIPT = 'https://www.googletagmanager.com https://*.googletagmanager.com https://www.google-analytics.com https://www.googleadservices.com https://googleads.g.doubleclick.net https://www.google.com'
const GOOGLE_CONNECT = 'https://www.google-analytics.com https://*.google-analytics.com https://analytics.google.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://*.doubleclick.net https://www.google.com https://www.googleadservices.com https://pagead2.googlesyndication.com'
const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${GOOGLE_SCRIPT}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${GOOGLE_CONNECT}`,
  "media-src 'self' blob:",
  "worker-src 'self' blob:",
  "frame-src https://td.doubleclick.net https://www.googletagmanager.com https://*.doubleclick.net",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ')

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  // Security headers. HSTS has no includeSubDomains/preload so it stays reversible. Camera is allowed for this
  // origin only (the compliance Smart Scanner); everything else the site never uses is switched off.
  async headers() {
    const base = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
      { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
    ]
    return [
      { source: '/:path*', headers: isProd ? [...base, { key: 'Content-Security-Policy', value: CSP }] : base },
      // API responses are data, not pages: never cached by shared caches, never sniffed, never framed.
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex' }] },
    ]
  },
}

export default withNextIntl(nextConfig)
