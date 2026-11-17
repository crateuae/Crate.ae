/**
 * BUYER REQUESTS — a UAE importer asks Crate for supplier offers on a product.
 *
 * The demand side of the supplier-offers list. Stored in `tool_leads` with tool = 'buyer_request'
 * (no new table; review state in `answers._status`), matched against the stored supplier offers
 * by category and product words, reviewed in /dashboard/buyer-requests.
 */
import { CATEGORIES, PAYMENT_TERMS, type OfferAnswers } from '@/lib/supplier-offers/model'

export type Bi = { en: string; ar: string }
export const REQUEST_TOOL = 'buyer_request'
export { CATEGORIES }

/** Product landing pages, one per product we hold supplier offers for. */
export interface SourceProduct {
  slug: string
  category: string
  /** words that identify the product in an offer or a request (any language) */
  match: RegExp
  guide: string            // import guide slug
  name: Bi
  title: Bi
  description: Bi
  h1: Bi
  lead: Bi
  specHint: Bi
  faq: Array<{ q: Bi; a: Bi }>
}

export const SOURCE_PRODUCTS: SourceProduct[] = [
  {
    slug: 'pistachios', category: 'nuts', match: /pistach|فستق|پسته/i, guide: 'nuts',
    name: { en: 'pistachios', ar: 'الفستق' },
    title: { en: 'Buy Pistachios in Bulk for the UAE — Request Supplier Offers', ar: 'شراء الفستق بالجملة للإمارات — اطلب عروض الموردين' },
    description: {
      en: 'UAE importers and wholesalers: tell Crate the pistachio grade and quantity you need and receive matching offers from exporters, plus help with registration and the Arabic label.',
      ar: 'للمستوردين وتجار الجملة في الإمارات: أخبر Crate بدرجة الفستق والكمية المطلوبة واستلم عروضاً مطابقة من المصدّرين، مع المساعدة في التسجيل والملصق العربي.',
    },
    h1: { en: 'Buy pistachios in bulk for the UAE: request supplier offers', ar: 'شراء الفستق بالجملة للإمارات: اطلب عروض الموردين' },
    lead: {
      en: 'Tell us the grade, quantity and delivery point. We match your request against the pistachio offers exporters have sent us and send you the ones that fit — free to request.',
      ar: 'أخبرنا بالدرجة والكمية ومكان التسليم. نطابق طلبك مع عروض الفستق التي أرسلها لنا المصدّرون ونرسل لك المناسب منها — الطلب مجاني.',
    },
    specHint: { en: 'e.g. in-shell Akbari, 28–30 count, roasted & salted', ar: 'مثال: أكبري بالقشر، حجم 28–30، محمّص ومملّح' },
    faq: [
      { q: { en: 'What should I specify when sourcing pistachios?', ar: 'ما الذي يجب تحديده عند طلب الفستق؟' }, a: { en: 'Variety (e.g. Akbari, Ahmad Aghaei, Fandoghi), in-shell or kernel, size count per ounce, natural or roasted and salted, packaging, and a recent aflatoxin test. Quotes are only comparable when these match.', ar: 'الصنف (مثل أكبري، أحمد آقائي، فندقي)، بالقشر أم لب، الحجم (عدد الحبات للأونصة)، طبيعي أم محمّص ومملّح، التعبئة، وتحليل أفلاتوكسين حديث. لا تُقارن الأسعار إلا عند تطابق هذه المواصفات.' } },
      { q: { en: 'Does Crate sell the pistachios?', ar: 'هل تبيع Crate الفستق؟' }, a: { en: 'No. Crate passes your request to suppliers whose offers match and helps you with the UAE side — product registration and the Arabic label. You agree terms with the supplier.', ar: 'لا. تمرّر Crate طلبك إلى الموردين الذين تطابق عروضهم، وتساعدك في الجانب الإماراتي — تسجيل المنتج والملصق العربي. وتتفق على الشروط مع المورد.' } },
      { q: { en: 'How should I pay a new supplier?', ar: 'كيف أدفع لمورد جديد؟' }, a: { en: 'On a first deal prefer a letter of credit, cash against documents or an escrow service over 100% advance transfer, and ask for samples and lab tests before shipment.', ar: 'في الصفقة الأولى فضّل الاعتماد المستندي أو الدفع مقابل المستندات أو خدمة الضمان على التحويل المسبق 100%، واطلب عينات وتحاليل مخبرية قبل الشحن.' } },
    ],
  },
  {
    slug: 'dates', category: 'dates', match: /\bdates?\b|تمر|تمور|خرما|mazafati|medjool|مضافتي|مجهول|كبكاب/i, guide: 'dates',
    name: { en: 'dates', ar: 'التمور' },
    title: { en: 'Buy Dates in Bulk for the UAE — Request Supplier Offers', ar: 'شراء التمور بالجملة للإمارات — اطلب عروض الموردين' },
    description: {
      en: 'UAE importers, retailers and food manufacturers: tell Crate the date variety and quantity you need and receive matching offers from producers, plus help with registration and labelling.',
      ar: 'للمستوردين وتجار التجزئة ومصانع الأغذية في الإمارات: أخبر Crate بصنف التمر والكمية المطلوبة واستلم عروضاً مطابقة من المنتجين، مع المساعدة في التسجيل والملصق.',
    },
    h1: { en: 'Buy dates in bulk for the UAE: request supplier offers', ar: 'شراء التمور بالجملة للإمارات: اطلب عروض الموردين' },
    lead: {
      en: 'Tell us the variety, grade, quantity and packing. We match your request against the date offers producers have sent us and send you the ones that fit — free to request.',
      ar: 'أخبرنا بالصنف والدرجة والكمية والتعبئة. نطابق طلبك مع عروض التمور التي أرسلها لنا المنتجون ونرسل لك المناسب منها — الطلب مجاني.',
    },
    specHint: { en: 'e.g. Mazafati, first grade, 5 kg cartons', ar: 'مثال: مضافتي، درجة أولى، كراتين 5 كغ' },
    faq: [
      { q: { en: 'What should I specify when sourcing dates?', ar: 'ما الذي يجب تحديده عند طلب التمور؟' }, a: { en: 'Variety (e.g. Mazafati, Medjool, Kabkab, Sayer), grade, moisture, pitted or whole, packing (bulk cartons or retail packs) and the harvest year.', ar: 'الصنف (مثل مضافتي، مجهول، كبكاب، سعمران)، الدرجة، الرطوبة، منزوع النوى أم كامل، التعبئة (كراتين جملة أم عبوات تجزئة)، وسنة الحصاد.' } },
      { q: { en: 'Does Crate sell the dates?', ar: 'هل تبيع Crate التمور؟' }, a: { en: 'No. Crate passes your request to suppliers whose offers match and helps with the UAE side — product registration and the Arabic label. You agree terms with the supplier.', ar: 'لا. تمرّر Crate طلبك إلى الموردين الذين تطابق عروضهم، وتساعدك في الجانب الإماراتي — تسجيل المنتج والملصق العربي. وتتفق على الشروط مع المورد.' } },
      { q: { en: 'Do retail packs of dates need an Arabic label?', ar: 'هل تحتاج عبوات التمور للتجزئة إلى ملصق عربي؟' }, a: { en: 'Yes. Prepackaged food sold in the UAE carries the mandatory particulars in Arabic under GSO 9 — Crate can check and print that label.', ar: 'نعم. يحمل الغذاء المعبأ المبيع في الإمارات البيانات الإلزامية بالعربية وفق GSO 9 — ويمكن لـ Crate فحص هذا الملصق وطباعته.' } },
    ],
  },
]

