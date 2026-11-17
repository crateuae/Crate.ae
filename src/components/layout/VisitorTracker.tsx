'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { gtagPageView } from '@/lib/gtag'

/**
 * First-party visit counter (page_views) + GA4 page_view.
 *
 * What counts as a visit, since 2026-11-17: a page that a person ENGAGED with — they moved,
 * scrolled, touched or typed, or kept the page in front of them for 8 seconds. Crawlers that
 * run JavaScript render the page and leave within a second or two; in November they made up
 * most of the "visitors" (single page, no referrer, an even spread over every guide). Also
 * skipped: automated browsers (navigator.webdriver) and the owner's own browsers (flag set by
 * the dashboard). The server drops known bot user agents as a second line (/api/track).
 * GA4 still counts every page, as before.
 */
const ENGAGE_MS = 8000

export default function VisitorTracker() {
  const pathname = usePathname()
  const lastPath = useRef('')

  useEffect(() => {
    if (pathname === lastPath.current) return
    if (pathname.includes('/dashboard') || pathname.includes('/admin') || pathname.startsWith('/api')) return
    lastPath.current = pathname

    // GA4 page_view on SPA route change
    gtagPageView(window.location.href)

    let skip = false
    try { skip = navigator.webdriver === true || localStorage.getItem('crate_owner') === '1' } catch { /* storage blocked */ }
    if (skip) return

    let sent = false
    const send = () => {
      if (sent) return
      sent = true
      cleanup()
      let visitor_id: string | null = null
      try {
        visitor_id = localStorage.getItem('crate_vid')
        if (!visitor_id) { visitor_id = crypto.randomUUID(); localStorage.setItem('crate_vid', visitor_id) }
      } catch { visitor_id = 'nostore-' + Math.random().toString(36).slice(2) }
      const locale = pathname.split('/')[1] || 'ar'
      navigator.sendBeacon('/api/track', JSON.stringify({
        path: pathname,
        visitor_id,
        lang: locale,
        referrer: document.referrer || null,
      }))
    }
    const events: Array<keyof WindowEventMap> = ['pointermove', 'pointerdown', 'scroll', 'touchstart', 'keydown']
    // Dwell counts only while the tab is actually in front.
    let timer: number | undefined
    const arm = () => { if (document.visibilityState === 'visible' && timer === undefined) timer = window.setTimeout(send, ENGAGE_MS) }
    const onVis = () => { if (document.visibilityState === 'visible') arm(); else if (timer !== undefined) { clearTimeout(timer); timer = undefined } }
    const cleanup = () => {
      events.forEach(e => window.removeEventListener(e, send))
      document.removeEventListener('visibilitychange', onVis)
      if (timer !== undefined) clearTimeout(timer)
    }
    events.forEach(e => window.addEventListener(e, send, { once: true, passive: true }))
    document.addEventListener('visibilitychange', onVis)
    arm()
    return cleanup
  }, [pathname])

  return null
}
