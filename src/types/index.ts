// ─── Products ───────────────────────────────────────────────────────────────
export interface Product {
  id: string
  slug: string
  category_id: string
  brand_id: string | null
  name_ar: string
  name_en: string
  type_ar: string
  type_en: string
  size_ar: string | null
  size_en: string | null
  description_ar: string | null
  description_en: string | null
  price_aed: number | null
  price_on_request: boolean
  images: string[]
  barcode: string | null
  hs_code: string | null
  country_origin: string | null
  is_active: boolean
  created_at: string
}

export interface ProductCategory {
  id: string
  name_ar: string
  name_en: string
  slug: string
}

export interface ProductBrand {
  id: string
  name: string
  logo_url: string | null
}

// ─── Market Intelligence ─────────────────────────────────────────────────────
export type SignalType = 'demand' | 'supply'
export type SignalSource = 'noon' | 'amazon_ae' | 'carrefour' | 'lulu' | 'google_trends' | 'keyword_planner' | 'internal_search' | 'quote_request'

export interface MarketSignal {
  id: string
  product_id: string
  signal_type: SignalType
  source: SignalSource
  value: number
  metadata: Record<string, unknown>
  recorded_at: string
}

export interface GapAlert {
  product_id: string
  product_name_ar: string
  product_name_en: string
  demand_score: number
  supply_score: number
  gap_score: number
  alert_type: 'shortage' | 'arbitrage' | 'trend_rising' | 'trend_falling'
  details: string
  detected_at: string
}

// ─── Compliance ───────────────────────────────────────────────────────────────
export type ProductClass =
  | 'food_general'
  | 'beverage_energy'
  | 'beverage_general'
  | 'dairy'
  | 'meat'
  | 'confectionery'
  | 'dietary_supplement'
  | 'baby_food'
  | 'frozen_food'

export interface ComplianceRule {
  id: string
  product_class: ProductClass
  standard_ref: string
  clause: string
  requirement_ar: string
  requirement_en: string
  field_to_check: string
  is_mandatory: boolean
}

export interface ComplianceResult {
  product_name: string
  product_class: ProductClass
  standard: string
  passed: ComplianceCheck[]
  failed: ComplianceCheck[]
  verdict: 'registerable' | 'not_registerable' | 'needs_review'
  missing_count: number
}

export interface ComplianceCheck {
  rule_id: string
  standard_ref: string
  clause: string
  requirement_ar: string
  requirement_en: string
  passed: boolean
  note?: string
}

// ─── Packaging ────────────────────────────────────────────────────────────────
export type PackagingMode = 'repack' | 'basket_single' | 'basket_mix'

export interface RepackInput {
  product_name: string
  target_unit_weight_kg: number
  target_quantity: number
  available_sizes_kg: number[]
  packaging_type: 'bag' | 'box' | 'carton' | 'can'
  brand_name?: string
}

export interface RepackOutput {
  total_weight_kg: number
  total_weight_tons: number
  source_units: { size_kg: number; quantity: number }[]
  packaging_materials: { item: string; quantity: number; unit: string }[]
  pallet_config: { units_per_carton: number; cartons_per_layer: number; layers: number; total_cartons: number }
  storage: { temp_min_c: number; temp_max_c: number; humidity_max: string; shelf_life_months: number }
  logistics: { volume_m3: number; gross_weight_kg: number; dimensions_cm: string }
  cost_breakdown: { raw_material_aed: number; packaging_aed: number; labor_aed: number; waste_aed: number; total_aed: number }
  suggested_price_aed: number
  suggested_margin_pct: number
  label_data: LabelData
}

export interface LabelData {
  product_name_ar: string
  product_name_en: string
  brand: string
  net_weight: string
  ingredients_placeholder: string
  storage_condition_ar: string
  storage_condition_en: string
  country_of_origin: string
  barcode_placeholder: string
  required_warnings: string[]
}

export interface BasketItem {
  product_id: string
  product_name_ar: string
  product_name_en: string
  quantity: number
  unit_weight_kg?: number
  dimensions_cm?: { l: number; w: number; h: number }
}

export interface BasketOutput {
  box_type: string
  box_dimensions_cm: { l: number; w: number; h: number }
  fill_percentage: number
  items: BasketItem[]
  total_weight_kg: number
  cost_aed: number
  suggested_price_aed: number
}

// ─── Providers ───────────────────────────────────────────────────────────────
export interface Provider {
  id: string
  name_ar: string
  name_en: string
  license_no: string | null
  category: string
  subcategory: string | null
  phone: string | null
  email: string | null
  website: string | null
  city: string | null
  is_verified: boolean
  is_active: boolean
}

// ─── Articles ────────────────────────────────────────────────────────────────
export interface Article {
  id: string
  slug: string
  title_ar: string
  title_en: string
  body_ar: string
  body_en: string
  image_url: string | null
  tags: string[]
  published_at: string | null
  is_published: boolean
}

// ─── Campaigns ───────────────────────────────────────────────────────────────
export type ContentMode = 'ai_auto' | 'ai_draft' | 'manual'
export type ThreadStatus = 'pending' | 'draft' | 'sent' | 'replied' | 'converted' | 'bounced' | 'unsubscribed'

export interface EmailCampaign {
  id: string
  name: string
  description: string | null
  content_mode: ContentMode
  daily_cap: number
  throttle_minutes: number
  sent_today: number
  recipient_emails: string[]
  is_active: boolean
  created_at: string
}

export interface CampaignStep {
  id: string
  campaign_id: string
  step_index: number
  subject_ar: string
  subject_en: string
  prompt_ar: string
  prompt_en: string
  body_ar: string | null
  body_en: string | null
}

export interface EmailThread {
  id: string
  campaign_id: string
  company_id: string | null
  email: string
  status: ThreadStatus
  sequence_step: number
  last_sent_at: string | null
  created_at: string
}

export interface EmailMessage {
  id: string
  thread_id: string
  direction: 'outbound' | 'inbound' | 'draft'
  subject: string
  body_text: string
  body_html: string | null
  message_id: string | null
  sent_at: string | null
}

// ─── Companies ───────────────────────────────────────────────────────────────
export interface Company {
  id: string
  name: string
  email: string | null
  phone: string | null
  industry: string | null
  city: string | null
  country: string
  notes: string | null
}

// ─── Quotes ──────────────────────────────────────────────────────────────────
export interface QuoteRequest {
  id: string
  items: { product_id: string; product_name: string; quantity: number; unit: string }[]
  company_name: string
  email: string
  phone: string | null
  notes: string | null
  status: 'new' | 'reviewing' | 'quoted' | 'closed'
  created_at: string
}

// ─── Analytics ───────────────────────────────────────────────────────────────
export interface PageView {
  id: string
  path: string
  visitor_id: string
  lang: string
  referrer: string | null
  created_at: string
}
