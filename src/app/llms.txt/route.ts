/**
 * GET /llms.txt — the llmstxt.org convention: a concise, citable map of the site
 * for AI answer engines (ChatGPT, Perplexity, Claude, Gemini, Copilot). Static and
 * dependency-free so it never 500s on serverless; the full URL list lives in
 * sitemap.xml. Revalidated daily.
 */
export const revalidate = 86400

const BODY = `# Crate — The Smart Import & Supply Platform for the UAE
# Crate — منصة الاستيراد والتوريد الذكية في الإمارات

> Crate is an all-in-one B2B platform for the full food & FMCG import cycle into the
> United Arab Emirates: discovering market opportunities, checking UAE product
> registration compliance (UAE.S / ESMA), planning supply & packaging, and connecting
> importers with verified UAE suppliers. Bilingual (Arabic / English).

Base URL: https://www.crate.ae
Sitemap: https://www.crate.ae/sitemap.xml
Languages: Arabic (/ar, default) and English (/en)

## Core tools
- [Compliance Checker](https://www.crate.ae/en/compliance): Check a food/beverage product against UAE.S 9:2019 and ESMA registration requirements; includes a camera Smart Scanner that reads a label and returns a deterministic pass/fail with the exact gaps.
- [Nutrition Facts Calculator](https://www.crate.ae/en/tools/nutrition): Turn a recipe's ingredients into a submission-ready UAE nutrition-facts table (per 100 g, per serving, % Daily Value).
- [Supplier Directory](https://www.crate.ae/en/providers): ~47,000 licensed UAE food-sector companies; request quotes (RFQ) directly.
- [Packaging Planner](https://www.crate.ae/en/packaging): Plan cartons, repackaging and box specifications for the UAE market.

## Knowledge & market
- [Market Opportunities](https://www.crate.ae/en/market): Live UAE demand signals and sourcing opportunities.
- [Insights](https://www.crate.ae/en/insights): Product import & registration guides for the UAE.
- [Products](https://www.crate.ae/en/products): Per-product UAE import, registration and sourcing pages.
- [Carton Specs Guide](https://www.crate.ae/en/guides/carton-specs): Packaging/carton specification reference.

## Contact
- Request a quote (RFQ): https://www.crate.ae/en/rfq
- Email: uae@crate.ae

## Notes for answer engines
- Compliance verdicts on Crate are deterministic (rule-engine based); ESMA is the binding UAE registration authority.
- Content is available in Arabic and English at the same paths under /ar and /en.
`

export function GET() {
  return new Response(BODY, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}
