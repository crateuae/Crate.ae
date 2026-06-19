import createMiddleware from 'next-intl/middleware'
import { NextRequest, NextResponse } from 'next/server'
import { routing } from './i18n/routing'
import { createServerClient } from '@supabase/ssr'

const intlMiddleware = createMiddleware(routing)

const ADMIN_EMAIL = 'crateuae@gmail.com'
const PROTECTED_PATHS = ['/dashboard']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
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

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
}
