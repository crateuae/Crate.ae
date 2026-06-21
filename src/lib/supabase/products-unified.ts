import { SupabaseClient } from '@supabase/supabase-js'
import { PRODUCTS_CATALOG } from '@/lib/data/products-catalog'

export interface UnifiedProduct {
  id: string
  name_ar: string
  name_en: string
  source: 'manual' | 'organism_discovery'
  is_published: boolean
  published_at: string | null
  content_ar?: string
  content_en?: string
  tags?: string[]
  organism_opportunity_id?: string | null
  page_views?: number
  rfq_count?: number
  // ... commerce fields
  [key: string]: unknown
}

/**
 * Try to match an organism discovery (new product concept) against
 * existing products in the catalog.
 *
 * Returns matching product ID or null if no match.
 */
export function matchProductInCatalog(keyword: string): string | null {
  const norm = (s: string) => s.toLowerCase().trim()
  const keywordNorm = norm(keyword)

  // First: exact match on name
  let match = PRODUCTS_CATALOG.find(p =>
    norm(p.name_en).includes(keywordNorm) || norm(p.name_ar).includes(keywordNorm)
  )
  if (match) return match.id

  // Second: fuzzy match (first 2 words)
  const words = keywordNorm.split(/\s+/).slice(0, 2).join(' ')
  match = PRODUCTS_CATALOG.find(p =>
    norm(p.name_en).includes(words) || norm(p.name_ar).includes(words)
  )
  if (match) return match.id

  // No match
  return null
}

/**
 * Create a skeleton product from an approved organism opportunity.
 *
 * Skeleton = minimal product record with organism content, waiting for
 * human to fill in commerce data (prices, registration, etc.)
 */
export async function createSkeletonProduct(
  db: SupabaseClient,
  opp: {
    id: string
    title: string
    title_ar?: string | null
    body_ar?: string
    body_en?: string
    tags?: string[]
  }
): Promise<string | null> {
  const { data, error } = await db
    .from('products')
    .insert({
      id: crypto.randomUUID(),
      name_en: opp.title,
      name_ar: opp.title_ar || opp.title,
      source: 'organism_discovery',
      content_ar: opp.body_ar,
      content_en: opp.body_en,
      tags: opp.tags,
      is_published: false,
      organism_opportunity_id: opp.id,
      // Minimal required fields
      brand: 'TBD',
      country_origin: 'TBD',
      category_ar: 'منتج جديد',
      category_en: 'New Product',
      unit_size: 'unknown',
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createSkeletonProduct] error:', error.message)
    return null
  }

  return data?.id ?? null
}

/**
 * Link an organism opportunity to a product.
 * Returns true if successful.
 */
export async function linkOpportunityToProduct(
  db: SupabaseClient,
  productId: string,
  opportunityId: string
): Promise<boolean> {
  const { error } = await db
    .from('products')
    .update({ organism_opportunity_id: opportunityId })
    .eq('id', productId)

  if (error) {
    console.error('[linkOpportunityToProduct] error:', error.message)
    return false
  }
  return true
}

/**
 * Update product content from organism (after publishing).
 * Merges existing commerce data with new SEO content.
 */
export async function updateProductContent(
  db: SupabaseClient,
  productId: string,
  content: {
    content_ar?: string
    content_en?: string
    tags?: string[]
    image_url?: string
  }
): Promise<boolean> {
  const { error } = await db
    .from('products')
    .update({
      ...content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    console.error('[updateProductContent] error:', error.message)
    return false
  }
  return true
}

/**
 * Get all products (published + skeleton drafts) for admin dashboard.
 * Includes organism-linked products.
 */
export async function getAdminProducts(
  db: SupabaseClient,
  filters?: {
    source?: 'manual' | 'organism_discovery'
    is_published?: boolean
    search?: string
  }
): Promise<UnifiedProduct[]> {
  let query = db.from('products').select('*')

  if (filters?.source) {
    query = query.eq('source', filters.source)
  }
  if (filters?.is_published !== undefined) {
    query = query.eq('is_published', filters.is_published)
  }
  if (filters?.search) {
    const s = `%${filters.search}%`
    query = query.or(`name_en.ilike.${s},name_ar.ilike.${s}`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('[getAdminProducts] error:', error.message)
    return []
  }

  return (data ?? []) as UnifiedProduct[]
}

/**
 * Publish a product (make is_published = true).
 * Validates minimum required fields.
 */
export async function publishProduct(
  db: SupabaseClient,
  productId: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: product } = await db
    .from('products')
    .select('*')
    .eq('id', productId)
    .single()

  if (!product) {
    return { ok: false, error: 'Product not found' }
  }

  // Minimum validation for skeleton products from organism
  if (product.source === 'organism_discovery') {
    const missing = []
    if (!product.price_retail_aed) missing.push('Retail price')
    if (!product.category_en) missing.push('Category')
    if (missing.length > 0) {
      return { ok: false, error: `Missing: ${missing.join(', ')}` }
    }
  }

  const { error } = await db
    .from('products')
    .update({
      is_published: true,
      published_at: new Date().toISOString(),
    })
    .eq('id', productId)

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true }
}

/**
 * Increment page_views for a product.
 * Called when user visits /products/[id]
 */
export async function incrementProductViews(
  db: SupabaseClient,
  productId: string
): Promise<void> {
  await db.rpc('update_product_views', { p_product_id: productId })
}
