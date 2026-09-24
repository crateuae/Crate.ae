/**
 * LEGAL + TRUST DOCUMENTS (Privacy Policy, Terms & Conditions, About & Methodology).
 * One structure → both languages, rendered by src/components/legal/LegalDoc.tsx.
 *
 * Every statement about data handling below was checked against the code on 2026-09-25:
 * scanner photos are NOT stored; unsubscribe + suppression list exist; sign-in is Google or
 * email+password (Supabase Auth); browser storage keys are crate_vid and crate_lead; printed-label
 * orders are passed to the print partner Art for Printing. The legal entity name, licence number and
 * registered address are NOT stated because they are not recorded anywhere in the project — add them
 * in OPERATOR below when the owner provides them. These are drafts for a UAE lawyer to review.
 */
export type Bi = { en: string; ar: string }
export type Block = { p: Bi } | { ul: Bi[] }
export interface Section { id: string; h: Bi; blocks: Block[] }
export interface Doc { key: 'privacy' | 'terms' | 'about'; title: Bi; description: Bi; updated: string; intro: Bi; sections: Section[] }

export const UPDATED = '2026-09-25'
export const UPDATED_LABEL: Bi = { en: '25 September 2026', ar: '25 سبتمبر 2026' }
export const CONTACT = { email: 'uae@crate.ae', phone: '+971 54 300 0415', site: 'https://www.crate.ae' }

const p = (en: string, ar: string): Block => ({ p: { en, ar } })
const ul = (...items: [string, string][]): Block => ({ ul: items.map(([en, ar]) => ({ en, ar })) })

