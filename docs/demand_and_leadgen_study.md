# Crate — دراسة الطلب الفعلي وآلة توليد العملاء (Demand & Lead-Gen Study)

> التاريخ: 2026-09-24. الهدف: معرفة ما يبحث عنه الناس فعلاً في مجال Crate (استيراد/امتثال/موردون FMCG في الإمارات) عبر محركات البحث ومحركات الإجابة بالذكاء الاصطناعي، ومن يخدم هذا الطلب اليوم، وكيف نبني توليد عملاء تلقائياً بأسعار رمزية ودخل متراكم.
>
> **حدود المنهج (مهم):** لا أحد خارج OpenAI/Google/Anthropic يرى ما يكتبه الناس داخل ChatGPT/Gemini/Claude. لذا قِسنا الطلب من مصادر بديلة يمكن التحقق منها: اقتراحات الإكمال التلقائي في Google/Bing/DuckDuckGo (جغرافيا الإمارات، عربي+إنجليزي، 1,465 اقتراحاً → 1,031 عبارة فريدة)، «أسئلة أخرى» في جوجل، Google Trends للإمارات (12 شهراً)، إجابات Bing Copilot وPerplexity ومصادرهما، بيانات إحالة Crate نفسها. حصة SerpAPI (250/250) مستهلكة هذا الشهر فلا أرقام حجم SERP. **أهم بيانات ناقصة: Google Search Console لـ crate.ae** — تعطي الاستعلامات والانطباعات الحقيقية.

---

## 1. الخلاصة التنفيذية

1. **الطلب موجود لكنه ضيّق وعالي القيمة، وليس «هائلاً» داخل الإمارات.** Google Trends يُظهر مصطلحات مثل `montaji`، `product registration dubai`، `import food uae`، `esma certificate` عند حد الضجيج (أسابيع كثيرة = 0) أي مئات البحوث شهرياً لكل موضوع على الأكثر، لا عشرات الآلاف. المقابل: كل عميل يساوي كثيراً — الاستشاريون يقبضون **3,000–10,000 درهم لكل منتج** (رسوم البلدية الرسمية 10 + 220 درهم فقط).
2. **أكبر عناقيد الطلب (بعدد العبارات الفريدة):** شهادات المطابقة (ESMA/ECAS/EQM/حلال) 203، تسجيل المنتجات (Montaji/FIRS/ZAD/MoHAP) 201، كيفية الاستيراد 136، **الموردون** 127، الرخص/التأسيس 78، الملصقات 73، الجمارك/HS code/الضريبة الانتقائية 49.
3. **الجمهور الأكبر خارج الإمارات:** استعلامات المصدّرين («how to import rice from india to uae»، «food items from india»، «Filipino food suppliers»، تركيا، مصر) — من يريد **دخول** السوق لا من هو فيه.
4. **الطلب العربي ضعيف في الإمارات ومختلط بالسعودية** (هيئة الغذاء والدواء، سابر) ومصر. الاستثناء: «تسجيل منتج غذائي في دبي/بلدية دبي»، «شهادة حلال الامارات»، «علامة الجودة الاماراتية»، «رخصة تجارة عامة دبي» (تكلفتها).
5. **من يخدم الطلب اليوم:** شركات تأسيس الأعمال (Shuraa، filings.ae، Nextmove «500+ علامة»، The Infinite Service «135 تقييم جوجل»، CorpBridge، EGSH، Takween، Arnifi، Emirabiz). كلها نموذج واحد: مقال 2026 → «استشارة مجانية» → واتساب → عرض سعر غير معلن. **لا أحد يبيع أداة ذاتية الخدمة أو يعلن السعر.** الاستثناء الجديد: **sijil.ae** (بوابة مجانية + حاسبة تكلفة + أدلة عربي/إنجليزي) — أقرب منافس لنموذج Crate.
6. **محركات الإجابة:** Bing Copilot (وهو فهرس ChatGPT) يستشهد بمقالات الاستشاريين (filings.ae، shuraa، productregistrationdubai.ae) وبـ sijil.ae للملصقات. Perplexity يستشهد **بالمصادر الحكومية فقط** (Food Code بلدية دبي، ADAFSA، u.ae). **ChatGPT أحال 5 زيارات إلى crate.ae يوم 12 سبتمبر إلى `/en/products`** — أدلة الاستيراد الخاصة بمنتج محدد هي القناة المثبتة لدينا.
7. **الاستنتاج:** لا نبني SaaS بالاشتراك أولاً. نبني **أدوات مجانية صغيرة مطابقة لكل عنقود طلب** تُنتج نتيجة شخصية وتطلب البريد للحصول على تقرير PDF، ثم سلّم بيع: تقرير 99 درهم → مراجعة بشرية 299 درهم → إحالة للاستشاري (10–20% من 3–10 آلاف) → لاحقاً اشتراك «مراقبة اللوائح». الحجم يأتي من (أ) صفحات الموردين البرمجية من دليل 47,303 شركة، (ب) أدلة المنتجات التي يستشهد بها الذكاء الاصطناعي، (ج) استهداف المصدّرين خارج الإمارات.

