import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'
import { ChevronLeft, Newspaper } from 'lucide-react'

export const revalidate = 1800

function db() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: isAr ? 'رؤى السوق | Crate.ae' : 'Market Insights | Crate.ae',
    description: isAr
      ? 'تحليلات وفرص السوق للمنتجات الغذائية و FMCG في الإمارات.'
      : 'Market analysis and product opportunities for FMCG & food trade in the UAE.',
    alternates: { canonical: `https://www.crate.ae/${locale}/insights` },
  }
}

interface ArticleCard {
  slug: string; title_ar: string; title_en: string
  body_ar: string; body_en: string; tags: string[] | null; published_at: string | null
}

export default async function InsightsIndex(
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params
  const isAr = locale === 'ar'

  const { data } = await db()
    .from('articles')
    .select('slug, title_ar, title_en, body_ar, body_en, tags, published_at')
    .eq('is_published', true)
    .order('published_at', { ascending: false })
    .limit(60)

  const articles = (data as ArticleCard[]) ?? []

  return (
    <div className="min-h-screen bg-gray-50" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <Newspaper className="w-6 h-6 text-orange-600" />
          <div>
            <h1 className="text-2xl font-black text-gray-900">{isAr ? 'رؤى السوق' : 'Market Insights'}</h1>
            <p className="text-sm text-gray-500">
              {isAr ? 'فرص وتحليلات سوق FMCG في الإمارات' : 'UAE FMCG market opportunities & analysis'}
            </p>
          </div>
        </div>

        {articles.length === 0 ? (
          <p className="text-gray-400 text-center py-16">{isAr ? 'لا رؤى منشورة بعد.' : 'No insights published yet.'}</p>
        ) : (
          <div className="space-y-3">
            {articles.map(a => {
              const title = isAr ? a.title_ar : a.title_en
              const excerpt = (isAr ? a.body_ar : a.body_en).replace(/\s+/g, ' ').slice(0, 160)
              return (
                <Link key={a.slug} href={`/${locale}/insights/${a.slug}`}
                  className="block bg-white border border-gray-200 rounded-2xl p-5 hover:border-orange-300 hover:shadow-sm transition-all">
                  <h2 className="text-lg font-bold text-gray-900 mb-1">{title}</h2>
                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">{excerpt}…</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {(a.tags ?? []).slice(0, 3).map(t => (
                        <span key={t} className="text-[11px] bg-gray-100 text-gray-500 rounded-md px-2 py-0.5">{t}</span>
                      ))}
                    </div>
                    <ChevronLeft className={`w-4 h-4 text-orange-500 ${isAr ? '' : 'rotate-180'}`} />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
