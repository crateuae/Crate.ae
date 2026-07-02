import { redirect } from 'next/navigation'

// Alias: /blog/<slug> → /insights/<slug> (canonical article location).
export default async function BlogSlugRedirect({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { locale, slug } = await params
  redirect(`/${locale}/insights/${slug}`)
}
