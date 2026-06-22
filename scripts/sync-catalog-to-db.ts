/**
 * Sync all catalog products into Supabase with FULL data.
 * Run: npx tsx scripts/sync-catalog-to-db.ts
 */
import { createClient } from '@supabase/supabase-js'
import { PRODUCTS_CATALOG, getProductSlug } from '../src/lib/data/products-catalog'

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sync() {
  const products = PRODUCTS_CATALOG.map(p => ({
    slug: getProductSlug(p),
    name_ar: p.name_ar,
    name_en: p.name_en,
    brand: p.brand,
    country_origin: p.country_origin,
    country_origin_ar: p.country_origin_ar,
    category_ar: p.category_ar,
    category_en: p.category_en,
    subcategory_ar: p.subcategory_ar,
    subcategory_en: p.subcategory_en,
    unit_size: p.unit_size,
    price_retail_aed: p.price_retail_aed,
    price_wholesale_aed: p.price_wholesale_aed,
    price_import_aed: p.price_import_aed ?? null,
    units_per_carton: p.units_per_carton,
    barcode_type: p.barcode_type,
    shelf_life_months: p.shelf_life_months,
    storage_temp: p.storage_temp,
    certifications: p.certifications,
    hs_code: p.hs_code,
    market_signal: p.market_signal,
    gap_score: p.gap_score,
    image_emoji: p.image_emoji,
    description_ar: p.description_ar,
    description_en: p.description_en,
    registration_status: p.registration_status,
    acquisition_type: p.acquisition_type,
    local_distributor_note: p.local_distributor_note ?? null,
    registration_cost_aed: p.registration_cost_aed ?? null,
    registration_months: p.registration_months ?? null,
    required_docs: p.required_docs ?? null,
    type_ar: p.subcategory_ar,
    type_en: p.subcategory_en,
    source: 'manual' as const,
    is_published: true,
    published_at: new Date().toISOString(),
    is_active: true,
    page_views: 0,
    rfq_count: 0,
  }))

  console.log(`Syncing ${products.length} catalog products with full data...`)

  // Insert in batches of 10 (safe for upsert on slug)
  const batchSize = 10
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const { error } = await sb
      .from('products')
      .upsert(batch, { onConflict: 'slug' })

    if (error) {
      console.error(`Batch ${Math.floor(i/batchSize)+1} error:`, error.message)
      process.exit(1)
    }
    console.log(`  ✓ ${Math.min(i + batchSize, products.length)} / ${products.length}`)
  }

  console.log('✓ Done!')
  process.exit(0)
}

sync().catch(e => { console.error(e.message); process.exit(1) })
