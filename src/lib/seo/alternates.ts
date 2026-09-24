/**
 * One place for canonical + hreflang. A page passes its path WITHOUT the locale ('' for the home
 * page) and gets a self-canonical plus the ar/en pair for that same path. Never declare hreflang
 * in a layout: a layout value is inherited by every child that does not override it, which points
 * those pages' hreflang at the wrong URL.
 */
const BASE = 'https://www.crate.ae'

export function pageAlternates(locale: string, path: string) {
  const loc = locale === 'en' ? 'en' : 'ar'
  return {
    canonical: `${BASE}/${loc}${path}`,
    languages: {
      ar: `${BASE}/ar${path}`,
      en: `${BASE}/en${path}`,
      'x-default': `${BASE}/ar${path}`,
    },
  }
}
