# منصة محمد العمري — رؤية المعمار

## الفكرة الأساسية (لا تتغيّر)

**SEOS = Sovereign Executive Operating System**: منصة تنفيذية شخصية مبنية حول:
- **Agents**: SAMI (Hermes Agent) + sub-agents متخصصة
- **AI Skills**: 240+ مهارة قابلة للتشغيل
- **Knowledge Graph**: ٢٤ جهة اتصال + سياق مؤسسي
- **Local-first**: كل البيانات على Mac mini + Hostinger VPS

البوابة هي *الواجهة* لهذه المنصة، مش بديل عنها.

## كيف نتعامل مع G-TMS

**نأخذ كأدوات داخل skills، لا كنظام منفصل**:
- خوارزمية match score (٤٠ تخصص + ٣٠ خبرة + ٣٠ مستوى) → كـ skill باسم `match_nominee_to_program`
- قوالب الإيميلات → كـ نظام قوالب يستخدمه email automation skills
- ضباط الاتصال + الجهات → جزء من Knowledge Graph الموجود

**ما لا نستنسخه**:
- نظام شهادات منفصل (نستخدم skills + Canva)
- Excel import مستقل (نستخدم claude code + skills)
- لوحة admin منفصلة لكل شي (لدينا workspace موحّد)

## الميزات الجوهرية الجديدة

| ميزة | الأولوية | الوضع |
|------|---------|------|
| التقويم الشهري الموحّد | عالية | جاري البناء |
| monday.com integration | عالية | skeleton + قابل للربط |
| قوالب الإيميلات (نظام عام) | متوسطة | جدول جاهز، UI لاحقاً |
| Email automation skills | متوسطة | يستخدم Hermes |
| نظام الترشيحات (داخل qtech) | منخفضة | اختياري |

## monday.com Integration

**الفكرة**: monday.com هو نظام إدارة المشاريع والمهام الرئيسي. منصة محمد تجلب منه:
- المهام المخصصة لكل عضو فريق
- المواعيد النهائية
- الحالات (todo / in progress / done)

ثم تعرضها في:
- التقويم الشهري (مدمجة مع events أخرى)
- لوحة الإدارة العامة `/work` (overdue alerts)
- Daily briefing (الصباحي عبر Telegram)

**التكوين**: `MONDAY_API_TOKEN` في `.env.local` + اختيار الـ board IDs المراد المزامنة منها.

## مبدأ التصميم

- **الجمال أولاً**: كل صفحة لها هوية بصرية واضحة، typography حذرة
- **السهولة**: ٣ نقرات كحد أقصى للوصول لأي ميزة
- **قابلية التطوير**: كل ميزة modular، schema قابل للتوسعة، بدون hardcoding
- **Local-first**: VPS كـ presentation layer، Mac mini كـ execution layer
