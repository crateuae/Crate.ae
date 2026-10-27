/**
 * SUPPLIER OFFERS — what an exporter sends Crate so UAE importers can see it.
 *
 * Stored in `tool_leads` with tool = 'supplier_offer' (no new table): the offer itself lives in
 * `answers` (jsonb), the contact in the table's own columns, and the review state in
 * `answers._status` / `answers._admin_notes` — the same pattern the basket inbox uses.
 *
 * One parser for both doors in: the public form (/sell-to-uae) and the dashboard's "add offer"
 * (an offer that arrived on WhatsApp or by email). Everything is clipped and whitelisted here,
 * so neither route trusts a free-form body.
 */
export type Bi = { en: string; ar: string }

export const OFFER_TOOL = 'supplier_offer'

export const CATEGORIES: Array<{ key: string; label: Bi }> = [
  { key: 'nuts', label: { en: 'Nuts & seeds', ar: 'مكسرات وبذور' } },
  { key: 'dates', label: { en: 'Dates & dried fruit', ar: 'تمور وفواكه مجففة' } },
  { key: 'spices', label: { en: 'Spices & saffron', ar: 'بهارات وزعفران' } },
  { key: 'food', label: { en: 'Other food & beverages', ar: 'أغذية ومشروبات أخرى' } },
  { key: 'nonfood', label: { en: 'Non-food products', ar: 'منتجات غير غذائية' } },
]

export const CURRENCIES = ['USD', 'AED', 'EUR'] as const
export const PRICE_UNITS: Array<{ key: string; label: Bi }> = [
  { key: 'kg', label: { en: 'per kg', ar: 'للكيلو' } },
  { key: 'ton', label: { en: 'per ton', ar: 'للطن' } },
  { key: 'pack', label: { en: 'per pack', ar: 'للعبوة' } },
  { key: 'carton', label: { en: 'per carton', ar: 'للكرتون' } },
]
export const INCOTERMS: Array<{ key: string; label: Bi }> = [
  { key: 'CIF Jebel Ali', label: { en: 'CIF Jebel Ali (delivered to UAE port)', ar: 'CIF جبل علي (حتى ميناء الإمارات)' } },
  { key: 'CFR', label: { en: 'CFR (cost and freight)', ar: 'CFR (التكلفة والشحن)' } },
  { key: 'FOB', label: { en: 'FOB (loaded at origin port)', ar: 'FOB (على ظهر السفينة في بلد المنشأ)' } },
  { key: 'EXW', label: { en: 'EXW (at your factory)', ar: 'EXW (من المصنع)' } },
  { key: 'DAP UAE', label: { en: 'DAP UAE (delivered to buyer)', ar: 'DAP الإمارات (حتى المشتري)' } },
]
export const PAYMENT_TERMS: Array<{ key: string; label: Bi; risky?: boolean }> = [
  { key: 'lc', label: { en: 'Letter of credit (L/C)', ar: 'اعتماد مستندي (L/C)' } },
  { key: 'cad', label: { en: 'Cash against documents', ar: 'الدفع مقابل المستندات' } },
  { key: '30_70', label: { en: '30% advance, 70% before shipment', ar: '30% مقدماً و70% قبل الشحن' } },
  { key: 'escrow', label: { en: 'Escrow / marketplace protection', ar: 'ضمان طرف ثالث (Escrow)' } },
  { key: '100_advance', label: { en: '100% advance', ar: '100% دفع مقدم' }, risky: true },
  { key: 'other', label: { en: 'Other / negotiable', ar: 'أخرى / قابلة للتفاوض' } },
]
export const DOCUMENTS: Array<{ key: string; label: Bi }> = [
  { key: 'export_licence', label: { en: 'Export licence / company registration', ar: 'رخصة التصدير / سجل الشركة' } },
  { key: 'origin', label: { en: 'Certificate of origin', ar: 'شهادة المنشأ' } },
  { key: 'phyto', label: { en: 'Phytosanitary certificate', ar: 'شهادة الصحة النباتية' } },
  { key: 'health', label: { en: 'Health certificate', ar: 'الشهادة الصحية' } },
  { key: 'lab', label: { en: 'Lab test (e.g. aflatoxin)', ar: 'تحليل مخبري (مثل الأفلاتوكسين)' } },
  { key: 'halal', label: { en: 'Halal certificate', ar: 'شهادة حلال' } },
  { key: 'quality', label: { en: 'ISO / HACCP', ar: 'ISO / HACCP' } },
]

