/**
 * The automatic "documents request" email a supplier gets after submitting an offer.
 * Plain, short, bilingual (their form language first). Dependency-free on purpose: the caller
 * passes the document list, so scripts can use it as well as the API route.
 */
type Bi = { en: string; ar: string }
type Doc = { key: string; label: Bi }

/** The documents a UAE importer asks for first, in this order. */
export const CORE_DOCS = ['export_licence', 'origin', 'phyto', 'health', 'lab'] as const

const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!))

export function docsRequestEmail(input: {
  ref: string
  product: string
  company: string
  locale: 'ar' | 'en'
  held: string[]            // document keys the supplier ticked on the form
  docs: Doc[]               // DOCUMENTS from model.ts
}): { subject: string; html: string; text: string } {
  const { ref, product, company, locale, held, docs } = input
  const label = (k: string, l: 'en' | 'ar') => docs.find(d => d.key === k)?.label[l] ?? k
  const core = [...CORE_DOCS] as string[]
  const missing = core.filter(k => !held.includes(k))
  const ticked = core.filter(k => held.includes(k))

  const en = [
    `Hello ${company},`,
    `Thank you for submitting your offer for ${product} on Crate. Your reference is ${ref}.`,
    `To mark the offer as verified for UAE importers, please reply to this email with:`,
    ...[...ticked, ...missing].map(k => `• ${label(k, 'en')}${ticked.includes(k) ? ' (you said you have it — please attach it)' : ''}`),
    `• 2–3 photos of the product and its packaging`,
    `Crate is a UAE import platform, not a buyer. We share verified offers with UAE importers who request the product, and interested buyers contact you through us. Crate never asks suppliers for deposits or payments.`,
    `Regards,\nCrate — www.crate.ae`,
  ]
  const ar = [
    `مرحباً ${company}،`,
    `شكراً لإرسال عرضكم لـ ${product} على Crate. رقم المرجع: ${ref}.`,
    `لتوثيق العرض أمام المستوردين في الإمارات، يرجى الرد على هذا البريد مع إرفاق:`,
    ...[...ticked, ...missing].map(k => `• ${label(k, 'ar')}${ticked.includes(k) ? ' (ذكرتم أنها متوفرة — يرجى إرفاقها)' : ''}`),
    `• 2–3 صور للمنتج وتعبئته`,
    `Crate منصة للاستيراد في الإمارات وليست مشترياً. نشارك العروض الموثّقة مع المستوردين الذين يطلبون المنتج، ويتواصل المهتمون معكم عبرنا. لا تطلب Crate من الموردين أي عربون أو دفعات.`,
    `مع التحية،\nCrate — www.crate.ae`,
  ]
  const first = locale === 'ar' ? ar : en
  const second = locale === 'ar' ? en : ar
  const para = (lines: string[], dir: 'rtl' | 'ltr') => `<div dir="${dir}" style="text-align:${dir === 'rtl' ? 'right' : 'left'}">${lines.map(l => `<p style="margin:0 0 10px">${esc(l).replace(/\n/g, '<br>')}</p>`).join('')}</div>`
  return {
    subject: locale === 'ar' ? `استلمنا عرضكم ${ref} — المستندات المطلوبة` : `Offer ${ref} received — documents needed`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;color:#1f2430;max-width:600px">${para(first, locale === 'ar' ? 'rtl' : 'ltr')}<hr style="border:none;border-top:1px solid #e5e7eb;margin:18px 0">${para(second, locale === 'ar' ? 'ltr' : 'rtl')}</div>`,
    text: `${first.join('\n')}\n\n— — —\n\n${second.join('\n')}`,
  }
}
