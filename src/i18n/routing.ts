import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // hreflang lives in each page's <head> (src/lib/seo/alternates.ts). The default Link header would
  // say x-default = an un-prefixed URL that 307-redirects, contradicting the page — two sources, one truth.
  alternateLinks: false,
})
