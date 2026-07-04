'use client'

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback, type ChangeEvent } from 'react'
import {
  Camera, X, Loader2, RotateCcw, ScanLine, Sparkles, Upload,
  CheckCircle2, XCircle, AlertTriangle, ImageIcon,
} from 'lucide-react'

// Snapshot any source (video frame / bitmap / image) into a stable, downscaled
// canvas we can re-enhance from repeatedly (a stopped video won't redraw later).
function makeBaseCanvas(source: CanvasImageSource, sw: number, sh: number): HTMLCanvasElement {
  const cap = 2600, scale = Math.min(1, cap / Math.max(sw, sh))
  const c = document.createElement('canvas')
  c.width = Math.max(1, Math.round(sw * scale)); c.height = Math.max(1, Math.round(sh * scale))
  c.getContext('2d')!.drawImage(source, 0, 0, c.width, c.height)
  return c
}

// Pure-Canvas enhancement — GPU-accelerated, instant, no heavy WASM. Boosts text
// legibility for the OCR step. (We deliberately do NOT use OpenCV: its ~10 MB WASM
// compiles synchronously on the main thread and froze mobile browsers, and Claude
// Vision reads skewed/full-frame labels fine, so perspective-crop isn't needed.)
function enhance(base: HTMLCanvasElement, mode: 'color' | 'bw'): string {
  const c = document.createElement('canvas')
  c.width = base.width; c.height = base.height
  const ctx = c.getContext('2d')!
  ctx.filter = mode === 'bw'
    ? 'grayscale(1) contrast(1.75) brightness(1.08)'
    : 'contrast(1.32) brightness(1.05) saturate(1.06)'
  ctx.drawImage(base, 0, 0)
  return c.toDataURL('image/jpeg', 0.92)
}

// ── Types ─────────────────────────────────────────────────────────────────────
export interface ScanResult { extracted: any; compliance: any }

interface Props { isAr: boolean; onClose: () => void; onApply: (r: ScanResult) => void }

type Stage = 'camera' | 'processing' | 'preview' | 'analyzing' | 'result'