export const DELIVERY: Array<{ key: string; label: Bi }> = [
  { key: 'jebel_ali', label: { en: 'Jebel Ali port (CIF)', ar: 'ميناء جبل علي (CIF)' } },
  { key: 'dubai_wh', label: { en: 'My warehouse in Dubai', ar: 'مستودعي في دبي' } },
  { key: 'other_uae', label: { en: 'Another emirate', ar: 'إمارة أخرى' } },
  { key: 'fob', label: { en: 'I arrange shipping (FOB)', ar: 'أتولى الشحن (FOB)' } },
]
export const QTY_UNITS = ['kg', 'ton', 'carton', 'container'] as const
export const SERVICES: Array<{ key: string; label: Bi }> = [
  { key: 'registration', label: { en: 'Product registration in the UAE', ar: 'تسجيل المنتج في الإمارات' } },
  { key: 'label', label: { en: 'Arabic label (GSO 9) check and printing', ar: 'فحص الملصق العربي (GSO 9) وطباعته' } },
  { key: 'inspection', label: { en: 'Samples and lab test before shipment', ar: 'عينات وتحليل مخبري قبل الشحن' } },
]
export const BR_STATUSES: Array<{ key: string; label: Bi; tone: string }> = [
  { key: 'new', label: { en: 'New', ar: 'جديد' }, tone: 'bg-orange-100 text-orange-700' },
  { key: 'contacted', label: { en: 'Contacted', ar: 'تم التواصل' }, tone: 'bg-blue-100 text-blue-700' },
  { key: 'offers_sent', label: { en: 'Offers sent', ar: 'أُرسلت العروض' }, tone: 'bg-purple-100 text-purple-700' },
  { key: 'deal', label: { en: 'Deal', ar: 'صفقة' }, tone: 'bg-emerald-100 text-emerald-700' },
  { key: 'closed', label: { en: 'Closed / no fit', ar: 'مغلق / غير مناسب' }, tone: 'bg-slate-100 text-slate-500' },
]
export const BR_STATUS_KEYS = new Set(BR_STATUSES.map(s => s.key))

