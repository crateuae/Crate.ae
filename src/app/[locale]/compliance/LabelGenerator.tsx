'use client'

// "Generate a compliant label" — turns the compliance data into a print-ready SVG
// artwork laid out with the UAE.S 9:2019 mandatory sections. Deterministic, no AI
// / no credit. Missing mandatory fields show as red placeholders so the importer
// knows what to add. Downloadable as SVG (vector) or PNG.
import { useMemo, useState } from 'react'
import { FileText, Download, ImageDown, X } from 'lucide-react'
import { buildLabelSVG, type LabelData } from '@/lib/label/compliant-label'

export default function LabelGenerator({ isAr, data }: { isAr: boolean; data: LabelData }) {
  const [open, setOpen] = useState(false)
  const t = isAr ? {
    cta: 'أنشئ ملصقاً مطابقاً', hint: 'ولّد فن ملصق جاهز للطباعة بأقسام UAE.S الإلزامية — مجاناً',
    title: 'ملصق مطابق (UAE.S 9:2019)', sub: 'الحقول الناقصة تظهر بالأحمر — أكملها قبل الطباعة.',
    svg: 'تنزيل SVG', png: 'تنزيل PNG', close: 'إغلاق',
  } : {
    cta: 'Generate a compliant label', hint: 'Produce print-ready label artwork with the mandatory UAE.S sections — free',
    title: 'Compliant label (UAE.S 9:2019)', sub: 'Missing fields show in red — complete them before printing.',
    svg: 'Download SVG', png: 'Download PNG', close: 'Close',
  }
  return (
    <>
      <button onClick={() => setOpen(true)}
        className="w-full rounded-2xl border border-orange-200 bg-gradient-to-b from-orange-50 to-white p-4 text-start hover:border-orange-300 hover:shadow-sm transition-all group"
        dir={isAr ? 'rtl' : 'ltr'}>
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center group-hover:scale-105 transition-transform"><FileText className="w-5 h-5" /></span>
          <span className="flex-1">
            <span className="block text-sm font-semibold text-stone-800">{t.cta}</span>
            <span className="block text-xs text-stone-500 mt-0.5">{t.hint}</span>
          </span>
        </div>
      </button>
      {open && <LabelModal isAr={isAr} t={t} data={data} onClose={() => setOpen(false)} />}
    </>
  )
}

function LabelModal({ isAr, t, data, onClose }: { isAr: boolean; t: Record<string, string>; data: LabelData; onClose: () => void }) {
  const svg = useMemo(() => buildLabelSVG(data), [JSON.stringify(data)])

  const download = (kind: 'svg' | 'png') => {
    if (kind === 'svg') {
      const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'compliant-label.svg'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return
    }
    const img = new Image()
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    img.onload = () => {
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = img.width * scale; canvas.height = img.height * scale
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      URL.revokeObjectURL(url)
      const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = 'compliant-label.png'; a.click()
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-sm p-0 sm:p-4" onClick={onClose} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="bg-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-white/90 backdrop-blur border-b border-stone-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-stone-800">{t.title}</h3>
            <p className="text-xs text-stone-500 mt-0.5">{t.sub}</p>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 p-1"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">
          <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 flex justify-center p-3">
            <div className="w-full max-w-[380px]" dangerouslySetInnerHTML={{ __html: svg }} />
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button onClick={() => download('svg')} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-stone-800 text-white text-sm font-semibold py-2.5 hover:bg-stone-700"><Download className="w-4 h-4" />{t.svg}</button>
            <button onClick={() => download('png')} className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 text-white text-sm font-semibold py-2.5 hover:bg-orange-600 shadow-sm shadow-orange-500/30"><ImageDown className="w-4 h-4" />{t.png}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
