// ════════════════════════════════════════════════════════════════
// MOCK DATA — بيانات تجريبية شاملة
// عدّل هذا الملف لتغيير البيانات الظاهرة في الموقع
// ════════════════════════════════════════════════════════════════

export const MOCK_STATS = {
  stats: {
    orgs_total: 396, orgs_active: 320,
    programs_total: 350, programs_online: 11,
    beneficiaries_total: 6824, beneficiaries_unique_emails: 5545,
    liaisons_total: 298, liaisons_linked: 287,
    total_seats: 7939, total_cost_sar: 16000000,
  },
  sectors: [
    { sector: 'التنمية العامة', orgs: 58, beneficiaries: 822 },
    { sector: 'الصحي', orgs: 42, beneficiaries: 792 },
    { sector: 'المؤسسات والمراكز التعليمية', orgs: 11, beneficiaries: 703 },
    { sector: 'الجامعات', orgs: 29, beneficiaries: 684 },
    { sector: 'الامني', orgs: 25, beneficiaries: 484 },
    { sector: 'الصناعي', orgs: 18, beneficiaries: 392 },
    { sector: 'التجاري', orgs: 22, beneficiaries: 317 },
    { sector: 'المالي', orgs: 13, beneficiaries: 309 },
    { sector: 'البلدي', orgs: 19, beneficiaries: 304 },
    { sector: 'الاتصالات', orgs: 8, beneficiaries: 245 },
  ],
  beneficiariesByYear: [
    { year: 2021, count: 179 },
    { year: 2022, count: 818 },
    { year: 2023, count: 1288 },
    { year: 2024, count: 1326 },
    { year: 2025, count: 2474 },
    { year: 2026, count: 747 },
  ],
  topOrgs: [
    { id: 1, name_ar: 'المؤسسة العامة للتدريب التقني والمهني', sector: 'المؤسسات والمراكز التعليمية', classification: 'التحسين', quota: 417, beneficiaries: 417, utilization_pct: 100 },
    { id: 2, name_ar: 'وزارة الصحة', sector: 'الصحي', classification: 'التكامل', quota: 192, beneficiaries: 192, utilization_pct: 100 },
    { id: 3, name_ar: 'وزارة المالية', sector: 'المالي', classification: 'التكامل', quota: 147, beneficiaries: 147, utilization_pct: 100 },
    { id: 4, name_ar: 'وزارة العدل', sector: 'العدل', classification: 'الإبداع', quota: 117, beneficiaries: 117, utilization_pct: 100 },
    { id: 5, name_ar: 'وزارة النقل والخدمات اللوجستية', sector: 'النقل', classification: 'الإبداع', quota: 115, beneficiaries: 115, utilization_pct: 100 },
    { id: 6, name_ar: 'هيئة الحكومة الرقمية', sector: 'الاتصالات', classification: 'التكامل', quota: 109, beneficiaries: 109, utilization_pct: 100 },
    { id: 7, name_ar: 'وزارة التعليم', sector: 'المؤسسات والمراكز التعليمية', classification: 'التحسين', quota: 95, beneficiaries: 95, utilization_pct: 100 },
    { id: 8, name_ar: 'صندوق تنمية الموارد البشرية', sector: 'العمل والتنمية الاجتماعية', classification: 'التكامل', quota: 84, beneficiaries: 84, utilization_pct: 100 },
    { id: 9, name_ar: 'وزارة الداخلية', sector: 'الامني', classification: 'التكامل', quota: 78, beneficiaries: 78, utilization_pct: 100 },
    { id: 10, name_ar: 'هيئة تقويم التعليم والتدريب', sector: 'المؤسسات والمراكز التعليمية', classification: 'التحسين', quota: 72, beneficiaries: 72, utilization_pct: 100 },
  ],
};

