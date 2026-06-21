import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function generateText(prompt: string, systemPrompt?: string): Promise<string> {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })
  return (msg.content[0] as { type: string; text: string }).text
}

export async function generateJSON<T>(prompt: string, systemPrompt?: string): Promise<T> {
  const text = await generateText(prompt, systemPrompt)
  const match = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
  if (!match) throw new Error('No JSON found in AI response')
  return JSON.parse(match[1] || match[0]) as T
}

// ─── Compliance Checker ───────────────────────────────────────────────────────
export async function checkProductCompliance(input: {
  product_class: string
  product_name: string
  ingredients?: string
  label_text?: string
  caffeine_mg_per_100ml?: number
  has_sulfites?: boolean
}) {
  const system = `You are a UAE food product compliance expert specializing in ESMA standards.
Return ONLY valid JSON. No explanation outside JSON.`

  const prompt = `Check this product against UAE.S 9:2019 and category-specific standards.

Product: ${input.product_name}
Class: ${input.product_class}
Ingredients: ${input.ingredients || 'not provided'}
Label text: ${input.label_text || 'not provided'}
Caffeine: ${input.caffeine_mg_per_100ml || 'not provided'} mg/100ml
Has sulfites: ${input.has_sulfites || false}

Return JSON:
{
  "standard": "UAE.S 9:2019",
  "verdict": "registerable|not_registerable|needs_review",
  "passed": [{"clause": "...", "requirement_en": "...", "requirement_ar": "..."}],
  "failed": [{"clause": "...", "requirement_en": "...", "requirement_ar": "...", "note": "..."}],
  "missing_count": 0,
  "summary_ar": "...",
  "summary_en": "..."
}`

  return generateJSON(prompt, system)
}

// ─── Packaging Calculator ─────────────────────────────────────────────────────
export async function calculateRepackaging(input: {
  product_name: string
  product_class: string
  target_weight_kg: number
  target_quantity: number
  packaging_type: string
  brand_name?: string
  country_origin?: string
}) {
  const system = `You are a food packaging and logistics expert for the UAE market.
Return ONLY valid JSON matching the exact structure requested. All costs in AED.`

  const total_kg = input.target_weight_kg * input.target_quantity

  const prompt = `Calculate complete repackaging plan:

Product: ${input.product_name}
Class: ${input.product_class}
Target: ${input.target_quantity} units × ${input.target_weight_kg} kg = ${total_kg} kg total
Packaging: ${input.packaging_type}
Brand: ${input.brand_name || 'TBD'}
Origin: ${input.country_origin || 'UAE'}

UAE market context: standard cartons, pallet = 80×120cm, AED pricing.

Return JSON:
{
  "total_weight_kg": ${total_kg},
  "total_weight_tons": ${(total_kg / 1000).toFixed(3)},
  "source_units": [{"size_kg": 25, "quantity": ${Math.ceil(total_kg / 25)}}],
  "packaging_materials": [
    {"item": "${input.packaging_type}s (${input.target_weight_kg}kg)", "quantity": ${input.target_quantity}, "unit": "pcs"},
    {"item": "master carton", "quantity": 0, "unit": "pcs"},
    {"item": "shrink wrap", "quantity": 0, "unit": "rolls"},
    {"item": "pallet", "quantity": 0, "unit": "pcs"}
  ],
  "pallet_config": {"units_per_carton": 0, "cartons_per_layer": 0, "layers": 0, "total_cartons": 0},
  "storage": {"temp_min_c": 10, "temp_max_c": 25, "humidity_max": "65%", "shelf_life_months": 12},
  "logistics": {"volume_m3": 0, "gross_weight_kg": 0, "dimensions_cm": ""},
  "cost_breakdown": {
    "raw_material_aed": 0,
    "packaging_aed": 0,
    "labor_aed": 0,
    "waste_aed": 0,
    "total_aed": 0
  },
  "suggested_price_aed": 0,
  "suggested_margin_pct": 20,
  "label_data": {
    "product_name_ar": "",
    "product_name_en": "${input.product_name}",
    "brand": "${input.brand_name || 'CRATE'}",
    "net_weight": "${input.target_weight_kg} kg",
    "ingredients_placeholder": "100% ${input.product_name}",
    "storage_condition_ar": "يحفظ في مكان بارد وجاف",
    "storage_condition_en": "Store in a cool dry place",
    "country_of_origin": "${input.country_origin || 'UAE'}",
    "barcode_placeholder": "XXXXXXXXX",
    "required_warnings": []
  }
}`

  return generateJSON(prompt, system)
}

// ─── Email Generation ─────────────────────────────────────────────────────────
export async function generateEmailContent(input: {
  campaign_name: string
  step_index: number
  subject_template: string
  prompt: string
  recipient_name: string
  recipient_company: string
  recipient_industry: string
}) {
  const system = `You are a professional B2B email copywriter for UAE food & beverage trade.
Write concise, professional emails. Return only JSON.`

  const prompt = `Write email for:
Campaign: ${input.campaign_name}
Step: ${input.step_index + 1}
Recipient: ${input.recipient_name} at ${input.recipient_company} (${input.recipient_industry})
Template: ${input.prompt}

Return JSON:
{
  "subject": "...",
  "body_text": "...",
  "body_html": "<p>...</p>"
}`

  return generateJSON(prompt, system)
}

// ─── Market Gap Analysis ──────────────────────────────────────────────────────
export async function analyzeMarketGap(input: {
  product_name: string
  demand_score: number
  supply_score: number
  price_trend: number
  sources: string[]
}) {
  const system = `You are a UAE market intelligence analyst for food & beverage trading.
Return ONLY valid JSON.`

  const prompt = `Analyze this market signal:

Product: ${input.product_name}
Demand score (0-100): ${input.demand_score}
Supply score (0-100): ${input.supply_score}
Price trend (% change): ${input.price_trend}%
Data sources: ${input.sources.join(', ')}

Return JSON:
{
  "alert_type": "shortage|arbitrage|trend_rising|trend_falling|balanced",
  "gap_score": 0,
  "details_ar": "...",
  "details_en": "...",
  "recommended_action_ar": "...",
  "recommended_action_en": "...",
  "urgency": "high|medium|low"
}`

  return generateJSON(prompt, system)
}

// ─── Article Generation ───────────────────────────────────────────────────────
export async function generateArticle(keyword: string, lang: 'ar' | 'en' | 'both') {
  const system = `You are a UAE food trade and market intelligence expert.
Write detailed, SEO-optimized articles for UAE importers and traders. Return ONLY valid JSON.`

  const prompt = `Write a detailed market intelligence article about: "${keyword}"
Target audience: UAE food & beverage importers, traders, distributors.
${lang === 'both' ? 'Provide BOTH Arabic and English versions. Each body must be at least 600 characters.' : `Language: ${lang}`}

IMPORTANT: body_ar and body_en must each be at least 600 characters — include market context, UAE regulations, import tips, and opportunities.

Return ONLY this JSON (no markdown, no extra text):
{
  "title_ar": "عنوان المقال بالعربية",
  "title_en": "Article Title in English",
  "body_ar": "محتوى مفصّل بالعربية (600+ حرف) يشمل: وصف المنتج، حجم السوق الإماراتي، فرص الاستيراد، اشتراطات التسجيل، التوصيات للتجار...",
  "body_en": "Detailed content in English (600+ chars) covering: product overview, UAE market size, import opportunities, registration requirements, trader recommendations...",
  "tags": ["uae", "fmcg", "import"],
  "slug": "keyword-uae-market"
}`

  return generateJSON(prompt, system)
}
