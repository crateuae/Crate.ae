import type { Metadata } from 'next'
import { Poppins, Noto_Sans_Arabic } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import VisitorTracker from '@/components/layout/VisitorTracker'
import { AuthProvider } from '@/components/providers/AuthProvider'
import '../globals.css'

// English → Poppins, Arabic → Noto Sans Arabic. Exposed as CSS vars --font-en / --font-ar.
const poppins = Poppins({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-en',
  display: 'swap',
})
const notoArabic = Noto_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-ar',
  display: 'swap',
})

const GT_ID = 'GT-K5M94L6R'   // Google Tag container (routes to GA4 + Ads)
const GA_ID = 'G-D24S8N3VBP'  // GA4 Measurement ID (destination)

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params
  const isAr = locale === 'ar'
  return {
    title: {
      default: isAr
        ? 'Crate — منصة الاستيراد والتوريد الذكية في الإمارات'
        : 'Crate — The Smart Import & Supply Platform for the UAE',
      template: '%s | Crate',
    },
    description: isAr
      ? 'منصة متكاملة تدير دورة الاستيراد كاملة — اكتشاف فرص السوق، فحص اشتراطات التسجيل، وتخطيط التوريد والتعبئة للسوق الإماراتي'
      : 'An all-in-one platform for the full import cycle — market opportunity discovery, registration compliance checks, and supply & packing planning for the UAE market',
    alternates: { languages: { ar: '/ar', en: '/en', 'x-default': '/ar' } },
  }
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
    <html lang={locale} dir={dir} className={`${poppins.variable} ${notoArabic.variable}`}>
      <head>
        {/* Google Tag — GT-K5M94L6R → GA4 G-D24S8N3VBP */}
        <script async src={`https://www.googletagmanager.com/gtag/js?id=${GT_ID}`} />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GT_ID}');gtag('config','${GA_ID}');`,
          }}
        />
      </head>
      <body className="min-h-screen bg-white text-gray-900 font-sans">
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <Navbar />
            <main>{children}</main>
            <Footer locale={locale} />
            <VisitorTracker />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
