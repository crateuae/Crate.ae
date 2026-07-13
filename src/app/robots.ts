import { MetadataRoute } from 'next'

// Keep admin/dashboard/api/auth out of every index.
const OFF_LIMITS = ['/api/', '/ar/dashboard/', '/en/dashboard/', '/ar/admin/', '/en/admin/', '/ar/login', '/en/login', '/ar/auth/', '/en/auth/']

// AI answer-engine + training crawlers we WANT to be cited by (AEO). Listing them
// explicitly (allowed, same off-limits) signals intent and avoids accidental blocks
// — e.g. Google-Extended (Gemini/Vertex) and Applebot-Extended default to blocked
// on many sites; we opt IN for discoverability in ChatGPT, Perplexity, Claude,
// Gemini, Bing Copilot, and Apple Intelligence.
const AI_CRAWLERS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',        // OpenAI / ChatGPT
  'PerplexityBot', 'Perplexity-User',               // Perplexity
  'ClaudeBot', 'anthropic-ai', 'Claude-User',       // Anthropic / Claude
  'Google-Extended',                                // Gemini / Vertex
  'Applebot-Extended', 'Applebot',                  // Apple Intelligence / Siri
  'Amazonbot', 'Bytespider', 'CCBot', 'Meta-ExternalAgent', 'cohere-ai',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: OFF_LIMITS },
      { userAgent: AI_CRAWLERS, allow: '/', disallow: OFF_LIMITS },
    ],
    sitemap: 'https://www.crate.ae/sitemap.xml',
    host: 'https://www.crate.ae',
  }
}
