'use server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )
}

// ─── Products ────────────────────────────────────────────────

export async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertProduct(product: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .upsert(product, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleProductActive(id: string, is_active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('products')
    .update({ is_active })
    .eq('id', id)
  if (error) throw error
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ─── Categories ──────────────────────────────────────────────

export async function getCategories() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_categories')
    .select('*, product_subcategories(*)')
    .order('sort_order', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function upsertCategory(cat: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_categories')
    .upsert(cat, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function toggleCategoryActive(id: string, is_active: boolean) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('product_categories')
    .update({ is_active })
    .eq('id', id)
  if (error) throw error
}

export async function upsertSubcategory(sub: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('product_subcategories')
    .upsert(sub, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSubcategory(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('product_subcategories').delete().eq('id', id)
  if (error) throw error
}

// ─── Market Signals (gap_alerts) ─────────────────────────────

export async function getProductSignals(slug: string) {
  const supabase = await createClient()
  // Try to find via product join first
  const { data: productRow } = await supabase
    .from('products')
    .select('id')
    .eq('slug', slug)
    .single()
  if (!productRow) return null
  const { data } = await supabase
    .from('gap_alerts')
    .select('demand_score, supply_score, gap_score, details_ar, details_en, recommended_action_ar, recommended_action_en, detected_at, updated_at')
    .eq('product_id', productRow.id)
    .order('detected_at', { ascending: false })
    .limit(1)
    .single()
  return data
}

export async function getAllSignals() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gap_alerts')
    .select('*, products(name_ar, name_en, image_emoji)')
    .order('gap_score', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function upsertSignal(signal: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('gap_alerts')
    .upsert(signal, { onConflict: 'id' })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSignal(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('gap_alerts').delete().eq('id', id)
  if (error) throw error
}

// ─── Dashboard Stats ─────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await createClient()
  const [products, categories] = await Promise.all([
    supabase.from('products').select('id, market_signal, registration_status, is_active'),
    supabase.from('product_categories').select('id'),
  ])
  const p = products.data ?? []
  return {
    total: p.length,
    active: p.filter(x => x.is_active).length,
    categories: categories.data?.length ?? 0,
    shortage: p.filter(x => x.market_signal === 'shortage').length,
    rising: p.filter(x => x.market_signal === 'rising').length,
    unregistered: p.filter(x => x.registration_status === 'unregistered').length,
  }
}
