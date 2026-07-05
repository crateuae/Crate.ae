// Next.js 16 proxy (formerly middleware). Turbopack requires a named `proxy`
// function export — declared below. Cache-bust: 2026-06-21.
import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createMiddleware(routing)

const ADMIN_EMAIL = 'crateuae@gmail.com'
const PROTECTED_PATHS = ['/dashboard']

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Authenticate admin APIs centrally. These use the service-role key and were
  // previously unauthenticated (the matcher below now includes /api/admin). Only
  // the dashboard (login-gated to ADMIN_EMAIL) calls them; cron endpoints live
  // under /api/organism and are NOT matched here — they keep their CRON_SECRET.
  if (pathname.startsWith('/api/admin')) {
    const response = NextResponse.next()
    const supabase = createServerClient(
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
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
    return response
  }

  const pathWithoutLocale = pathname.replace(/^\/(ar|en)/, '')
  const isProtected = PROTECTED_PATHS.some(p => pathWithoutLocale.startsWith(p))
  const locale = pathname.split('/')[1] || 'ar'

  if (isProtected) {
    // Build a response we can attach cookie mutations to
    const response = NextResponse.next()

    const supabase = createServerClient(
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
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL(`/${locale}/login`, request.url))
    }

    if (user.email !== ADMIN_EMAIL) {
      return NextResponse.redirect(new URL(`/${locale}/login?error=unauthorized`, request.url))
    }
  }

  return intlMiddleware(request)
}

export default proxy

export const config = {
  // First entry: all app pages except api/_next/_vercel/static files (intl + dashboard).
  // Second entry: admin APIs, so the auth gate above runs on them.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)', '/api/admin/:path*'],
}
