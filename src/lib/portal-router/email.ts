/**
 * Transactional email for the Portal Router: the same deterministic route the
 * visitor saw on screen, rendered as a printable checklist. No marketing copy —
 * the visitor asked for this document (TDRA: transactional, not promotional).
 */
import type { RouteResult, Answers } from './rules'
import { CATEGORIES, EMIRATES, answersToQuery } from './rules'

const SITE = 'https://www.crate.ae'

export function portalRouterEmail(result: RouteResult, answers: Answers, locale: 'ar' | 'en'): { subject: string; html: string } {
  const ar = locale === 'ar'
  const t = (b: { en: string; ar: string }) => (ar ? b.ar : b.en)
  const cat = CATEGORIES.find(c => c.key === answers.category)!
  const em = EMIRATES.find(e => e.key === answers.emirate)!
  const link = `${SITE}/${locale}/tools/product-registration-uae?${answersToQuery(answers)}`

  const li = (items: { en: string; ar: string }[]) => items.map(i => `<li style="margin:0 0 6px">${esc(t(i))}</li>`).join('')
  const steps = result.steps.map((s, i) => `
    <tr><td style="padding:10px 0;border-top:1px solid #f1e6dc;vertical-align:top;width:28px"><span style="display:inline-block;width:24px;height:24px;border-radius:12px;background:#f97316;color:#fff;text-align:center;line-height:24px;font-size:13px">${i + 1}</span></td>
    <td style="padding:10px 8px;border-top:1px solid #f1e6dc">
      <div style="font-size:15px;color:#1f2430"><b>${esc(t(s.portal))}</b> — ${esc(t(s.authority))}</div>
      <div style="font-size:13px;color:#4b5563;margin-top:4px">${esc(t(s.purpose))}</div>
      ${s.fee ? `<div style="font-size:12px;color:#6b7280;margin-top:4px">${ar ? 'الرسوم' : 'Fees'}: ${esc(t(s.fee))}</div>` : ''}
      ${s.time ? `<div style="font-size:12px;color:#6b7280">${ar ? 'المدة' : 'Timeline'}: ${esc(t(s.time))}</div>` : ''}
      <div style="font-size:12px;margin-top:4px"><a href="${s.url}" style="color:#ea580c">${s.url}</a></div>
    </td></tr>`).join('')

  const subject = ar
    ? `مسار تسجيل منتجك في الإمارات: ${cat.label.ar} — ${em.label.ar}`
    : `Your UAE registration route: ${cat.label.en} — ${em.label.en}`

  const html = `<!doctype html><html lang="${locale}" dir="${ar ? 'rtl' : 'ltr'}"><body style="margin:0;background:#fff7ed;padding:24px 12px;font-family:${ar ? "'Noto Sans Arabic'," : ''}Poppins,Arial,sans-serif;color:#1f2430">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #fed7aa;border-radius:16px;padding:24px">
    <div style="font-size:12px;color:#9a3412;letter-spacing:.04em">CRATE · ${ar ? 'موجّه بوابات التسجيل' : 'Registration Portal Router'}</div>
    <h1 style="font-size:20px;margin:8px 0 4px;font-weight:600">${esc(t(result.headline))}</h1>
    <div style="font-size:13px;color:#6b7280;margin-bottom:16px">${ar ? 'النوع' : 'Category'}: ${esc(t(cat.label))} · ${ar ? 'الإمارة' : 'Emirate'}: ${esc(t(em.label))} · ${answers.imported ? (ar ? 'مستورد' : 'Imported') : (ar ? 'تصنيع محلي' : 'Locally made')}</div>

    <h2 style="font-size:15px;margin:16px 0 4px;font-weight:600">${ar ? 'الخطوات بالترتيب' : 'Steps, in order'}</h2>
    <table style="width:100%;border-collapse:collapse">${steps}</table>

    ${result.warnings.length ? `<div style="margin-top:16px;padding:12px;border-radius:12px;background:#fff7ed;border:1px solid #fed7aa;font-size:13px"><b>${ar ? 'انتبه' : 'Watch out'}</b><ul style="margin:6px 0 0;padding-${ar ? 'right' : 'left'}:18px">${li(result.warnings)}</ul></div>` : ''}

    <h2 style="font-size:15px;margin:18px 0 4px;font-weight:600">${ar ? 'قائمة المستندات' : 'Document checklist'}</h2>
    <ul style="margin:0;padding-${ar ? 'right' : 'left'}:18px;font-size:13px;color:#374151">${li(result.documents)}</ul>

    <h2 style="font-size:15px;margin:18px 0 4px;font-weight:600">${ar ? 'أكثر أسباب الرفض' : 'Most common rejection reasons'}</h2>
    <ul style="margin:0;padding-${ar ? 'right' : 'left'}:18px;font-size:13px;color:#374151">${li(result.rejections)}</ul>

    <div style="margin-top:20px;padding:14px;border-radius:12px;background:#fafafa;border:1px solid #eee;font-size:13px">
      <b>${ar ? 'الخطوة التالية' : 'Next step'}</b><br>
      ${ar ? 'افحص ملصقك مجاناً قبل التقديم (الأخطاء اللغوية أكثر سبب للرفض):' : 'Pre-check your label for free before you file (label errors are the #1 rejection reason):'}
      <a href="${SITE}/${locale}/compliance" style="color:#ea580c">${SITE}/${locale}/compliance</a><br>
      ${ar ? 'رابط نتيجتك (للطباعة أو الحفظ PDF):' : 'Your result (print or save as PDF):'} <a href="${link}" style="color:#ea580c">${link}</a>
    </div>

    <div style="margin-top:16px;font-size:11px;color:#9ca3af;line-height:1.6">
      ${ar ? 'هذا دليل إرشادي مؤرخ 2026-09-24 مبني على المصادر الرسمية والمنقول عن الاستشاريين حيث أُشير إلى ذلك. الجهة المختصة هي المرجع النهائي.' : 'Guidance dated 2026-09-24, built from official sources and consultant-reported figures where marked. The competent authority is the final reference.'}<br>
      ${result.sources.map(s => `<a href="${s.url}" style="color:#9ca3af">${esc(s.label)}</a>`).join(' · ')}
    </div>
  </div>
  <div style="text-align:center;font-size:11px;color:#9ca3af;margin-top:12px">Crate · ${SITE}</div>
</body></html>`
  return { subject, html }
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))
}
