import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

// Vision model: Haiku 4.5 has vision + is cheap. Override with COMPLIANCE_VISION_MODEL
// (e.g. claude-sonnet-5) for higher Arabic-OCR accuracy.
const MODEL = process.env.COMPLIANCE_VISION_MODEL || 'claude-haiku-4-5-20251001'

export interface LabelExtraction {
  product_name: string
  product_name_ar: string | null
  brand: string | null
  product_class: string          // one of the known compliance classes
  ingredients: string[]
  label_text: string             // verbatim OCR of ALL text (Arabic + English)
  caffeine_mg_per_100ml: number | null
  has_sulfites: boolean
  net_content: string | null
  country_of_origin: string | null
  importer: string | null
  arabic_sections: { dates: boolean; storage: boolean; nutrition: boolean; ingredients: boolean }
  confidence: 'high' | 'medium' | 'low'
}

const VALID_CLASSES = ['beverage_general', 'beverage_energy', 'food_general', 'dairy', 'meat', 'confectionery', 'snack', 'oil', 'dietary_supplement']

// Extract the first balanced JSON object from a model response, tolerating
// markdown fences and trailing prose. Falls back gracefully.
function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  const body = fenced ? fenced[1] : text
  const start = body.indexOf('{')
  if (start === -1) return null
  let depth = 0, inStr = false, esc = false
  for (let i = start; i < body.length; i++) {
    const ch = body[i]
    if (esc) { esc = false; continue }
    if (ch === '\\') { esc = true; continue }
    if (ch === '"') { inStr = !inStr; continue }
    if (inStr) continue
    if (ch === '{') depth++
    else if (ch === '}') { depth--; if (depth === 0) return body.slice(start, i + 1) }
  }
  return null // unbalanced (truncated) — caller handles
}

const SYSTEM = `You are an OCR + data-extraction engine for UAE food & beverage product labels.
Read EVERY piece of text on the label — Arabic AND English — and return structured data as JSON.
You are ONLY extracting/reading. You do NOT judge compliance. Return ONLY valid JSON, nothing else.`

export async function extractLabelFromImage(base64: string, mediaType: string): Promise<LabelExtraction> {
  const prompt = `Extract this UAE product label into JSON.

Rules:
- "label_text": transcribe ALL visible text VERBATIM, keeping Arabic in Arabic and English in English, in reading order. This is the most important field — include every date, storage line, nutrition value, ingredient, warning, importer, and origin exactly as printed.
- "product_class": choose the single best match from EXACTLY this list: ${VALID_CLASSES.join(', ')}. A regular soda = beverage_general; an energy drink = beverage_energy.
- "ingredients": array of ingredient strings as printed (English list if present, else Arabic).
- "caffeine_mg_per_100ml": the caffeine content per 100 ml as a number, ONLY if the label states it; else null.
- "has_sulfites": true if sulphites are present — i.e. the label/ingredients mention "sulphite"/"sulfite"/"كبريتيت"/E220–E228, OR contain caramel colour E150d (sulphite ammonia caramel). Else false.
- "arabic_sections": for each of dates, storage, nutrition, ingredients — true if that section appears IN ARABIC on the label, false if only English or absent.
- "confidence": your overall OCR confidence (high/medium/low).

Return ONLY this JSON:
{
  "product_name": "", "product_name_ar": null, "brand": null,
  "product_class": "beverage_general",
  "ingredients": [],
  "label_text": "",
  "caffeine_mg_per_100ml": null,
  "has_sulfites": false,
  "net_content": null,
  "country_of_origin": null,
  "importer": null,
  "arabic_sections": { "dates": false, "storage": false, "nutrition": false, "ingredients": false },
  "confidence": "medium"
}`

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 4096, // dense bilingual label_text can be long — avoid truncating the JSON
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mediaType as 'image/jpeg', data: base64 } },
        { type: 'text', text: prompt },
      ],
    }],
  })

  const text = (msg.content.find(b => b.type === 'text') as { type: 'text'; text: string } | undefined)?.text ?? ''
  const json = extractJsonObject(text)
  if (!json) throw new Error(`vision returned unparseable output (stop=${msg.stop_reason})`)
  let raw: Partial<LabelExtraction>
  try { raw = JSON.parse(json) as Partial<LabelExtraction> }
  catch { throw new Error('vision returned malformed JSON') }

  // Normalize / guard
  const product_class = VALID_CLASSES.includes(raw.product_class ?? '') ? raw.product_class! : 'food_general'
  return {
    product_name: raw.product_name?.trim() || 'Unnamed product',
    product_name_ar: raw.product_name_ar ?? null,
    brand: raw.brand ?? null,
    product_class,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients.map(String) : [],
    label_text: raw.label_text ?? '',
    caffeine_mg_per_100ml: typeof raw.caffeine_mg_per_100ml === 'number' ? raw.caffeine_mg_per_100ml : null,
    has_sulfites: !!raw.has_sulfites,
    net_content: raw.net_content ?? null,
    country_of_origin: raw.country_of_origin ?? null,
    importer: raw.importer ?? null,
    arabic_sections: {
      dates: !!raw.arabic_sections?.dates, storage: !!raw.arabic_sections?.storage,
      nutrition: !!raw.arabic_sections?.nutrition, ingredients: !!raw.arabic_sections?.ingredients,
    },
    confidence: (['high', 'medium', 'low'] as const).includes(raw.confidence as 'high') ? raw.confidence as 'high' : 'medium',
  }
}
