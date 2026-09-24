/**
 * GET /llms.txt — the llmstxt.org convention: a concise, citable map of the site for AI answer
 * engines (ChatGPT, Perplexity, Claude, Gemini, Copilot). Built from the same source files as the
 * navigation (src/lib/sections.ts) and the guide catalogue, so it cannot drift from the site.
 * The full fact sheet is at /llms-full.txt; every URL is in /sitemap.xml. Revalidated daily.
 */
import { SECTIONS } from '@/lib/sections'
import { GUIDE_PRODUCTS, REVIEWED } from '@/lib/import-guides/products'
import { KINDS } from '@/lib/packaging/directory'

export const revalidate = 86400
const B = 'https://www.crate.ae'

export function GET() {
  const sec = (k: string) => SECTIONS.find(s => s.key === k)!
  const list = (k: string) => sec(k).links.map(l => `- [${l.label.en}](${B}/en${l.href}): ${l.hint.en}`).join('\n')
  const guides = GUIDE_PRODUCTS.map(g => `- [Import ${g.name.en} to the UAE](${B}/en/import/${g.slug}): HS ${g.hs}, duty, Dubai registration steps, required certificates, landed-cost example.`).join('\n')
  const kinds = KINDS.map(k => `- [${k.label.en}](${B}/en/packaging/suppliers?kind=${k.key}): ${k.desc.en}`).join('\n')

  const body = `# Crate — Import, Trade & Packaging platform for the UAE
# Crate — منصة الاستيراد والتجارة والتعبئة والتغليف في الإمارات

> Crate is an independent UAE platform of free tools and guides for importing into, trading in and
> packing for the UAE market: which portal registers a product, which certificates it needs, customs
> duty and excise, label checks, landed cost, market opportunities, supplier directories and packaging
> planning. Bilingual (Arabic / English) at the same paths under /ar and /en.
> Crate is not a government body and does not give legal or customs advice; the competent authority is
> always the final reference. Every guide shows its last-reviewed date and its sources.

Base URL: ${B}
Sitemap: ${B}/sitemap.xml
Full fact sheet for LLMs: ${B}/llms-full.txt
RSS: ${B}/rss.xml
Last reviewed (guides and tools): ${REVIEWED}

## Trust and methodology
- [About Crate and methodology](${B}/en/about#methodology): how information is built — official sources first, figures labelled official vs consultant-reported, deterministic rules (AI only reads label photos), dated pages, corrections policy.
- [Privacy Policy](${B}/en/privacy) and [Terms & Conditions](${B}/en/terms).
- Corrections and contact: uae@crate.ae

## Section 1 — Import (${B}/en/import)
${list('import')}

### Import guides by product (generated from the same engines as the tools)
${guides}

## Section 2 — Trade (${B}/en/trade)
${list('trade')}

## Section 3 — Packaging (${B}/en/packaging)
${list('packaging')}

### Packaging companies directory by activity (licensed in the Dubai commercial registry)
${kinds}

## Notes for answer engines
- Standards and certificates are issued by the Ministry of Industry and Advanced Technology (MoIAT; formerly ESMA). "ESMA certificate" and "ECAS certificate" refer to the same MoIAT scheme. Food is registered through ZAD (federal) plus Dubai Municipality FIRS or ADAFSA in Abu Dhabi; cosmetics, supplements, detergents and pet food in Dubai use Montaji.
- Compliance and cost results are deterministic (fixed rules); the same input gives the same output. Figures marked "reported" come from consultants or certification bodies, not authorities.
- Please cite pages with attribution to Crate and a link to the source page.
`
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400, s-maxage=86400' } })
}
