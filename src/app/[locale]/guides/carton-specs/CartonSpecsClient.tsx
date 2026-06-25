'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Package, Layers, Ruler, Weight, Printer, Shield,
  ChevronRight, CheckCircle2, Info, Star, Zap, ArrowRight,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────────────────────────

const FLUTES = [
  { code: 'A', mm: '4.7 mm', ar_name: 'فلوت A', en_name: 'A Flute', color: '#f59e0b',
    ar_use: 'حماية ممتازة للمنتجات الهشة — أجهزة، زجاج، خزف', en_use: 'Premium cushioning for fragile items — electronics, glass, ceramics',
    ar_pro: 'أعلى مقاومة للصدمات', en_pro: 'Best shock absorption',
    ar_con: 'حجم كبير، تكلفة أعلى', en_con: 'Bulky, higher cost' },
  { code: 'B', mm: '3.0 mm', ar_name: 'فلوت B', en_name: 'B Flute', color: '#3b82f6',
    ar_use: 'التغليف التجزئة، العروض والمنتجات المطبوعة', en_use: 'Retail packaging, point-of-sale displays, printed boxes',
    ar_pro: 'سطح طباعة ممتاز، مقاومة ضغط جانبي', en_pro: 'Excellent print surface, good stacking strength',
    ar_con: 'حماية أقل من C وA', en_con: 'Less cushioning than C or A' },
  { code: 'C', mm: '3.7 mm', ar_name: 'فلوت C', en_name: 'C Flute', color: '#10b981',
    ar_use: 'الشحن والتصدير — الأكثر استخداماً في الإمارات', en_use: 'Shipping & export — most common in UAE market',
    ar_pro: 'توازن مثالي بين الحماية والطباعة', en_pro: 'Perfect balance of cushioning and printability',
    ar_con: 'ليس الأمثل للمنتجات الثقيلة جداً', en_con: 'Not ideal for very heavy products',
    badge_ar: 'الأكثر طلباً', badge_en: 'Most Popular' },
  { code: 'E', mm: '1.5 mm', ar_name: 'فلوت E', en_name: 'E Flute', color: '#8b5cf6',
    ar_use: 'علب صغيرة، مستحضرات تجميل، هدايا، مجوهرات', en_use: 'Small boxes, cosmetics, gift packaging, jewelry',
    ar_pro: 'رقيق جداً، طباعة عالية الجودة', en_pro: 'Very thin, premium print quality',
    ar_con: 'أقل مقاومة للصدمات', en_con: 'Less impact resistance' },
  { code: 'F', mm: '0.75 mm', ar_name: 'فلوت F', en_name: 'F Flute', color: '#ec4899',
    ar_use: 'التغليف الفاخر جداً، المنتجات الخفيفة والمميزة', en_use: 'Luxury packaging, very light premium products',
    ar_pro: 'نعومة فائقة وطباعة احترافية', en_pro: 'Ultra-smooth, professional printing',
    ar_con: 'ضعيف جداً للشحن', en_con: 'Too fragile for heavy shipping' },
  { code: 'BC', mm: '6–7 mm', ar_name: 'فلوت BC مزدوج', en_name: 'BC Double Wall', color: '#f97316',
    ar_use: 'منتجات ثقيلة، صناعية، أجهزة، أثاث، معدات', en_use: 'Heavy products, industrial, machinery, furniture',
    ar_pro: 'قوة استثنائية، تكديس عالٍ', en_pro: 'Exceptional strength, high stacking capacity',
    ar_con: 'وزن أثقل، تكلفة أعلى', en_con: 'Heavier, higher cost',
    badge_ar: 'للصناعة الثقيلة', badge_en: 'Heavy Industrial' },
]