// ═════════════════════════════════ PRIVACY POLICY ═════════════════════════════════
export const PRIVACY: Doc = {
  key: 'privacy', updated: UPDATED,
  title: { en: 'Privacy Policy', ar: 'سياسة الخصوصية' },
  description: {
    en: `How Crate collects, uses and protects personal data on crate.ae — browsing analytics, quote requests, free tools and downloads, the label scanner, accounts and printed-label orders — and the choices you have.`,
    ar: `كيف تجمع Crate البيانات الشخصية وتستخدمها وتحميها على crate.ae — تحليلات التصفح، وطلبات عروض الأسعار، والأدوات المجانية والتنزيلات، وماسح الملصقات، والحسابات، وطلبات طباعة الملصقات — والخيارات المتاحة لك.`,
  },
  intro: {
    en: `Crate ("Crate", "we", "us") operates www.crate.ae, a platform of information and tools for import, trade and packaging in the United Arab Emirates. This policy explains which personal data we collect when you use it, why, who we share it with, and what you can do about it.`,
    ar: `تدير Crate («كريت»، «نحن») الموقع www.crate.ae، وهو منصة معلومات وأدوات للاستيراد والتجارة والتعبئة والتغليف في الإمارات العربية المتحدة. توضح هذه السياسة البيانات الشخصية التي نجمعها عند استخدامك للموقع، ولماذا نجمعها، ومع من نشاركها، وما الذي يمكنك فعله بشأنها.`,
  },
  sections: [
    { id: 'collect', h: { en: '1. What we collect', ar: '1. ما الذي نجمعه' }, blocks: [
      p(`We collect only what each feature needs:`, `نجمع فقط ما تحتاجه كل خاصية:`),
      ul(
        [`Browsing data — the pages you view, your language, the site you came from, device and browser details, and a random identifier stored in your browser (crate_vid). We use our own first-party counter and Google Analytics 4.`, `بيانات التصفح — الصفحات التي تزورها، ولغتك، والموقع الذي جئت منه، وتفاصيل الجهاز والمتصفح، ومعرّف عشوائي محفوظ في متصفحك (crate_vid). نستخدم عدّاداً خاصاً بنا وGoogle Analytics 4.`],
        [`Requests and quotes — when you ask for a quote or ask us to contact a company: your name, email, phone, company, the product and quantity, your message, and the page you came from.`, `الطلبات وعروض الأسعار — عند طلب عرض سعر أو أن نتواصل مع شركة نيابةً عنك: اسمك وبريدك وهاتفك وشركتك والمنتج والكمية ورسالتك والصفحة التي جئت منها.`],
        [`Free tools and downloads — when you print, save or download a result, or ask for it by email: your email (required), your name (optional), sometimes company and phone, the answers you gave the tool (for example product category and emirate), and whether you chose to receive updates. We remember your email in your browser (crate_lead) so we do not ask again.`, `الأدوات المجانية والتنزيلات — عند طباعة نتيجة أو حفظها أو تنزيلها أو طلبها بالبريد: بريدك (إلزامي) واسمك (اختياري) وأحياناً شركتك وهاتفك، وإجاباتك في الأداة (مثل فئة المنتج والإمارة)، وما إذا اخترت تلقي التحديثات. نتذكّر بريدك في متصفحك (crate_lead) كي لا نسألك مجدداً.`],
        [`Label scanner — the photo you take or upload is sent to AI and text-recognition services to read the text on it. We do not keep the photo. We keep the extracted text (product name, class, ingredients, label text) and the check result.`, `ماسح الملصقات — تُرسل الصورة التي تلتقطها أو ترفعها إلى خدمات ذكاء اصطناعي وتعرّف على النصوص لقراءة ما عليها. لا نحتفظ بالصورة. نحتفظ بالنص المستخرج (اسم المنتج والفئة والمكوّنات ونص الملصق) ونتيجة الفحص.`],
        [`Accounts — your email and name and how you sign in (Google, or email and password), handled through our authentication provider.`, `الحسابات — بريدك واسمك وطريقة تسجيل الدخول (Google أو البريد وكلمة المرور)، عبر مزوّد المصادقة لدينا.`],
        [`Printed-label orders — your name, email, phone, order details and any artwork you upload. These are passed to our print partner, Art for Printing, so it can quote, confirm and produce your order.`, `طلبات طباعة الملصقات — اسمك وبريدك وهاتفك وتفاصيل الطلب وأي تصميم ترفعه. تُمرَّر إلى شريك الطباعة لدينا Art for Printing ليسعّر طلبك ويؤكده وينفّذه.`],
        [`Partners — the business profile details you enter in the partner portal, some of which appear on your public partner page.`, `الشركاء — بيانات الملف التجاري التي تدخلها في بوابة الشركاء، ويظهر بعضها في صفحة الشريك العامة.`],
        [`Emails — we record delivery events (sent, bounced, unsubscribed) and replies to our emails.`, `الرسائل البريدية — نسجّل أحداث التسليم (أُرسلت، ارتدّت، أُلغي الاشتراك) والردود على رسائلنا.`],
        [`WhatsApp — if you tap the WhatsApp button, WhatsApp opens with a pre-written message. From then on WhatsApp's own privacy terms apply.`, `واتساب — إذا ضغطت زر واتساب يُفتح التطبيق برسالة جاهزة. ومن ثَمّ تسري شروط الخصوصية الخاصة بواتساب.`],
      ),
    ] },
    { id: 'registry', h: { en: '2. Business registry data', ar: '2. بيانات السجل التجاري' }, blocks: [
      p(`Our supplier and packaging-company directories are built from the public commercial registry of Dubai. They describe businesses (name, activity, licence category), not private individuals. For packaging companies we do not publish licence numbers or issue dates, and contact goes through Crate. If you represent a listed business and want a correction or removal, email us and we will review it.`,
        `تُبنى أدلة الموردين وشركات التغليف لدينا من السجل التجاري العام في دبي. وهي تصف منشآت (الاسم والنشاط وفئة الرخصة) لا أفراداً. ولا ننشر أرقام رخص شركات التغليف ولا تواريخ إصدارها، ويمرّ التواصل عبر Crate. إن كنت تمثّل منشأة مدرجة وتريد تصحيحاً أو حذفاً فراسلنا وسنراجع طلبك.`),
    ] },
    { id: 'use', h: { en: '3. Why we use it', ar: '3. لماذا نستخدمها' }, blocks: [
      ul(
        [`To provide the tools and results you ask for, and send them to you.`, `لتقديم الأدوات والنتائج التي تطلبها وإرسالها إليك.`],
        [`To handle your quote requests and pass them to the companies you asked us to contact.`, `للتعامل مع طلبات عروض الأسعار وتمريرها إلى الشركات التي طلبت أن نتواصل معها.`],
        [`To run, secure and improve the site, and to prevent abuse and spam.`, `لتشغيل الموقع وحمايته وتحسينه ومنع إساءة الاستخدام والرسائل المزعجة.`],
        [`To send updates only if you opted in (see section 8).`, `لإرسال التحديثات فقط إذا وافقت عليها (انظر البند 8).`],
        [`To meet legal obligations.`, `للوفاء بالالتزامات القانونية.`],
      ),
    ] },
    { id: 'cookies', h: { en: '4. Cookies and browser storage', ar: '4. ملفات الارتباط وتخزين المتصفح' }, blocks: [
      p(`Google Analytics sets cookies to measure how the site is used. Sign-in sets authentication cookies. Two items are kept in your browser's local storage: crate_vid (a random visitor identifier for our own counter) and crate_lead (the email and name you gave a download form, so we do not ask twice). You can block or clear cookies and local storage in your browser settings; parts of the site that need sign-in may then stop working.`,
        `يضع Google Analytics ملفات ارتباط لقياس استخدام الموقع، ويضع تسجيل الدخول ملفات ارتباط للمصادقة. ويُحفظ عنصران في التخزين المحلي لمتصفحك: crate_vid (معرّف زائر عشوائي لعدّادنا) وcrate_lead (البريد والاسم اللذان أدخلتهما في نموذج تنزيل كي لا نسألك مرتين). يمكنك حظر ملفات الارتباط والتخزين المحلي أو مسحها من إعدادات المتصفح، وقد تتوقف حينها أجزاء تتطلب تسجيل الدخول.`),
    ] },
    { id: 'share', h: { en: '5. Who we share it with', ar: '5. مع من نشاركها' }, blocks: [
      p(`We do not sell personal data. We share it only with:`, `لا نبيع البيانات الشخصية. نشاركها فقط مع:`),
      ul(
        [`Service providers that run the site: Vercel (hosting), Supabase (database and authentication), Resend (email), Google (Analytics and Google sign-in).`, `مزوّدي الخدمات الذين يشغّلون الموقع: Vercel (الاستضافة) وSupabase (قاعدة البيانات والمصادقة) وResend (البريد) وGoogle (التحليلات وتسجيل الدخول).`],
        [`AI and text-recognition providers used by the label scanner (Anthropic, and OCR.space as a fallback), for the photo you submit.`, `مزوّدي الذكاء الاصطناعي والتعرّف على النصوص في ماسح الملصقات (Anthropic، وOCR.space كبديل)، للصورة التي ترسلها.`],
        [`Art for Printing, our print partner, when you order printed labels.`, `Art for Printing، شريك الطباعة لدينا، عند طلب طباعة ملصقات.`],
        [`Companies you ask us to contact, to the extent needed for them to answer your request.`, `الشركات التي طلبت أن نتواصل معها، بالقدر اللازم لتردّ على طلبك.`],
        [`Authorities, when the law requires it.`, `الجهات المختصة عندما يوجب القانون ذلك.`],
      ),
    ] },
    { id: 'transfers', h: { en: '6. Where data is processed', ar: '6. أين تُعالَج البيانات' }, blocks: [
      p(`Some of our providers process data on servers outside the United Arab Emirates. We choose established providers and take reasonable steps to protect data wherever it is processed.`,
        `يعالج بعض مزوّدينا البيانات على خوادم خارج الإمارات العربية المتحدة. نختار مزوّدين معروفين ونتخذ خطوات معقولة لحماية البيانات أينما عُولجت.`),
    ] },
    { id: 'keep', h: { en: '7. How long we keep it, and security', ar: '7. مدة الاحتفاظ والأمان' }, blocks: [
      p(`We keep personal data only as long as needed for the purposes above or as the law requires, then delete or anonymise it. You can ask us to delete it sooner. We protect data with encrypted connections (HTTPS) and restricted access to our systems, but no online service can be guaranteed completely secure.`,
        `نحتفظ بالبيانات الشخصية فقط للمدة اللازمة للأغراض أعلاه أو وفق ما يوجبه القانون، ثم نحذفها أو نُجهّلها. ويمكنك أن تطلب حذفها مبكراً. نحمي البيانات باتصالات مشفّرة (HTTPS) وصلاحيات وصول مقيّدة إلى أنظمتنا، لكن لا يمكن ضمان أمان أي خدمة إلكترونية بالكامل.`),
    ] },
    { id: 'marketing', h: { en: '8. Marketing emails', ar: '8. الرسائل التسويقية' }, blocks: [
      p(`We send marketing emails only to people who opted in. Every marketing email has an unsubscribe link, and we keep a suppression list so that people who unsubscribed, bounced or complained are not emailed again. A quote request or a download on its own is not consent to marketing. The result or reply you asked for is a service message, not marketing.`,
        `لا نرسل رسائل تسويقية إلا لمن وافق عليها. تحمل كل رسالة تسويقية رابط إلغاء اشتراك، ونحتفظ بقائمة حظر كي لا نراسل من ألغى الاشتراك أو ارتدّت رسائله أو اشتكى. وطلب عرض السعر أو التنزيل وحده لا يُعدّ موافقة على التسويق. أما النتيجة أو الردّ الذي طلبته فهو رسالة خدمة لا تسويق.`),
    ] },
    { id: 'rights', h: { en: '9. Your rights', ar: '9. حقوقك' }, blocks: [
      p(`You can ask to access the personal data we hold about you, correct it, delete it, withdraw a consent you gave, or object to marketing. Email us at ${CONTACT.email} and we will respond within a reasonable time. We handle personal data in line with the UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data, to the extent it applies to us.`,
        `يمكنك أن تطلب الاطلاع على البيانات الشخصية التي نحتفظ بها عنك، أو تصحيحها، أو حذفها، أو سحب موافقة منحتها، أو الاعتراض على التسويق. راسلنا على ${CONTACT.email} وسنرد خلال مدة معقولة. نتعامل مع البيانات الشخصية وفق المرسوم بقانون اتحادي رقم 45 لسنة 2021 بشأن حماية البيانات الشخصية بالقدر الذي ينطبق علينا.`),
    ] },
    { id: 'children', h: { en: '10. Children', ar: '10. الأطفال' }, blocks: [
      p(`Crate is a business platform and is not directed to children. We do not knowingly collect their personal data.`, `Crate منصة أعمال وليست موجّهة للأطفال، ولا نجمع بياناتهم الشخصية عن علم.`),
    ] },
    { id: 'changes', h: { en: '11. Changes to this policy', ar: '11. تغييرات السياسة' }, blocks: [
      p(`We update this policy when our practices change and show the date at the top. Continued use after an update means you accept the updated policy.`, `نحدّث هذه السياسة عند تغيّر ممارساتنا ونعرض تاريخ التحديث في أعلاها. ويُعدّ استمرارك في الاستخدام بعد التحديث قبولاً للسياسة المحدّثة.`),
    ] },
  ],
}

