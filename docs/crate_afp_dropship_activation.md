# تفعيل الدروبشيب Crate ⇄ Art for Printing — المرحلة 1 (نموذج العمولة)

تاريخ: 2026-08-05 · النموذج: **A — عمولة** (AFP تاجر السجل تقبض من المشتري، Crate يأخذ عمولة).

## ما بُني فعلاً (كود جاهز، مفحوص الأنواع)

**Art for Printing** (`C:\Projects\artprinting` · Supabase `etaoppdwdpicipauprcj`):
- `src/lib/partner/auth.ts` — تحقّق HMAC (fail-closed).
- `POST /api/partner/quote` — سعر حيّ من محرّك التسعير (يحلّ المنتج بالـslug).
- `POST /api/partner/orders` — حقن الطلب: إعادة تسعير خادمية + بطاقة إنتاج `pending_sales` (تُحصَّل الدفعة قبل الإنتاج) + رفع الفن + دفع Odoo **company_id=2** + وسم `partner_source='crate'` + idempotency.
- `GET /api/partner/orders/[ref]/status` — قراءة الحالة.
- تعديل `pushOrderToOdoo(orderId, {companyId})` — المسار الجديد فقط يمرّر 2؛ المتجر الحالي دون تغيير.

**Crate** (`C:\Projects\crate` · Supabase `ffaqjittonurtiggwxml`):
- `src/lib/partner/afp.ts` — عميل موقّع (getAfpQuote / createAfpOrder / getAfpStatus).
- `POST /api/partner/quote` — بروكسي المتصفح (السرّ يبقى خادمياً).
- `POST /api/partner/order` — يحقن في AFP + يسجّل في `partner_orders` (سجلّ العمولة) + يُخطر الأدمن.
- `OrderLabelCTA.tsx` — زر «اطلب ملصقاً مطابقاً» في نتيجة `/compliance` (سعر حيّ + رفع فن + بيانات المشتري).

## خطوات التفعيل (عليك — بالترتيب)

### 1) شغّل SQL (كلٌّ على مشروعه الصحيح)
- **Crate** (`ffaqjittonurtiggwxml`): محتوى `crate/docs/sql/partner_orders.sql`
- **Art for Printing** (`etaoppdwdpicipauprcj`): محتوى `artprinting/docs/sql/orders_partner_columns.sql`

### 2) اضبط متغيّرات البيئة (ثم أعد النشر — الـenv لا يسري بلا redeploy)
سرّ مشترك مقترح (نفس القيمة على المشروعين):
```
PARTNER_SHARED_SECRET=c0c5953af51d0ba4ea68eac98b802ba7f7af7662cfe469003ed9564869b9f674
```
- **على Vercel Art for Printing:** `PARTNER_SHARED_SECRET` (نفس القيمة).
- **على Vercel Crate:** `PARTNER_SHARED_SECRET` (نفس القيمة) + `AFP_PARTNER_URL=https://<نطاق-AFP-الحيّ>` + (اختياري) `CRATE_COMMISSION_PCT=15`.

### 3) أكّد سطر منتج الملصق في AFP
العقد يحلّ المنتج بالـslug الافتراضي `custom-paper-product-labels`. تأكّد أن هذا هو الـslug الفعلي لمنتج «Custom Paper Product Labels» في جدول `products` (إن كان مختلفاً أخبرني لأضبط الافتراضي).

### 4) أعد نشر المشروعين، ثم اختبر
افتح `/ar/compliance` على Crate ← افحص منتجاً ← اضغط «اطلب ملصقاً مطابقاً» ← احسب السعر (يجب أن يأتي رقم حقيقي من AFP) ← أرسل طلباً تجريبياً ← تحقّق: طلب `AFP-…` جديد في AFP (بطاقة إنتاج `pending_sales`, department=Crate) + صف في `partner_orders` لدى Crate.

## ملاحظة تحقّق صريحة
لم أستطع اختبار المسار حيّاً (مشروعان منفصلان، الـenv غير مضبوط بعد، وMCP لا يصل لأي من القاعدتين). **فحصت الأنواع (tsc) على المشروعين ونجحا.** التشغيل الحيّ يعتمد على الخطوات 1–4 أعلاه.

## المتبقّي (مراحل لاحقة)
- **م2:** webhook حالة AFP→Crate + إخطار المشتري تلقائياً + لوحة حالة.
- **م3:** لوحة الهامش/العمولة + تقرير تسوية شهري داخل لوحة Crate.
- **م4:** مولّد الفن الآلي (الملصق المطابق يُولَّد من نتيجة الفحص) · محرّك تسعير الستكرات (imposition) للمقاسات الحرّة · الإحالة العكسية AFP→Crate.