export const MOCK_ORGS = [
  { id: 1, name_ar: 'هيئة الحكومة الرقمية', email_domain: 'dga.gov.sa', sector: 'الاتصالات', classification: 'التكامل', total_quota_seats: 109, total_beneficiaries_count: 109, total_programs_count: 8, liaisons_count: 5, utilization_pct: 100, last_email_date: new Date().toISOString(), last_program_date: '2026-04-15', engagement_status: 'active', is_active: true },
  { id: 2, name_ar: 'وزارة الصحة', email_domain: 'moh.gov.sa', sector: 'الصحي', classification: 'التكامل', total_quota_seats: 192, total_beneficiaries_count: 192, total_programs_count: 12, liaisons_count: 8, utilization_pct: 100, last_email_date: '2026-04-20', last_program_date: '2026-03-30', engagement_status: 'active', is_active: true },
  { id: 3, name_ar: 'وزارة المالية', email_domain: 'mof.gov.sa', sector: 'المالي', classification: 'التكامل', total_quota_seats: 147, total_beneficiaries_count: 147, total_programs_count: 9, liaisons_count: 4, utilization_pct: 100, last_email_date: '2026-04-10', last_program_date: '2026-02-15', engagement_status: 'active', is_active: true },
  { id: 4, name_ar: 'وزارة العدل', email_domain: 'moj.gov.sa', sector: 'العدل', classification: 'الإبداع', total_quota_seats: 117, total_beneficiaries_count: 117, total_programs_count: 7, liaisons_count: 3, utilization_pct: 100, last_email_date: '2026-03-25', last_program_date: '2026-01-20', engagement_status: 'moderate', is_active: true },
  { id: 5, name_ar: 'وزارة النقل والخدمات اللوجستية', email_domain: 'mot.gov.sa', sector: 'النقل', classification: 'الإبداع', total_quota_seats: 115, total_beneficiaries_count: 115, total_programs_count: 6, liaisons_count: 4, utilization_pct: 100, last_email_date: '2026-04-05', last_program_date: '2026-03-10', engagement_status: 'active', is_active: true },
  { id: 6, name_ar: 'وزارة التعليم', email_domain: 'moe.gov.sa', sector: 'المؤسسات والمراكز التعليمية', classification: 'التحسين', total_quota_seats: 95, total_beneficiaries_count: 95, total_programs_count: 5, liaisons_count: 6, utilization_pct: 100, last_email_date: '2026-04-18', last_program_date: '2026-04-01', engagement_status: 'active', is_active: true },
  { id: 7, name_ar: 'وزارة الداخلية', email_domain: 'moi.gov.sa', sector: 'الامني', classification: 'التكامل', total_quota_seats: 78, total_beneficiaries_count: 78, total_programs_count: 4, liaisons_count: 2, utilization_pct: 100, last_email_date: '2026-02-10', last_program_date: '2025-12-15', engagement_status: 'inactive', is_active: true },
  { id: 8, name_ar: 'هيئة حقوق الإنسان', email_domain: 'hrc.gov.sa', sector: 'العدل', classification: 'الإبداع', total_quota_seats: 35, total_beneficiaries_count: 28, total_programs_count: 3, liaisons_count: 2, utilization_pct: 80, last_email_date: '2026-04-22', last_program_date: '2026-03-15', engagement_status: 'active', is_active: true },
  { id: 9, name_ar: 'صندوق تنمية الموارد البشرية', email_domain: 'hrdf.org.sa', sector: 'العمل والتنمية الاجتماعية', classification: 'التكامل', total_quota_seats: 84, total_beneficiaries_count: 84, total_programs_count: 5, liaisons_count: 3, utilization_pct: 100, last_email_date: '2026-03-30', last_program_date: '2026-02-20', engagement_status: 'moderate', is_active: true },
  { id: 10, name_ar: 'هيئة تقويم التعليم والتدريب', email_domain: 'etec.gov.sa', sector: 'المؤسسات والمراكز التعليمية', classification: 'التحسين', total_quota_seats: 72, total_beneficiaries_count: 72, total_programs_count: 4, liaisons_count: 3, utilization_pct: 100, last_email_date: '2026-04-08', last_program_date: '2026-03-25', engagement_status: 'active', is_active: true },
];