// ═════════════════════════════════ TERMS & CONDITIONS ═════════════════════════════════
export const TERMS: Doc = {
  key: 'terms', updated: UPDATED,
  title: { en: 'Terms & Conditions', ar: 'الشروط والأحكام' },
  description: {
    en: `The terms for using crate.ae — an informational platform for import, trade and packaging in the UAE: what the tools and directories are and are not, how quote requests and label orders work, acceptable use, and liability.`,
    ar: `شروط استخدام crate.ae — منصة معلومات للاستيراد والتجارة والتعبئة والتغليف في الإمارات: ما هي الأدوات والأدلة وما ليست عليه، وكيف تعمل طلبات عروض الأسعار وطلبات الملصقات، والاستخدام المقبول، والمسؤولية.`,
  },
  intro: {
    en: `By using www.crate.ae (the "Site") you agree to these terms. If you do not agree, please do not use the Site.`,
    ar: `باستخدامك الموقع www.crate.ae («الموقع») فإنك توافق على هذه الشروط. وإن لم توافق فيرجى عدم استخدام الموقع.`,
  },
  sections: [
    { id: 'service', h: { en: '1. What Crate provides', ar: '1. ما تقدّمه Crate' }, blocks: [
      ul(
        [`Import: guides, a registration-route finder, a certificate checker, an HS-code and landed-cost calculator, a label pre-check and a nutrition-facts calculator.`, `الاستيراد: أدلة، وأداة تحديد مسار التسجيل، وفاحص الشهادات، وحاسبة رمز HS والتكلفة الواصلة، وفحص مسبق للملصق، وحاسبة الحقائق الغذائية.`],
        [`Trade: market opportunities, product pages and a directory of trading companies.`, `التجارة: فرص السوق وصفحات المنتجات ودليل شركات التجارة.`],
        [`Packaging: packing and repacking calculators and a directory of packaging companies.`, `التعبئة والتغليف: حاسبات التعبئة وإعادة التعبئة ودليل شركات التغليف.`],
        [`Quote requests, in which Crate passes your request to companies and relays their answers, and printed-label orders fulfilled by our partner.`, `طلبات عروض الأسعار، حيث تمرّر Crate طلبك إلى الشركات وتنقل ردودها، وطلبات طباعة الملصقات التي ينفّذها شريكنا.`],
      ),
    ] },
    { id: 'info', h: { en: '2. Information only — not legal or regulatory advice', ar: '2. معلومات فقط — وليست استشارة قانونية أو تنظيمية' }, blocks: [
      p(`Everything on the Site is general information to help you plan. It is not legal, customs, regulatory, tax or professional advice. Rules, fees and lists change, so each page shows the date it was last reviewed and its sources. Figures marked as reported by consultants are not official. The competent authority — for example the Ministry of Industry and Advanced Technology, Dubai Municipality, the Abu Dhabi Agriculture and Food Safety Authority, the Ministry of Climate Change and Environment, the Emirates Drug Establishment, the Federal Tax Authority or customs — is always the final reference, and you should confirm with it before you act.`,
        `كل ما في الموقع معلومات عامة تساعدك على التخطيط، وليس استشارة قانونية أو جمركية أو تنظيمية أو ضريبية أو مهنية. وتتغيّر القواعد والرسوم والقوائم، ولذلك تعرض كل صفحة تاريخ آخر مراجعة ومصادرها. والأرقام الموسومة بأنها منقولة عن الاستشاريين ليست رسمية. والجهة المختصة — مثل وزارة الصناعة والتكنولوجيا المتقدمة وبلدية دبي وهيئة أبوظبي للزراعة والسلامة الغذائية ووزارة التغير المناخي والبيئة ومؤسسة الإمارات للدواء والهيئة الاتحادية للضرائب والجمارك — هي المرجع النهائي دائماً، وعليك التأكد منها قبل اتخاذ أي إجراء.`),
      p(`Crate is independent. It is not part of, and is not endorsed by, any government authority.`, `Crate جهة مستقلة، وليست جزءاً من أي جهة حكومية ولا معتمدة منها.`),
    ] },
    { id: 'tools', h: { en: '3. Tool results and the label scanner', ar: '3. نتائج الأدوات وماسح الملصقات' }, blocks: [
      p(`Our checks apply fixed rules to the data you enter, so the same input gives the same result. A favourable result is not an approval or a guarantee that an authority will accept your product. The label scanner uses AI and text recognition to read a photo, which can make mistakes; always review what it extracted before relying on it.`,
        `تطبّق فحوصنا قواعد ثابتة على البيانات التي تدخلها، فيعطي المدخل نفسه النتيجة نفسها. والنتيجة الإيجابية ليست موافقة ولا ضماناً بأن جهة ما ستقبل منتجك. ويستخدم الماسح الذكاء الاصطناعي والتعرّف على النصوص لقراءة الصورة، وقد يخطئ؛ فراجع دائماً ما استخرجه قبل الاعتماد عليه.`),
    ] },
    { id: 'directories', h: { en: '4. Directories and quote requests', ar: '4. الأدلة وطلبات عروض الأسعار' }, blocks: [
      p(`Directory entries come from public registries and may be incomplete or out of date. Crate does not guarantee that a listed company is licensed, active, reliable or able to supply, and does not vet the quality of its goods or services. A quote request is not a purchase. Any agreement is between you and the company; Crate is an intermediary and is not a party to it. Verify licences and terms yourself before you commit.`,
        `تأتي مدخلات الأدلة من سجلات عامة وقد تكون ناقصة أو قديمة. ولا تضمن Crate أن الشركة المدرجة مرخّصة أو نشطة أو موثوقة أو قادرة على التوريد، ولا تفحص جودة سلعها أو خدماتها. وطلب عرض السعر ليس عملية شراء. وأي اتفاق يكون بينك وبين الشركة، وCrate وسيط وليست طرفاً فيه. تحقق بنفسك من التراخيص والشروط قبل الالتزام.`),
    ] },
    { id: 'orders', h: { en: '5. Printed-label orders', ar: '5. طلبات طباعة الملصقات' }, blocks: [
      p(`When you order printed labels, our partner Art for Printing prices the order, confirms the details with you and collects payment before production, as shown when you order. You are responsible for the accuracy and legality of the artwork and text you supply.`,
        `عند طلب طباعة ملصقات يسعّر شريكنا Art for Printing الطلب ويؤكد التفاصيل معك ويحصّل الدفع قبل الإنتاج، كما يظهر عند الطلب. وأنت مسؤول عن دقة التصميم والنصوص التي تقدّمها ومشروعيتها.`),
    ] },
    { id: 'accounts', h: { en: '6. Accounts and partners', ar: '6. الحسابات والشركاء' }, blocks: [
      p(`Give accurate information and keep your sign-in secure. Partners are responsible for the accuracy of their profile and public page. We may suspend an account that breaks these terms or harms the Site or other users.`,
        `قدّم معلومات دقيقة وحافظ على أمان دخولك. ويتحمل الشركاء مسؤولية دقة ملفهم وصفحتهم العامة. ويجوز لنا تعليق أي حساب يخالف هذه الشروط أو يضرّ بالموقع أو بمستخدمين آخرين.`),
    ] },
    { id: 'use', h: { en: '7. Acceptable use', ar: '7. الاستخدام المقبول' }, blocks: [
      ul(
        [`Do not use the Site for anything unlawful, or to send false, harmful or spam requests.`, `لا تستخدم الموقع لأي غرض غير مشروع، ولا لإرسال طلبات كاذبة أو ضارة أو مزعجة.`],
        [`Do not disrupt the Site, probe its security, or attempt to reverse-engineer it.`, `لا تعطّل الموقع ولا تختبر ثغراته الأمنية ولا تحاول هندسته عكسياً.`],
        [`Automated access must respect robots.txt and reasonable rate limits. Search engines and AI assistants may crawl the public pages listed in robots.txt.`, `يجب أن يحترم الوصول الآلي ملف robots.txt وحدوداً معقولة للطلبات. ويجوز لمحركات البحث ومساعدات الذكاء الاصطناعي زحف الصفحات العامة المسموح بها في robots.txt.`],
      ),
    ] },
    { id: 'ip', h: { en: '8. Intellectual property and citing us', ar: '8. الملكية الفكرية والاستشهاد بنا' }, blocks: [
      p(`The Site's text, tools, structure and design belong to Crate. You may quote short extracts and cite our figures with attribution to Crate and a link to the source page. Registry and third-party data remain the property of their sources. Content you submit stays yours, and you allow us to use it to run the service you asked for.`,
        `نصوص الموقع وأدواته وبنيته وتصميمه ملك لـCrate. ويجوز لك اقتباس مقتطفات قصيرة والاستشهاد بأرقامنا مع نسبتها إلى Crate ووضع رابط الصفحة المصدر. وتبقى بيانات السجلات والأطراف الثالثة ملكاً لمصادرها. والمحتوى الذي ترسله يبقى ملكك، وتأذن لنا باستخدامه لتشغيل الخدمة التي طلبتها.`),
    ] },
    { id: 'liability', h: { en: '9. Warranties and liability', ar: '9. الضمانات والمسؤولية' }, blocks: [
      p(`The Site is provided "as is" and "as available". To the extent the law allows, Crate is not liable for indirect or consequential loss — including rejected registrations, customs delays, penalties, lost profit or a supplier's failure to perform — arising from use of, or reliance on, the Site. Nothing in these terms excludes liability that cannot be excluded under UAE law.`,
        `يُقدَّم الموقع «كما هو» و«حسب توافره». وبالقدر الذي يسمح به القانون لا تتحمل Crate مسؤولية الخسائر غير المباشرة أو التبعية — ومنها رفض التسجيل وتأخر الإفراج الجمركي والغرامات وفوات الربح وإخلال المورّد — الناشئة عن استخدام الموقع أو الاعتماد عليه. ولا يستثني أي شيء في هذه الشروط مسؤولية لا يجوز استثناؤها بموجب القانون الإماراتي.`),
    ] },
    { id: 'changes', h: { en: '10. Changes and suspension', ar: '10. التغييرات والتعليق' }, blocks: [
      p(`We may change the Site or these terms and will show the date above. We may suspend or end access to protect the Site or if these terms are broken.`, `يجوز لنا تعديل الموقع أو هذه الشروط وسنعرض التاريخ في الأعلى. ويجوز لنا تعليق الوصول أو إنهاؤه لحماية الموقع أو عند مخالفة هذه الشروط.`),
    ] },
    { id: 'law', h: { en: '11. Governing law and language', ar: '11. القانون الحاكم واللغة' }, blocks: [
      p(`These terms are governed by the laws of the United Arab Emirates, and the competent courts of the UAE have jurisdiction. The Arabic and English texts are meant to have the same meaning; if they differ, the Arabic text prevails to the extent the law allows.`,
        `تخضع هذه الشروط لقوانين دولة الإمارات العربية المتحدة، وتختص بها المحاكم المختصة في الدولة. والنصان العربي والإنجليزي يُقصد بهما المعنى نفسه؛ وعند الاختلاف يُعتد بالنص العربي بالقدر الذي يسمح به القانون.`),
    ] },
  ],
}

