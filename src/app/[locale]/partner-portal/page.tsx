'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Package, Loader2, Save, LogOut, Globe, Truck, ShieldCheck, ExternalLink } from 'lucide-react'

type Partner = Record<string, any>

// Module-level so identity is stable across renders (avoids input focus loss).
const INP = 'w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all'
function Field({ label, value, onChange, dir, type = 'text' }: { label: string; value: any; onChange: (v: string) => void; dir?: 'rtl' | 'ltr'; type?: string }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-stone-500 block">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} className={INP} dir={dir} />
    </div>
  )
}
function Area({ label, value, onChange }: { label: string; value: any; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold text-stone-500 block">{label}</label>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={2} className={`${INP} resize-none`} />
    </div>
  )
}

export default function PartnerPortalPage() {
  const isAr = !usePathname()?.startsWith('/en')
  const locale = isAr ? 'ar' : 'en'
  const [state, setState] = useState<'loading' | 'anon' | 'unlinked' | 'ready'>('loading')
  const [email, setEmail] = useState('')
  const [form, setForm] = useState<Partner>({})
  const [ro, setRo] = useState<Partner>({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const load = async () => {
    try {
      const res = await fetch('/api/partner-portal', { cache: 'no-store' })
      if (res.status === 401) { setState('anon'); return }
      const d = await res.json()
      if (res.status === 404) { setEmail(d.email || ''); setState('unlinked'); return }
      if (d.ok) { setForm(d.partner); setRo(d.partner); setEmail(d.email || ''); setState('ready') }
      else setErr(isAr ? 'تعذّر التحميل' : 'Failed to load')
    } catch { setErr(isAr ? 'تعذّر التحميل' : 'Failed to load') }
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [])

  const upd = (k: string, v: any) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  const save = async () => {
    setSaving(true); setErr('')
    try {
      const res = await fetch('/api/partner-portal', {
        method: 'PATCH', headers: { 'content-type': 'application/json' },
        body: JSON.stringify(form),
      })
      const d = await res.json()
      if (!res.ok || !d.ok) setErr(isAr ? 'تعذّر الحفظ' : 'Save failed')
      else { setSaved(true); setRo({ ...ro, ...form }) }
    } finally { setSaving(false) }
  }

  const logout = async () => { await createClient().auth.signOut(); setState('anon') }

  const T = {
    title: isAr ? 'بوابة الشريك' : 'Partner Portal',
    loginNeeded: isAr ? 'سجّل الدخول للوصول إلى ملفك' : 'Sign in to manage your profile',
    login: isAr ? 'تسجيل الدخول' : 'Sign in',
    unlinkedTitle: isAr ? 'لا يوجد ملف شريك مرتبط' : 'No partner profile linked',
    unlinkedBody: isAr ? 'بريدك غير مربوط بأي شريك بعد. تواصل معنا لربط حسابك.' : 'Your email is not linked to a partner yet. Contact us to link your account.',
    save: isAr ? 'حفظ' : 'Save', saved: isAr ? 'تم الحفظ ✓' : 'Saved ✓', logout: isAr ? 'خروج' : 'Sign out',
    identity: isAr ? 'الهوية' : 'Identity', contact: isAr ? 'التواصل' : 'Contact', offering: isAr ? 'الخدمات والمواد' : 'Services & materials',
    settings: isAr ? 'الإعدادات' : 'Settings', ownerInfo: isAr ? 'بيانات يديرها المشرف (للعرض فقط)' : 'Managed by admin (read-only)',
    nameEn: isAr ? 'الاسم (إنجليزي)' : 'Name (EN)', nameAr: isAr ? 'الاسم (عربي)' : 'Name (AR)',
    phone: isAr ? 'الهاتف' : 'Phone', email: isAr ? 'البريد' : 'Email', website: isAr ? 'الموقع' : 'Website', address: isAr ? 'العنوان' : 'Address',
    services: isAr ? 'الخدمات' : 'Services', materials: isAr ? 'المواد' : 'Materials', desc: isAr ? 'وصف' : 'Description', logo: isAr ? 'رابط الشعار' : 'Logo URL',
    publish: isAr ? 'نشر صفحتي العامة' : 'Publish my public page', viewPublic: isAr ? 'عرض صفحتي العامة' : 'View my public page',
    status: isAr ? 'الحالة' : 'Status', license: isAr ? 'رقم الرخصة' : 'Trade license', trn: isAr ? 'الرقم الضريبي' : 'Tax reg. no.',
    fulfillment: isAr ? 'شريك تنفيذ' : 'Fulfillment partner', slug: isAr ? 'معرّف الصفحة' : 'Public slug', yes: isAr ? 'نعم' : 'Yes', no: isAr ? 'لا' : 'No',
  }

  if (state === 'loading') return <div className="min-h-screen flex justify-center items-center text-stone-400"><Loader2 className="w-6 h-6 animate-spin" /></div>

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gradient-to-b from-orange-50/40 to-white" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-3xl mx-auto px-5 py-12">{children}</div>
    </div>
  )
  const Header = () => (
    <div className="flex items-center gap-2.5 mb-8">
      <div className="w-10 h-10 bg-orange-500 rounded-2xl flex items-center justify-center shadow-sm shadow-orange-500/30"><Package className="w-5 h-5 text-white" /></div>
      <div><div className="font-black text-stone-900 leading-none">Crate</div><div className="text-[11px] text-stone-400">{T.title}</div></div>
    </div>
  )

  if (state === 'anon') return (
    <Shell><Header />
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
        <ShieldCheck className="w-10 h-10 text-orange-400 mx-auto mb-3" />
        <p className="text-stone-600 mb-5">{T.loginNeeded}</p>
        <Link href={`/${locale}/login?next=/${locale}/partner-portal`} className="inline-block rounded-xl bg-orange-500 text-white text-sm font-semibold px-6 py-2.5 hover:bg-orange-600">{T.login}</Link>
      </div>
    </Shell>
  )

  if (state === 'unlinked') return (
    <Shell><Header />
      <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center">
        <h2 className="font-bold text-stone-800">{T.unlinkedTitle}</h2>
        <p className="text-sm text-stone-500 mt-2">{T.unlinkedBody}</p>
        {email && <p className="text-xs text-stone-400 mt-3" dir="ltr">{email}</p>}
        <button onClick={logout} className="mt-5 text-xs text-stone-500 hover:text-orange-500 inline-flex items-center gap-1"><LogOut className="w-3.5 h-3.5" />{T.logout}</button>
      </div>
    </Shell>
  )

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
      <h3 className="font-bold text-stone-700 text-sm">{title}</h3>{children}
    </div>
  )

  return (
    <Shell>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <Header />
        <div className="flex items-center gap-2">
          {ro.public_published && ro.slug && (
            <a href={`/${locale}/partners/${ro.slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-stone-500 hover:text-orange-500 inline-flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />{T.viewPublic}</a>
          )}
          <button onClick={logout} className="text-xs text-stone-500 hover:text-orange-500 inline-flex items-center gap-1"><LogOut className="w-3.5 h-3.5" />{T.logout}</button>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-orange-500 text-white text-sm font-semibold px-5 py-2.5 hover:bg-orange-600 disabled:opacity-60 shadow-sm shadow-orange-500/30">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}{saved ? T.saved : T.save}
          </button>
        </div>
      </div>
      {err && <p className="text-sm text-red-500 mb-3">{err}</p>}

      <div className="grid sm:grid-cols-2 gap-5">
        <Card title={T.identity}>
          <Field label={T.nameEn} value={form.name_en} onChange={v => upd('name_en', v)} />
          <Field label={T.nameAr} value={form.name_ar} onChange={v => upd('name_ar', v)} dir="rtl" />
          <Field label={T.logo} value={form.logo_url} onChange={v => upd('logo_url', v)} dir="ltr" />
        </Card>
        <Card title={T.contact}>
          <Field label={T.phone} value={form.phone} onChange={v => upd('phone', v)} dir="ltr" />
          <Field label={T.email} value={form.email} onChange={v => upd('email', v)} dir="ltr" />
          <Field label={T.website} value={form.website} onChange={v => upd('website', v)} dir="ltr" />
          <Field label={T.address} value={form.address} onChange={v => upd('address', v)} />
        </Card>
      </div>

      <div className="mt-5"><Card title={T.offering}>
        <Field label={T.services} value={form.services} onChange={v => upd('services', v)} />
        <Field label={T.materials} value={form.materials} onChange={v => upd('materials', v)} />
        <Area label={T.desc} value={form.description} onChange={v => upd('description', v)} />
      </Card></div>

      <div className="mt-5"><Card title={T.settings}>
        <label className="flex items-center gap-2 cursor-pointer select-none" onClick={() => upd('public_published', !form.public_published)}>
          <span className={`w-10 h-5 rounded-full transition-colors relative ${form.public_published ? 'bg-emerald-500' : 'bg-stone-200'}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${form.public_published ? 'start-5' : 'start-0.5'}`} />
          </span>
          <span className="text-sm font-semibold text-stone-700 inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" />{T.publish}</span>
        </label>
      </Card></div>

      {/* Owner-managed, read-only */}
      <div className="mt-5 bg-stone-50 border border-stone-100 rounded-2xl p-5">
        <h3 className="font-bold text-stone-400 text-[11px] uppercase tracking-wide mb-3">{T.ownerInfo}</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <Info label={T.status} value={ro.status} />
          <Info label={T.slug} value={ro.slug} />
          <Info label={T.license} value={ro.trade_license_no} />
          <Info label={T.trn} value={ro.trn} />
          <Info label={T.fulfillment} value={ro.is_fulfillment ? T.yes : T.no} icon={ro.is_fulfillment ? <Truck className="w-3 h-3 text-orange-400" /> : undefined} />
        </div>
      </div>
    </Shell>
  )
}

function Info({ label, value, icon }: { label: string; value: any; icon?: React.ReactNode }) {
  return (
    <div>
      <div className="text-stone-400">{label}</div>
      <div className="text-stone-700 font-semibold inline-flex items-center gap-1">{icon}{value ?? '—'}</div>
    </div>
  )
}
