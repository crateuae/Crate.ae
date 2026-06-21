'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Loader2, Save, X, AlertCircle, CheckCircle2, Eye, EyeOff, Sparkles } from 'lucide-react'

interface Product {
  id: string
  name_ar: string
  name_en: string
  source: 'manual' | 'organism_discovery'
  is_published: boolean
  published_at: string | null
  content_ar?: string
  content_en?: string
  tags?: string[]
  organism_opportunity_id?: string
  page_views?: number
  rfq_count?: number
  // Commerce data
  brand?: string
  price_retail_aed?: number
  price_wholesale_aed?: number
  price_import_aed?: number
  category_en?: string
  [key: string]: unknown
}

interface EditorState {
  tab: 'data' | 'content' | 'analytics' | 'preview'
  product: Product | null
  isDirty: boolean
  isSaving: boolean
  validationErrors: string[]
}

export default function UnifiedProductEditor({ isAr }: { isAr: boolean }) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'manual' | 'organism_discovery' | 'draft' | 'published'>('all')
  const [search, setSearch] = useState('')
  const [editor, setEditor] = useState<EditorState>({
    tab: 'data',
    product: null,
    isDirty: false,
    isSaving: false,
    validationErrors: [],
  })

  // Load products on mount and when filters change
  useEffect(() => {
    loadProducts()
  }, [filter, search])

  async function loadProducts() {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (filter !== 'all') {
        if (['manual', 'organism_discovery'].includes(filter)) {
          query.append('source', filter)
        } else if (filter === 'draft') {
          query.append('published', 'false')
        } else if (filter === 'published') {
          query.append('published', 'true')
        }
      }
      if (search) query.append('q', search)

      const url = `/api/admin/products/unified?${query.toString()}`
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setProducts(data.products || [])
    } catch (e) {
      console.error('[loadProducts] error:', e)
    } finally {
      setLoading(false)
    }
  }

  async function saveProduct() {
    if (!editor.product) return

    // Minimal validation: names only
    const errors: string[] = []
    if (!editor.product.name_en?.trim()) errors.push('English name required')
    if (!editor.product.name_ar?.trim()) errors.push('Arabic name required')

    if (errors.length > 0) {
      setEditor(prev => ({ ...prev, validationErrors: errors }))
      return
    }

    setEditor(prev => ({ ...prev, isSaving: true, validationErrors: [] }))
    try {
      const res = await fetch('/api/admin/products/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editor.product),
      })

      if (res.ok) {
        const saved = await res.json()
        setEditor(prev => ({
          ...prev,
          product: saved,
          isDirty: false,
          validationErrors: [],
        }))
        await loadProducts()
      } else {
        const err = await res.json()
        setEditor(prev => ({
          ...prev,
          validationErrors: [err.error || 'Save failed'],
        }))
      }
    } finally {
      setEditor(prev => ({ ...prev, isSaving: false }))
    }
  }

  async function publishProduct() {
    if (!editor.product?.id) return

    setEditor(prev => ({ ...prev, isSaving: true }))
    try {
      const res = await fetch('/api/admin/products/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editor.product.id, publish: true }),
      })

      if (res.ok) {
        const updated = await res.json()
        setEditor(prev => ({
          ...prev,
          product: updated,
          isDirty: false,
        }))
        await loadProducts()
      }
    } finally {
      setEditor(prev => ({ ...prev, isSaving: false }))
    }
  }

  function closeEditor() {
    setEditor({
      tab: 'data',
      product: null,
      isDirty: false,
      isSaving: false,
      validationErrors: [],
    })
  }

  // Editor open
  if (editor.product) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-gray-900">
                {editor.product.id ? isAr ? 'تحرير المنتج' : 'Edit Product' : isAr ? 'منتج جديد' : 'New Product'}
              </h2>
              {editor.product.source === 'organism_discovery' && (
                <p className="text-xs text-amber-600 mt-1">🤖 {isAr ? 'من الكائن — أكمل البيانات' : 'From organism — complete data'}</p>
              )}
            </div>
            <button onClick={closeEditor} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            {(['data', 'content', 'analytics', 'preview'] as const).map(t => (
              <button key={t}
                onClick={() => setEditor(prev => ({ ...prev, tab: t }))}
                className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  editor.tab === t
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}>
                {t === 'data' && (isAr ? 'البيانات' : 'Commerce')}
                {t === 'content' && (isAr ? 'المحتوى' : 'Content')}
                {t === 'analytics' && (isAr ? 'الأداء' : 'Analytics')}
                {t === 'preview' && (isAr ? 'معاينة' : 'Preview')}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 space-y-4">
            {/* Validation Errors */}
            {editor.validationErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                {editor.validationErrors.map((err, i) => (
                  <p key={i} className="text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" /> {err}
                  </p>
                ))}
              </div>
            )}

            {/* TAB: Commerce Data */}
            {editor.tab === 'data' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'الاسم EN' : 'Name EN'}</label>
                    <input type="text" value={editor.product.name_en || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, name_en: e.target.value }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'الاسم AR' : 'Name AR'}</label>
                    <input type="text" value={editor.product.name_ar || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, name_ar: e.target.value }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'العلامة التجارية' : 'Brand'}</label>
                    <input type="text" value={editor.product.brand || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, brand: e.target.value }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'التصنيف' : 'Category'}</label>
                    <input type="text" value={editor.product.category_en || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, category_en: e.target.value }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'التجزئة' : 'Retail'}</label>
                    <input type="number" value={editor.product.price_retail_aed || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, price_retail_aed: Number(e.target.value) }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'الجملة' : 'Wholesale'}</label>
                    <input type="number" value={editor.product.price_wholesale_aed || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, price_wholesale_aed: Number(e.target.value) }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'الاستيراد' : 'Import'}</label>
                    <input type="number" value={editor.product.price_import_aed || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, price_import_aed: Number(e.target.value) }, isDirty: true }))}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm" />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: SEO Content */}
            {editor.tab === 'content' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'المحتوى AR' : 'Content AR'}</label>
                  <textarea value={editor.product.content_ar || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, content_ar: e.target.value }, isDirty: true }))}
                    rows={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">{isAr ? 'المحتوى EN' : 'Content EN'}</label>
                  <textarea value={editor.product.content_en || ''} onChange={e => setEditor(prev => ({ ...prev, product: { ...prev.product!, content_en: e.target.value }, isDirty: true }))}
                    rows={6} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                </div>
              </div>
            )}

            {/* TAB: Analytics */}
            {editor.tab === 'analytics' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{isAr ? 'الزيارات' : 'Views'}</p>
                    <p className="text-2xl font-black text-blue-600">{editor.product.page_views ?? 0}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">{isAr ? 'الطلبات' : 'RFQs'}</p>
                    <p className="text-2xl font-black text-green-600">{editor.product.rfq_count ?? 0}</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: Preview */}
            {editor.tab === 'preview' && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-bold text-gray-900">{isAr ? editor.product.name_ar : editor.product.name_en}</h3>
                <p className="text-sm text-gray-600 line-clamp-4">{isAr ? editor.product.content_ar : editor.product.content_en}</p>
                <p className="text-xs text-gray-400">{isAr ? 'المعاينة على الموقع الحيّ' : 'Live page preview'}</p>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-2">
            <button onClick={closeEditor}
              className="px-4 py-2 text-gray-600 text-sm font-bold rounded-lg hover:bg-gray-100">
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <div className="flex gap-2">
              {editor.product.id && !editor.product.is_published && (
                <button onClick={publishProduct} disabled={editor.isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-60">
                  {editor.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  {isAr ? 'نشر' : 'Publish'}
                </button>
              )}
              <button onClick={saveProduct} disabled={!editor.isDirty || editor.isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-60">
                {editor.isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input type="text" placeholder={isAr ? 'بحث...' : 'Search...'} value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm" />
        <select value={filter} onChange={e => setFilter(e.target.value as any)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="all">{isAr ? 'الكل' : 'All'}</option>
          <option value="manual">{isAr ? 'يدوي' : 'Manual'}</option>
          <option value="organism_discovery">{isAr ? '🤖 من الكائن' : '🤖 Organism'}</option>
          <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
          <option value="published">{isAr ? 'منشور' : 'Published'}</option>
        </select>
        <button onClick={() => setEditor(prev => ({
          ...prev,
          product: {
            id: '',
            name_ar: '',
            name_en: '',
            source: 'manual',
            is_published: false,
            published_at: null,
          } as Product
        }))}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold">
          <Plus className="w-4 h-4" /> {isAr ? 'جديد' : 'New'}
        </button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">{isAr ? 'لا منتجات' : 'No products'}</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left font-bold text-gray-700">{isAr ? 'المنتج' : 'Product'}</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">{isAr ? 'المصدر' : 'Source'}</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="px-4 py-2 text-left font-bold text-gray-700">{isAr ? 'الأداء' : 'Performance'}</th>
                <th className="px-4 py-2 text-right font-bold text-gray-700">{isAr ? 'الإجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {products.map(p => {
                // Check if commerce data is incomplete
                const missingData = p.source === 'organism_discovery' && (!p.price_retail_aed || !p.category_en)

                return (
                <tr key={p.id} className={`hover:bg-gray-50 ${missingData ? 'bg-yellow-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{p.name_en}</div>
                    <div className="text-xs text-gray-400">{p.name_ar}</div>
                    {missingData && (
                      <div className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {isAr ? 'بيانات ناقصة' : 'Incomplete data'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.source === 'organism_discovery' ? (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">🤖 {isAr ? 'من الكائن' : 'Organism'}</span>
                    ) : (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">{isAr ? 'يدوي' : 'Manual'}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.is_published ? (
                      <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded flex items-center gap-1 w-fit">
                        <Eye className="w-3 h-3" /> {isAr ? 'مُنشور' : 'Live'}
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1 w-fit">
                        <EyeOff className="w-3 h-3" /> {isAr ? 'مسودة' : 'Draft'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    👁 {p.page_views ?? 0} · 📝 {p.rfq_count ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditor(prev => ({ ...prev, product: p }))}
                      className="text-blue-600 hover:text-blue-700 font-bold text-xs">
                      {isAr ? 'تحرير' : 'Edit'}
                    </button>
                  </td>
                </tr>
              )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
