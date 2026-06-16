'use client'
import { useState, useEffect, useTransition } from 'react'
import { Plus, Edit2, Trash2, Loader2, RefreshCw, X, TrendingUp, TrendingDown, BarChart3, AlertTriangle } from 'lucide-react'
import { getAllSignals, upsertSignal, deleteSignal, getProducts } from '@/lib/supabase/actions'

type Signal = {
  id: string
  product_id: string
  alert_type: string
  urgency: string
  demand_score: number
  supply_score: number
  gap_score: number
  details_ar: string
  details_en: string
  recommended_action_ar: string
  recommended_action_en: string
  detected_at: string
  updated_at?: string
  products?: { name_ar: string; name_en: string; image_emoji: string }
}

type Product = { id: string; name_ar: string; name_en: string; image_emoji: string; slug: string }

const ALERT_TYPES = ['shortage', 'trend_rising', 'arbitrage', 'trend_falling', 'balanced']
const URGENCY_LEVELS = ['high', 'medium', 'low']

const EMPTY_FORM = {
  id: '', product_id: '', alert_type: 'shortage', urgency: 'medium',
  demand_score: 50, supply_score: 50, gap_score: 0,
  details_ar: '', details_en: '',
  recommended_action_ar: '', recommended_action_en: '',
}

export default function MarketSignalsPage() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const [sigs, prods] = await Promise.all([
        getAllSignals().catch(() => []),
        getProducts().catch(() => []),
      ])
      setSignals(sigs as Signal[])
      setProducts(prods as Product[])
    } catch {}
    setLoading(false)
  }

  function openAdd() {
    setForm({ ...EMPTY_FORM })
    setModalOpen(true)
  }

  function openEdit(s: Signal) {
    setForm({
      id: s.id, product_id: s.product_id, alert_type: s.alert_type, urgency: s.urgency,
      demand_score: s.demand_score, supply_score: s.supply_score, gap_score: s.gap_score,
      details_ar: s.details_ar || '', details_en: s.details_en || '',
      recommended_action_ar: s.recommended_action_ar || '',
      recommended_action_en: s.recommended_action_en || '',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.product_id) return
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        product_id: form.product_id,
        alert_type: form.alert_type,
        urgency: form.urgency,
        demand_score: form.demand_score,
        supply_score: form.supply_score,
        gap_score: form.gap_score,
        details_ar: form.details_ar,
        details_en: form.details_en,
        recommended_action_ar: form.recommended_action_ar,
        recommended_action_en: form.recommended_action_en,
        updated_at: new Date().toISOString(),
      }
      if (form.id) payload.id = form.id
      await upsertSignal(payload)
      await load()
      setModalOpen(false)
    } catch (e) { alert('خطأ في الحفظ') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('حذف هذه الإشارة؟')) return
    startTransition(async () => {
      await deleteSignal(id)
      setSignals(prev => prev.filter(s => s.id !== id))
    })
  }

  async function handleRefreshAll() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/market/signals', {
        method: 'POST',
        headers: { 'x-cron-secret': 'manual-refresh' },
      })
      if (res.ok) await load()
    } catch {}
    setRefreshing(false)
  }

  const f = (key: keyof typeof form, val: string | number) => setForm(p => ({ ...p, [key]: val }))

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
    </div>
  )

  return (
    <div className="px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            إشارات السوق
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">{signals.length} إشارة · تحكم في بيانات العرض والطلب لكل منتج</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefreshAll} disabled={refreshing}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            تحديث الكل
          </button>
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm">
            <Plus className="w-4 h-4" /> إشارة جديدة
          </button>
        </div>
      </div>

      {signals.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-16 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 mb-2">لا توجد إشارات بعد</p>
          <p className="text-xs text-gray-300">أضف إشارات يدوياً أو انقر "تحديث الكل" لجلب البيانات</p>
        </div>
      ) : (
        <div className="space-y-3">
          {signals.map((s) => {
            const AlertIcon = s.alert_type === 'shortage' ? AlertTriangle
              : s.alert_type === 'trend_rising' ? TrendingUp
              : s.alert_type === 'trend_falling' ? TrendingDown
              : BarChart3
            const urgencyClr = s.urgency === 'high' ? 'bg-red-100 text-red-700'
              : s.urgency === 'medium' ? 'bg-amber-100 text-amber-700'
              : 'bg-gray-100 text-gray-500'
            return (
              <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className="text-3xl">{s.products?.image_emoji || '📦'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold text-gray-900">{s.products?.name_ar || s.product_id}</h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgencyClr}`}>
                        {s.urgency === 'high' ? 'عاجل' : s.urgency === 'medium' ? 'متوسط' : 'منخفض'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <AlertIcon className="w-3.5 h-3.5" /> {s.alert_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs mb-2">
                      {[
                        { l: 'الطلب', v: s.demand_score, c: 'text-green-600' },
                        { l: 'العرض', v: s.supply_score, c: 'text-blue-600' },
                        { l: 'الفجوة', v: s.gap_score, c: 'text-orange-500' },
                      ].map(m => (
                        <div key={m.l} className="flex items-center gap-1">
                          <span className="text-gray-400">{m.l}:</span>
                          <span className={`font-black ${m.c}`}>{m.v}</span>
                        </div>
                      ))}
                    </div>
                    {s.details_ar && <p className="text-xs text-gray-400 truncate">{s.details_ar}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(s)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(s.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-black text-gray-900">{form.id ? 'تعديل الإشارة' : 'إشارة جديدة'}</h2>
              <button onClick={() => setModalOpen(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Product */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">المنتج *</label>
                <select value={form.product_id} onChange={e => f('product_id', e.target.value)} className={inputCls}>
                  <option value="">— اختر منتجاً —</option>
                  {products.map((p: Product) => (
                    <option key={p.id} value={p.id}>{p.image_emoji} {p.name_ar}</option>
                  ))}
                </select>
              </div>
              {/* Alert type + Urgency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">نوع الإشارة</label>
                  <select value={form.alert_type} onChange={e => f('alert_type', e.target.value)} className={inputCls} dir="ltr">
                    {ALERT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1.5">الأولوية</label>
                  <select value={form.urgency} onChange={e => f('urgency', e.target.value)} className={inputCls} dir="ltr">
                    {URGENCY_LEVELS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              {/* Scores */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { key: 'demand_score', label: 'الطلب (0-100)', color: 'text-green-600' },
                  { key: 'supply_score', label: 'العرض (0-100)', color: 'text-blue-600' },
                  { key: 'gap_score', label: 'الفجوة (0-100)', color: 'text-orange-500' },
                ].map(s => (
                  <div key={s.key}>
                    <label className={`block text-xs font-bold mb-1.5 ${s.color}`}>{s.label}</label>
                    <input type="number" min="0" max="100"
                      value={form[s.key as keyof typeof form] as number}
                      onChange={e => f(s.key as keyof typeof form, +e.target.value)}
                      className={inputCls} dir="ltr" />
                  </div>
                ))}
              </div>
              {/* Details */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">التفاصيل (عربي)</label>
                <textarea value={form.details_ar} onChange={e => f('details_ar', e.target.value)} rows={2} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">التفاصيل (إنجليزي)</label>
                <textarea value={form.details_en} onChange={e => f('details_en', e.target.value)} rows={2} className={`${inputCls} text-left`} dir="ltr" />
              </div>
              {/* Recommended action */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الإجراء المقترح (عربي)</label>
                <textarea value={form.recommended_action_ar} onChange={e => f('recommended_action_ar', e.target.value)} rows={2} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">الإجراء المقترح (إنجليزي)</label>
                <textarea value={form.recommended_action_en} onChange={e => f('recommended_action_en', e.target.value)} rows={2} className={`${inputCls} text-left`} dir="ltr" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.product_id}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />} حفظ
                </button>
                <button onClick={() => setModalOpen(false)} className="px-5 border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 font-medium">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 bg-white resize-none'
