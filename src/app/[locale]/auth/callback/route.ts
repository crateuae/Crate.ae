import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { isAdminUser } from '@/lib/security/admin'
import { safeNextPath } from '@/lib/security/guard'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale: rawLocale } = await params
  const locale = rawLocale === 'en' ? 'en' : 'ar'
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // `next` must be a same-site path: "@evil.com" or "//evil.com" would otherwise turn this into an open redirect.
  const next = safeNextPath(searchParams.get('next'), `/${locale}`)

  if (!code) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_failed`)
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    return NextResponse.redirect(`${origin}/${locale}/login?error=auth_failed`)
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (isAdminUser(user)) {
    return NextResponse.redirect(`${origin}/${locale}/dashboard`)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
