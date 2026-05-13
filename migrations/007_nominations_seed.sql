-- Migration 007: بيانات تجريبية للترشيحات

-- جهات حكومية
INSERT INTO government_entities (name_ar, name_en, email_domain, entity_type) VALUES
  ('وزارة الموارد البشرية',          'MHRSD',        'hrsd.gov.sa',     'ministry'),
  ('هيئة الأمن السيبراني',           'NCA',          'nca.gov.sa',      'authority'),
  ('سدايا',                          'SDAIA',        'sdaia.gov.sa',    'authority'),
  ('هيئة الاتصالات والفضاء',          'CST',          'cst.gov.sa',      'authority'),
  ('وزارة الصحة',                    'MOH',          'moh.gov.sa',      'ministry'),
  ('بلدية الرياض',                   'Riyadh Mun.',  'amana.gov.sa',    'municipality')
ON CONFLICT (email_domain) DO NOTHING;

-- ضباط الاتصال
INSERT INTO liaison_officers (entity_id, full_name, email, mobile, job_title) VALUES
  ((SELECT id FROM government_entities WHERE email_domain = 'hrsd.gov.sa'),     'أحمد المالكي',    'a.malki@hrsd.gov.sa',     '+966500000001', 'مدير التدريب'),
  ((SELECT id FROM government_entities WHERE email_domain = 'nca.gov.sa'),      'سارة العنزي',      's.anazi@nca.gov.sa',       '+966500000002', 'منسّقة برامج'),
  ((SELECT id FROM government_entities WHERE email_domain = 'sdaia.gov.sa'),    'فيصل الشهري',     'f.shahri@sdaia.gov.sa',    '+966500000003', 'رئيس قسم التطوير'),
  ((SELECT id FROM government_entities WHERE email_domain = 'cst.gov.sa'),      'لطيفة العتيبي',   'l.utaibi@cst.gov.sa',      '+966500000004', 'محللة موارد بشرية'),
  ((SELECT id FROM government_entities WHERE email_domain = 'moh.gov.sa'),      'عبدالعزيز الحربي','a.harbi@moh.gov.sa',       '+966500000005', 'مدير التطوير المهني')
ON CONFLICT (email) DO NOTHING;

-- مرشحون
INSERT INTO nominees (full_name_ar, email, mobile, job_title, specialization, years_of_experience, job_level, entity_id, liaison_officer_id) VALUES
  ('خالد بن مساعد',    'k.massad@hrsd.gov.sa',    '+966511111001', 'محلل بيانات',         'علم البيانات',        4,  'موظف',           (SELECT id FROM government_entities WHERE email_domain='hrsd.gov.sa'),  (SELECT id FROM liaison_officers WHERE email='a.malki@hrsd.gov.sa')),
  ('نورة الدوسري',     'n.dosari@hrsd.gov.sa',    '+966511111002', 'مدير منتج',           'تقنية المعلومات',     7,  'مدير',           (SELECT id FROM government_entities WHERE email_domain='hrsd.gov.sa'),  (SELECT id FROM liaison_officers WHERE email='a.malki@hrsd.gov.sa')),
  ('بدر الزهراني',     'b.zahrani@nca.gov.sa',    '+966511111003', 'مهندس أمن',           'الأمن السيبراني',     6,  'موظف',           (SELECT id FROM government_entities WHERE email_domain='nca.gov.sa'),   (SELECT id FROM liaison_officers WHERE email='s.anazi@nca.gov.sa')),
  ('ريم العتيبي',      'r.utaibi@sdaia.gov.sa',   '+966511111004', 'مهندسة AI',           'الذكاء الاصطناعي',   5,  'موظف',           (SELECT id FROM government_entities WHERE email_domain='sdaia.gov.sa'), (SELECT id FROM liaison_officers WHERE email='f.shahri@sdaia.gov.sa')),
  ('فهد الشمري',       'f.shamri@cst.gov.sa',     '+966511111005', 'محلل سياسات',         'السياسات الرقمية',   8,  'رئيس قسم',      (SELECT id FROM government_entities WHERE email_domain='cst.gov.sa'),   (SELECT id FROM liaison_officers WHERE email='l.utaibi@cst.gov.sa')),
  ('هند المطيري',      'h.mutairi@moh.gov.sa',    '+966511111006', 'مديرة تحوّل رقمي',   'الصحة الرقمية',       9,  'مدير',           (SELECT id FROM government_entities WHERE email_domain='moh.gov.sa'),   (SELECT id FROM liaison_officers WHERE email='a.harbi@moh.gov.sa')),
  ('عبدالله الحارثي',  'a.harthi@hrsd.gov.sa',    '+966511111007', 'مهندس برمجيات',      'هندسة البرمجيات',    3,  'موظف',           (SELECT id FROM government_entities WHERE email_domain='hrsd.gov.sa'),  (SELECT id FROM liaison_officers WHERE email='a.malki@hrsd.gov.sa')),
  ('مها العمري',       'm.amri@sdaia.gov.sa',     '+966511111008', 'باحثة بيانات',        'علم البيانات',        4,  'موظف',           (SELECT id FROM government_entities WHERE email_domain='sdaia.gov.sa'), (SELECT id FROM liaison_officers WHERE email='f.shahri@sdaia.gov.sa'))
ON CONFLICT (email) DO NOTHING;

-- ترشيحات (مع match scores متنوّعة)
INSERT INTO nominations (program_id, nominee_id, status, match_score, created_at)
SELECT
  p.id,
  nm.id,
  CASE
    WHEN random() < 0.4 THEN 'waiting'
    WHEN random() < 0.7 THEN 'accepted'
    ELSE 'rejected'
  END,
  20 + floor(random() * 80)::int,  -- score from 20-99
  NOW() - (random() * interval '30 days')
FROM programs p
CROSS JOIN nominees nm
WHERE p.status IN ('open','running','draft')
LIMIT 25
ON CONFLICT (program_id, nominee_id) DO NOTHING;