export const MOCK_PROGRAMS = [
  { id: 1, title: 'Google Cloud Innovation & AI Executives Enablement Program', type: 'برنامج دولي', year: 2026, country: 'بريطانيا', start_date: '2026-06-29', end_date: '2026-07-02', seats: 25, duration_hours: 32, actual_beneficiaries: 18, orgs_served: 8, status_timeline: 'upcoming', is_high_impact: true },
  { id: 2, title: 'Future Readiness: Government Process Reengineering', type: 'برنامج دولي', year: 2026, country: 'سنغافورة', start_date: '2026-06-08', end_date: '2026-06-12', seats: 30, duration_hours: 40, actual_beneficiaries: 28, orgs_served: 12, status_timeline: 'upcoming', is_high_impact: true },
  { id: 3, title: 'البرنامج التنفيذي للحكومة الرقمية - MDEP Cohort 7', type: 'برنامج محلي', year: 2026, country: 'الرياض', start_date: '2026-03-15', end_date: '2026-05-15', seats: 40, duration_hours: 120, actual_beneficiaries: 38, orgs_served: 22, status_timeline: 'completed', is_high_impact: true },
  { id: 4, title: 'برنامج قدراتك للقيادات الرقمية', type: 'ورشة', year: 2026, country: 'الرياض', start_date: '2026-04-01', end_date: '2026-04-03', seats: 25, duration_hours: 24, actual_beneficiaries: 22, orgs_served: 15, status_timeline: 'completed', is_high_impact: false },
  { id: 5, title: 'Digital Transformation Leadership - INSEAD', type: 'برنامج دولي', year: 2026, country: 'فرنسا', start_date: '2026-09-15', end_date: '2026-09-20', seats: 20, duration_hours: 40, actual_beneficiaries: 0, orgs_served: 0, status_timeline: 'upcoming', is_high_impact: true },
];

