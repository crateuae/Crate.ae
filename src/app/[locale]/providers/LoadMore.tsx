'use client'

import { useState, useCallback } from 'react'
import { Loader2, Plus } from 'lucide-react'
import ProviderCard, { type PublicProvider } from './ProviderCard'

const PAGE = 15

export default function LoadMore({
  locale, isAr, cat, q, initialFrom, total,
}: {
  locale: string; isAr: boolean; cat: string; q: string; initialFrom: number; total: number
}) {
  const [items, setItems] = useState<PublicProvider[]>([])
  const [from, setFrom] = useState(initialFrom)
  const [loading, setLoading] = useState(false)

  const loaded = initialFrom + items.length
  const hasMore = loaded < total

  const more = useCallback(async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams({ from: String(from), size: String(PAGE) })
      if (cat) qs.set('cat', cat)
      if (q) qs.set('q', q)
      const res = await fetch(`/api/providers?${qs.toString()}`, { cache: 'no-store' })
      const data = await res.json()
      setItems(prev => [...prev, ...(data.rows ?? [])])
      setFrom(f => f + PAGE)
    } finally {
      setLoading(false)
    }
  }, [from, cat, q])

  return (
    <>
      {items.length > 0 && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5 mt-5">
          {items.map(p => <ProviderCard key={p.id} p={p} locale={locale} isAr={isAr} />)}
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center mt-8">
          <button onClick={more} disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-60 transition-colors">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {isAr ? 'عرض المزيد' : 'Load more'}
            <span className="text-xs text-gray-400">({(total - loaded).toLocaleString(isAr ? 'ar-EG' : 'en')})</span>
          </button>
        </div>
      )}
    </>
  )
}