---

## 2. ما يبحث عنه الناس فعلاً (مقاس)

### 2.1 العناقيد (1,031 عبارة فريدة من 3 محركات، جغرافيا AE)
| العنقود | عبارات | أمثلة مؤكدة في ≥2 محركات |
|---|---|---|
| CERTIFY — شهادات المطابقة | 203 | esma certificate (cost / meaning / how to get / uae), ecas certificate (of conformity), emirates quality mark (EQM, logo), halal certificate uae, approved halal certification bodies uae, halal certification cost |
| REGISTER — تسجيل المنتجات | 201 | montaji (login / portal / registration / fees / product registration check / contact number), dubai municipality product registration (fees / check / certificate / requirements), food product registration in dubai, dubai municipality firs system, dubai municipality food label approval, mohap product registration, zad abu dhabi, adafsa registration, food watch registration |
| IMPORT-HOWTO — كيف أستورد | 136 | how to import food products to uae, food import license uae, food import regulations uae, how to get import license in uae, how to import rice from india/pakistan to uae, how to import perfume, dubai import products list, goods imported into the uae |
| SUPPLIERS — الموردون | 127 | food suppliers in dubai/uae, wholesale food suppliers uae (online), fmcg distributors in uae, food importers in dubai, foodstuff suppliers, + 28 تنويعة: frozen, dry, HORECA, hotel, Filipino, Italian, Japanese, Mexican, pet food, food packaging suppliers, food ingredient supplier |
| LICENSE/SETUP — الرخص | 78 | general trading llc license cost in dubai, how to start import export business in uae, رخصة تجارة عامة دبي (تكلفة), رخصة استيراد وتصدير دبي |
| LABEL — الملصقات | 73 | uae food labelling regulations, general food labelling requirements uae, dubai municipality food label approval, nutrition facts label, made in uae sticker, label/sticker printing dubai |
| CUSTOMS/TAX | 49 | hs code uae (list / pdf / search / customs), excise tax, تخليص جمركي |
| BANNED / SHELF-LIFE / LAB / PACKAGING | 9 / 6 / 1 / 7 | prohibited items, shelf life, packaging suppliers uae, carton box supplier near me |

### 2.2 الأسئلة الصريحة (صيغة سؤال)
- how to register (a/food/cosmetic) product in dubai municipality · how to apply FIRS in dubai municipality · how to make FIRS
- how to get esma certificate (in uae) · what is esma certificate · esma certificate cost · what is gso standard · what is mohap
- how to get halal certificate in uae · halal certification bodies/requirements/cost · halal suitable vs halal certified
- how to get import (export) license in dubai/uae · where to apply import code in uae · how to start import export business in uae
- how to find suppliers/distributors in uae · how to find suppliers for dropshipping in uae · wholesale food suppliers uae online
- how to import food items from india to uae · how to import rice from india/pakistan to uae · how to export rice to dubai · how to import perfume
- what documents are needed to import goods · how much food does the uae import · where does dubai get its food
- «أسئلة أخرى» (جوجل عربي): ما هي شروط استيراد المواد الغذائية إلى الإمارات؟ · **كم نسبة الربح في تجارة المواد الغذائية؟** · أين أشتري المواد الغذائية بالجملة عبر الإنترنت في الإمارات؟

### 2.3 Google Trends (الإمارات، 12 شهراً)
- `montaji`, `product registration dubai`, `import food uae`, `esma certificate`: كلها عند حد الضجيج (0 في معظم الأسابيع، قفزات متفرقة) ⇒ حجم صغير.
- استعلامات montaji المرتبطة: login 100، dubai 87، product registration 30، app 13. **صاعدة:** montaji app +130%، montaji dubai +120%، montaji product registration +90%.
- دلالة: حتى أكبر مصطلح في المجال صغير، لكنه ينمو.

