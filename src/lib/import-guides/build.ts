/**
 * Builds one guide's data from the deterministic engines. Pure: same product → same guide.
 */
import { HS_FMCG, type HsEntry } from '@/lib/customs/hs-fmcg'
import { computeLandedCost, type CostResult } from '@/lib/customs/landed-cost'
import { routeProduct, type RouteResult, type Bi } from '@/lib/portal-router/rules'
import { checkCertificates, type CertResult } from '@/lib/certificates/rules'
import type { GuideProduct } from './products'

export interface Guide {
  product: GuideProduct
  hs: HsEntry
  route: RouteResult
  certs: CertResult
  cost: CostResult
  costInputs: { goods: number; freight: number; insurance: number; local: number; units: number; litres?: number; sugar?: number; retail?: number }
  duty: Bi
  faq: { q: Bi; a: Bi }[]
}

export function dutyPhrase(hs: HsEntry): Bi {
  if (hs.duty === 0) return { en: '0% customs duty — duty-free under the GCC unified tariff', ar: '0% رسوم جمركية — معفى بموجب التعرفة الخليجية الموحدة' }
  if (hs.duty === 'verify') return { en: '5% standard customs duty on CIF unless this exact tariff line is on the GCC exemption list (confirm the 8-digit line)', ar: '5% رسوم جمركية قياسية على CIF ما لم يكن البند الدقيق ضمن قائمة الإعفاءات الخليجية (أكّد البند ثماني الخانات)' }
  if (hs.duty === 5) return { en: '5% customs duty on the CIF value (GCC standard rate)', ar: '5% رسوم جمركية على قيمة CIF (المعدل الخليجي القياسي)' }
  return { en: `${hs.duty}% customs duty on the CIF value`, ar: `${hs.duty}% رسوم جمركية على قيمة CIF` }
}

export function buildGuide(p: GuideProduct): Guide {
  const hs = HS_FMCG.find(e => e.code === p.hs)
  if (!hs) throw new Error(`import-guides: HS ${p.hs} missing from HS_FMCG (${p.slug})`)

  const route = routeProduct({ category: p.category, emirate: 'dubai', imported: true, animal: !!p.animal, ecasWatch: !!p.ecasWatch, claims: false })
  const certs = checkCertificates({ family: p.family, imported: true, animal: !!p.animal, organic: false, halalMark: false })

  // One illustrative shipment, identical for every guide so figures are comparable.
  const costInputs = {
    goods: 20000, freight: 2500, insurance: 200, local: 3000,
    units: p.example?.units ?? 1000, litres: p.example?.litres, sugar: p.example?.sugar, retail: p.example?.retail,
  }
  const cost = computeLandedCost({
    goodsValue: costInputs.goods, freight: costInputs.freight, insurance: costInputs.insurance, units: costInputs.units,
    duty: hs.duty, dutyOverride: 5, excise: p.excise ?? 'none',
    litres: costInputs.litres, sugarPer100ml: costInputs.sugar, retailPricePerUnit: costInputs.retail,
    clearance: 900, transport: 600, compliance: 1500, vatRegistered: true, targetMarginPct: 30,
  })

  const duty = dutyPhrase(hs)
  const first = route.steps.map(s => s.portal)
  const mandatory = certs.items.filter(i => i.status === 'mandatory' && i.key !== 'registration')
  const cond = certs.items.filter(i => i.status === 'conditional')
  const n = p.name

  const faq: Guide['faq'] = [
    {
      q: { en: `Is there customs duty on ${n.en} imported to the UAE?`, ar: `هل توجد رسوم جمركية على استيراد ${n.ar} إلى الإمارات؟` },
      a: { en: `${cap(duty.en)}. HS heading ${hs.code} (${hs.en}). VAT of 5% is charged on top of the value including duty${p.excise ? ' and excise' : ''}.`, ar: `${duty.ar}. البند الجمركي ${hs.code} (${hs.ar}). وتُفرض ضريبة قيمة مضافة 5% فوق القيمة شاملة الرسوم${p.excise ? ' والضريبة الانتقائية' : ''}.` },
    },
    {
      q: { en: `Which portal registers ${n.en} in Dubai?`, ar: `أي بوابة تسجّل ${n.ar} في دبي؟` },
      a: { en: `Steps in order: ${first.map(x => x.en).join(' → ')}. ${p.category === 'food' ? 'Food is not registered through Montaji — that submission is rejected.' : ''}`.trim(), ar: `الخطوات بالترتيب: ${first.map(x => x.ar).join(' ← ')}. ${p.category === 'food' ? 'الأغذية لا تُسجَّل عبر منتاجي — ويُرفض الطلب.' : ''}`.trim() },
    },
    {
      q: { en: `Do I need an ECAS, EQM or halal certificate for ${n.en}?`, ar: `هل أحتاج شهادة ECAS أو EQM أو حلال لاستيراد ${n.ar}؟` },
      a: {
        en: mandatory.length || cond.length
          ? `${mandatory.length ? `Mandatory: ${mandatory.map(i => i.name.en).join('; ')}. ` : ''}${cond.length ? `Conditional: ${cond.map(i => i.name.en).join('; ')}.` : ''}`.trim()
          : 'No conformity certificate is mandatory for this product family as of the review date; product registration and the Arabic label are the gate. Re-check MoIAT for unusual formulations.',
        ar: mandatory.length || cond.length
          ? `${mandatory.length ? `إلزامية: ${mandatory.map(i => i.name.ar).join('؛ ')}. ` : ''}${cond.length ? `مشروطة: ${cond.map(i => i.name.ar).join('؛ ')}.` : ''}`.trim()
          : 'لا توجد شهادة مطابقة إلزامية لهذه العائلة حتى تاريخ المراجعة؛ البوابة هي تسجيل المنتج والملصق العربي. راجع الوزارة للتركيبات غير المعتادة.',
      },
    },
  ]

  return { product: p, hs, route, certs, cost, costInputs, duty, faq }
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