export default function SmartScanner({ isAr, onClose, onApply }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  // Stable downscaled snapshot so the colour/B&W toggle can re-enhance instantly.
  const baseRef = useRef<HTMLCanvasElement | null>(null)

  const [stage, setStage] = useState<Stage>('camera')
  const [processed, setProcessed] = useState<string | null>(null)
  const [mode, setMode] = useState<'color' | 'bw'>('color')
  const [result, setResult] = useState<ScanResult | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [camReady, setCamReady] = useState(false)

  const T = {
    title: isAr ? 'الماسح الذكي' : 'Smart Scanner',
    hint: isAr ? 'صوّب الكاميرا على بطاقة المنتج داخل الإطار' : 'Point the camera at the product label inside the frame',
    capture: isAr ? 'التقط' : 'Capture',
    upload: isAr ? 'من الاستوديو' : 'From gallery',
    retake: isAr ? 'إعادة' : 'Retake',
    analyze: isAr ? 'حلّل البطاقة' : 'Analyze label',
    processing: isAr ? 'جاري تجهيز الصورة…' : 'Preparing image…',
    analyzing: isAr ? 'Crate يقرأ البطاقة…' : 'Crate is reading the label…',
    color: isAr ? 'ملوّن' : 'Colour',
    bw: isAr ? 'أبيض/أسود' : 'B/W',
    ready: isAr ? 'الصورة محسّنة وجاهزة ✓' : 'Image enhanced & ready ✓',
    apply: isAr ? 'تعبئة الفاحص بالنتيجة' : 'Apply to checker',
    camErr: isAr ? 'تعذّر فتح الكاميرا — ارفع صورة من الاستوديو' : 'Camera unavailable — upload from gallery',
  }

  const stopCam = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }, [])

  const startCamera = useCallback(async () => {
    stopCam() // never run two streams at once
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        // Request the highest practical resolution so the frame grab is sharp.
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 2560 }, height: { ideal: 1440 } }, audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}) }
      setCamReady(true)
    } catch {
      setCamReady(false) // upload fallback stays available
    }
  }, [stopCam])

  // Acquire the camera only while on the camera stage; release it on every
  // transition away (capture / preview / unmount). Keyed on `stage` so retake
  // re-acquires reliably — and the video element is already mounted when this runs.
  useEffect(() => {
    if (stage !== 'camera') return
    startCamera()
    return () => stopCam()
  }, [stage, startCamera, stopCam])

  // Esc closes; lock page scroll while the modal is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { stopCam(); onClose() } }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [onClose, stopCam])

  async function enhanceAndPreview(src: CanvasImageSource, w: number, h: number, m: 'color' | 'bw') {
    const base = makeBaseCanvas(src, w, h)
    baseRef.current = base
    setStage('processing'); setErr(null)
    await new Promise(r => setTimeout(r, 20)) // let the spinner paint first
    try {
      setProcessed(enhance(base, m))
    } catch {
      setProcessed(base.toDataURL('image/jpeg', 0.92)) // never block the user
    }
    setStage('preview')
  }

  async function capture() {
    // Prefer a FULL-RESOLUTION still via ImageCapture (Android Chrome) — much
    // sharper than grabbing a low-res video preview frame. Falls back gracefully.
    const track = streamRef.current?.getVideoTracks?.()[0]
    const W = window as any
    if (track && W.ImageCapture) {
      try {
        const blob = await new W.ImageCapture(track).takePhoto()
        const bmp = await createImageBitmap(blob, { imageOrientation: 'from-image' })
        stopCam()
        await enhanceAndPreview(bmp, bmp.width, bmp.height, mode)
        return
      } catch { /* fall through to frame grab */ }
    }
    const v = videoRef.current
    if (!v || !v.videoWidth) { stopCam(); return }
    stopCam()
    await enhanceAndPreview(v, v.videoWidth, v.videoHeight, mode)
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; if (!f) return
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(img.src); stopCam(); enhanceAndPreview(img, img.naturalWidth, img.naturalHeight, mode) }
    img.src = URL.createObjectURL(f)
  }

  function reRunMode(m: 'color' | 'bw') {
    setMode(m)
    if (baseRef.current) setProcessed(enhance(baseRef.current, m))
  }

  async function analyze() {
    if (!processed) return
    setStage('analyzing'); setErr(null)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 60_000)
    try {
      const res = await fetch('/api/compliance/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: processed }), signal: ctrl.signal,
      })
      const d = await res.json()
      if (!res.ok) { setErr(d.error || (isAr ? 'خطأ' : 'error')); setStage('preview'); return }
      setResult(d); setStage('result')
    } catch (e) {
      const aborted = (e as Error)?.name === 'AbortError'
      setErr(aborted
        ? (isAr ? 'انتهت المهلة — جرّب صورة أوضح' : 'Timed out — try a clearer image')
        : (isAr ? 'فشل الاتصال بالخادم' : 'Server request failed'))
      setStage('preview')
    } finally {
      clearTimeout(timer)
    }
  }

  function retake() {
    // The camera-acquire effect re-runs because stage returns to 'camera'.
    baseRef.current = null
    setProcessed(null); setResult(null); setErr(null); setCamReady(false); setStage('camera')
  }

  const verdict = result?.compliance?.verdict as string | undefined

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3" dir={isAr ? 'rtl' : 'ltr'}
      onClick={(e) => { if (e.target === e.currentTarget) { stopCam(); onClose() } }}>
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl max-h-[92vh] flex flex-col"
        role="dialog" aria-modal="true" aria-label={T.title}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2 font-black text-gray-900">
            <ScanLine className="w-5 h-5 text-orange-500" />{T.title}
          </div>
          <button onClick={() => { stopCam(); onClose() }} aria-label={isAr ? 'إغلاق' : 'Close'}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* CAMERA */}
          {stage === 'camera' && (
            <div className="p-4">
              <div className="relative rounded-2xl overflow-hidden bg-gray-900 aspect-[3/4]">
                <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-6 border-2 border-white/70 rounded-xl pointer-events-none" style={{ boxShadow: '0 0 0 100vmax rgba(0,0,0,.25)' }} />
                {!camReady && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/80 text-sm gap-2 text-center px-6">
                    <Camera className="w-8 h-8" />{T.camErr}
                  </div>
                )}
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">{T.hint}</p>
              <div className="flex items-center gap-2 mt-3">
                <button onClick={capture} disabled={!camReady}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold py-3 rounded-2xl transition-colors">
                  <Camera className="w-5 h-5" />{T.capture}
                </button>
                <button onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-3 px-4 rounded-2xl">
                  <Upload className="w-4 h-4" />{T.upload}
                </button>
                {/* No `capture` attr → opens the photo gallery/file picker, not the camera */}
                <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
              </div>
            </div>
          )}

          {/* PROCESSING (instant Canvas enhance — brief) */}
          {stage === 'processing' && (
            <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
              <p className="text-sm">{T.processing}</p>
              <p className="text-[11px] text-gray-400">{isAr ? 'المعالجة داخل متصفحك — بدون خوادم' : 'Processing in your browser — no servers'}</p>
            </div>
          )}

          {/* PREVIEW */}
          {stage === 'preview' && processed && (
            <div className="p-4">
              <div className="rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                <img src={processed} alt="processed" className="w-full object-contain max-h-[46vh]" />
              </div>
              <div className="mt-2 text-xs flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />{T.ready}
              </div>
              {/* colour / high-contrast B&W toggle — instant, re-enhances the raw source */}
              <div className="flex items-center gap-1 mt-3 bg-gray-100 rounded-xl p-1 w-fit">
                {(['color', 'bw'] as const).map(m => (
                  <button key={m} onClick={() => reRunMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold ${mode === m ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500'}`}>
                    {m === 'color' ? T.color : T.bw}
                  </button>
                ))}
              </div>
              {err && <p className="text-red-500 text-xs mt-2">{err}</p>}
              <div className="flex items-center gap-2 mt-4">
                <button onClick={retake} className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 px-4 rounded-2xl text-sm">
                  <RotateCcw className="w-4 h-4" />{T.retake}
                </button>
                <button onClick={analyze} className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-2xl text-sm">
                  <Sparkles className="w-4 h-4" />{T.analyze}
                </button>
              </div>
            </div>
          )}

          {/* ANALYZING */}
          {stage === 'analyzing' && (
            <div className="p-12 flex flex-col items-center gap-3 text-gray-500">
              <Loader2 className="w-7 h-7 animate-spin text-orange-500" /><p className="text-sm">{T.analyzing}</p>
            </div>
          )}

          {/* RESULT */}
          {stage === 'result' && result && (
            <div className="p-4 space-y-3">
              <div className={`rounded-2xl p-4 flex items-center gap-3 ${verdict === 'registerable' ? 'bg-emerald-50 border border-emerald-200' : verdict === 'not_registerable' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                {verdict === 'registerable' ? <CheckCircle2 className="w-6 h-6 text-emerald-600" /> : verdict === 'not_registerable' ? <XCircle className="w-6 h-6 text-red-500" /> : <AlertTriangle className="w-6 h-6 text-amber-500" />}
                <div>
                  <div className="font-black text-gray-900 text-sm">
                    {verdict === 'registerable' ? (isAr ? 'قابل للتسجيل ✓' : 'Registerable ✓') : verdict === 'not_registerable' ? (isAr ? 'غير قابل للتسجيل' : 'Not registerable') : (isAr ? 'يحتاج مراجعة' : 'Needs review')}
                  </div>
                  <div className="text-xs text-gray-500">{isAr ? result.compliance.summary_ar : result.compliance.summary_en}</div>
                </div>
              </div>

              {result.extracted.confidence === 'low' && (
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2 text-[11px] text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  {isAr ? 'ثقة القراءة منخفضة — راجع الحقول بعد التعبئة أو أعد المسح بصورة أوضح.' : 'Low OCR confidence — review the fields after applying, or rescan with a clearer photo.'}
                </div>
              )}

              {/* extracted quick view */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3 text-xs space-y-1.5">
                <div className="flex justify-between gap-3"><span className="text-gray-400">{isAr ? 'المنتج' : 'Product'}</span><span className="font-bold text-gray-800 text-end">{result.extracted.product_name}</span></div>
                <div className="flex justify-between gap-3"><span className="text-gray-400">{isAr ? 'الفئة' : 'Class'}</span><span className="font-semibold text-gray-700">{result.extracted.product_class}</span></div>
                {result.extracted.net_content && <div className="flex justify-between gap-3"><span className="text-gray-400">{isAr ? 'الحجم' : 'Net'}</span><span className="font-semibold text-gray-700">{result.extracted.net_content}</span></div>}
                <div className="flex justify-between gap-3"><span className="text-gray-400">{isAr ? 'ثقة القراءة' : 'OCR confidence'}</span><span className="font-semibold text-gray-700">{result.extracted.confidence}</span></div>
              </div>

              {result.compliance.failed?.length > 0 && (
                <div className="text-xs">
                  <div className="font-bold text-red-600 mb-1.5">{isAr ? `النواقص (${result.compliance.failed.length})` : `Issues (${result.compliance.failed.length})`}</div>
                  <ul className="space-y-1">
                    {result.compliance.failed.map((f: any, i: number) => (
                      <li key={i} className="flex items-start gap-1.5 text-gray-600"><XCircle className="w-3 h-3 text-red-400 mt-0.5 flex-shrink-0" />{isAr ? f.requirement_ar : f.requirement_en}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <button onClick={retake} className="flex items-center justify-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold py-2.5 px-4 rounded-2xl text-sm">
                  <RotateCcw className="w-4 h-4" />{T.retake}
                </button>
                <button onClick={() => { stopCam(); onApply(result) }} className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-2xl text-sm">
                  <CheckCircle2 className="w-4 h-4" />{T.apply}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