### 2.4 إشارات أخرى
- YouTube: «Dubai Municipality Food Item Registration and Label Assessment» (2022) **15.7 ألف مشاهدة** — شهية لشرح عملي خطوة بخطوة.
- فيسبوك: مجموعة «تجارة وتصدير المواد الغذائية بالجملة من الإمارات» 32.8 ألف متابع تظهر في نتائج جوجل العربية.
- إحالات Crate: ChatGPT 5 (12 سبتمبر → /en/products)، Bing 8 (carton-specs، providers، packaging، market).

---

## 3. من يظهر أمام الباحث اليوم (المنافسون/الوجهات)
| الجهة | النموذج | ما يفعله جيداً | الفجوة |
|---|---|---|---|
| Shuraa (#1 جوجل EN+AR) | تأسيس أعمال، 26 سنة | مقال شامل «2026»، رسوم، أسباب الرفض، FAQ، واتساب | لا أداة، لا سعر خدمة |
| filings.ae / firmz.ae | تأسيس أعمال | يستشهد بهما Bing Copilot | نصوص عامة |
| Nextmove Services | استشارة تسجيل، «500+ brands» | مدد بالفئة (2–6 أسابيع)، واتساب بأسماء | لا سعر، لا أدوات |
| The Infinite Service | استشارة تسجيل، 135 تقييم جوجل | يغطي تصاريح CPIP/ZDLM | لا سعر |
| CorpBridge | تسجيل + **ترجمة ملصقات GSO 9:2022** | خدمة الترجمة المعتمدة | مقالي فقط |
| **sijil.ae** | SaaS هجين: بوابة مجانية، حاسبة تكلفة، أدلة AR/EN | أقرب نموذج لنا؛ يظهر في Bing للملصقات | جديد؛ تركيزه تأسيس الشركات |
| بلدية دبي / ADAFSA / u.ae | حكومي | Perplexity يستشهد بها حصراً | لا تشرح «كيف» عملياً |
| Food Label Maker (إعلان Bing) | SaaS عالمي للملصقات | يدفع إعلانات على استعلام الملصق الإماراتي | ليس محلياً |

**الدرس:** الفراغ ليس في «مقال آخر». الفراغ في: (1) أداة تعطي جواباً شخصياً فورياً، (2) سعر معلن، (3) عربية إماراتية صحيحة، (4) دليل موردين قابل للتصفح بالفئة.

---

## 4. توقعات واقعية للحجم
- حجم البحث الإماراتي للمواضيع العشرة الأولى مجتمعة: تقديري **بضعة آلاف بحث/شهر** (لا يمكن تأكيده دون GSC/Ads). التقاط 5–10% منها + استشهادات AI ⇒ **100–300 زائر مهتم/شهر** بعد 3–6 أشهر من نشر الصفحات.
- معايير الصناعة: أداة مجانية تحوّل 3–8% إلى بريد؛ صفحات قائمة التحقق 20–35%؛ طلب التدقيق 1–3% لكن نية عالية جداً.
- ⇒ **5–20 عميلاً محتملاً/شهر**. بسلّم 99–299 درهم + إحالة أو اثنتان شهرياً (500–1,000 درهم لكل إغلاق) ⇒ **1,000–4,000 درهم/شهر** تتراكم مع نمو الصفحات. هذا هو الواقع؛ «الأعداد الهائلة» تتطلب التوسع خارج الإمارات (المصدّرون) والخليج (السعودية أكبر بوضوح في العربية).

---

## 5. آلة توليد العملاء — التصميم
### 5.1 صفحات-أدوات مطابقة لكل عنقود (كل واحدة: نتيجة فورية → «أرسل لي التقرير PDF» بالبريد)
1. **موجّه البوابات (Portal Router):** «أي جهة تسجّل منتجي؟» Montaji / FIRS-ZAD / MoHAP-EDE / ADAFSA بحسب الفئة والإمارة → الرسوم الرسمية، المستندات، المدة. يخدم عنقود REGISTER و«montaji product registration» الصاعد.
2. **فاحص الشهادات:** «هل يحتاج منتجي ESMA/ECAS/EQM أو حلال؟ وكم يكلّف؟» (اكتب: «ESMA (now MoIAT)» لأن الناس ما زالوا يبحثون بالاسم القديم).
3. **فاحص الملصق** (موجود: السكانر) — أعد تسميته «Dubai Municipality label pre-check» ووجّه إليه من الصفحة الرئيسية (82% يهبطون على الرئيسية ولا يصلون إليه).
4. **HS code + حاسبة التكلفة الواصلة** (جمارك 5% + ضريبة انتقائية + VAT) — ميزة First FMCG؛ عنقود CUSTOMS.
5. **صفحات الموردين البرمجية** من الدليل: `/suppliers/{category}/{emirate}` (frozen food Dubai, dry food, HORECA, pet food, packaging…) — أكبر عنقود يمكن خدمته الآن بالبيانات الموجودة (الأسماء + الفئة + الإمارة). العميل هنا هو **المشتري** الذي يترك RFQ، حتى قبل إثراء بيانات اتصال الموردين. تُباع «قائمة موردين مختصرة موثقة» 49–149 درهم يدوياً إلى أن يكتمل الإثراء.
6. **أدلة المنتجات** `/products/{x}-uae` (القناة التي يستشهد بها ChatGPT) — دفعة للنوايا المقاسة: rice (India/Pakistan), perfume, honey, olive oil, coffee, chocolate, baby food, pet food, supplements, energy drinks, dates.
7. **الرخص/التأسيس** (78 عبارة، لا نبيعها): صفحة «كم تكلفة رخصة استيراد؟» + إحالة مدفوعة لشركات التأسيس (عمولة).

### 5.2 الالتقاط والرعاية
- نموذج البريد مع خانة موافقة صريحة (TDRA) → 3 رسائل رعاية (النتيجة، الأخطاء الشائعة، العرض) → CRM الموجود (provider_contacts/inbound).
- تخزين كل نتيجة أداة كـ lead بمصدرها (`source_tool`, `product_class`, `verdict`).

### 5.3 سلّم البيع (أسعار تجريبية غير مختبرة)
| المرحلة | المنتج | السعر |
|---|---|---|
| مجاني | نتيجة الأداة على الشاشة | 0 |
| ذاتي | تقرير PDF كامل (قائمة النواقص + مسار البوابة + المستندات) | 99 درهم |
| بشري | مراجعة 20 دقيقة + ملصق مصحح جاهز للطباعة (AFP) | 299 درهم |
| إحالة | تسجيل كامل عبر استشاري شريك | 10–20% من 3–10 آلاف |
| لاحقاً | «مراقبة اللوائح» لمنتجاتك | 49 درهم/شهر |

### 5.4 الظهور في محركات الإجابة (AEO)
- جُمل تقريرية بحقائق مؤرخة (الرسوم 10+220 درهم، المدد، 2026)، جداول، FAQ schema، تاريخ تحديث، استشهاد بالمصادر الحكومية (Perplexity لا يستشهد بغيرها).
- **Bing أولاً:** ChatGPT يقرأ فهرس Bing → أضف crate.ae إلى Bing Webmaster + IndexNow (المفتاح موجود في البيئة).
- ثنائية اللغة الصحيحة، وعناوين تحمل الأسماء التي يبحث بها الناس (Montaji, FIRS, ESMA/MoIAT, ZAD, MoHAP/EDE).
- خارج الموقع: فيديو YouTube قصير لكل أداة، إجابات في مجموعات التجار، LinkedIn.

---

## 6. خطة الأسبوع الأول (مقترح)
1. **موجّه البوابات + بريد PDF** (أداة واحدة، تعيد استخدام محرك الامتثال).
2. **صفحات الموردين البرمجية** (فئة × إمارة) من الدليل + RFQ.
3. **Bing Webmaster + IndexNow + GSC** (المالك يضيف الملكية؛ نعيد استخدام مزامنة GSC المبنية في AFP).
4. دفعة 10 أدلة منتجات للنوايا المقاسة.
5. الصفحة الرئيسية: زر واحد كبير → الفاحص.

## 7. ما لم نتحقق منه / حدود
- أحجام البحث الفعلية (يلزم GSC أو Google Ads Keyword Planner).
- الإكمال التلقائي يعكس ما يُكتب لا كم يُكتب.
- أسعار الاستشاريين مأخوذة من مقالات عامة (3–10 آلاف درهم شاملة المختبر) لا من عروض فعلية.
- Google Trends أعطى بيانات لاستعلام واحد فقط؛ الثاني لم يُحمّل (تقييد).

## المصادر الرئيسية
Shuraa product registration 2026 · Nextmove FIRS/Montaji guides · The Infinite Service · CorpBridge GSO 9:2022 · sijil.ae guides · Bing Copilot answer (filings.ae, unigardengroup) · Perplexity (dm.gov.ae Food Code, adafsa.gov.ae, u.ae) · Google Trends AE 12m · Google/Bing/DDG autocomplete (2026-09-24) · Crate page_views (إحالات) · مقالات معايير التحويل للأدوات المجانية (3–8%).