export const MOCK_INBOX = [
  { id: 1, from_addr: 'ahmed.alhamoud@alhasa.gov.sa', from_name: 'هيثم بن عبدالله أحمد الحمود', subject: 'حالة الترشيح للبرنامج الدولي "Google Cloud Innovation"', body_text: 'تحية طيبة\n\nبخصوص ترشيحنا للبرنامج الدولي "Google Cloud Innovation & AI Executives Enablement Program"، وذلك وفق الجدول أدناه:\n\nأسم المرشح: د. هيثم عبدالله الحمود\nالموقع: الوقت 1\n\nمن يوم الاثنين 29 يونيو 2026م إلى يوم الخميس 2 يوليو 2026م بريطانيا - لندن\n\nوفي حال ترشيحكم لمرشحين غير المذكورين أعلاه فإنه نعتذر عن قبولهم لمحدودية المقاعد، وفي حال حصول انسحابات من جهات أخرى وتوفر مقعد سوف يتم التواصل معكم في حينه.\n\nمع التحية\nهيثم الحمود', received_at: new Date().toISOString(), status: 'new', liaison_id: null, liaison_name: null, liaison_org_name: null, sender_type: 'beneficiary' },
  { id: 2, from_addr: 'malidga@dga.gov.sa', from_name: 'malidga', subject: 'Delivery delayed - دعوة للتسجيل في ورشة عمل', body_text: 'نعتذر عن التأخير في إرسال الدعوة. الورشة ستُعقد يوم الأحد القادم بمشيئة الله.\n\nالرابط للتسجيل سيُرسل قريباً.', received_at: '2026-05-12T14:30:00Z', status: 'read', liaison_id: 2, liaison_name: 'منى الإدريسي', liaison_org_name: 'هيئة الحكومة الرقمية', sender_type: 'liaison' },
  { id: 3, from_addr: 'walolayet@moh.gov.sa', from_name: 'بندر العولايت', subject: 'اشعار قبول في البرنامج التدريبي', body_text: 'نشكر لكم ترشيحنا للبرنامج التدريبي القادم.\n\nنود تأكيد قبول الترشيح للزملاء التالين:\n- د. عبدالله الفهد\n- أ. سارة المهيدب\n\nمع التحية\nبندر العولايت', received_at: '2026-05-11T09:15:00Z', status: 'replied', liaison_id: 3, liaison_name: 'بندر العولايت', liaison_org_name: 'وزارة الصحة', sender_type: 'liaison' },
  { id: 4, from_addr: 'employee@gmail.com', from_name: 'محمد الراشد', subject: 'استفسار عن البرامج التدريبية', body_text: 'السلام عليكم،\n\nأنا موظف في إحدى الجهات الحكومية، وأود الاستفسار عن إمكانية الالتحاق بأحد برامج قدراتك.\n\nهل يمكنكم توجيهي للمسار الصحيح؟\n\nشكراً جزيلاً', received_at: '2026-05-10T11:20:00Z', status: 'new', liaison_id: null, liaison_name: null, liaison_org_name: null, sender_type: 'external' },
  { id: 5, from_addr: 'tarfah@dga.gov.sa', from_name: 'طرفة الفالح', subject: 'حالة الترشيح للبرنامج الدولي - Digital Government', body_text: 'بخصوص الترشيح للبرنامج الدولي، نود تأكيد المرشحين النهائيين من الهيئة.\n\nسأرسل القائمة النهائية خلال يومين بإذن الله.', received_at: '2026-05-09T16:45:00Z', status: 'new', liaison_id: 4, liaison_name: 'طرفة الفالح', liaison_org_name: 'هيئة الحكومة الرقمية', sender_type: 'liaison' },
  { id: 6, from_addr: 'meshal@moe.gov.sa', from_name: 'مشعل الوحيد', subject: 'اشعار قبول للبرنامج التدريبي Human-Centricity and AI-2', body_text: 'يسرنا تأكيد قبول المرشحين التاليين للبرنامج:\n- د. عبدالعزيز السنيدي\n- أ. ليلى الحربي\n\nنرجو تأكيد الحضور قبل تاريخ 20 مايو 2026.\n\nشكراً', received_at: '2026-05-08T08:00:00Z', status: 'read', liaison_id: 6, liaison_name: 'مشعل الوحيد', liaison_org_name: 'وزارة التعليم', sender_type: 'liaison' },
  { id: 7, from_addr: 'lalmutairi@moh.gov.sa', from_name: 'لطيفة المطيري', subject: 'Visa Appointment Challenges - MDEP Cohort7', body_text: 'بخصوص تأشيرات السفر لبعض المرشحين، نواجه تأخراً في الحصول على المواعيد.\n\nنرجو التنسيق لإيجاد حل بديل لـ 3 مرشحين.', received_at: '2026-05-07T13:30:00Z', status: 'new', liaison_id: 7, liaison_name: 'لطيفة المطيري', liaison_org_name: 'وزارة الصحة', sender_type: 'liaison' },
  { id: 8, from_addr: 'aalqahtani@hrc.gov.sa', from_name: 'علي الحتيلة', subject: 'اعتذار عن الترشيح للبرنامج الدولي - Government Process Reengineering', body_text: 'تحية طيبة\n\nنعتذر عن إكمال المشاركة في البرنامج، نظراً للتوجيهات الصادرة مؤخراً لكافة الجهات، فقد تعذر علينا استكمال المشاركة في البرنامج.\n\nنأمل التكرم بقبول الاعتذار.\n\nمع التحية\nعلي الحتيلة\nهيئة حقوق الإنسان', received_at: '2026-05-06T10:15:00Z', status: 'read', liaison_id: 8, liaison_name: 'علي الحتيلة', liaison_org_name: 'هيئة حقوق الإنسان', sender_type: 'liaison' },
];

