import Link from 'next/link'
import { Mail, Phone } from 'lucide-react'
import { CONTACT, UPDATED_LABEL, type Doc } from '@/lib/legal/content'

/** Renders a legal/trust document (server component, fully crawlable HTML). */
export default function LegalDoc({ doc, locale, others }: { doc: Doc; locale: 'ar' | 'en'; others: { href: string; label: { en: string; ar: string } }[] }) {
  const isAr = locale === 'ar'
  const t = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en)
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10 print:bg-white print:py-0" dir={isAr ? 'rtl' : 'ltr'}>
      <article className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 sm:p-9 print:border-0 print:p-0">
        <nav className="text-xs text-gray-400 mb-4 print:hidden"><Link href={`/${locale}`} className="hover:text-orange-600">Crate</Link> / <span className="text-gray-600">{t(doc.title)}</span></nav>
        <h1 className="text-3xl font-semibold text-gray-900 leading-tight mb-2">{t(doc.title)}</h1>
        <div className="text-xs text-gray-400 mb-5">{isAr ? 'آخر تحديث' : 'Last updated'}: <time dateTime={doc.updated}>{t(UPDATED_LABEL)}</time></div>
        <p className="text-[15px] text-gray-700 leading-relaxed mb-6">{t(doc.intro)}</p>

        <nav aria-label={isAr ? 'المحتويات' : 'Contents'} className="rounded-xl border border-gray-100 bg-gray-50 p-4 mb-8 print:hidden">
          <ol className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
            {doc.sections.map(s => <li key={s.id}><a href={`#${s.id}`} className="text-gray-600 hover:text-orange-600">{t(s.h)}</a></li>)}
          </ol>
        </nav>

        <div className="flex flex-col gap-8">
          {doc.sections.map(s => (
            <section key={s.id} id={s.id} className="scroll-mt-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{t(s.h)}</h2>
              <div className="flex flex-col gap-3 text-[15px] text-gray-700 leading-relaxed">
                {s.blocks.map((b, i) => 'p' in b
                  ? <p key={i}>{t(b.p)}</p>
                  : <ul key={i} className="list-disc ps-5 flex flex-col gap-2">{b.ul.map((x, j) => <li key={j}>{t(x)}</li>)}</ul>)}
              </div>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-xl border border-orange-100 bg-orange-50/50 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">{isAr ? 'تواصل معنا' : 'Contact us'}</h2>
          <p className="text-sm text-gray-600 mb-3">{isAr ? 'لأي سؤال أو طلب بشأن هذه الصفحة أو بياناتك:' : 'For any question or request about this page or your data:'}</p>
          <ul className="flex flex-col gap-1.5 text-sm">
            <li className="flex items-center gap-2"><Mail className="w-4 h-4 text-orange-500" /><a href={`mailto:${CONTACT.email}`} className="text-orange-600 hover:underline">{CONTACT.email}</a></li>
            <li className="flex items-center gap-2"><Phone className="w-4 h-4 text-orange-500" /><a href={`tel:${CONTACT.phone.replace(/\s/g, '')}`} className="text-orange-600 hover:underline" dir="ltr">{CONTACT.phone}</a></li>
          </ul>
        </section>

        <div className="mt-6 flex flex-wrap gap-2 text-sm print:hidden">
          {others.map(o => <Link key={o.href} href={`/${locale}${o.href}`} className="rounded-xl border border-gray-200 px-3 py-1.5 text-gray-600 hover:border-orange-300 hover:text-orange-600">{t(o.label)}</Link>)}
        </div>
      </article>
    </div>
  )
}