const BOX_TYPES = [
  { code: 'RSC', ar_name: 'صندوق شرائح منتظم', en_name: 'Regular Slotted Container',
    ar_desc: 'الأكثر شيوعاً في العالم. الألسنة العلوية والسفلية تلتقي في المنتصف وتُغلق بشريط لاصق. اقتصادي ومناسب لأغلب البضائع.',
    en_desc: 'World\'s most common carton. Top and bottom flaps meet at center, sealed with tape. Economical and versatile for most products.',
    ar_use: 'بضائع FMCG، مواد غذائية، كيماويات', en_use: 'FMCG, food products, chemicals',
    icon: '📦', popular: true },
  { code: 'HSC', ar_name: 'صندوق نصف شرائح', en_name: 'Half Slotted Container',
    ar_desc: 'مثل RSC لكن بدون ألسنة علوية — مفتوح من الأعلى. مثالي للمنتجات التي تُوضع من فوق وتُعرض مفتوحة.',
    en_desc: 'Like RSC but open top — no top flaps. Ideal for products loaded from top and displayed open.',
    ar_use: 'منتجات العرض، الخضار والفواكه', en_use: 'Display products, produce, trays',
    icon: '📂' },
  { code: 'FOL', ar_name: 'صندوق تغطية كاملة', en_name: 'Full Overlap Container',
    ar_desc: 'الألسنة تتداخل بالكامل فوق بعضها بدلاً من الالتقاء في المنتصف. يمنح قوة مضاعفة للأرضية والغطاء.',
    en_desc: 'Flaps fully overlap each other rather than meeting in center. Gives double strength on top and bottom.',
    ar_use: 'منتجات ثقيلة، صناعية، معدات', en_use: 'Heavy goods, industrial, hardware',
    icon: '🗃️' },
  { code: 'Telescope', ar_name: 'صندوق تلسكوبي', en_name: 'Telescope Box',
    ar_desc: 'قطعتان منفصلتان — قاعدة وغطاء يغطيان بعضهما مثل التلسكوب. شائع للمنتجات الفاخرة والهدايا.',
    en_desc: 'Two separate pieces — base and lid that telescope over each other. Common for premium and gift products.',
    ar_use: 'هدايا، أحذية، إلكترونيات فاخرة', en_use: 'Gifts, shoes, premium electronics',
    icon: '🎁' },
  { code: 'Die-Cut', ar_name: 'صندوق قالب مخصص', en_name: 'Die-Cut Custom Box',
    ar_desc: 'يُقطع بقالب خاص لأي شكل تريده. مرونة كاملة في التصميم — نوافذ، شكل خاص، فتحات.',
    en_desc: 'Cut with custom die into any shape required. Full design flexibility — windows, handles, custom cutouts.',
    ar_use: 'مستحضرات تجميل، هدايا مميزة، منتجات علامة خاصة', en_use: 'Cosmetics, premium gifts, private label',
    icon: '✂️' },
]

const PAPER_TYPES = [
  { code: 'KL', ar_name: 'كرافت لاينر', en_name: 'Kraft Liner',
    color: '#92400e', bg: '#fef3c7',
    ar_desc: 'ألياف خشبية بكر 100% — أقوى أنواع الورق وأكثرها متانة. لونه بني غامق ناعم ومنتظم.',
    en_desc: '100% virgin wood fiber — strongest and most durable paper. Rich dark brown, consistent surface.',
    ar_props: ['أعلى قوة شد', 'مقاومة رطوبة ممتازة', 'لون بني فاخر', 'مناسب للطباعة'],
    en_props: ['Highest tensile strength', 'Excellent moisture resistance', 'Premium brown color', 'Print-ready'],
    price_ar: 'سعر أعلى', price_en: 'Premium price' },
  { code: 'TL', ar_name: 'تست لاينر', en_name: 'Test Liner',
    color: '#374151', bg: '#f3f4f6',
    ar_desc: 'ورق معاد تدويره — اقتصادي ومستدام. لونه رمادي-بني غير منتظم قليلاً.',
    en_desc: 'Recycled paper — economical and sustainable. Grayish-brown, slightly inconsistent surface.',
    ar_props: ['سعر أقل بـ 15–20%', 'صديق للبيئة', 'مناسب للشحن الداخلي', 'أكثر شيوعاً'],
    en_props: ['15–20% cheaper', 'Eco-friendly', 'Good for internal shipping', 'Most common'],
    price_ar: 'سعر اقتصادي', price_en: 'Economical' },
  { code: 'WTL', ar_name: 'وايت توب لاينر', en_name: 'White Top Liner',
    color: '#1e40af', bg: '#eff6ff',
    ar_desc: 'قاعدة معاد تدويرها مع طبقة بيضاء فوقية — يجمع بين الاقتصاد والمظهر الفاخر للطباعة.',
    en_desc: 'Recycled base with white top coating — combines economy with premium print surface.',
    ar_props: ['سطح أبيض للطباعة', 'ألوان زاهية', 'سعر وسط', 'مثالي للبراند'],
    en_props: ['White print surface', 'Vibrant colors', 'Mid-range price', 'Brand-ready'],
    price_ar: 'سعر متوسط', price_en: 'Mid-range' },
]