export const MOCK_LIAISONS = [
  { id: 1, name: 'أحمد المثال', title: 'مدير القدرات الرقمية', email: 'ahmed@dga.gov.sa', phone: '966500000001', liaison_group: 'G1', inbox_count: 12, last_email_at: new Date().toISOString(), org_id: 1, org_name: 'هيئة الحكومة الرقمية', org_sector: 'الاتصالات' },
  { id: 2, name: 'منى الإدريسي', title: 'مديرة المهارات الرقمية', email: 'mona@dga.gov.sa', phone: '966500000002', liaison_group: 'G1', inbox_count: 8, last_email_at: '2026-05-10', org_id: 1, org_name: 'هيئة الحكومة الرقمية', org_sector: 'الاتصالات' },
  { id: 3, name: 'بندر العولايت', title: 'منسق البرامج التدريبية', email: 'walolayet@moh.gov.sa', phone: '966500000003', liaison_group: 'G2', inbox_count: 15, last_email_at: '2026-05-11', org_id: 2, org_name: 'وزارة الصحة', org_sector: 'الصحي' },
  { id: 4, name: 'طرفة الفالح', title: 'مدير الموارد البشرية', email: 'tarfah@dga.gov.sa', phone: '966500000004', liaison_group: 'G1', inbox_count: 6, last_email_at: '2026-05-09', org_id: 1, org_name: 'هيئة الحكومة الرقمية', org_sector: 'الاتصالات' },
  { id: 5, name: 'سلطان الشهري', title: 'منسق الترشيحات', email: 'sultan@moj.gov.sa', phone: '966500000005', liaison_group: 'G3', inbox_count: 4, last_email_at: '2026-04-25', org_id: 4, org_name: 'وزارة العدل', org_sector: 'العدل' },
];

export const MOCK_BENEFICIARIES = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: ['عبدالله الفهد', 'سارة المهيدب', 'فهد الراشد', 'منى السبتي', 'محمد الحربي', 'نورة العثمان', 'خالد الزهراني', 'ريم البلوي'][i % 8] + ' ' + (i + 1),
  job_title: ['مدير عام', 'مدير إدارة', 'رئيس قسم', 'مستشار', 'محلل أعمال'][i % 5],
  email: `beneficiary${i + 1}@example.gov.sa`,
  phone: `9665${String(10000000 + i).padStart(8, '0')}`,
  gender: i % 3 === 0 ? 'أنثى' : 'ذكر',
  target_level: ['Experts', 'Managers', 'Awareness', 'High Level'][i % 4],
  year: [2024, 2025, 2026][i % 3],
  country: 'السعودية',
  org_id: (i % 10) + 1,
  org_name: MOCK_ORGS[i % 10].name_ar,
  org_sector: MOCK_ORGS[i % 10].sector,
  program_id: (i % 5) + 1,
  program_title: MOCK_PROGRAMS[i % 5].title,
  program_type: MOCK_PROGRAMS[i % 5].type,
}));

export const MOCK_USER = {
  id: 1, email: 'design@qtech.help', full_name: 'محمد العمري',
  role: 'super_admin', tenant: 'qtech', theme: 'dark',
};

export const MOCK_USERS = [
  { id: 1, email: 'mohammed@omary.cloud', full_name: 'محمد العمري', role: 'super_admin' },
  { id: 2, email: 'fawaz@dga.gov.sa', full_name: 'فواز العنزي', role: 'consulting_admin' },
  { id: 3, email: 'bushra@dga.gov.sa', full_name: 'بشرى القحطاني', role: 'training_admin' },
  { id: 4, email: 'tala@dga.gov.sa', full_name: 'تالا العريفي', role: 'editor' },
  { id: 5, email: 'abdullah@dga.gov.sa', full_name: 'عبدالله بن جديد', role: 'editor' },
];
