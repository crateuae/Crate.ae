// ═══════════════════════════════════════════════════════════════════════════
// FREE OCR fallback — zero Anthropic credit. Uses OCR.space (free tier, ~25k/mo)
// to read raw text off the label, then fills the LabelExtraction shape with
// regex heuristics so the SAME deterministic compliance engine can judge it.
//
// Lower accuracy than Claude Vision (especially on structured fields like the
// nutrition table and ingredient parsing), but the compliance verdict leans on
// label_text + section detection, which raw OCR still supports. Enabled by
// setting OCRSPACE_API_KEY. See src/lib/ai/vision.ts for the Claude path.
// ═══════════════════════════════════════════════════════════════════════════
import type { LabelExtraction } from '@/lib/ai/vision'

const VALID_CLASSES = ['beverage_general', 'beverage_energy', 'food_general', 'dairy', 'meat', 'confectionery', 'snack', 'oil', 'dietary_supplement']

// Rough product-class inference from keywords in the OCR'd text.
function inferClass(t: string): string {
  const s = t.toLowerCase()
  if (/energy drink|طاقة|taurine|تورين/.test(s)) return 'beverage_energy'
  if (/juice|عصير|water|مياه|soda|soft drink|مشروب|beverage|drink|كولا|cola/.test(s)) return 'beverage_general'
  if (/milk|حليب|laban|لبن|yoghurt|yogurt|زبادي|جبن|cheese|dairy|ألبان/.test(s)) return 'dairy'
  if (/chicken|دجاج|meat|لحم|beef|بقري|لحوم|poultry|دواجن/.test(s)) return 'meat'
  if (/chocolate|شوكولا|candy|حلوى|sweets|سكاكر|biscuit|بسكوت/.test(s)) return 'confectionery'
  if (/chips|شيبس|snack|وجبة خفيفة|مقرمش|crackers/.test(s)) return 'snack'
  if (/oil|زيت|olive|زيتون|ghee|سمن/.test(s)) return 'oil'
  if (/supplement|مكمل|vitamin|فيتامين|capsule|كبسول/.test(s)) return 'dietary_supplement'
  return 'food_general'
}

function buildExtractionFromText(text: string): LabelExtraction {
  const t = text || ''
  const hasArabic = /[؀-ۿ]/.test(t)
  const caffeine = (() => {
    const m = t.match(/caffeine[^\d]{0,20}(\d+(?:\.\d+)?)\s*mg/i) || t.match(/كافيين[^\d]{0,20}(\d+(?:\.\d+)?)/)
    return m ? Number(m[1]) : null
  })()
  const has_sulfites = /sulph?ite|كبريتيت|E\s?2(?:2[0-8])|E\s?150d/i.test(t)
  // First non-empty line as a best-effort product name.
  const firstLine = t.split(/\r?\n/).map(s => s.trim()).find(Boolean) || 'Unnamed product'

  return {
    product_name: firstLine.slice(0, 120),
    product_name_ar: hasArabic ? (t.split(/\r?\n/).map(s => s.trim()).find(s => /[؀-ۿ]/.test(s)) ?? null) : null,
    brand: null,
    product_class: inferClass(t),
    ingredients: [],
    label_text: t,
    caffeine_mg_per_100ml: caffeine,
    has_sulfites,
    net_content: (t.match(/(\d+(?:\.\d+)?)\s?(ml|مل|l|لتر|g|غم|جم|kg|كجم)\b/i)?.[0]) ?? null,
    country_of_origin: (t.match(/(?:product of|country of origin|بلد المنشأ|صنع في|منتج)[:\s]+([A-Za-z؀-ۿ ]{2,30})/i)?.[1]?.trim()) ?? null,
    importer: null,
    nutrition: { columns: [], rows: [] },
    arabic_sections: {
      dates: hasArabic && /تاريخ|انتهاء|صلاحية|الإنتاج/.test(t),
      storage: hasArabic && /تخزين|يحفظ|حفظ|يخزن/.test(t),
      nutrition: hasArabic && /غذائية|القيمة|الحقائق|السعرات/.test(t),
      ingredients: hasArabic && /المكوّنات|المكونات|مكونات/.test(t),
    },
    confidence: t.length > 40 ? 'low' : 'low',
  }
}

export async function extractLabelViaFreeOCR(base64: string, mediaType: string): Promise<LabelExtraction> {
  const key = process.env.OCRSPACE_API_KEY
  if (!key) throw new Error('free_ocr_not_configured')

  const form = new URLSearchParams()
  form.set('base64Image', `data:${mediaType};base64,${base64}`)
  form.set('language', 'ara')   // Engine 1 + ara reads Arabic (and Latin passably)
  form.set('OCREngine', '1')
  form.set('scale', 'true')
  form.set('isTable', 'true')

  const res = await fetch('https://api.ocr.space/parse/image', {
    method: 'POST',
    headers: { apikey: key, 'content-type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })
  const d: any = await res.json().catch(() => ({}))
  if (!res.ok || d?.IsErroredOnProcessing) {
    throw new Error('free_ocr_error: ' + (Array.isArray(d?.ErrorMessage) ? d.ErrorMessage.join('; ') : (d?.ErrorMessage || res.status)))
  }
  const text = String(d?.ParsedResults?.[0]?.ParsedText || '').trim()
  if (!text) throw new Error('free_ocr_empty')
  return buildExtractionFromText(text)
}
