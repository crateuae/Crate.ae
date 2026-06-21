import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ChevronLeft, Tag, Clock } from 'lucide-react'
import RfqForm from './RfqForm'

export const revalidate = 3600

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

interface Article {
  slug: string
  title_ar: string; title_en: string
  body_ar: string; body_en: string
  image_url: string | null
  tags: string[] | null
  published_at: string | null
}

async function getArticle(slug: string): Promise<Article | null> {
  const { data } = await db()
    .from('articles')
    .select('slug, title_ar, title_en, body_ar, body_en, image_url, tags, published_at')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle()
  return (data as Article) ?? null
}

async function getOpportunityId(slug: string): Promise<string | null> {
  const { data } = await db()
    .from('opportunities')
    .select('id')
    .eq('published_url', `/insights/${slug}`)
    .maybeSingle()
  return data?.id ?? null
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string; slug: string }> }
): Promise<Metadata> {
  const { locale, slug } = await params
  const a = await getArticle(slug)
  if (!a) return { title: 'Not found' }
  const isAr = locale === 'ar'
  const title = isAr ? a.title_ar : a.title_en
  const desc = (isAr ? a.body_ar : a.body_en).replace(/\s+/g, ' ').slice(0, 155)
  const url = `https://www.crate.ae/${locale}/insights/${slug}`
  return {
    title: `${title} | Crate.ae`,
    description: desc,
    alternates: {
      canonical: url,
      languages: {
        'ar-AE': `https://www.crate.ae/ar/insights/${slug}`,
        'en-AE': `https://www.crate.ae/en/insights/${slug}`,
      },
    },
    openGraph: {
      title, description: desc, url, type: 'article',
      images: a.image_url ? [a.image_url] : undefined,
    },
    keywords: a.tags ?? undefined,
  }
}

export default async function InsightPage(
  { params }: { params: Promise<{ locale: string; slug: string }> }
) {
  const { locale, slug } = await params
  const isAr = locale === 'ar'

  const [a, opportunityId] = await Promise.all([
    getArticle(slug),
    getOpportunityId(slug),
  ])
  if (!a) notFound()

  const title = isAr ? a.title_ar : a.title_en
  const body = isAr ? a.body_ar : a.body_en
  const paragraphs = body.split(/\n{2,}|\n/).map(p => p.trim()).filter(Boolean)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    inLanguage: isAr ? 'ar-AE' : 'en-AE',
    datePublished: a.published_at,
    publisher: { '@type': 'Organization', name: 'Crate.ae' },
    keywords: (a.tags ?? []).join(', '),
  }

  return (
    <article className="min-h-screen bg-white" dir={isAr ? 'rtl' : 'ltr'}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-gray-50 border-b border-gray-100 px-6 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-2 text-sm text-gray-400">
          <Link href={`/${locale}`} className="hover:text-gray-700">{isAr ? 'الرئيسية' : 'Home'}</Link>
          <ChevronLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          <Link href={`/${locale}/insights`} className="hover:text-gray-700">{isAr ? 'رؤى السوق' : 'Insights'}</Link>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-black text-gray-900 mb-4 leading-tight">{title}</h1>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-8 flex-wrap">
          {a.published_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(a.published_at).toLocaleDateString(isAr ? 'ar-AE' : 'en-AE')}
            </span>
          )}
          {(a.tags ?? []).map(t => (
            <span key={t} className="flex items-center gap-1 bg-gray-100 rounded-lg px-2 py-0.5">
              <Tag className="w-3 h-3" />{t}
            </span>
          ))}
        </div>

        <div className="prose prose-gray max-w-none space-y-4">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-gray-700 leading-relaxed">{p}</p>
          ))}
        </div>

        {/* RFQ Form — the deal capture point */}
        <RfqForm
          opportunityId={opportunityId}
          productName={isAr ? (a.title_ar ?? a.title_en) : a.title_en}
          productNameAr={a.title_ar}
          sourcePage={`/${locale}/insights/${slug}`}
          isAr={isAr}
          locale={locale}
        />
      </div>
    </article>
  )
}