/** The review pipeline. "shared" = sent to a UAE importer who asked for this product. */
export const STATUSES: Array<{ key: string; label: Bi; tone: string }> = [
  { key: 'new', label: { en: 'New', ar: 'جديد' }, tone: 'bg-orange-100 text-orange-700' },
  { key: 'docs_requested', label: { en: 'Documents requested', ar: 'طُلبت المستندات' }, tone: 'bg-blue-100 text-blue-700' },
  { key: 'verified', label: { en: 'Verified', ar: 'موثّق' }, tone: 'bg-emerald-100 text-emerald-700' },
  { key: 'shared', label: { en: 'Shared with an importer', ar: 'أُرسل لمستورد' }, tone: 'bg-purple-100 text-purple-700' },
  { key: 'rejected', label: { en: 'Rejected / spam', ar: 'مرفوض / مزعج' }, tone: 'bg-slate-100 text-slate-500' },
]
export const STATUS_KEYS = new Set(STATUSES.map(s => s.key))

export const CHANNELS = ['form', 'whatsapp', 'email'] as const
export type Channel = (typeof CHANNELS)[number]

export interface OfferAnswers {
  product: string
  category: string
  origin: string
  grade?: string
  packaging?: string
  price?: number
  currency?: string
  price_unit?: string
  incoterm?: string
  moq?: number
  moq_unit?: string
  lead_time_days?: number
  payment_terms?: string
  private_label?: boolean
  documents?: string[]
  website?: string
  notes?: string
  channel: Channel
  _status: string
  _admin_notes?: string
  _updated_at?: string
}

export interface ParsedOffer {
  answers: OfferAnswers
  company: string
  name: string | null
  phone: string
  email: string | null
}

const clip = (v: unknown, n: number) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ').slice(0, n) : '')
const num = (v: unknown, max: number) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 && n <= max ? Math.round(n * 1000) / 1000 : undefined
}
const oneOf = (v: unknown, keys: readonly string[]) => (typeof v === 'string' && keys.includes(v) ? v : undefined)
const url = (v: unknown) => {
  const s = clip(v, 300)
  if (!s) return undefined
  const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`
  try { const u = new URL(withProto); return /^https?:$/.test(u.protocol) ? u.toString() : undefined } catch { return undefined }
}

/**
 * Validates and whitelists an offer. Returns the field that is missing on failure.
 * Required: product, category, origin, company, and a WhatsApp/phone number.
 */
export function parseOffer(b: Record<string, unknown>, channel: Channel): { ok: true; offer: ParsedOffer } | { ok: false; field: string } {
  const product = clip(b.product, 120)
  const category = oneOf(b.category, CATEGORIES.map(c => c.key))
  const origin = clip(b.origin, 60)
  const company = clip(b.company, 160)
  const phone = clip(b.phone, 40)
  if (!product) return { ok: false, field: 'product' }
  if (!category) return { ok: false, field: 'category' }
  if (!origin) return { ok: false, field: 'origin' }
  if (!company) return { ok: false, field: 'company' }
  if (!/\d{6,}/.test(phone.replace(/\D/g, ''))) return { ok: false, field: 'phone' }
  const email = clip(b.email, 160).toLowerCase()
  const docs = Array.isArray(b.documents) ? b.documents.filter(d => DOCUMENTS.some(x => x.key === d)).slice(0, DOCUMENTS.length) as string[] : []
  return {
    ok: true,
    offer: {
      company,
      name: clip(b.name, 120) || null,
      phone,
      email: email.includes('@') ? email : null,
      answers: {
        product, category, origin,
        grade: clip(b.grade, 160) || undefined,
        packaging: clip(b.packaging, 160) || undefined,
        price: num(b.price, 10_000_000),
        currency: oneOf(b.currency, CURRENCIES) ?? 'USD',
        price_unit: oneOf(b.price_unit, PRICE_UNITS.map(u => u.key)) ?? 'kg',
        incoterm: oneOf(b.incoterm, INCOTERMS.map(i => i.key)),
        moq: num(b.moq, 100_000_000),
        moq_unit: oneOf(b.moq_unit, PRICE_UNITS.map(u => u.key)) ?? 'kg',
        lead_time_days: num(b.lead_time_days, 365),
        payment_terms: oneOf(b.payment_terms, PAYMENT_TERMS.map(p => p.key)),
        private_label: b.private_label === true,
        documents: docs,
        website: url(b.website),
        notes: clip(b.notes, 1000) || undefined,
        channel,
        _status: 'new',
      },
    },
  }
}

export const labelOf = (list: Array<{ key: string; label: Bi }>, key: string | undefined, ar: boolean) => {
  const hit = list.find(x => x.key === key)
  return hit ? (ar ? hit.label.ar : hit.label.en) : key ?? ''
}

/** "USD 18 / kg · CIF Jebel Ali" — the one-line price everybody reads. */
export function priceLine(a: Pick<OfferAnswers, 'price' | 'currency' | 'price_unit' | 'incoterm'>): string {
  if (!a.price) return ''
  return `${a.currency ?? 'USD'} ${a.price.toLocaleString('en-US')} / ${a.price_unit ?? 'kg'}${a.incoterm ? ` · ${a.incoterm}` : ''}`
}

/** Short public reference, e.g. "SO-3F9A1C". */
export const offerRef = (id: string) => `SO-${id.replace(/-/g, '').slice(0, 6).toUpperCase()}`
