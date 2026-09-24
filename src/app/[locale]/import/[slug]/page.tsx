import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ExternalLink, Check, AlertTriangle } from 'lucide-react'
import { GUIDE_PRODUCTS, findGuide, REVIEWED } from '@/lib/import-guides/products'
import { buildGuide } from '@/lib/import-guides/build'
import { answersToQuery } from '@/lib/portal-router/rules'
import { certAnswersToQuery } from '@/lib/certificates/rules'
import GuideActions from './GuideActions'

export const revalidate = 86400
export const dynamicParams = false

export function generateStaticParams() {
  return (['ar', 'en'] as const).flatMap(locale => GUIDE_PRODUCTS.map(p => ({ locale, slug: p.slug })))
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params
  const p = findGuide(slug)
  if (!p) return {}
  const g = buildGuide(p)
  const isAr = locale === 'ar'
  const title = isAr
    ? `كيف تستورد ${p.name.ar} إلى الإمارات (2026): رمز HS والرسوم والتسجيل والشهادات`
    : `How to import ${p.name.en} to the UAE (2026): HS code, duty, registration & certificates`
  const description = isAr
    ? `دليل استيراد ${p.name.ar} إلى دبي: HS ${g.hs.code}، ${g.duty.ar}، خطوات التسجيل والشهادات المطلوبة، ومثال تكلفة واصلة.`
    : `Importing ${p.name.en} into Dubai: HS ${g.hs.code}, ${g.duty.en}, registration steps, required certificates and a landed-cost example.`
  return { title, description, alternates: { canonical: `https://www.crate.ae/${locale}/import/${slug}`, languages: { ar: `/ar/import/${slug}`, en: `/en/import/${slug}`, 'x-default': `/ar/import/${slug}` } }, openGraph: { title, description, url: `https://www.crate.ae/${locale}/import/${slug}` } }
}

const fmt = (n: number) => n.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })

export default async function ImportGuidePage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale: loc, slug } = await params
  const p = findGuide(slug)
  if (!p) notFound()
  const locale: 'ar' | 'en' = loc === 'en' ? 'en' : 'ar'
  const isAr = locale === 'ar'
  const g = buildGuide(p)
  const t = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en)
  const name = t(p.name)
  const isFood = p.category === 'food'
  const mandatory = g.certs.items.filter(i => i.status === 'mandatory' && i.key !== 'registration')
  const conditional = g.certs.items.filter(i => i.status === 'conditional')
  const related = p.related.map(findGuide).filter(Boolean) as typeof GUIDE_PRODUCTS

  const H = {
    crumbTools: isAr ? 'أدلة الاستيراد' : 'Import guides',
    h1: isAr ? `كيف تستورد ${name} إلى الإمارات (2026)` : `How to import ${name} to the UAE (2026)`,
    quick: isAr ? 'الجواب السريع' : 'Quick answer',
    hsL: isAr ? 'رمز HS' : 'HS code', dutyL: isAr ? 'الرسوم الجمركية' : 'Customs duty', vatL: isAr ? 'ضريبة القيمة المضافة' : 'VAT',
    exciseL: isAr ? 'الضريبة الانتقائية' : 'Excise', certL: isAr ? 'الشهادات المطلوبة' : 'Certificates required', routeL: isAr ? 'مسار التسجيل في دبي' : 'Registration route in Dubai',
    vat: isAr ? '5% على القيمة شاملة الرسوم' + (p.excise ? ' والانتقائية' : '') : '5% on the value incl. duty' + (p.excise ? ' and excise' : ''),
    exNone: isAr ? 'لا تنطبق' : 'Not applicable',
    exEnergy: isAr ? '100% (قرار مجلس الوزراء 197/2025)' : '100% (Cabinet Decision 197/2025)',
    exSweet: isAr ? 'بحسب السكر: أقل من 5 غ/100 مل = 0؛ 5–أقل من 8 غ = 0.79 درهم/لتر؛ 8 غ فأكثر = 1.09 درهم/لتر' : 'By sugar: <5 g/100 ml = 0; 5–<8 g = AED 0.79/L; ≥8 g = AED 1.09/L',
    certNone: isAr ? 'لا شهادة مطابقة إلزامية — البوابة هي تسجيل المنتج والملصق العربي' : 'No mandatory conformity certificate — product registration and the Arabic label are the gate',
    steps: isAr ? 'الخطوات بالترتيب (دبي، مستورد)' : 'Steps in order (Dubai, imported)',
    fees: isAr ? 'الرسوم' : 'Fees', time: isAr ? 'المدة' : 'Timeline',
    certs: isAr ? 'الشهادات المطلوبة' : 'Certificates required',
    docs: isAr ? 'قائمة المستندات' : 'Document checklist',
    label: isAr ? 'متطلبات الملصق' : 'Label requirements',
    labelIntro: isAr ? 'وفق UAE.S 9 (GSO 9) يجب أن تظهر بالعربية:' : 'Under UAE.S 9 (GSO 9) the following must appear in Arabic:',
    labelItems: isAr
      ? ['اسم المنتج', 'المكوّنات', 'تاريخا الإنتاج والانتهاء', 'ظروف التخزين', 'الحقائق الغذائية', 'إضافةً إلى: المحتوى الصافي بوحدات مترية، وبلد المنشأ، واسم المستورد']
      : ['Product name', 'Ingredients', 'Production and expiry dates', 'Storage conditions', 'Nutrition facts', 'Plus: net content in metric units, country of origin and importer name'],
    labelCta: isAr ? 'افحص ملصقك مجاناً قبل التقديم' : 'Pre-check your label for free',
    cost: isAr ? 'مثال تكلفة واصلة (شحنة توضيحية)' : 'Landed-cost example (illustrative shipment)',
    costSub: (c: typeof g.costInputs) => isAr
      ? `بضاعة ${fmt(c.goods)} + شحن ${fmt(c.freight)} + تأمين ${fmt(c.insurance)} + تكاليف محلية ${fmt(c.local)} درهم${g.product.excise === 'sweet' ? ` — ${fmt(c.litres ?? 0)} لتراً بسكر ${c.sugar} غ/100 مل` : ''}${g.product.excise === 'energy' ? ` — ${c.units.toLocaleString('en-US')} علبة بسعر تجزئة ${c.retail} درهم` : ''}`
      : `Goods ${fmt(c.goods)} + freight ${fmt(c.freight)} + insurance ${fmt(c.insurance)} + local costs ${fmt(c.local)} AED${g.product.excise === 'sweet' ? ` — ${fmt(c.litres ?? 0)} L at ${c.sugar} g sugar/100 ml` : ''}${g.product.excise === 'energy' ? ` — ${c.units.toLocaleString('en-US')} cans at AED ${c.retail} retail` : ''}`,
    rows: { cif: 'CIF', duty: isAr ? 'الرسوم الجمركية' : 'Customs duty', excise: isAr ? 'الضريبة الانتقائية' : 'Excise tax', local: isAr ? 'التكاليف المحلية' : 'Local costs', exVat: isAr ? 'التكلفة الواصلة قبل VAT' : 'Landed cost ex-VAT', vat: isAr ? 'VAT 5%' : 'VAT 5%', inc: isAr ? 'شاملة VAT' : 'Incl. VAT' },
    uplift: isAr ? 'الزيادة على قيمة البضاعة' : 'Uplift on goods value',
    costNote: isAr ? 'أرقام توضيحية للتخطيط وليست تقييماً جمركياً. عدّل الأرقام في الحاسبة.' : 'Illustrative planning figures, not a customs valuation. Adjust the numbers in the calculator.',
    mistakes: isAr ? 'أكثر أسباب الرفض' : 'Most common rejection reasons',
    notes: isAr ? 'ملاحظات خاصة بهذا المنتج' : 'Notes specific to this product',
    faq: isAr ? 'أسئلة شائعة' : 'Frequently asked',
    more: isAr ? 'أدلة ذات صلة' : 'Related guides',
    src: isAr ? `المصادر (مراجعة ${REVIEWED})` : `Sources (reviewed ${REVIEWED})`,
    disc: isAr ? 'دليل إرشادي مبني على المصادر الرسمية والأرقام المنقولة عن الاستشاريين حيث أُشير إلى ذلك؛ الجهة المختصة هي المرجع النهائي والرسوم تتغير.' : 'Guidance built from official sources and consultant-reported figures where marked; the competent authority is the final reference and fees change.',
    updated: isAr ? `آخر مراجعة: ${REVIEWED}` : `Last reviewed: ${REVIEWED}`,
  }

  const exciseText = p.excise === 'energy' ? H.exEnergy : p.excise === 'sweet' ? H.exSweet : H.exNone
  const certText = mandatory.length ? mandatory.map(i => t(i.name)).join(isAr ? '؛ ' : '; ') : H.certNone
  const routeText = g.route.steps.map(s => t(s.portal)).join(isAr ? ' ← ' : ' → ')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: H.h1, inLanguage: locale, dateModified: REVIEWED, datePublished: REVIEWED, author: { '@type': 'Organization', name: 'Crate', url: 'https://www.crate.ae' }, publisher: { '@type': 'Organization', name: 'Crate', url: 'https://www.crate.ae' }, mainEntityOfPage: `https://www.crate.ae/${locale}/import/${slug}`, citation: g.route.sources.map(s => ({ '@type': 'CreativeWork', name: s.label, url: s.url })) },
      { '@type': 'BreadcrumbList', itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Crate', item: `https://www.crate.ae/${locale}` },
        { '@type': 'ListItem', position: 2, name: H.crumbTools, item: `https://www.crate.ae/${locale}/import` },
        { '@type': 'ListItem', position: 3, name: name, item: `https://www.crate.ae/${locale}/import/${slug}` },
      ] },
      { '@type': 'FAQPage', mainEntity: g.faq.map(f => ({ '@type': 'Question', name: t(f.q), acceptedAnswer: { '@type': 'Answer', text: t(f.a) } })) },
    ],
  }

  const routerQ = answersToQuery({ category: p.category, emirate: 'dubai', imported: true, animal: !!p.animal, ecasWatch: !!p.ecasWatch, claims: false })
  const certQ = certAnswersToQuery({ family: p.family, imported: true, animal: !!p.animal, organic: false, halalMark: false })
  const Row = ({ l, v, bold }: { l: string; v: number; bold?: boolean }) => (
    <tr className={`border-b border-gray-50 ${bold ? 'font-semibold text-gray-900' : 'text-gray-700'}`}><td className="py-2">{l}</td><td className="py-2 text-end tabular-nums">{fmt(v)} <span className="text-[11px] text-gray-400">AED</span></td></tr>
  )
  const card = 'bg-white border border-gray-200 rounded-2xl p-5 mb-4'

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:py-0" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="max-w-3xl mx-auto">
        <nav className="text-xs text-gray-400 mb-3 print:hidden"><Link href={`/${locale}`} className="hover:text-orange-600">Crate</Link> / <Link href={`/${locale}/import`} className="hover:text-orange-600">{H.crumbTools}</Link> / <span className="text-gray-600">{name}</span></nav>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 leading-tight print:text-2xl">{H.h1}</h1>
        <div className="text-xs text-gray-400 mb-5">{H.updated}</div>

        {/* Quick answer */}
        <section className="bg-white border-2 border-orange-100 rounded-2xl p-5 mb-4">
          <h2 className="text-sm font-semibold text-orange-700 mb-3">{H.quick}</h2>
          <dl className="grid sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-gray-400">{H.hsL}</dt><dd className="text-gray-900"><span className="font-mono text-orange-600">{g.hs.code}</span> — {t({ en: g.hs.en, ar: g.hs.ar })}</dd>
            <dt className="text-gray-400">{H.dutyL}</dt><dd className="text-gray-900">{t(g.duty)}</dd>
            <dt className="text-gray-400">{H.vatL}</dt><dd className="text-gray-900">{H.vat}</dd>
            <dt className="text-gray-400">{H.exciseL}</dt><dd className="text-gray-900">{exciseText}</dd>
            <dt className="text-gray-400">{H.certL}</dt><dd className="text-gray-900">{certText}</dd>
            <dt className="text-gray-400">{H.routeL}</dt><dd className="text-gray-900">{routeText}</dd>
          </dl>
          <div className="mt-4"><GuideActions locale={locale} titleAr={`دليل استيراد ${p.name.ar}`} categoryAr={`أدلة الاستيراد · ${p.name.ar}`}
            routerHref={`/${locale}/tools/product-registration-uae?${routerQ}`} certHref={`/${locale}/tools/certificates-uae?${certQ}`}
            calcHref={`/${locale}/tools/landed-cost-uae?hs=${encodeURIComponent(g.hs.code)}`} rfqHref={`/${locale}/rfq?product=${encodeURIComponent(p.name.en)}`} /></div>
        </section>

        {p.notes.length > 0 && (
          <section className={card}><h2 className="text-base font-semibold text-gray-900 mb-2">{H.notes}</h2>
            <ul className="list-disc ps-5 text-sm text-gray-700 flex flex-col gap-2">{p.notes.map((n, i) => <li key={i}>{t(n)}</li>)}</ul></section>
        )}

        {/* Steps */}
        <section className={card}>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{H.steps}</h2>
          <ol className="flex flex-col gap-4">
            {g.route.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-orange-500 text-white text-sm flex items-center justify-center tabular-nums">{i + 1}</span>
                <div className="min-w-0">
                  <div className="text-sm text-gray-900"><span className="font-semibold">{t(s.portal)}</span> <span className="text-gray-400">— {t(s.authority)}</span></div>
                  <div className="text-sm text-gray-600 mt-0.5">{t(s.purpose)}</div>
                  {s.fee && <div className="text-xs text-gray-500 mt-1">{H.fees}: {t(s.fee)}</div>}
                  {s.time && <div className="text-xs text-gray-500">{H.time}: {t(s.time)}</div>}
                  <a href={s.url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-orange-600 mt-1 print:text-gray-500">{s.url}<ExternalLink className="w-3 h-3 print:hidden" /></a>
                </div>
              </li>
            ))}
          </ol>
          {g.route.warnings.length > 0 && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 mt-4 text-sm text-gray-700">
              <div className="font-semibold text-gray-800 flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4 text-orange-500" />{isAr ? 'انتبه' : 'Watch out'}</div>
              <ul className="list-disc ps-5 flex flex-col gap-1">{g.route.warnings.map((w, i) => <li key={i}>{t(w)}</li>)}</ul>
            </div>
          )}
        </section>

        {/* Certificates */}
        <section className={card}>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{H.certs}</h2>
          <div className="flex flex-col gap-3">
            {g.certs.items.map((c, i) => (
              <div key={c.key + i} className="rounded-xl border border-gray-100 p-3">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${c.status === 'mandatory' ? 'bg-orange-500 text-white' : c.status === 'conditional' ? 'bg-amber-100 text-amber-800' : c.status === 'voluntary' ? 'bg-gray-100 text-gray-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {c.status === 'mandatory' ? (isAr ? 'إلزامية' : 'Mandatory') : c.status === 'conditional' ? (isAr ? 'مشروطة' : 'Conditional') : c.status === 'voluntary' ? (isAr ? 'اختيارية' : 'Voluntary') : (isAr ? 'غير مطلوبة' : 'Not required')}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{t(c.name)}</span>
                </div>
                <div className="text-sm text-gray-600">{t(c.why)}</div>
                {c.officialFee && <div className="text-xs text-gray-500 mt-1">{isAr ? 'الرسوم الرسمية' : 'Official fees'}: {t(c.officialFee)}</div>}
                {c.reportedFee && <div className="text-xs text-gray-500 mt-1">{isAr ? 'رسوم منقولة' : 'Reported fees'}: {t(c.reportedFee)}</div>}
              </div>
            ))}
          </div>
        </section>

        {/* Documents + label */}
        <section className={card}>
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">{H.docs}</h2>
              <ul className="flex flex-col gap-1.5 text-sm text-gray-700">{g.route.documents.map((d, i) => <li key={i} className="flex gap-2"><Check className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" /><span>{t(d)}</span></li>)}</ul>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2">{H.mistakes}</h2>
              <ul className="list-disc ps-5 text-sm text-gray-700 flex flex-col gap-1.5">{g.route.rejections.map((r, i) => <li key={i}>{t(r)}</li>)}</ul>
            </div>
          </div>
        </section>

        {isFood && (
          <section className={card}>
            <h2 className="text-base font-semibold text-gray-900 mb-2">{H.label}</h2>
            <p className="text-sm text-gray-600 mb-2">{H.labelIntro}</p>
            <ul className="list-disc ps-5 text-sm text-gray-700 flex flex-col gap-1 mb-3">{H.labelItems.map(x => <li key={x}>{x}</li>)}</ul>
            <Link href={`/${locale}/compliance`} className="inline-flex items-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm px-4 py-2 print:hidden">{H.labelCta}</Link>
          </section>
        )}

        {/* Cost */}
        <section className={card}>
          <h2 className="text-base font-semibold text-gray-900 mb-1">{H.cost}</h2>
          <div className="text-xs text-gray-400 mb-3">{H.costSub(g.costInputs)}</div>
          <table className="w-full text-sm"><tbody>
            <Row l={H.rows.cif} v={g.cost.cif} />
            <Row l={`${H.rows.duty} (${g.cost.dutyRate}%)`} v={g.cost.duty} />
            {p.excise && <Row l={`${H.rows.excise}${g.cost.exciseTier ? ` (${g.cost.exciseTier})` : ''}`} v={g.cost.excise} />}
            <Row l={H.rows.local} v={g.cost.local} />
            <Row l={H.rows.exVat} v={g.cost.landedExVat} bold />
            <Row l={H.rows.vat} v={g.cost.vat} />
            <Row l={H.rows.inc} v={g.cost.landedTotal} bold />
          </tbody></table>
          <div className="text-xs text-gray-500 mt-2">{H.uplift}: <b className="tabular-nums">{g.cost.effectiveRatePct.toFixed(1)}%</b></div>
          <div className="text-[11px] text-gray-400 mt-2">{H.costNote}</div>
        </section>

        {/* FAQ */}
        <section className={card}>
          <h2 className="text-base font-semibold text-gray-900 mb-3">{H.faq}</h2>
          <div className="flex flex-col gap-3">{g.faq.map((f, i) => <div key={i}><h3 className="text-sm font-semibold text-gray-800">{t(f.q)}</h3><p className="text-sm text-gray-600 mt-0.5">{t(f.a)}</p></div>)}</div>
        </section>

        {related.length > 0 && (
          <section className="mb-4 print:hidden">
            <h2 className="text-sm font-semibold text-gray-800 mb-2">{H.more}</h2>
            <div className="flex flex-wrap gap-2">{related.map(r => <Link key={r.slug} href={`/${locale}/import/${r.slug}`} className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-orange-300">{t({ en: `Import ${r.name.en}`, ar: `استيراد ${r.name.ar}` })}</Link>)}</div>
          </section>
        )}

        <div className="text-[11px] text-gray-400">{H.disc}</div>
        <div className="text-[11px] text-gray-400 mt-2"><span className="font-semibold">{H.src}:</span> {g.route.sources.map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noopener" className="hover:text-orange-600">{s.label}</a></span>)}</div>
      </article>
    </div>
  )
}
