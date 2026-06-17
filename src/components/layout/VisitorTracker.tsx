'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gtagPageView } from '@/lib/gtag'

export default function VisitorTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    if (pathname === lastPath.current) return
    if (pathname.includes('/dashboard') || pathname.includes('/admin') || pathname.startsWith('/api')) return
    lastPath.current = pathname

    // First-party visitor tracking (Supabase)
    let visitor_id = localStorage.getItem('crate_vid')
    if (!visitor_id) {
      visitor_id = crypto.randomUUID()
      localStorage.setItem('crate_vid', visitor_id)
    }
    const locale = pathname.split('/')[1] || 'ar'
    navigator.sendBeacon('/api/track', JSON.stringify({
      path: pathname,
      visitor_id,
      lang: locale,
      referrer: document.referrer || null,
    }))

    // GA4 page_view on SPA route change
    gtagPageView(window.location.href)
  }, [pathname])

  return null
}