export interface RequestAnswers {
  product: string
  category: string
  source_slug?: string
  spec?: string
  quantity?: number
  qty_unit?: string
  delivery?: string
  target_price?: number
  currency?: string
  needed_by?: string
  services?: string[]
  notes?: string
  _status: string
  _admin_notes?: string
  _updated_at?: string
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, n) : '')
const num = (v: unknown, max: number) => { const n = Number(v); return Number.isFinite(n) && n > 0 && n <= max ? Math.round(n * 1000) / 1000 : undefined }
const oneOf = (v: unknown, keys: readonly string[]) => (typeof v === 'string' && keys.includes(v) ? v : undefined)

export function parseRequest(b: Record<string, unknown>): { ok: true; req: { answers: RequestAnswers; company: string | null; name: string | null; phone: string; email: string | null } } | { ok: false; field: string } {
  const product = clip(b.product, 120)
  const category = oneOf(b.category, CATEGORIES.map(c => c.key))
  const phone = clip(b.phone, 40)
  if (!product) return { ok: false, field: 'product' }
  if (!category) return { ok: false, field: 'category' }
  if (!/\d{6,}/.test(phone.replace(/\D/g, ''))) return { ok: false, field: 'phone' }
  const email = clip(b.email, 160).toLowerCase()
  const services = Array.isArray(b.services) ? b.services.filter(s => SERVICES.some(x => x.key === s)) as string[] : []
  return {
    ok: true,
    req: {
      company: clip(b.company, 160) || null,
      name: clip(b.name, 120) || null,
      phone,
      email: email.includes('@') ? email : null,
      answers: {
        product, category,
        source_slug: oneOf(b.source_slug, SOURCE_PRODUCTS.map(p => p.slug)),
        spec: clip(b.spec, 200) || undefined,
        quantity: num(b.quantity, 100_000_000),
        qty_unit: oneOf(b.qty_unit, QTY_UNITS) ?? 'kg',
        delivery: oneOf(b.delivery, DELIVERY.map(d => d.key)),
        target_price: num(b.target_price, 10_000_000),
        currency: oneOf(b.currency, ['USD', 'AED', 'EUR']) ?? 'USD',
        needed_by: clip(b.needed_by, 40) || undefined,
        services,
        notes: clip(b.notes, 1000) || undefined,
        _status: 'new',
      },
    },
  }
}

export const requestRef = (id: string) => `BR-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`

/** Words a product name brings to matching ("First-class pistachios" → pistachios). */
function productRe(product: string): RegExp | null {
  const hit = SOURCE_PRODUCTS.find(p => p.match.test(product))
  if (hit) return hit.match
  const words = product.toLowerCase().split(/[^a-z؀-ۿ]+/).filter(w => w.length >= 4)
  return words.length ? new RegExp(words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'i') : null
}

export interface OfferRow { id: string; company: string | null; phone: string | null; email: string; consent: boolean; answers: OfferAnswers }

/**
 * Supplier offers that fit a request: same product words first, then same category.
 * Rejected offers never match. Verified ones rank first; an offer the supplier did not
 * consent to share is still listed (the reviewer asks first) but ranked last.
 */
export function matchOffers(req: Pick<RequestAnswers, 'product' | 'category'>, offers: OfferRow[]): Array<OfferRow & { strength: 'product' | 'category' }> {
  const re = productRe(req.product)
  const rank: Record<string, number> = { verified: 0, shared: 1, docs_requested: 2, new: 3 }
  return offers
    .filter(o => o.answers?._status !== 'rejected')
    .map(o => {
      const byProduct = re ? re.test(`${o.answers.product} ${o.answers.notes ?? ''}`) : false
      const byCategory = o.answers.category === req.category
      return byProduct || byCategory ? { ...o, strength: (byProduct ? 'product' : 'category') as 'product' | 'category' } : null
    })
    .filter((o): o is OfferRow & { strength: 'product' | 'category' } => !!o)
    .sort((a, b) => (a.strength === b.strength ? 0 : a.strength === 'product' ? -1 : 1)
      || (rank[a.answers._status] ?? 9) - (rank[b.answers._status] ?? 9)
      || Number(b.consent) - Number(a.consent))
}

export const riskyTerms = (key?: string) => !!PAYMENT_TERMS.find(p => p.key === key)?.risky
