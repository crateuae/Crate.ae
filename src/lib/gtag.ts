/**
 * Google Analytics 4 (G-D24S8N3VBP) + Google Ads (288-270-4613) helpers
 * Used throughout the app for event tracking.
 */

export const GT_ID = 'GT-K5M94L6R'   // Google Tag container
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? 'G-D24S8N3VBP'  // GA4 destination
export const ADS_ACCOUNT = '288-270-4613'

declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
    dataLayer: unknown[]
  }
}

/** Fire a GA4 page_view (called from VisitorTracker on route change) */
export function gtagPageView(url: string, title?: string) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', 'page_view', {
    page_location: url,
    page_title: title ?? document.title,
    send_to: GA_ID,
  })
}

/** Generic GA4 event */
export function gtagEvent(
  action: string,
  params?: Record<string, string | number | boolean>
) {
  if (typeof window === 'undefined' || !window.gtag) return
  window.gtag('event', action, { send_to: GA_ID, ...params })
}

/** Track product view (fires on /products/[slug] page load) */
export function trackProductView(productId: string, productName: string, category: string) {
  gtagEvent('view_item', {
    item_id: productId,
    item_name: productName,
    item_category: category,
  })
}

/** Track quote request submission */
export function trackQuoteRequest(productId: string, productName: string) {
  gtagEvent('generate_lead', {
    item_id: productId,
    item_name: productName,
    currency: 'AED',
  })
}

/** Track search (fires on /search or market filter) */
export function trackSearch(term: string) {
  gtagEvent('search', { search_term: term })
}

/** Track gap signal click in trends dashboard */
export function trackGapSignalClick(keyword: string, gapScore: number) {
  gtagEvent('select_content', {
    content_type: 'gap_signal',
    item_id: keyword,
    value: gapScore,
  })
}
