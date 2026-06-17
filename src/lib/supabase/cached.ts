/**
 * Cached Supabase queries — wraps heavy queries with Next.js cache.
 * Data revalidates every hour automatically (ISR).
 *
 * Uses a direct anon client (no cookies) because unstable_cache runs
 * outside request context and cannot access next/headers cookies.
 */
import { unstable_cache } from 'next/cache'
import { createClient as createBrowserClient } from '@supabase/supabase-js'

function getClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}

export type ProviderRow = {
  id: string
  slug: string
  name_ar: string | null
  name_en: string | null
  type: string | null
  category: string | null
  emirate: string | null
  license_no: string | null
  issue_date: string | null
  is_verified: boolean
}

type GetProvidersResult = {
  rows: ProviderRow[]
  total: number
  traders: number
  repack: number
}

/** Single RPC call: paginated rows + type counts. Cached 1 hour per unique filter combo. */
export function getProviders(opts: {
  type?: string
  emirate?: string
  query?: string
  from: number
  to: number
}): Promise<GetProvidersResult> {
  const cacheKey = [
    'providers-list',
    opts.type    ?? 'all',
    opts.emirate ?? 'all',
    opts.query   ?? '',
    String(opts.from),
    String(opts.to),
  ]

  return unstable_cache(
    async (): Promise<GetProvidersResult> => {
      try {
        const supabase = getClient()
        const { data, error } = await supabase.rpc('get_providers', {
          p_type:    opts.type    || null,
          p_emirate: opts.emirate || null,
          p_query:   opts.query   || null,
          p_from:    opts.from,
          p_to:      opts.to,
        })
        if (error || !data) {
          console.error('get_providers RPC error:', error)
          return { rows: [], total: 0, traders: 0, repack: 0 }
        }
        return {
          rows:    data.rows    ?? [],
          total:   data.total   ?? 0,
          traders: data.traders ?? 0,
          repack:  data.repack  ?? 0,
        }
      } catch (err) {
        console.error('getProviders threw:', err)
        return { rows: [], total: 0, traders: 0, repack: 0 }
      }
    },
    cacheKey,
    { revalidate: 3600, tags: ['providers'] },
  )()
}

/** Single provider by slug. Cached 24 hours. */
export function getProviderBySlug(slug: string) {
  return unstable_cache(
    async () => {
      try {
        const supabase = getClient()
        const { data } = await supabase
          .from('providers')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()
        return data
      } catch (err) {
        console.error('getProviderBySlug threw:', err)
        return null
      }
    },
    ['provider-detail', slug],
    { revalidate: 86400, tags: ['providers'] },
  )()
}
