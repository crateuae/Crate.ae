// ─────────────────────────────────────────────────────────────────────────────
// "Order a compliant label" — the bridge from a compliance verdict to a real printed
// order. It used to open a modal that asked for a quantity in SHEETS of an uncut
// 100 × 70 cm sheet and promised a phone call to collect payment; nobody buys labels
// that way. It now hands the buyer to /labels, where the order is by the piece in a
// size, the price is live from the print partner, and payment is online.
// ─────────────────────────────────────────────────────────────────────────────
import Link from 'next/link'
import { Tag } from 'lucide-react'

type Props = { isAr: boolean; productName?: string; verdict?: string }

export default function OrderLabelCTA({ isAr, productName }: Props) {
  const locale = isAr ? 'ar' : 'en'
  const href = `/${locale}/labels${productName ? `?product=${encodeURIComponent(productName.slice(0, 120))}` : ''}`
  return (
    <Link
      href={href}
      className="block w-full rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50 to-white p-4 text-start hover:border-orange-300 hover:shadow-sm transition-all group"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      <span className="flex items-center gap-3">
        <span className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm shadow-orange-500/30 group-hover:scale-105 transition-transform">
          <Tag className="w-5 h-5" />
        </span>
        <span className="flex-1">
          <span className="block text-sm font-semibold text-orange-600">{isAr ? 'اطبع ملصقاً مطابقاً' : 'Print a compliant label'}</span>
          <span className="block text-xs text-stone-500 mt-0.5">{isAr ? 'اختر المقاس والكمية — سعر فوري ودفع إلكتروني' : 'Choose size and quantity — instant price, pay online'}</span>
        </span>
      </span>
    </Link>
  )
}