// ═════════════════════════════════ ABOUT & METHODOLOGY ═════════════════════════════════
export const ABOUT: Doc = {
  key: 'about', updated: UPDATED,
  title: { en: 'About Crate and how we build our information', ar: 'عن Crate وكيف نبني معلوماتنا' },
  description: {
    en: `Crate is an independent UAE platform for import, trade and packaging information. How our guides and tools are built from official sources, how figures are dated and labelled, our data sources, and how to send a correction.`,
    ar: `Crate منصة إماراتية مستقلة لمعلومات الاستيراد والتجارة والتعبئة والتغليف. كيف تُبنى أدلتنا وأدواتنا من مصادر رسمية، وكيف نؤرّخ الأرقام ونصنّفها، ومصادر بياناتنا، وكيف ترسل تصحيحاً.`,
  },
  intro: {
    en: `Crate helps businesses import into, trade in and pack for the UAE market. We publish free tools and guides so a trader can see the registration route, certificates, duty and packaging options for a product before committing money.`,
    ar: `تساعد Crate المنشآت على الاستيراد إلى السوق الإماراتي والتجارة فيه والتعبئة له. ننشر أدوات وأدلة مجانية ليرى التاجر مسار التسجيل والشهادات والرسوم وخيارات التعبئة لمنتجه قبل أن يلتزم مالياً.`,
  },
  sections: [
    { id: 'what', h: { en: 'What Crate is — and is not', ar: 'ما هي Crate وما ليست عليه' }, blocks: [
      ul(
        [`Import — tools and guides for product registration, certificates, duty and labels.`, `الاستيراد — أدوات وأدلة لتسجيل المنتجات والشهادات والرسوم والملصقات.`],
        [`Trade — market opportunities, products and trading-company suppliers.`, `التجارة — فرص السوق والمنتجات والموردون من شركات التجارة.`],
        [`Packaging — packing and repacking calculators and packaging suppliers, factories and companies.`, `التعبئة والتغليف — حاسبات التعبئة وإعادة التعبئة وموردو ومصانع وشركات التغليف.`],
        [`Crate is independent. It is not a government body, is not endorsed by one, and does not give legal or customs advice.`, `Crate جهة مستقلة، وليست جهة حكومية ولا معتمدة من جهة حكومية، ولا تقدّم استشارات قانونية أو جمركية.`],
      ),
    ] },
    { id: 'methodology', h: { en: 'Methodology: how a guide or tool is built', ar: 'المنهجية: كيف يُبنى الدليل أو الأداة' }, blocks: [
      ul(
        [`Official first. Portals, fees, certificates and rules are taken from the authorities' own pages: Dubai Municipality (Montaji and FIRS), the Ministry of Industry and Advanced Technology (ECAS, EQM, halal), the Ministry of Climate Change and Environment (ZAD), the Abu Dhabi Agriculture and Food Safety Authority, the Emirates Drug Establishment, and the Federal Tax Authority (excise, Cabinet Decision 197/2025).`, `الرسمي أولاً. تُؤخذ البوابات والرسوم والشهادات والقواعد من صفحات الجهات نفسها: بلدية دبي (منتاجي وFIRS) ووزارة الصناعة والتكنولوجيا المتقدمة (ECAS وEQM والحلال) ووزارة التغير المناخي والبيئة (زاد) وهيئة أبوظبي للزراعة والسلامة الغذائية ومؤسسة الإمارات للدواء والهيئة الاتحادية للضرائب (الضريبة الانتقائية، قرار مجلس الوزراء 197/2025).`],
        [`Labelled by strength. Official figures are shown as official. Figures that come from consultants or certification bodies are labelled "reported". Where we could not confirm a rate, such as a customs exemption for an exact tariff line, we say "confirm the line" instead of guessing.`, `موسومة بقوة المصدر. تُعرض الأرقام الرسمية بوصفها رسمية. أما الأرقام المنقولة عن الاستشاريين أو جهات الاعتماد فتُوسم بـ«منقول». وحيث لم نتمكن من تأكيد نسبة، كإعفاء جمركي لبند تعرفة محدد، نقول «أكّد البند» بدل التخمين.`],
        [`Rules, not guesses. The checkers apply fixed rules, so the same input always gives the same result. AI is used only to read text from a label photo; the verdict comes from the rules.`, `قواعد لا تخمينات. تطبّق الفاحصات قواعد ثابتة فيعطي المدخل نفسه النتيجة نفسها. ويُستخدم الذكاء الاصطناعي فقط لقراءة نص صورة الملصق، أما الحكم فمن القواعد.`],
        [`Dated. Every guide and tool shows when it was last reviewed, and lists its sources.`, `مؤرَّخة. يعرض كل دليل وأداة تاريخ آخر مراجعة ويسرد مصادره.`],
        [`One source of truth. Import guides are generated from the same engines as the tools, so a guide cannot contradict a tool.`, `مصدر واحد للحقيقة. تُولَّد أدلة الاستيراد من المحركات نفسها التي تعمل بها الأدوات، فلا يمكن أن يناقض الدليل الأداة.`],
      ),
    ] },
    { id: 'data', h: { en: 'Our data sources', ar: 'مصادر بياناتنا' }, blocks: [
      ul(
        [`Directories: the public commercial registry of Dubai.`, `الأدلة: السجل التجاري العام في دبي.`],
        [`Market signals: public product listings on Noon, Amazon.ae, Carrefour and Lulu, and Google Trends.`, `إشارات السوق: قوائم المنتجات العامة في نون وأمازون.ae وكارفور ولولو، وGoogle Trends.`],
        [`Standards and fees: the authorities listed above, cited on each page.`, `المعايير والرسوم: الجهات المذكورة أعلاه، مع الاستشهاد بها في كل صفحة.`],
      ),
    ] },
    { id: 'corrections', h: { en: 'Corrections', ar: 'التصحيحات' }, blocks: [
      p(`Rules and fees change. If you find something out of date or wrong, email ${CONTACT.email} with the page link and, if you can, the official source. We review it and update the page and its review date. Businesses listed in our directories can ask for a correction or removal the same way.`,
        `تتغيّر القواعد والرسوم. إن وجدت ما هو قديم أو خاطئ فراسل ${CONTACT.email} مع رابط الصفحة، ومع المصدر الرسمي إن أمكن. سنراجعه ونحدّث الصفحة وتاريخ مراجعتها. ويمكن للمنشآت المدرجة في أدلتنا طلب التصحيح أو الحذف بالطريقة نفسها.`),
    ] },
    { id: 'machine', h: { en: 'For search engines and AI assistants', ar: 'لمحركات البحث ومساعدات الذكاء الاصطناعي' }, blocks: [
      p(`Our public pages are open to search and AI crawlers. A machine-readable summary is at /llms.txt and a fuller fact sheet at /llms-full.txt; the sitemap is at /sitemap.xml and an RSS feed at /rss.xml. You are welcome to cite our pages with attribution and a link.`,
        `صفحاتنا العامة مفتوحة لزواحف البحث والذكاء الاصطناعي. ملخص مقروء آلياً في /llms.txt وورقة حقائق أوسع في /llms-full.txt، وخريطة الموقع في /sitemap.xml وموجز RSS في /rss.xml. ويسعدنا أن تستشهد بصفحاتنا مع النسبة إلينا ووضع رابط.`),
    ] },
  ],
}

export const DOCS = { privacy: PRIVACY, terms: TERMS, about: ABOUT } as const
