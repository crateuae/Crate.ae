import { redirect } from 'next/navigation'

// The blog content lives under /insights. Keep /blog working as a permanent alias.
export default async function BlogIndexRedirect({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  redirect(`/${locale}/insights`)
}
