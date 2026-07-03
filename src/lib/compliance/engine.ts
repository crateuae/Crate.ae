/**
 * DETERMINISTIC compliance engine.
 *
 * The old checker asked an AI (temperature ~1.0) to "check compliance", so it
 * invented a DIFFERENT subset of findings every run — you'd fix one set, re-run,
 * and get another. This engine is pure code: it evaluates the fixed rule catalog
 * (compliance_rules) against the product input, so the SAME input always yields
 * the SAME complete result. No randomness, nothing left out.
 *
 * Each rule's `field_to_check` maps to a deterministic evaluator below.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface ComplianceInput {
  product_class: string
  product_name: string
  ingredients?: string
  label_text?: string
  caffeine_mg_per_100ml?: number
  has_sulfites?: boolean
}

export interface RuleResult {
  clause: string
  field: string
  requirement_en: string
  requirement_ar: string
  status: 'pass' | 'fail' | 'review' | 'na'
  note?: string      // Arabic note shown by the UI
  note_en?: string
  note_ar?: string
}

export interface ComplianceResult {
  standard: string
  verdict: 'registerable' | 'not_registerable' | 'needs_review'
  passed: RuleResult[]
  failed: RuleResult[]
  review: RuleResult[]
  na: RuleResult[]
  missing_count: number
  summary_ar: string
  summary_en: string
  deterministic: true
}

interface Rule {
  product_class: string
  clause: string
  field_to_check: string
  requirement_en: string
  requirement_ar: string
  is_mandatory: boolean
}

// A product class inherits the label rules of its base classes.
const CLASS_CHAIN: Record<string, string[]> = {
  food_general:    ['food_general'],
  beverage_general:['food_general', 'beverage_general'],
  beverage_energy: ['food_general', 'beverage_general', 'beverage_energy'],
  dairy:           ['food_general', 'dairy'],
}

const hasArabic = (s: string) => /[؀-ۿ]/.test(s)
const norm = (s?: string) => (s ?? '').toLowerCase()

// ── Deterministic evaluators, keyed by field_to_check ──────────────────────────
// Each returns 'pass' | 'fail' | 'review' | 'na' from the input alone.
const EVALUATORS: Record<string, (i: ComplianceInput) => { status: RuleResult['status']; note_en?: string; note_ar?: string }> = {
  label_product_name: (i) => {
    const t = norm(i.label_text)
    if (!t) return { status: 'review', note_en: 'No label text provided — confirm the product name appears on the label.', note_ar: 'لم يُدخل نص البطاقة — تأكد من ظهور اسم المنتج على البطاقة.' }
    return t.includes(norm(i.product_name).split(' ')[0])
      ? { status: 'pass' }
      : { status: 'review', note_en: 'Product name not detected in the label text.', note_ar: 'لم يُكتشف اسم المنتج في نص البطاقة.' }
  },
  dates_in_arabic: (i) => arabicSection(i.label_text, /تاريخ|الإنتاج|إنتاج|انتهاء|الصلاحية|الانتهاء/,
    'Production & expiry dates must appear in Arabic.', 'يجب أن تظهر تواريخ الإنتاج والانتهاء باللغة العربية.'),
  storage_in_arabic: (i) => arabicSection(i.label_text, /يحفظ|التخزين|تخزين|ظروف الحفظ|بارد|جاف/,
    'Storage conditions must appear in Arabic.', 'يجب أن تظهر ظروف التخزين باللغة العربية.'),
  storage_temp_arabic: (i) => arabicSection(i.label_text, /يحفظ|درجة الحرارة|مبرد|التخزين|°|مئوية/,
    'Storage temperature must be specified in Arabic.', 'يجب تحديد درجة حرارة التخزين باللغة العربية.'),
  nutrition_in_arabic: (i) => arabicSection(i.label_text, /القيمة الغذائية|الحقائق الغذائية|السعرات|الطاقة|بروتين|دهون|كربوهيدرات|سكر/,
    'Nutrition facts must appear in Arabic.', 'يجب أن تظهر الحقائق الغذائية باللغة العربية.'),
  ingredients_in_arabic: (i) => arabicSection(i.label_text, /المكونات|المحتويات|مكونات/,
    'Ingredients list must appear in Arabic.', 'يجب أن تظهر قائمة المكونات باللغة العربية.'),
  net_weight: (i) => {
    const t = norm(i.label_text)
    return /\d+\s*(ml|l|g|kg|cl|مل|لتر|جم|كجم|جرام|غرام|سم3)/.test(t)
      ? { status: 'pass' }
      : { status: 'fail', note_en: 'Net content in metric units (e.g. 330 ml) not detected.', note_ar: 'لم يُكتشف المحتوى الصافي بالوحدات المترية (مثال: ٣٣٠ مل).' }
  },
  country_of_origin: (i) => {
    const t = norm(i.label_text)
    return /بلد المنشأ|المنشأ|صنع في|منشأ|made in|product of|country of origin|origin:/.test(t)
      ? { status: 'pass' }
      : { status: 'fail', note_en: 'Country of origin statement not detected.', note_ar: 'لم يُكتشف بيان بلد المنشأ.' }
  },
  sulfites_declared: (i) => {
    if (!i.has_sulfites) return { status: 'na', note_en: 'Product declared free of sulfites.', note_ar: 'المنتج مُعلن خالٍ من السلفايت.' }
    const t = norm(i.label_text) + ' ' + norm(i.ingredients)
    return /e2(2[0-8])|\bsulph?ite|سلفايت|سلفيت|كبريتيت|ثاني أكسيد الكبريت/.test(t)
      ? { status: 'pass' }
      : { status: 'fail', note_en: 'Product contains sulfites but the E-number (E220–E228) is not declared on the label.', note_ar: 'المنتج يحتوي على سلفايت لكن رقم E (E220–E228) غير مُعلن على البطاقة.' }
  },
  // Energy-drink specific
  health_warning_prefix: (i) => warnKeyword(i.label_text, /تحذير|warning/, 'Warnings must be prefixed with "Warning".', 'يجب أن تُسبق التحذيرات بكلمة «تحذير».'),
  health_warnings_groups: (i) => warnKeyword(i.label_text, /حامل|الحوامل|مرضع|الأطفال|القلب|الكافيين|pregnan|nursing|children|heart/, 'Must include the mandatory health-warning groups.', 'يجب تضمين فئات التحذير الصحي الإلزامية.'),
  sleep_warning: (i) => warnKeyword(i.label_text, /النوم|قدرة على النوم|sleep/, 'Must warn that excessive consumption may reduce sleep ability.', 'يجب التحذير من أن الإفراط قد يقلل القدرة على النوم.'),
  high_caffeine_label: (i) => {
    const highByValue = (i.caffeine_mg_per_100ml ?? 0) * 10 > 150 // mg/L
    if (!highByValue) return { status: 'na', note_en: 'Caffeine ≤ 150 mg/L — high-caffeine statement not required.', note_ar: 'الكافيين ≤ ١٥٠ ملغم/لتر — بيان الكافيين العالي غير مطلوب.' }
    return warnKeyword(i.label_text, /كافيين عالي|high caffeine|محتوى عالٍ من الكافيين/, 'Caffeine > 150 mg/L: must state "High caffeine content".', 'الكافيين > ١٥٠ ملغم/لتر: يجب ذكر «محتوى عالٍ من الكافيين».')
  },
  max_daily_consumption: (i) => warnKeyword(i.label_text, /الحد الأقصى|الاستهلاك اليومي|maximum daily|per day/, 'Must state maximum daily consumption (cans or ml).', 'يجب ذكر الحد الأقصى للاستهلاك اليومي (عبوات أو مل).'),
  // Dairy
  fat_content: (i) => {
    const t = norm(i.label_text)
    return /\d+\s*%|دسم|نسبة الدهون|fat/.test(t)
      ? { status: 'pass' }
      : { status: 'fail', note_en: 'Fat content percentage not declared.', note_ar: 'لم تُعلن نسبة الدهون.' }
  },
}

function arabicSection(label: string | undefined, kw: RegExp, note_en: string, note_ar: string): { status: RuleResult['status']; note_en?: string; note_ar?: string } {
  const t = label ?? ''
  if (!t.trim()) return { status: 'review', note_en: `No label text provided — ${note_en}`, note_ar: `لم يُدخل نص البطاقة — ${note_ar}` }
  if (!hasArabic(t)) return { status: 'fail', note_en: `Label has no Arabic — ${note_en}`, note_ar: `البطاقة بلا نص عربي — ${note_ar}` }
  return kw.test(t) ? { status: 'pass' } : { status: 'fail', note_en, note_ar }
}

function warnKeyword(label: string | undefined, kw: RegExp, note_en: string, note_ar: string): { status: RuleResult['status']; note_en?: string; note_ar?: string } {
  const t = norm(label)
  if (!t.trim()) return { status: 'review', note_en: `No label text provided — ${note_en}`, note_ar: `لم يُدخل نص البطاقة — ${note_ar}` }
  return kw.test(t) ? { status: 'pass' } : { status: 'fail', note_en, note_ar }
}

export async function checkComplianceDeterministic(db: SupabaseClient, input: ComplianceInput): Promise<ComplianceResult> {
  const classes = CLASS_CHAIN[input.product_class] ?? ['food_general']
  const { data } = await db
    .from('compliance_rules')
    .select('product_class, clause, field_to_check, requirement_en, requirement_ar, is_mandatory')
    .in('product_class', classes)
  const rules = ((data ?? []) as Rule[])
    // stable order: class chain, then clause, then field — so output order never shifts
    .sort((a, b) =>
      classes.indexOf(a.product_class) - classes.indexOf(b.product_class) ||
      a.clause.localeCompare(b.clause) || a.field_to_check.localeCompare(b.field_to_check))

  // de-dup identical field_to_check across inherited classes (keep first)
  const seen = new Set<string>()
  const results: RuleResult[] = []
  for (const r of rules) {
    if (seen.has(r.field_to_check)) continue
    seen.add(r.field_to_check)
    const ev = EVALUATORS[r.field_to_check]?.(input) ?? { status: 'review' as const, note_en: 'Manual review required.', note_ar: 'يتطلب مراجعة يدوية.' }
    results.push({ clause: r.clause, field: r.field_to_check, requirement_en: r.requirement_en, requirement_ar: r.requirement_ar, ...ev, note: ev.note_ar })
  }

  const passed = results.filter(r => r.status === 'pass')
  const failed = results.filter(r => r.status === 'fail')
  const review = results.filter(r => r.status === 'review')
  const na = results.filter(r => r.status === 'na')

  const verdict: ComplianceResult['verdict'] =
    failed.length > 0 ? 'not_registerable' : review.length > 0 ? 'needs_review' : 'registerable'

  const summary_en = failed.length
    ? `${failed.length} requirement(s) not met — fix all of them to register. ${passed.length} passed, ${review.length} to verify.`
    : review.length
    ? `No failures. ${review.length} item(s) need manual verification on the artwork. ${passed.length} passed.`
    : `All ${passed.length} applicable requirements met — registerable.`
  const summary_ar = failed.length
    ? `${failed.length} اشتراط غير مستوفٍ — عالجها كلها للتسجيل. ${passed.length} مستوفٍ، ${review.length} للتحقق.`
    : review.length
    ? `لا إخفاقات. ${review.length} بند يحتاج تحققاً يدوياً على التصميم. ${passed.length} مستوفٍ.`
    : `جميع الاشتراطات المنطبقة (${passed.length}) مستوفاة — قابل للتسجيل.`

  return { standard: 'UAE.S 9:2019', verdict, passed, failed, review, na, missing_count: failed.length, summary_ar, summary_en, deterministic: true }
}
