import { createClient } from '@supabase/supabase-js'
import { PRODUCTS_CATALOG } from '../src/lib/data/products-catalog'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function sync() {
  console.log(`Syncing ${Object.keys(PRODUCTS_CATALOG).length} catalog products...`)

  const products = Object.values(PRODUCTS_CATALOG).map(p => {
    const obj: any = {
      id: crypto.randomUUID(),
      slug: (p.name_en || p.id).toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 100),
      name_en: p.name_en,
      name_ar: p.name_ar,
      type_en: 'Imported',
      type_ar: 'مستورد',
      source: 'manual',
      is_published: true,
      published_at: new Date().toISOString(),
      country_origin: p.country_origin || 'Unknown',
      page_views: 0,
      rfq_count: 0,
      price_on_request: false,
    }
    // Only add optional fields if they exist
    if (p.price_retail_aed) obj.price_aed = p.price_retail_aed
    if (p.price_wholesale_aed) obj.price_wholesale_aed = p.price_wholesale_aed
    if (p.price_import_aed) obj.price_import_aed = p.price_import_aed
    if (p.description_en) obj.description_en = p.description_en
    if (p.description_ar) obj.description_ar = p.description_ar
    if (p.brand) obj.brand = p.brand
    if (p.hs_code) obj.hs_code = p.hs_code
    if (p.unit_size) obj.unit_size = p.unit_size
    return obj
  })

  // Insert in batches
  const batchSize = 50
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize)
    const { error } = await supabase
      .from('products')
      .insert(batch)

    if (error) {
      console.error(`Batch ${i / batchSize + 1} failed:`, error.message)
      process.exit(1)
    }
    console.log(`✓ Synced ${Math.min(i + batchSize, products.length)} / ${products.length}`)
  }

  console.log('✓ Sync complete')
}

sync().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
