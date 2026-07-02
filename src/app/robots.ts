import { MetadataRoute } from 'next'

// Single canonical host + sitemap pointer. Admin/dashboard/api kept out of the index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/ar/dashboard/', '/en/dashboard/', '/ar/admin/', '/en/admin/', '/ar/login', '/en/login', '/ar/auth/', '/en/auth/'],
    },
    sitemap: 'https://www.crate.ae/sitemap.xml',
    host: 'https://www.crate.ae',
  }
}
