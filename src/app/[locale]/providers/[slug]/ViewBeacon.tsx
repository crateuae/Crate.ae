'use client'

import { useEffect, useRef } from 'react'

/** Fires a single page_view event for this provider on mount. */
export default function ViewBeacon({ providerId }: { providerId: string }) {
  const sent = useRef(false)
  useEffect(() => {
    if (sent.current) return
    sent.current = true

    // Stable anonymous visitor id (shared with the rest of the site if present).
    let vid: string | null = null
    try {
      vid = localStorage.getItem('crate_vid')
      if (!vid) { vid = crypto.randomUUID(); localStorage.setItem('crate_vid', vid) }
    } catch { /* ignore */ }

    fetch('/api/providers/view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider_id: providerId, visitor_id: vid }),
      keepalive: true,
    }).catch(() => {})
  }, [providerId])

  return null
}