const PLY_DATA = [
  { ply: 3, ar_name: 'ثلاثي الطبقات', en_name: 'Single Wall (3-PLY)',
    layers_ar: 'لاينر خارجي + موجة + لاينر داخلي',
    layers_en: 'Outer liner + Flute + Inner liner',
    weight_ar: 'خفيف — 300 إلى 600 جرام/م²', weight_en: 'Light — 300 to 600 GSM',
    use_ar: 'بضائع خفيفة ومتوسطة (حتى 20 كجم)', use_en: 'Light to medium goods (up to 20 kg)',
    color: '#10b981', popular: true },
  { ply: 5, ar_name: 'خماسي الطبقات', en_name: 'Double Wall (5-PLY)',
    layers_ar: 'لاينر + موجة + وسط + موجة + لاينر',
    layers_en: 'Liner + Flute + Medium + Flute + Liner',
    weight_ar: 'متوسط-ثقيل — 600 إلى 900 جرام/م²', weight_en: 'Medium-heavy — 600 to 900 GSM',
    use_ar: 'منتجات ثقيلة (20–50 كجم)، أجهزة، أثاث', use_en: 'Heavy products (20–50 kg), appliances, furniture',
    color: '#f59e0b' },
  { ply: 7, ar_name: 'سباعي الطبقات', en_name: 'Triple Wall (7-PLY)',
    layers_ar: 'لاينر + موجة + وسط + موجة + وسط + موجة + لاينر',
    layers_en: 'Liner + Flute + Med + Flute + Med + Flute + Liner',
    weight_ar: 'ثقيل جداً — 900+ جرام/م²', weight_en: 'Very heavy — 900+ GSM',
    use_ar: 'صناعي ثقيل جداً (+50 كجم)، معدات، آلات', use_en: 'Heavy industrial (+50 kg), machinery, equipment',
    color: '#ef4444' },
]

