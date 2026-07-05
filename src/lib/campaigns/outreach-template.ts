/**
 * The ONE supplier-outreach pitch template. Both auto-draft paths — an incoming
 * RFQ (/api/rfq) and the weekly organism outreach (/api/organism/outreach) —
 * previously hardcoded their own near-identical bilingual HTML, which could drift
 * apart. They now share this. {{company}} is filled per-recipient at send time.
 */
export function supplierPitchHtml(opts: { productEn: string; productAr?: string | null }): string {
  const nameAr = opts.productAr || opts.productEn
  return (
    `<div dir="rtl" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8">`
    + `<p>مرحباً {{company}},</p><p>لدينا طلب استيراد فعّال على <strong>${nameAr}</strong>. `
    + `إن كنتم توفّرونه أو ما يماثله، شاركونا قائمة الأسعار والحد الأدنى للطلب — بدون التزام.</p></div>`
    + `<div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;margin-top:12px">`
    + `<p>Hello {{company}},</p><p>We have an active import request for <strong>${opts.productEn}</strong>. `
    + `If you supply this or a close match, share your price list and MOQ — no obligation.</p></div>`
  )
}

/** Trend/opportunity-driven pitch (weekly organism outreach). Distinct message
 *  from the RFQ one, but kept here so all outreach copy lives in one file. */
export function opportunityPitchHtml(o: { title: string; title_ar?: string | null; category_guess?: string | null }): { subject: string; body_html: string } {
  const cat = o.category_guess ?? 'FMCG'
  const nameAr = o.title_ar ?? o.title
  return {
    subject: `فرصة توريد: ${nameAr} — Supply opportunity`,
    body_html: `
<div dir="rtl" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1f2430">
  <p>مرحباً {{company}}،</p>
  <p>رصدنا طلباً متنامياً في السوق الإماراتي على <strong>${nameAr}</strong> ضمن فئة ${cat}.</p>
  <p>إن كنتم توفّرون هذا المنتج أو ما يماثله، يسعدنا ربطكم بمستوردين وموزّعين يبحثون عنه الآن — بدون أي التزام.</p>
  <p>هل ترغبون بإرسال قائمة الأسعار والحد الأدنى للطلب؟</p>
</div>
<div dir="ltr" style="font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#1f2430;margin-top:14px">
  <p>Hello {{company}},</p>
  <p>We're seeing growing UAE demand for <strong>${o.title}</strong> in the ${cat} category.</p>
  <p>If you supply this or a close match, we'd be glad to connect you with importers/distributors actively sourcing it — no obligation.</p>
  <p>Could you share your price list and MOQ?</p>
</div>`,
  }
}
