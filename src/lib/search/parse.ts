// ═══════════════════════════════════════════════════════════════════════════
// Natural-language query parser — Layer 1 of Crate's hybrid smart search.
// DETERMINISTIC, zero AI/credit. Turns "500 cartons mango juice to Dubai CIF"
// (or "500 كرتون عصير مانجو لدبي") into structured filters the DB can use.
// Layer 3 (optional Claude refine + embeddings) can override this when credit is
// available, degrading to Layer 1 — same graceful pattern as the scanner's free
// OCR fallback. See docs/firstfmcg_analysis.md.
// ═══════════════════════════════════════════════════════════════════════════

export interface ParsedQuery {
  raw: string
  emirate: string | null
  category: string | null
  keywords: string[]
  quantity: { amount: number; unit: string } | null
  incoterm: string | null
}

// Provider categories present in the DB (must match the admin CAT_OPTIONS values).
const EMIRATES: [string, RegExp][] = [
  ['Abu Dhabi', /\babu\s?dhabi\b|أبوظبي|ابوظبي|أبو ظبي/i],
  ['Dubai', /\bdubai\b|دبي/i],
  ['Sharjah', /\bsharjah\b|الشارقة|الشارقه|شارقة/i],
  ['Ajman', /\bajman\b|عجمان/i],
  ['Umm Al Quwain', /\bumm\s?al\s?quwain\b|أم القيوين|ام القيوين/i],
  ['Ras Al Khaimah', /\bras\s?al\s?khaimah\b|رأس الخيمة|راس الخيمة/i],
  ['Fujairah', /\bfujairah\b|الفجيرة|الفجيره|فجيرة/i],
]

// keyword → provider category (first match wins).
const CATEGORY_MAP: [string, RegExp][] = [
  ['Beverages & Juices', /juice|عصير|عصائر|beverage|مشروب|مشروبات|soda|صودا|water|مياه|drink|كولا|cola|nectar/i],
  ['Dairy', /milk|حليب|laban|لبن|yog?h?urt|زبادي|روب|cheese|جبن|جبنة|dairy|ألبان|butter|زبدة|cream|قشطة/i],
  ['Meat & Poultry', /meat|لحم|لحوم|chicken|دجاج|beef|بقري|lamb|غنم|poultry|دواجن|frozen chicken/i],
  ['Seafood', /fish|سمك|أسماك|seafood|مأكولات بحرية|shrimp|روبيان|tuna|تونة/i],
  ['Chocolate & Sweets', /chocolate|شوكولا|شوكولاتة|candy|حلوى|حلويات|sweets|سكاكر|كاندي/i],
  ['Oils & Fats', /\boil\b|زيت|زيوت|olive|زيتون|ghee|سمن|fat\b|دهون/i],
  ['Grains & Flour', /rice|أرز|flour|طحين|دقيق|grain|حبوب|wheat|قمح|pasta|معكرونة|lentil|عدس/i],
  ['Spices & Condiments', /spice|بهار|بهارات|توابل|condiment|sauce|صلصة|ketchup|كاتشب/i],
  ['Snacks', /snack|سناك|chips|شيبس|رقائق|مقرمشات|crackers|بسكوت|biscuit/i],
  ['Bakery & Pastry', /bakery|مخبز|مخبوزات|bread|خبز|pastry|معجنات|cake|كيك|croissant/i],
  ['Frozen Foods', /frozen|مجمد|مجمّد|مثلج/i],
  ['Café & Coffee', /coffee|قهوة|café|cafe|كافيه|espresso|بن/i],
  ['Health & Nutrition', /supplement|مكمل|مكملات|vitamin|فيتامين|health|صحي|organic|عضوي|protein|بروتين/i],
  ['Packaging Services', /packaging|تغليف|تعبئة|carton|كرتون box|علب|packing/i],
  ['Water', /^water$|مياه معدنية/i],
]

const INCOTERMS = /\b(EXW|FOB|CIF|CFR|DAP|DDP|FCA)\b/i
const QTY = /(\d[\d,]*)\s*(cartons?|كرتون|كراتين|pallets?|طبلية|طبالي|منصات?|units?|قطع[ةه]?|pieces?|tons?|أطنان|طن|kg|كجم|كيلو|boxes?|علب)/i

const STOP = new Set(['to', 'for', 'of', 'the', 'a', 'an', 'in', 'need', 'want', 'looking', 'supplier', 'suppliers', 'wholesale',
  'الى', 'إلى', 'من', 'في', 'مورد', 'موردين', 'أريد', 'ابحث', 'أبحث', 'عن', 'جملة', 'بالجملة', 'كمية'])

export function parseQuery(q: string): ParsedQuery {
  const raw = String(q || '').trim()
  let rest = ' ' + raw + ' '

  const emirate = EMIRATES.find(([, re]) => re.test(raw))?.[0] ?? null
  const category = CATEGORY_MAP.find(([, re]) => re.test(raw))?.[0] ?? null
  const incoterm = raw.match(INCOTERMS)?.[1]?.toUpperCase() ?? null
  const qm = raw.match(QTY)
  const quantity = qm ? { amount: Number(qm[1].replace(/,/g, '')) || 0, unit: qm[2] } : null

  // Strip the parts we already classified, then keep significant tokens.
  for (const [, re] of EMIRATES) rest = rest.replace(re, ' ')
  rest = rest.replace(INCOTERMS, ' ').replace(QTY, ' ')
  const keywords = rest
    .split(/[\s,،.\-\/()]+/)
    .map(w => w.trim())
    .filter(w => w.length >= 2 && !STOP.has(w.toLowerCase()) && !/^\d+$/.test(w))
    .map(w => w.replace(/[^\p{L}\p{N}]/gu, '')) // safe for ilike / .or()
    .filter(Boolean)
    .slice(0, 6)

  return { raw, emirate, category, keywords, quantity, incoterm }
}
