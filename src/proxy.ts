// Next.js 16 proxy (formerly middleware). Turbopack requires a named `proxy`
// function export — declared below.
//
// Gates, in order:
//   1. /api/admin/*            → confirmed admin session only (these use the service-role key)
//   2. privileged non-admin APIs (organism, trends, packaging spec writes)
//                              → admin session OR a cron credential
//   3. /dashboard pages        → confirmed admin session, else redirect to login
//   4. everything else         → next-intl
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'node:crypto'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'
import { isAdminUser } from './lib/security/admin'
import { audit } from './lib/security/audit'
import { internalToken } from './lib/security/internal'
import { clientIp, rateLimit, sameOriginOrNone } from './lib/security/guard'

const intlMiddleware = createMiddleware(routing)

const PROTECTED_PATHS = ['/dashboard']

/** Routes that are NOT under /api/admin but must never be public: admin session or cron credential. */
const PRIVILEGED_API = [
  '/api/organism/',
  '/api/trends/discover',
  '/api/trends/analyze',
  '/api/trends/sync',
  '/api/packaging/calculate', // paid Claude call; no public UI uses it
]
/** The two paths Vercel Cron calls (vercel.json). */
const CRON_PATHS = ['/api/organism/heartbeat', '/api/organism/publish']

const eq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b)
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

function cronCredentialOk(req: NextRequest, pathname: string): boolean {
  const secret = process.env.CRON_SECRET || ''
  const realSecret = secret.length >= 16 && secret !== 'your_cron_secret'
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (realSecret && (eq(bearer, secret) || eq(req.headers.get('x-cron-secret') || '', secret))) return true
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && eq(req.headers.get('x-internal-token') || '', internalToken())) return true
  // Transitional: until CRON_SECRET is set in Vercel, Vercel's own cron user agent is accepted on the two
  // scheduled paths only (and rate limited). Set CRON_SECRET to close this.
  if (!realSecret && CRON_PATHS.includes(pathname) && /^vercel-cron\//i.test(req.headers.get('user-agent') || '')) {
    return rateLimit(req, 'cron-ua', 6, 3_600_000) === null
  }
  return false
}

function sessionClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )
}

const deny = (status: number, error: string) =>
  NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } })

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/')
  const isPrivilegedApi = PRIVILEGED_API.some(p => pathname.startsWith(p))
  const isSpecWrite = pathname === '/api/packaging/specs' && method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS'

  if (isAdminApi || isPrivilegedApi || isSpecWrite) {
    // Cross-site browser requests never reach privileged handlers.
    if (method !== 'GET' && method !== 'HEAD' && (!sameOriginOrNone(request) || request.headers.get('sec-fetch-site') === 'cross-site')) {
      if (!(isPrivilegedApi && cronCredentialOk(request, pathname))) return deny(403, 'forbidden_origin')
    }
    if (isPrivilegedApi && cronCredentialOk(request, pathname)) {
      const r = NextResponse.next()
      r.headers.set('Cache-Control', 'no-store')
      return r
    }
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store')
    const { data: { user } } = await sessionClient(request, response).auth.getUser()
    if (!isAdminUser(user)) {
      await audit(isAdminApi || isSpecWrite ? 'admin_auth_denied' : 'privileged_denied', {
        ip: clientIp(request), path: `${method} ${pathname}`, actor: user?.email ?? null,
      })
      return deny(401, 'unauthorized')
    }
    return response
  }

  // Remaining /api paths in the matcher (public reads such as GET /api/packaging/specs) are not pages: skip next-intl.
  if (pathname.startsWith('/api/')) return NextResponse.next()

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)(?=\/|$)/, '')
  const isProtected = PROTECTED_PATHS.some(p => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/'))
  const locale = pathname.split('/')[1] === 'en' ? 'en' : 'ar'

  if (isProtected) {
    const response = NextResponse.next()
    const { data: { user } } = await sessionClient(request, response).auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }
    if (!isAdminUser(user)) {
      await audit('dashboard_auth_denied', { ip: clientIp(request), path: pathname, actor: user.email ?? null })
      return NextResponse.redirect(new URL(`/${locale}/login?error=unauthorized`, request.url))
    }
    // Keep the dashboard out of shared caches and search results.
    const intl = intlMiddleware(request)
    intl.headers.set('Cache-Control', 'private, no-store')
    intl.headers.set('X-Robots-Tag', 'noindex, nofollow')
    response.cookies.getAll().forEach(c => intl.cookies.set(c))
    return intl
  }

  return intlMiddleware(request)
}

export default proxy

export const config = {
  // 1) all app pages except api/_next/_vercel/static files (intl + dashboard);
  // 2) admin + privileged API routes, so the gates above run on them;
  // 3) the dashboard explicitly — entry 1 skips any path that contains a dot, which would otherwise
  //    let /ar/dashboard/<segment.with.dot> bypass the login gate.
  matcher: [
    '/((?!api|_next|_vercel|.*\..*).*)',
    '/api/admin/:path*',
    '/api/organism/:path*',
    '/api/trends/discover',
    '/api/trends/analyze',
    '/api/trends/sync',
    '/api/packaging/calculate',
    '/api/packaging/specs',
    '/dashboard/:path*',
    '/(ar|en)/dashboard/:path*',
  ],
}
