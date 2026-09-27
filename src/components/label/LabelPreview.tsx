/**
 * A bilingual food label drawn in HTML, for reading on a screen of any size.
 *
 * The SVG generator (src/lib/label/compliant-label.ts) makes the print file, and a print file
 * is a fixed-width drawing: on a phone it shrinks until 13 px type is 6 px. This draws the same
 * LabelData the way real GCC labels are set — English on the left, Arabic mirrored on the
 * right, a shared nutrition table between them — and lets the text wrap, so it reads on a
 * 320 px phone and a desktop alike. It is real text, so screen readers and search engines
 * read it too.
 *
 * Direction is stated, never inherited: the box is dir="ltr" (English left, Arabic right on
 * every page, including the Arabic site) and every Arabic cell is dir="rtl".
 */
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import type { LabelData } from '@/lib/label/compliant-label'

const AR_RE = /[؀-ۿ]/
const AR_FONT: CSSProperties = { fontFamily: 'var(--font-ar), "Noto Sans Arabic", Tahoma, Arial, sans-serif' }
const EN_FONT: CSSProperties = { fontFamily: 'var(--font-en), Poppins, Arial, sans-serif' }

/** "Energy / الطاقة", "مطبوع على العبوة · printed on pack" → the English and the Arabic part. */
function splitBi(s?: string | null): { en: string; ar: string } {
  const parts = String(s ?? '').split(/\s+[/·]\s+/).map(x => x.trim()).filter(Boolean)
  return {
    en: parts.filter(p => !AR_RE.test(p)).join(' · '),
    ar: parts.filter(p => AR_RE.test(p)).join(' · '),
  }
}
const strip = (s: string | null | undefined, re: RegExp) => String(s ?? '').replace(re, '').trim()
/** Keeps a number with its unit ("200 g", "470 kcal") on one line. */
const nb = (s: string) => s.replace(/(\d)\s+(?=[A-Za-z%؀-ۿ])/g, '$1 ')

function Missing({ text }: { text: string }) {
  return <span className="italic text-red-500">— {text} —</span>
}

/** One mirrored row: English cell left-aligned, Arabic cell right-aligned. */
function Pair({ en, ar, className = '' }: { en: ReactNode; ar: ReactNode; className?: string }) {
  return (
    <div className={`grid grid-cols-2 gap-3 sm:gap-6 ${className}`}>
      <div dir="ltr" lang="en" className="min-w-0 text-left break-words">{en}</div>
      <div dir="rtl" lang="ar" className="min-w-0 text-right break-words" style={AR_FONT}>{ar}</div>
    </div>
  )
}

const HEAD = 'text-[11px] sm:text-xs font-extrabold text-orange-700'

