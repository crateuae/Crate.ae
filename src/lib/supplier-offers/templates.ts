/**
 * WhatsApp replies for supplier offers and UAE leads — one source for the dashboard buttons
 * and for copy-paste. WhatsApp formatting: *bold*, line breaks, "•" bullets. Kept short on
 * purpose: each message asks for ONE next step.
 *
 * {link} is the offer form for that language; {ref} an offer reference; {product} a product.
 */
export type ReplyKey =
  | 'supplier_first' | 'supplier_docs' | 'supplier_verified' | 'supplier_followup'
  | 'uae_registration' | 'uae_import' | 'uae_buyer'

export interface ReplyTemplate {
  key: ReplyKey
  audience: 'supplier' | 'uae'
  title: { en: string; ar: string }
  en: string
  ar: string
}

export const SELL_PATH = '/sell-to-uae'
const BASE = 'https://www.crate.ae'
export const offerFormUrl = (lang: 'ar' | 'en', product?: string) =>
  `${BASE}/${lang}${SELL_PATH}${product ? `?product=${encodeURIComponent(product)}` : ''}`

export const REPLIES: ReplyTemplate[] = [
  {
    key: 'supplier_first', audience: 'supplier',
    title: { en: 'Supplier · first reply', ar: 'مورّد · الرد الأول' },
    en: `Thank you for your offer 🌿

*Crate is a UAE import platform, not a buyer.* We show verified offers to UAE importers who ask for your product.

To be listed (free), submit your offer here:
👉 {link}

Takes 2 minutes. Prices *CIF Jebel Ali* get the most replies.`,
    ar: `شكراً لعرضكم 🌿

*Crate منصة للاستيراد في الإمارات، وليست مشترياً.* نعرض العروض الموثّقة على المستوردين في الإمارات الذين يطلبون منتجكم.

لإدراج عرضكم مجاناً، أرسلوه من هنا:
👉 {link}

يستغرق دقيقتين. العروض بسعر *CIF جبل علي* تحصل على أكبر تجاوب.`,
  },
  {
    key: 'supplier_docs', audience: 'supplier',
    title: { en: 'Supplier · request documents', ar: 'مورّد · طلب المستندات' },
    en: `Received your offer ✅ Ref: *{ref}*

To mark it *verified* for UAE importers, please send:
• Export licence / company registration
• Certificate of origin
• Phytosanitary or health certificate
• Lab test (aflatoxin for nuts)
• 2–3 product photos

Reply here with the files.`,
    ar: `استلمنا عرضكم ✅ المرجع: *{ref}*

لتوثيقه أمام المستوردين في الإمارات، أرسلوا:
• رخصة التصدير / سجل الشركة
• شهادة المنشأ
• شهادة الصحة النباتية أو الشهادة الصحية
• تحليل مخبري (الأفلاتوكسين للمكسرات)
• 2–3 صور للمنتج

أرسلوا الملفات هنا.`,
  },
  {
    key: 'supplier_verified', audience: 'supplier',
    title: { en: 'Supplier · verified', ar: 'مورّد · تم التوثيق' },
    en: `Your offer *{ref}* is now verified ✅

We share it with UAE importers who request {product}. Interested buyers contact you through Crate.

Note: *Crate never asks suppliers for deposits or payments.*`,
    ar: `تم توثيق عرضكم *{ref}* ✅

سنشاركه مع المستوردين في الإمارات الذين يطلبون {product}، ويتواصل المهتمون معكم عبر Crate.

ملاحظة: *Crate لا تطلب من الموردين أي دفعات أو عربون.*`,
  },
  {
    key: 'supplier_followup', audience: 'supplier',
    title: { en: 'Supplier · one follow-up', ar: 'مورّد · متابعة واحدة' },
    en: `A quick reminder 🙂 UAE importers only see offers submitted through the form:
👉 {link}

No form, no listing — this is our last message on it.`,
    ar: `تذكير سريع 🙂 المستوردون في الإمارات يرون فقط العروض المرسلة عبر النموذج:
👉 {link}

بدون النموذج لا يُدرج العرض — وهذه آخر رسالة منّا بهذا الخصوص.`,
  },
  {
    key: 'uae_registration', audience: 'uae',
    title: { en: 'UAE lead · product registration', ar: 'عميل إماراتي · تسجيل منتج' },
    en: `Hello and thank you for contacting *Crate* 👋

To guide you on registration, 3 quick questions:
1. What is the product?
2. Imported or made in the UAE?
3. Which emirate will you sell in?

Free tool (authority, fees, documents):
👉 https://www.crate.ae/en/tools/product-registration-uae`,
    ar: `أهلاً بك وشكراً لتواصلك مع *Crate* 👋

لنرشدك في التسجيل، 3 أسئلة سريعة:
1. ما المنتج؟
2. مستورد أم مصنّع في الإمارات؟
3. في أي إمارة ستبيعه؟

أداة مجانية (الجهة، الرسوم، المستندات):
👉 https://www.crate.ae/ar/tools/product-registration-uae`,
  },
  {
    key: 'uae_import', audience: 'uae',
    title: { en: 'UAE lead · import & supply', ar: 'عميل إماراتي · استيراد وتوريد' },
    en: `Welcome to *Crate* 👋

So we help you precisely:
• Are you *buying* (importing) or *selling* in the UAE?
• Which product and roughly what quantity?

Meanwhile, our free import tools:
👉 https://www.crate.ae/en/import`,
    ar: `أهلاً بك في *Crate* 👋

حتى نساعدك بدقة:
• هل أنت *مشترٍ* (تستورد) أم *بائع* في الإمارات؟
• ما المنتج والكمية التقريبية؟

وإلى أن تردّ، أدواتنا المجانية للاستيراد:
👉 https://www.crate.ae/ar/import`,
  },
  {
    key: 'uae_buyer', audience: 'uae',
    title: { en: 'UAE buyer · matching offers', ar: 'مشترٍ إماراتي · عروض مطابقة' },
    en: `We have supplier offers for *{product}* 📦

Tell us:
• Grade / specification
• Quantity
• Delivery (Jebel Ali or your warehouse)

We send you the matching offers and help with registration and the Arabic label.`,
    ar: `لدينا عروض موردين لـ *{product}* 📦

أخبرنا:
• الدرجة / المواصفات
• الكمية
• التسليم (جبل علي أو مستودعك)

نرسل لك العروض المطابقة، ونساعدك في التسجيل والملصق العربي.`,
  },
]

/** Fills {link}, {ref} and {product}. */
export function fillReply(t: ReplyTemplate, lang: 'ar' | 'en', vars: { ref?: string; product?: string } = {}): string {
  return (lang === 'ar' ? t.ar : t.en)
    .replace(/\{link\}/g, offerFormUrl(lang, vars.product))
    .replace(/\{ref\}/g, vars.ref ?? '')
    .replace(/\{product\}/g, vars.product ?? (lang === 'ar' ? 'منتجكم' : 'your product'))
}

/** wa.me link with the message pre-filled. Digits only, as WhatsApp requires. */
export const waLink = (phone: string, text: string) =>
  `https://wa.me/${phone.replace(/\D/g, '').replace(/^00/, '')}?text=${encodeURIComponent(text)}`
