import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://www.crate.ae'

// Stable lastmod for static pages — bump when a static page's content meaningfully changes.
// (Using new Date() here would change every revalidate and train Google to distrust the sitemap.)
const STATIC_LASTMOD = new Date('2026-07-03')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 3600

type Entry = MetadataRoute.Sitemap[number]

function pair(path: string, lastModified: Date, priority: number, changeFrequency: Entry['changeFrequency']): Entry[] {
  return (['ar', 'en'] as const).map(loc => ({
    url: `${BASE}/${loc}${path}`, lastModified, priority, changeFrequency,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPairs: Entry[] = [
    ...pair('', STATIC_LASTMOD, 1.0, 'daily'),
    ...pair('/products', STATIC_LASTMOD, 0.9, 'daily'),
    ...pair('/market', STATIC_LASTMOD, 0.8, 'daily'),
    ...pair('/insights', STATIC_LASTMOD, 0.8, 'daily'),
    ...pair('/providers', STATIC_LASTMOD, 0.8, 'weekly'),
    ...pair('/compliance', STATIC_LASTMOD, 0.7, 'monthly'),
    ...pair('/packaging', STATIC_LASTMOD, 0.7, 'monthly'),
    ...pair('/guides/carton-specs', STATIC_LASTMOD, 0.6, 'monthly'),
    ...pair('/rfq', STATIC_LASTMOD, 0.5, 'monthly'),
  ]

  // Product pages — use the keyword slug (falls back to id only if slug missing).
  const { data: products } = await supabase
    .from('products')
    .select('id, slug, updated_at')
    .eq('is_active', true)

  const productUrls = (products ?? []).flatMap(p =>
    pair(`/products/${p.slug ?? p.id}`, p.updated_at ? new Date(p.updated_at) : STATIC_LASTMOD, 0.8, 'weekly')
  )

  // Provider pages — only those with a slug (indexable company pages).
  const { data: providers } = await supabase
    .from('providers')
    .select('slug, updated_at')
    .eq('is_active', true)
    .not('slug', 'is', null)

  const providerUrls = (providers ?? []).flatMap(p =>
    pair(`/providers/${p.slug}`, p.updated_at ? new Date(p.updated_at) : STATIC_LASTMOD, 0.6, 'monthly')
  )

  // Insight articles (organism-published SEO content).
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('is_published', true)

  const articleUrls = (articles ?? []).flatMap(a =>
    pair(`/insights/${a.slug}`, a.published_at ? new Date(a.published_at) : STATIC_LASTMOD, 0.7, 'weekly')
  )

  return [...staticPairs, ...productUrls, ...providerUrls, ...articleUrls]
}