export default function LabelPreview({ data: d, className = '' }: { data: LabelData; className?: string }) {
  const net = splitBi(d.net_content)
  const ingArRaw = d.ingredients_ar || (AR_RE.test(d.ingredients ?? '') ? d.ingredients : '')
  const ingAr = strip(ingArRaw, /^\s*المكو\S*نات\s*:\s*/)
  const ingEn = strip(d.ingredients && !AR_RE.test(d.ingredients) ? d.ingredients : '', /^\s*ingredients\s*:\s*/i)
  const alAr = [d.allergens_ar || (AR_RE.test(d.allergens ?? '') ? d.allergens : ''), d.has_sulfites ? 'يحتوي على سلفايت (E220–E228).' : ''].filter(Boolean).join(' ')
  const alEn = [d.allergens && !AR_RE.test(d.allergens) ? d.allergens : '', d.has_sulfites ? 'Contains sulphites.' : ''].filter(Boolean).join(' ')
  const importer = splitBi(d.importer)
  const rows: Array<{ en: string; ar: string; v: { en: string; ar: string } }> = [
    { en: 'Production date', ar: 'تاريخ الإنتاج', v: splitBi(d.production_date) },
    { en: 'Expiry date', ar: 'تاريخ الانتهاء', v: splitBi(d.expiry_date) },
    { en: 'Storage', ar: 'ظروف التخزين', v: splitBi(d.storage) },
    { en: 'Country of origin', ar: 'بلد المنشأ', v: splitBi(d.origin_ar || d.country_of_origin) },
    { en: 'Importer', ar: 'المستورد', v: { en: strip(importer.en, /^imported by\s*:\s*/i), ar: strip(importer.ar, /^المستورد\s*:\s*/) } },
  ]
  const n = d.nutrition
  const cols = (n?.columns ?? []).slice(0, 3)

  return (
    <div dir="ltr" className={`mx-auto w-full max-w-xl rounded-2xl border-2 border-gray-900 bg-white p-4 sm:p-6 text-gray-900 ${className}`} style={EN_FONT}>
      {/* Product name */}
      <Pair className="items-end border-b-2 border-gray-900 pb-3"
        en={<p className="text-[15px] sm:text-2xl font-extrabold leading-tight">{d.product_name || <Missing text="Product name" />}</p>}
        ar={<p className="text-[15px] sm:text-2xl font-bold leading-snug">{d.product_name_ar || <Missing text="اسم المنتج" />}</p>} />

      {/* Net content */}
      <Pair className="border-b border-gray-200 py-2.5 text-[12px] sm:text-sm"
        en={<><span className="text-gray-500">Net content</span> <b className="whitespace-nowrap">{net.en ? nb(net.en) : net.ar ? nb(net.ar) : <Missing text="net content" />}</b></>}
        ar={<><span className="text-gray-500">المحتوى الصافي</span> <b className="whitespace-nowrap">{net.ar ? nb(net.ar) : net.en ? nb(net.en) : <Missing text="الوزن/الحجم الصافي" />}</b></>} />

      {/* Ingredients */}
      <Pair className="py-2.5 text-[12px] sm:text-sm leading-relaxed"
        en={<><h4 className={`${HEAD} uppercase tracking-wide`}>Ingredients</h4><p className="mt-1">{ingEn || <Missing text="ingredient list" />}</p></>}
        ar={<><h4 className={HEAD}>المكوّنات</h4><p className="mt-1">{ingAr || <Missing text="قائمة المكوّنات بالعربية" />}</p></>} />

      {/* Allergens */}
      {(alAr || alEn) && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
          <Pair className="text-[12px] sm:text-sm font-bold leading-relaxed text-red-700" en={alEn || <Missing text="allergens in English" />} ar={alAr || <Missing text="مسببات الحساسية بالعربية" />} />
        </div>
      )}

      {/* Nutrition */}
      {n && n.rows?.length > 0 && (
        <div className="mt-3">
          <Pair en={<h4 className={`${HEAD} uppercase tracking-wide`}>Nutrition facts</h4>} ar={<h4 className={HEAD}>الحقائق الغذائية</h4>} />
          <div className="mt-1.5 overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-[12px] sm:text-[13px]">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th scope="col" className="w-[36%] px-2 py-1.5"><span className="sr-only">Nutrient</span></th>
                  {cols.map((c, i) => {
                    const b = splitBi(c)
                    return (
                      <th key={i} scope="col" className="px-2 py-1.5 text-center font-semibold">
                        {b.en && <span className="block whitespace-nowrap">{nb(b.en)}</span>}
                        {b.ar && <span dir="rtl" lang="ar" className="block whitespace-nowrap" style={AR_FONT}>{nb(b.ar)}</span>}
                      </th>
                    )
                  })}
                  <th scope="col" className="w-[30%] px-2 py-1.5"><span className="sr-only">العنصر</span></th>
                </tr>
              </thead>
              <tbody>
                {n.rows.slice(0, 14).map((r, ri) => {
                  const lab = splitBi(r.label)
                  const sub = /^of which/i.test(lab.en)
                  return (
                    <tr key={ri} className="border-t border-gray-200 even:bg-gray-50">
                      <th scope="row" className={`px-2 py-1.5 text-left font-normal ${sub ? 'ps-4 text-gray-600' : ''}`}>{lab.en || lab.ar}</th>
                      {cols.map((_, ci) => {
                        const v = String(r.values?.[ci] ?? '—')
                        const parts = v.split(/\s+\/\s+/)
                        return (
                          <td key={ci} className="px-2 py-1.5 text-center tabular-nums">
                            {parts.map((p, pi) => (
                              <Fragment key={pi}>{pi > 0 && ' / '}<span className="whitespace-nowrap">{nb(p)}</span></Fragment>
                            ))}
                          </td>
                        )
                      })}
                      <td dir="rtl" lang="ar" className={`px-2 py-1.5 text-right ${sub ? 'ps-4 text-gray-600' : ''}`} style={AR_FONT}>{lab.ar || lab.en}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dates, storage, origin, importer */}
      <div className="mt-3 divide-y divide-gray-200 border-t border-gray-200">
        {rows.map(r => (
          <Pair key={r.en} className="py-2 text-[12px] sm:text-sm leading-relaxed"
            en={<><span className="block text-[11px] sm:text-xs text-gray-500">{r.en}</span>{r.v.en || r.v.ar || <Missing text={r.en.toLowerCase()} />}</>}
            ar={<><span className="block text-[11px] sm:text-xs text-gray-500">{r.ar}</span>{r.v.ar || r.v.en || <Missing text={r.ar} />}</>} />
        ))}
      </div>
    </div>
  )
}
