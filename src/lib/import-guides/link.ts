/**
 * Maps an existing page (article / product) to the free tools: which import guide fits,
 * which HS heading to preload in the landed-cost calculator, and the deep-link queries
 * for the Portal Router and Certificate Checker. Pure + deterministic.
 * Rule: link a GUIDE only on a precise match (a wrong "guide" link is worse than none);
 * the tools themselves always work with sensible defaults.
 */
import { HS_FMCG } from '@/lib/customs/hs-fmcg'
import { answersToQuery } from '@/lib/portal-router/rules'
import { certAnswersToQuery, type Family } from '@/lib/certificates/rules'
import { GUIDE_PRODUCTS, type GuideProduct } from './products'

export interface ToolLinks {
  guide?: GuideProduct
  hsCode?: string            // an entry that exists in HS_FMCG
  routerQuery?: string       // undefined when the Portal Router has no matching category (non-food articles)
  certQuery: string
}

// Articles written about specific trending brands → the closest guide (or a family for non-food).
const ARTICLE_MAP: Record<string, { guide?: string; family?: Family; hs?: string; food: boolean }> = {
  'olipop-uae-market-guide-beverage-importers': { guide: 'soft-drinks', food: true },
  'poppi-soda-uae-import-guide': { guide: 'soft-drinks', food: true },
  'prime-hydration-uae-import-guide': { guide: 'soft-drinks', food: true },
  'celsius-energy-drink-uae-import-guide': { guide: 'energy-drinks', food: true },
  'ghost-energy-uae-import-market-guide': { guide: 'energy-drinks', food: true },
  'rao-marinara-uae-import-guide': { family: 'processed_food', hs: '2103', food: true },
  'stanley-cup-uae-importers-guide': { family: 'packaging', food: false },
}

const findGuide = (slug?: string) => GUIDE_PRODUCTS.find(g => g.slug === slug)
const hsEntry = (code?: string | null) => {
  if (!code) return undefined
  return HS_FMCG.find(e => e.code === code) ?? HS_FMCG.find(e => e.code === code.slice(0, 7)) ?? HS_FMCG.find(e => e.code === code.slice(0, 4))
}

/** HS heading → certificate family (only used to preselect the checker; user can change it). */
function familyForHs(hs: string): Family {
  const c4 = hs.slice(0, 4), c2 = hs.slice(0, 2)
  if (c4 === '0409') return 'honey'
  if (c2 === '04') return 'dairy'
  if (c2 === '02') return 'meat'
  if (c4 === '2201') return 'water'
  if (c4 === '2202') return 'soft_drink'
  if (c4 === '2009') return 'juice'
  if (c4 === '1806' || c4 === '1704' || c4 === '1905') return 'confectionery_snack'
  if (['10', '11', '15', '17'].includes(c2)) return 'oils_grains'
  return 'processed_food'
}

/** For products with neither HS code nor category: a conservative name hint (the user can still change the family). */
function familyForName(name: string): Family | undefined {
  const n = name.toLowerCase()
  if (/\b(oat|oatly|almond|soy|coconut|plant)\b.*\bmilk\b|\bmilk\b.*\b(oat|almond|soy)\b/.test(n)) return 'soft_drink'   // plant milks are not dairy
  if (/\b(water|pellegrino|perrier|evian)\b/.test(n)) return 'water'
  if (/\b(energy|red ?bull|monster|celsius|ghost)\b/.test(n)) return 'energy'
  if (/\b(juice|lemonade|soda|cola|drink|hydration)\b|liquid iv/.test(n)) return 'soft_drink'
  if (/\b(milk|cheese|yogh?urt|butter|cream|skyr|labneh|feta)\b/.test(n)) return 'dairy'
  if (/\b(honey|syrup)\b/.test(n)) return 'honey'
  if (/\b(chocolate|candy|sweets?|biscuits?|cookies?|granola|popcorn|chips|snacks?)\b/.test(n)) return 'confectionery_snack'
  if (/\b(oil|flour|semolina|rice|sugar|salt|vermicelli)\b/.test(n)) return 'oils_grains'
  if (/\b(chicken|beef|lamb|jerky|meat|shawarma)\b/.test(n)) return 'meat'
  return undefined
}

const FAMILY_BY_CATEGORY: Record<string, Family> = {
  'Dairy Products': 'dairy', 'Oils & Fats': 'oils_grains', 'Frozen Products': 'processed_food', 'Meat, Poultry & Fish': 'meat',
  'Beverages': 'soft_drink', 'Sugar, Honey & Syrup': 'oils_grains', 'Canned & Preserved': 'processed_food', 'Spices & Sauces': 'processed_food',
  'Cereals & Products': 'processed_food', 'Snacks & Confectionery': 'confectionery_snack', 'Coffee & Tea': 'processed_food',
}

export function toolLinksForArticle(slug: string): ToolLinks {
  const m = ARTICLE_MAP[slug]
  const guide = findGuide(m?.guide)
  const family: Family = guide?.family ?? m?.family ?? 'processed_food'
  const hs = guide ? hsEntry(guide.hs) : hsEntry(m?.hs)
  const food = m ? m.food : true
  return {
    guide, hsCode: hs?.code,
    routerQuery: food ? answersToQuery({ category: 'food', emirate: 'dubai', imported: true, animal: !!guide?.animal, ecasWatch: !!guide?.ecasWatch, claims: false }) : undefined,
    certQuery: certAnswersToQuery({ family, imported: true, animal: !!guide?.animal, organic: false, halalMark: false }),
  }
}

export function toolLinksForProduct(p: { name_en?: string | null; category_en?: string | null; hs_code?: string | null }): ToolLinks {
  const hs = hsEntry(p.hs_code)
  const name = (p.name_en ?? '').toLowerCase()
  let guide: GuideProduct | undefined
  if (hs) {
    // exact HS first, then the 4-digit heading — but only where the guide's product IS that heading
    guide = GUIDE_PRODUCTS.find(g => g.hs === hs.code) ?? GUIDE_PRODUCTS.find(g => g.hs.slice(0, 4) === hs.code.slice(0, 4) && !g.hs.includes('.'))
    // 2202.99 mixes energy drinks with iced tea etc. — decide by name
    if (hs.code === '2202.99') guide = /energy|celsius|monster|red ?bull|ghost|bang/.test(name) ? findGuide('energy-drinks') : findGuide('soft-drinks')
  }
  const family: Family = guide?.family ?? (p.hs_code ? familyForHs(p.hs_code) : (FAMILY_BY_CATEGORY[p.category_en ?? ''] ?? familyForName(p.name_en ?? '') ?? 'processed_food'))
  const animal = guide?.animal || family === 'meat'
  return {
    guide, hsCode: hs?.code,
    routerQuery: answersToQuery({ category: 'food', emirate: 'dubai', imported: true, animal: !!animal, ecasWatch: !!guide?.ecasWatch || family === 'dairy', claims: false }),
    certQuery: certAnswersToQuery({ family, imported: true, animal: !!animal, organic: false, halalMark: false }),
  }
}
