import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE = 'https://www.crate.ae'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const staticPages = [
    { url: `${BASE}/ar`, lastModified: now, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${BASE}/en`, lastModified: now, priority: 1.0, changeFrequency: 'daily' as const },
    { url: `${BASE}/ar/products`, lastModified: now, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${BASE}/en/products`, lastModified: now, priority: 0.9, changeFrequency: 'daily' as const },
    { url: `${BASE}/ar/providers`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${BASE}/en/providers`, lastModified: now, priority: 0.8, changeFrequency: 'weekly' as const },
    { url: `${BASE}/ar/market`, lastModified: now, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${BASE}/en/market`, lastModified: now, priority: 0.7, changeFrequency: 'weekly' as const },
    { url: `${BASE}/ar/packaging`, lastModified: now, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE}/en/packaging`, lastModified: now, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE}/ar/compliance`, lastModified: now, priority: 0.6, changeFrequency: 'monthly' as const },
    { url: `${BASE}/en/compliance`, lastModified: now, priority: 0.6, changeFrequency: 'monthly' as const },
  ]

  // Dynamic product pages
  const { data: products } = await supabase
    .from('products')
    .select('id, updated_at')
    .eq('is_active', true)

  const productUrls = (products ?? []).flatMap(p => [
    {
      url: `${BASE}/ar/products/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    },
    {
      url: `${BASE}/en/products/${p.id}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      priority: 0.8,
      changeFrequency: 'weekly' as const,
    },
  ])

  // Dynamic provider pages
  const { data: providers } = await supabase
    .from('providers')
    .select('slug, updated_at')
    .eq('is_active', true)
    .not('slug', 'is', null)

  const providerUrls = (providers ?? []).flatMap(p => [
    {
      url: `${BASE}/ar/providers/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
    {
      url: `${BASE}/en/providers/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
      priority: 0.7,
      changeFrequency: 'monthly' as const,
    },
  ])

  // Dynamic insight pages (organism-published SEO content)
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, published_at')
    .eq('is_published', true)

  const articleUrls = (articles ?? []).flatMap(a => [
    {
      url: `${BASE}/ar/insights/${a.slug}`,
      lastModified: a.published_at ? new Date(a.published_at) : new Date(),
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    },
    {
      url: `${BASE}/en/insights/${a.slug}`,
      lastModified: a.published_at ? new Date(a.published_at) : new Date(),
      priority: 0.7,
      changeFrequency: 'weekly' as const,
    },
  ])

  return [...staticPages, ...productUrls, ...providerUrls, ...articleUrls]
}
