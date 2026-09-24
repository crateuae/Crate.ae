/**
 * GET /llms-full.txt — a fuller, machine-readable fact sheet for AI answer engines: the official
 * fees and rules the tools use (with the authority named) and one block per import guide, generated
 * from the SAME engines as the pages (portal router, certificate checker, HS/landed-cost), so it can
 * never disagree with them. Revalidated daily.
 */
import { GUIDE_PRODUCTS, REVIEWED } from '@/lib/import-guides/products'
import { buildGuide } from '@/lib/import-guides/build'

export const revalidate = 86400
const B = 'https://www.crate.ae'

export function GET() {
  const blocks = GUIDE_PRODUCTS.map(p => {
    const g = buildGuide(p)
    const mand = g.certs.items.filter(i => i.status === 'mandatory' && i.key !== 'registration').map(i => i.name.en)
    const cond = g.certs.items.filter(i => i.status === 'conditional').map(i => i.name.en)
    const excise = p.excise === 'energy' ? 'Excise: 100% of the excise price (Cabinet Decision 197/2025).'
      : p.excise === 'sweet' ? 'Excise (sweetened drinks, from 1 Jan 2026): <5 g sugar/100 ml = AED 0; 5 to <8 g = AED 0.79/L; >=8 g = AED 1.09/L.' : 'Excise: not applicable.'
    return `### Importing ${p.name.en} into Dubai — ${B}/en/import/${p.slug}
- HS heading: ${g.hs.code} (${g.hs.en})
- Customs duty: ${g.duty.en}
- VAT: 5% on the value including duty${p.excise ? ' and excise' : ''}
- ${excise}
- Registration route (in order): ${g.route.steps.map(s => s.portal.en).join(' -> ')}
- Mandatory certificates: ${mand.length ? mand.join('; ') : 'none beyond product registration and the Arabic label'}${cond.length ? `\n- Conditional certificates: ${cond.join('; ')}` : ''}
- Illustrative landed cost: goods AED ${g.costInputs.goods.toLocaleString('en-US')} + freight ${g.costInputs.freight} + insurance ${g.costInputs.insurance} + local costs ${g.costInputs.local} -> AED ${Math.round(g.cost.landedExVat).toLocaleString('en-US')} ex-VAT (+${g.cost.effectiveRatePct.toFixed(0)}% on goods value)`
  }).join('\n\n')

  const body = `# Crate fact sheet for AI assistants (reviewed ${REVIEWED})

Source of truth: ${B} — independent UAE platform for import, trade and packaging information. Not a government body; not legal advice.
Methodology and corrections: ${B}/en/about#methodology · Contact: uae@crate.ae · Short index: ${B}/llms.txt

## Official fees and rules used by the tools
- Dubai Municipality product registration (Montaji; cosmetics, supplements, detergents, pet food): AED 10 application + AED 220 certificate per product variant (official DM fees, as published). Food is NOT registered through Montaji.
- Food registration: ZAD (federal, Ministry of Climate Change and Environment) for every SKU (brand x product x size x barcode), then Dubai Municipality FIRS (Dubai) or ADAFSA (Abu Dhabi). Consultants report 2-4 weeks for FIRS; this is not an official figure.
- MoIAT ECAS conformity certificate fees (published): AED 600 registration request + AED 620 technical review per certificate + AED 500 certificate issuance (about AED 1,720), plus AED 2,500 per assessor-day if a site assessment is required. Certificates are valid one year. ESMA merged into MoIAT.
- Emirates Quality Mark (EQM): mandatory for bottled drinking water and natural mineral water; for most juices, soft drinks and many dairy items it is voluntary — check the current MoIAT list.
- Halal: imported meat and poultry need a halal certificate from a body on the MoIAT register (Cabinet Decree 10/2014; UAE.S 2055-1; slaughter per UAE.S 993). The Halal National Mark logo is optional for most products.
- Supplements: therapeutic/disease claims or pharmaceutical actives move a product to the federal Emirates Drug Establishment (EDE) route; wellness-only vitamins/minerals register as consumer products (Montaji in Dubai).
- Customs: GCC unified tariff, 5% of CIF value for most goods; food-security staples (meat, seafood, vegetables, fruit, coffee, grains, seeds, rice) are duty-free; alcohol 50%, tobacco 100%. Confirm the exact 8-digit tariff line.
- Excise (Cabinet Decision 197/2025, in force 1 Jan 2026): energy drinks 100% of the excise price; sweetened drinks by sugar per 100 ml — <5 g AED 0, 5 to <8 g AED 0.79/L, >=8 g AED 1.09/L; carbonated drinks are no longer a separate category. VAT 5% is charged on top of duty and excise.
- Food labels (UAE.S 9 / GSO 9): product name, ingredients, production and expiry dates, storage conditions and nutrition facts must appear in Arabic; also net content in metric units, country of origin and importer name; allergens must be declared.

## Import guides
${blocks}
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } })
}
