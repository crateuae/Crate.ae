import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VisitorTracker from '@/components/layout/VisitorTracker'
import { AuthProvider } from '@/components/providers/AuthProvider'
import '../globals.css'

const GT_ID = 'GT-K5M94L6R'   // Google Tag container (routes to GA4 + Ads)
const GA_ID = 'G-D24S8N3VBP'  // GA4 Measurement ID (destination)

export const metadata: Metadata = {
  title: { default: 'Crate — منصة الاستيراد والتوريد في الإمارات', template: '%s | Crate' },
  description: 'فرص السوق الإماراتي، اشتراطات استيراد المواد الغذائية، تخطيط التوريد والتعبئة',
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!routing.locales.includes(locale as 'ar' | 'en')) notFound()

  const messages = await getMessages()
  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  return (
    <html lang={locale} dir={dir}>
      <head>
        {/* Google Tag — GT-K5M94L6R → GA4 G-D24S8N3VBP */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GT_ID}');gtag('config','${GA_ID}');`,
          }}
        />
      </head>
      <body className="min-h-screen bg-[#F8F9FB] text-gray-900 font-sans">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer />
            <VisitorTracker />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