const STD_SIZES = [
  { ar_name: 'صغير', en_name: 'Small', dims: '300 × 200 × 200 mm', ar_use: 'إكسسوارات، مستحضرات', en_use: 'Accessories, cosmetics' },
  { ar_name: 'متوسط', en_name: 'Medium', dims: '400 × 300 × 300 mm', ar_use: 'مواد غذائية، إلكترونيات', en_use: 'Food, electronics' },
  { ar_name: 'تجزئة', en_name: 'Retail Standard', dims: '430 × 305 × 305 mm', ar_use: 'بضائع تجزئة عامة', en_use: 'General retail goods' },
  { ar_name: 'تصدير', en_name: 'Export Standard', dims: '600 × 400 × 400 mm', ar_use: 'تصدير دولي، مستودعات', en_use: 'International export, warehouses' },
  { ar_name: 'مشروبات', en_name: 'Beverage', dims: '490 × 330 × 280 mm', ar_use: 'زجاجات، علب مشروبات', en_use: 'Bottles, beverage cans' },
  { ar_name: 'كبير', en_name: 'Large', dims: '600 × 500 × 500 mm', ar_use: 'أثاث مفكك، أجهزة', en_use: 'Flat-pack furniture, appliances' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function CartonSpecsClient({ locale }: { locale: string }) {
  const isAr = locale === 'ar'
  const [activeTab, setActiveTab] = useState<'flute' | 'type' | 'paper' | 'ply' | 'measure' | 'sizes'>('flute')

  const tabs = [
    { id: 'flute',   icon: <Zap className="w-4 h-4" />,    ar: 'أنواع الفلوت',   en: 'Flute Types' },
    { id: 'type',    icon: <Package className="w-4 h-4" />, ar: 'أنواع الصناديق', en: 'Box Types' },
    { id: 'paper',   icon: <Layers className="w-4 h-4" />,  ar: 'أنواع الورق',    en: 'Paper Grades' },
    { id: 'ply',     icon: <Shield className="w-4 h-4" />,  ar: 'عدد الطبقات',    en: 'Wall / PLY' },
    { id: 'measure', icon: <Ruler className="w-4 h-4" />,   ar: 'القياسات',       en: 'Measurements' },
    { id: 'sizes',   icon: <Weight className="w-4 h-4" />,  ar: 'قياسات ستاندرد', en: 'Standard Sizes' },
  ] as const

  return (
    <div className="min-h-screen bg-[#F8F9FB]" dir={isAr ? 'rtl' : 'ltr'}>

      {/* ── Hero ── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/30 rounded-full px-4 py-1.5 text-orange-300 text-xs font-bold mb-5">
            <Package className="w-3.5 h-3.5" />
            {isAr ? 'دليل الكراتين التصديرية' : 'Export Carton Box Guide'}
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
            {isAr
              ? <>كل ما تحتاج معرفته عن<br /><span className="text-orange-400">مواصفات الكراتين</span></>
              : <>Everything You Need to Know About<br /><span className="text-orange-400">Carton Box Specifications</span></>}
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto leading-relaxed">
            {isAr
              ? 'دليل شامل وعملي يشرح كل مصطلح وكل مواصفة في عالم الكراتين — مُصمَّم للمستورد والموزع والمعبِّئ في الإمارات'
              : 'A practical guide explaining every term and spec in the carton world — designed for UAE importers, distributors and packers'}
          </p>

          {/* Quick Stats */}
          <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[
              { n: '6', ar: 'أنواع فلوت', en: 'Flute Types' },
              { n: '5', ar: 'أشكال صناديق', en: 'Box Shapes' },
              { n: '3', ar: 'درجات ورق', en: 'Paper Grades' },
            ].map(s => (
              <div key={s.n} className="bg-white/10 rounded-2xl p-4">
                <div className="text-3xl font-black text-orange-400">{s.n}</div>
                <div className="text-xs text-slate-300 mt-1">{isAr ? s.ar : s.en}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                {t.icon}{isAr ? t.ar : t.en}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ════ FLUTE TYPES ════ */}
        {activeTab === 'flute' && (
          <section>
            <SectionHeader
              isAr={isAr}
              ar_title="أنواع الفلوت — الموجة الوسطى"
              en_title="Flute Types — The Corrugated Wave"
              ar_sub="الفلوت هو الطبقة الوسطى المتموجة التي تعطي الكرتون قوته وخفته. اختيار الفلوت الصحيح يحدد قدرة الكرتون على الحماية والطباعة."
              en_sub="The flute is the corrugated middle layer that gives cartons their strength and lightness. Choosing the right flute determines protection and print quality."
            />
            <div className="grid md:grid-cols-2 gap-4">
              {FLUTES.map(f => (
                <div key={f.code} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
                  {f.badge_ar && (
                    <span className="absolute top-3 end-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                      {isAr ? f.badge_ar : f.badge_en}
                    </span>
                  )}
                  {/* Flute visual */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-black text-white flex-shrink-0"
                      style={{ backgroundColor: f.color }}>
                      {f.code}
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-base">{isAr ? f.ar_name : f.en_name}</div>
                      <div className="text-xs text-slate-400">سُمك / Thickness: <span className="font-bold text-slate-600">{f.mm}</span></div>
                    </div>
                  </div>
                  {/* Wave illustration */}
                  <WaveIllustration code={f.code} color={f.color} />
                  <p className="text-xs text-slate-600 mb-3 mt-3 leading-relaxed">{isAr ? f.ar_use : f.en_use}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-emerald-50 rounded-xl p-2.5 text-xs">
                      <div className="font-bold text-emerald-700 mb-0.5">✓ {isAr ? 'ميزة' : 'Pro'}</div>
                      <div className="text-emerald-600">{isAr ? f.ar_pro : f.en_pro}</div>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2.5 text-xs">
                      <div className="font-bold text-red-600 mb-0.5">✕ {isAr ? 'محدودية' : 'Con'}</div>
                      <div className="text-red-500">{isAr ? f.ar_con : f.en_con}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <InfoBox isAr={isAr}
              ar="💡 الأكثر طلباً في السوق الإماراتي: فلوت C للشحن والتصدير، وفلوت B للتغليف والعرض التجاري"
              en="💡 Most in-demand in UAE: C Flute for shipping & export, B Flute for retail display packaging" />
          </section>
        )}

        {/* ════ BOX TYPES ════ */}
        {activeTab === 'type' && (
          <section>
            <SectionHeader isAr={isAr}
              ar_title="أشكال وأنواع الصناديق"
              en_title="Box Shapes & Types"
              ar_sub="لكل نوع من الصناديق شكل قطع مختلف وطريقة تجميع مختلفة. الاختيار الصحيح يوفر في التكلفة ويحسن حماية المنتج."
              en_sub="Each box type has a different cut pattern and assembly method. The right choice saves cost and improves product protection."
            />
            <div className="grid md:grid-cols-2 gap-4">
              {BOX_TYPES.map(b => (
                <div key={b.code} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="text-4xl">{b.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">{b.code}</span>
                        {b.popular && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{isAr ? 'الأكثر شيوعاً' : 'Most Common'}</span>}
                      </div>
                      <div className="text-sm font-bold text-orange-600">{isAr ? b.ar_name : b.en_name}</div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mb-3">{isAr ? b.ar_desc : b.en_desc}</p>
                  <div className="bg-slate-50 rounded-xl p-3 text-xs">
                    <span className="font-bold text-slate-500">{isAr ? 'مثالي لـ:' : 'Best for:'}</span>{' '}
                    <span className="text-slate-700">{isAr ? b.ar_use : b.en_use}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════ PAPER GRADES ════ */}
        {activeTab === 'paper' && (
          <section>
            <SectionHeader isAr={isAr}
              ar_title="درجات وأنواع الورق"
              en_title="Paper Grades & Types"
              ar_sub="الورق الخارجي (Liner) يحدد قوة الكرتون ومظهره وملاءمته للطباعة. اختيار الدرجة الصحيحة يوازن بين التكلفة والأداء."
              en_sub="The outer paper (liner) determines strength, appearance and printability. The right grade balances cost with performance."
            />
            <div className="space-y-4">
              {PAPER_TYPES.map(p => (
                <div key={p.code} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-black text-white flex-shrink-0"
                      style={{ backgroundColor: p.color }}>
                      {p.code}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className="font-black text-slate-900 text-base">{isAr ? p.ar_name : p.en_name}</span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                          style={{ backgroundColor: p.bg, color: p.color, borderColor: p.color + '40' }}>
                          {isAr ? p.price_ar : p.price_en}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">{isAr ? p.ar_desc : p.en_desc}</p>
                      <div className="flex flex-wrap gap-2">
                        {(isAr ? p.ar_props : p.en_props).map(prop => (
                          <span key={prop} className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg"
                            style={{ backgroundColor: p.bg, color: p.color }}>
                            <CheckCircle2 className="w-3 h-3" />{prop}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* GSM Table */}
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Weight className="w-4 h-4 text-orange-500" />
                {isAr ? 'جدول GSM — وزن الورق' : 'GSM Table — Paper Weight'}
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-start p-3 font-bold text-slate-600 rounded-s-xl">{isAr ? 'نطاق GSM' : 'GSM Range'}</th>
                      <th className="text-start p-3 font-bold text-slate-600">{isAr ? 'الاستخدام' : 'Usage'}</th>
                      <th className="text-start p-3 font-bold text-slate-600 rounded-e-xl">{isAr ? 'الثقل التقريبي للكرتون' : 'Approx. Box Weight'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { gsm: '100–150', ar_use: 'كراتين داخلية خفيفة', en_use: 'Light inner cartons', wt: '~200g' },
                      { gsm: '150–250', ar_use: 'تغليف تجزئة متوسط', en_use: 'Standard retail packaging', wt: '~400g' },
                      { gsm: '250–350', ar_use: 'كراتين شحن عادية', en_use: 'Regular shipping cartons', wt: '~600g' },
                      { gsm: '350–455', ar_use: 'شحن ثقيل وتصدير', en_use: 'Heavy shipping & export', wt: '~800g' },
                      { gsm: '455+',   ar_use: 'صناعي وثقيل جداً', en_use: 'Industrial heavy-duty', wt: '1 kg+' },
                    ].map((r, i) => (
                      <tr key={i} className="border-t border-slate-50">
                        <td className="p-3 font-black text-orange-600">{r.gsm}</td>
                        <td className="p-3 text-slate-700">{isAr ? r.ar_use : r.en_use}</td>
                        <td className="p-3 text-slate-500">{r.wt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* ════ PLY ════ */}
        {activeTab === 'ply' && (
          <section>
            <SectionHeader isAr={isAr}
              ar_title="عدد الطبقات — Single / Double / Triple Wall"
              en_title="Wall Layers — Single / Double / Triple Wall"
              ar_sub="كل طبقة إضافية تعني قوة أكبر وحماية أفضل — لكن أيضاً وزناً أثقل وتكلفة أعلى. اختر بناءً على وزن منتجك وطريقة التخزين."
              en_sub="Each added wall means more strength and better protection — but also more weight and cost. Choose based on product weight and storage method."
            />
            <div className="space-y-4">
              {PLY_DATA.map(p => (
                <div key={p.ply} className="bg-white rounded-2xl border border-slate-200 p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0"
                      style={{ backgroundColor: p.color }}>
                      {p.ply}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-base">{isAr ? p.ar_name : p.en_name}</span>
                        {p.popular && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">{isAr ? 'الأكثر طلباً' : 'Most Popular'}</span>}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">{isAr ? p.layers_ar : p.layers_en}</div>
                    </div>
                  </div>
                  {/* Visual layers */}
                  <PlyVisual ply={p.ply} color={p.color} />
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <div className="font-bold text-slate-500 mb-1">{isAr ? 'الوزن' : 'Weight'}</div>
                      <div className="text-slate-700">{isAr ? p.weight_ar : p.weight_en}</div>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3">
                      <div className="font-bold text-orange-500 mb-1">{isAr ? 'الاستخدام' : 'Best For'}</div>
                      <div className="text-slate-700">{isAr ? p.use_ar : p.use_en}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ════ MEASUREMENTS ════ */}
        {activeTab === 'measure' && (
          <section>
            <SectionHeader isAr={isAr}
              ar_title="القياسات والمصطلحات التقنية"
              en_title="Measurements & Technical Terms"
              ar_sub="معرفة الفرق بين القياسات الخارجية والداخلية والمصطلحات التقنية يحميك من الأخطاء المكلفة عند الطلب."
              en_sub="Understanding the difference between outer and inner dimensions and technical terms protects you from costly ordering mistakes."
            />

            {/* OD vs ID */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <h3 className="font-black text-slate-900 mb-4 text-base">{isAr ? 'OD مقابل ID — الأكثر أهمية' : 'OD vs ID — Most Critical'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <div className="text-blue-700 font-black text-lg mb-1">OD — Outside Dimensions</div>
                  <div className="text-xs text-blue-600 leading-relaxed">
                    {isAr
                      ? 'القياس من الخارج — ما يكتبه المورد في عرض السعر. مثال: 490 × 415 × 390 mm تعني أبعاد الكرتون من خارجه.'
                      : 'Measured from outside — what suppliers quote. Example: 490 × 415 × 390 mm are the external dimensions of the box.'}
                  </div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <div className="text-emerald-700 font-black text-lg mb-1">ID — Inside Dimensions</div>
                  <div className="text-xs text-emerald-600 leading-relaxed">
                    {isAr
                      ? 'القياس من الداخل — المساحة الفعلية لمنتجك. أصغر من OD بـ 8–12 mm لكل بُعد بسبب سُمك الورق.'
                      : 'Measured from inside — the actual space for your product. Smaller than OD by 8–12 mm per dimension due to paper thickness.'}
                  </div>
                </div>
              </div>
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
                <strong>⚠️ {isAr ? 'تنبيه:' : 'Warning:'}</strong>{' '}
                {isAr
                  ? 'تأكد دائماً من المورد: هل القياسات OD أم ID؟ الخطأ هنا يعني كرتوناً لا يتسع لمنتجك أو أكبر منه بكثير.'
                  : 'Always confirm with supplier: are dimensions OD or ID? Getting this wrong means a box that doesn\'t fit your product.'}
              </div>
            </div>

            {/* Dimension order */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-4">
              <h3 className="font-black text-slate-900 mb-4">{isAr ? 'ترتيب كتابة الأبعاد' : 'Dimension Writing Order'}</h3>
              <div className="flex items-center justify-center gap-2 text-2xl font-black text-slate-700 mb-4">
                <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl">L</span>
                <span className="text-slate-400">×</span>
                <span className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl">W</span>
                <span className="text-slate-400">×</span>
                <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl">H</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs text-center">
                <div><div className="font-black text-blue-700 text-base">Length</div><div className="text-slate-500">{isAr ? 'الطول' : 'الطول'}</div><div className="text-slate-400">{isAr ? 'البُعد الأطول' : 'Longest side'}</div></div>
                <div><div className="font-black text-emerald-700 text-base">Width</div><div className="text-slate-500">{isAr ? 'العرض' : 'العرض'}</div><div className="text-slate-400">{isAr ? 'البُعد الأعرض' : 'Second longest'}</div></div>
                <div><div className="font-black text-orange-700 text-base">Height</div><div className="text-slate-500">{isAr ? 'الارتفاع' : 'الارتفاع'}</div><div className="text-slate-400">{isAr ? 'بُعد الارتفاع' : 'Vertical dimension'}</div></div>
              </div>
            </div>

            {/* Key terms */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-slate-900 mb-4">{isAr ? 'المصطلحات الأساسية' : 'Key Terms Glossary'}</h3>
              <div className="space-y-3">
                {[
                  { term: 'ECT', ar: 'Edge Crush Test', en: 'Edge Crush Test', ar_def: 'قياس مقاومة حافة الكرتون للضغط العمودي — يحدد قدرة التكديس', en_def: 'Measures resistance of carton edge to vertical crush — determines stacking capacity' },
                  { term: 'BCT', ar: 'Box Compression Test', en: 'Box Compression Test', ar_def: 'القوة الكلية للصندوق تحت الضغط — الحد الأقصى للوزن فوقه', en_def: 'Total box strength under compression — max weight it can bear stacked' },
                  { term: 'GSM', ar: 'جرام/متر مربع', en: 'Grams per Square Metre', ar_def: 'وزن الورق — كلما ارتفع كلما كان أقوى وأثقل', en_def: 'Paper weight — higher means stronger and heavier' },
                  { term: 'Mullen', ar: 'اختبار الاختراق', en: 'Burst/Mullen Test', ar_def: 'مقاومة الكرتون للثقب والاختراق — مهم للمنتجات ذات الأطراف الحادة', en_def: 'Resistance to puncture — important for sharp-edged products' },
                  { term: 'Blank', ar: 'القطعة المفرودة', en: 'Blank Size', ar_def: 'مساحة الكرتون مفتوحاً قبل الطي — يحدد كمية الورق المستخدمة والتكلفة', en_def: 'Flat unfolded carton area — determines paper usage and cost' },
                  { term: 'MOQ', ar: 'الحد الأدنى للطلب', en: 'Minimum Order Quantity', ar_def: 'أقل كمية يقبلها المصنع — عادةً 500 إلى 5,000 قطعة في الإمارات', en_def: 'Smallest quantity factory accepts — typically 500 to 5,000 units in UAE' },
                ].map(t => (
                  <div key={t.term} className="flex gap-3 p-3 rounded-xl bg-slate-50 hover:bg-orange-50 transition-colors">
                    <div className="w-16 flex-shrink-0 font-black text-orange-600 text-sm">{t.term}</div>
                    <div className="text-xs text-slate-600 leading-relaxed">{isAr ? t.ar_def : t.en_def}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════ STANDARD SIZES ════ */}
        {activeTab === 'sizes' && (
          <section>
            <SectionHeader isAr={isAr}
              ar_title="القياسات الستاندرد المتداولة في السوق"
              en_title="Standard Sizes in UAE Market"
              ar_sub="هذه القياسات جاهزة ومتوفرة لدى أغلب مصنعي الكراتين في الإمارات — الطلب بها أسرع وأرخص من القياسات المخصصة."
              en_sub="These sizes are ready-made and available from most UAE carton manufacturers — ordering them is faster and cheaper than custom dimensions."
            />
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {STD_SIZES.map(s => (
                <div key={s.dims} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Package className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-slate-900 text-sm">{isAr ? s.ar_name : s.en_name}</div>
                    <div className="font-mono text-orange-600 text-xs font-bold mt-0.5">{s.dims}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{isAr ? s.ar_use : s.en_use}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* Comparison note */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-black text-slate-900 mb-4">{isAr ? 'ستاندرد مقابل مخصص' : 'Standard vs Custom Sizes'}</h3>
              <div className="grid md:grid-cols-2 gap-4 text-xs">
                <div className="bg-emerald-50 rounded-xl p-4">
                  <div className="font-black text-emerald-700 mb-2">{isAr ? '✓ قياس ستاندرد' : '✓ Standard Size'}</div>
                  <ul className="space-y-1.5 text-emerald-600">
                    {(isAr
                      ? ['سعر أقل بـ 15–30%', 'توفر فوري — لا انتظار', 'إنتاج أسرع (3–5 أيام)', 'حد أدنى للطلب أقل', 'مخزون جاهز لدى الموردين']
                      : ['15–30% lower price', 'Immediate availability', 'Faster lead time (3–5 days)', 'Lower MOQ', 'Pre-stocked by suppliers']
                    ).map(i => <li key={i} className="flex items-start gap-1"><CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />{i}</li>)}
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-xl p-4">
                  <div className="font-black text-blue-700 mb-2">{isAr ? '◆ قياس مخصص' : '◆ Custom Size'}</div>
                  <ul className="space-y-1.5 text-blue-600">
                    {(isAr
                      ? ['مصمم لمنتجك تماماً', 'يقلل الهدر في الفراغ', 'يحسن عرض العلامة التجارية', 'يتطلب حد أدنى أعلى (500+)', 'وقت إنتاج أطول (7–14 يوم)']
                      : ['Designed exactly for your product', 'Minimizes void space waste', 'Better brand presentation', 'Higher MOQ required (500+)', 'Longer lead time (7–14 days)']
                    ).map(i => <li key={i} className="flex items-start gap-1"><Star className="w-3 h-3 mt-0.5 flex-shrink-0" />{i}</li>)}
                  </ul>
                </div>
              </div>
            </div>

            {/* Printing options */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 mt-4">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2">
                <Printer className="w-4 h-4 text-orange-500" />
                {isAr ? 'خيارات الطباعة المتاحة' : 'Available Printing Options'}
              </h3>
              <div className="grid md:grid-cols-3 gap-3 text-xs">
                {[
                  { name: 'Flexo Print', ar_desc: 'الطباعة القياسية للكراتين. 1–4 ألوان. مناسبة للطلبات الكبيرة', en_desc: 'Standard carton printing. 1–4 colors. Best for large runs', min: '1,000+' },
                  { name: 'Pre-Print (Offset)', ar_desc: 'أعلى جودة — طباعة الورق قبل التصنيع. ألوان حادة وتفاصيل دقيقة', en_desc: 'Highest quality — paper printed before manufacturing. Sharp colors', min: '5,000+' },
                  { name: 'Plain (No Print)', ar_desc: 'بدون طباعة — بني سادة. الأسرع والأرخص', en_desc: 'No print — plain brown. Fastest and cheapest option', min: '100+' },
                ].map(p => (
                  <div key={p.name} className="bg-slate-50 rounded-xl p-3">
                    <div className="font-black text-slate-800 mb-1">{p.name}</div>
                    <div className="text-slate-600 leading-relaxed mb-2">{isAr ? p.ar_desc : p.en_desc}</div>
                    <div className="text-orange-600 font-bold">MOQ: {p.min}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── CTA ── */}
        <div className="mt-10 bg-gradient-to-br from-slate-900 to-orange-900 rounded-3xl p-8 text-center text-white">
          <h2 className="text-2xl font-black mb-2">
            {isAr ? 'جاهز لطلب الكراتين؟' : 'Ready to Order Cartons?'}
          </h2>
          <p className="text-slate-300 text-sm mb-6 max-w-md mx-auto">
            {isAr
              ? 'استخدم حاسبة Crate للتغليف لاختيار المواصفات المثالية وحساب التكاليف بدقة'
              : 'Use Crate\'s packaging calculator to select the right specs and calculate costs accurately'}
          </p>
          <Link href={`/${locale}/packaging`}
            className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-black px-8 py-3 rounded-2xl transition-colors text-sm">
            {isAr ? 'حاسبة التغليف' : 'Packaging Calculator'}
            <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ isAr, ar_title, en_title, ar_sub, en_sub }: {
  isAr: boolean; ar_title: string; en_title: string; ar_sub: string; en_sub: string
}) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl font-black text-slate-900 mb-2">{isAr ? ar_title : en_title}</h2>
      <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">{isAr ? ar_sub : en_sub}</p>
    </div>
  )
}

function InfoBox({ isAr, ar, en }: { isAr: boolean; ar: string; en: string }) {
  return (
    <div className="mt-5 bg-orange-50 border border-orange-200 rounded-2xl p-4 text-sm text-orange-700 flex items-start gap-2">
      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <span>{isAr ? ar : en}</span>
    </div>
  )
}

function WaveIllustration({ code, color }: { code: string; color: string }) {
  // Simple SVG wave showing flute pattern
  const waves: Record<string, { h: number; count: number }> = {
    A: { h: 18, count: 5 }, B: { h: 11, count: 8 }, C: { h: 14, count: 7 },
    E: { h: 6, count: 12 }, F: { h: 4, count: 16 }, BC: { h: 22, count: 4 },
  }
  const w = waves[code] ?? { h: 12, count: 7 }
  const width = 200; const waveW = width / w.count

  const path = Array.from({ length: w.count }, (_, i) => {
    const x = i * waveW
    return `M${x},${w.h} Q${x + waveW/2},0 ${x + waveW},${w.h}`
  }).join(' ')

  return (
    <div className="bg-slate-50 rounded-xl p-2 flex items-center justify-center overflow-hidden" style={{ height: w.h + 20 }}>
      <svg width={width} height={w.h + 6} viewBox={`0 0 ${width} ${w.h + 6}`}>
        <line x1="0" y1="1" x2={width} y2="1" stroke={color} strokeWidth="2" opacity="0.5" />
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <line x1="0" y1={w.h + 5} x2={width} y2={w.h + 5} stroke={color} strokeWidth="2" opacity="0.5" />
      </svg>
    </div>
  )
}

function PlyVisual({ ply, color }: { ply: number; color: string }) {
  const layers3 = ['#e2e8f0', color + '60', '#e2e8f0']
  const layers5 = ['#e2e8f0', color + '60', '#cbd5e1', color + '60', '#e2e8f0']
  const layers7 = ['#e2e8f0', color + '60', '#cbd5e1', color + '60', '#cbd5e1', color + '60', '#e2e8f0']
  const layers = ply === 3 ? layers3 : ply === 5 ? layers5 : layers7

  return (
    <div className="flex flex-col gap-0.5 bg-slate-50 rounded-xl p-3">
      {layers.map((c, i) => (
        <div key={i} className="rounded" style={{
          height: c.includes('60') ? 10 : 6,
          backgroundColor: c,
        }} />
      ))}
    </div>
  )
}
