-- ============================================================================
-- Migration 010: توسعة بيانات المتدربين + seed إضافي للديمو
-- ============================================================================

ALTER TABLE trainees ADD COLUMN IF NOT EXISTS gender VARCHAR(10);
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS nationality VARCHAR(40);
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS leadership_role VARCHAR(40);
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS organization_name VARCHAR(255);
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS sector VARCHAR(40);
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS region VARCHAR(40);
ALTER TABLE trainees ADD COLUMN IF NOT EXISTS specialization VARCHAR(100);

-- بيانات تجريبية إضافية للديمو
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM trainees) < 30 THEN
    INSERT INTO trainees (full_name, email, mobile, status, gender, nationality, leadership_role, organization_name, sector, region, specialization)
    VALUES
      ('عبدالرحمن السديري', 'a.suderi@hrsd.gov.sa',  '+966512000001', 'active',    'male',   'saudi', 'middle_manager', 'وزارة الموارد البشرية', 'ministry',     'riyadh',  'الموارد البشرية'),
      ('منى الشهري',         'm.shahri@sdaia.gov.sa',  '+966512000002', 'active',    'female', 'saudi', 'expert',         'سدايا',                    'authority',    'riyadh',  'الذكاء الاصطناعي'),
      ('تركي البشيري',       't.bashri@nca.gov.sa',    '+966512000003', 'active',    'male',   'saudi', 'technical_lead', 'هيئة الأمن السيبراني',   'authority',    'riyadh',  'الأمن السيبراني'),
      ('لمى العنزي',          'l.anazi@cst.gov.sa',     '+966512000004', 'active',    'female', 'saudi', 'middle_manager', 'هيئة الاتصالات',          'authority',    'riyadh',  'تنظيم'),
      ('سعد الغامدي',         's.ghamdi@moh.gov.sa',    '+966512000005', 'completed', 'male',   'saudi', 'senior_manager', 'وزارة الصحة',              'ministry',     'jeddah',  'الصحة الرقمية'),
      ('روان الجهني',         'r.jhani@hrsd.gov.sa',    '+966512000006', 'active',    'female', 'saudi', 'expert',         'وزارة الموارد البشرية', 'ministry',     'riyadh',  'علم البيانات'),
      ('ماجد الدوسري',        'm.dosari@sdaia.gov.sa',  '+966512000007', 'active',    'male',   'saudi', 'technical_lead', 'سدايا',                    'authority',    'riyadh',  'البنية السحابية'),
      ('شيخة المالك',         'sh.malik@cst.gov.sa',    '+966512000008', 'completed', 'female', 'saudi', 'middle_manager', 'هيئة الاتصالات',          'authority',    'riyadh',  'سياسات رقمية'),
      ('فهد الزهراني',        'f.zahrani@amana.gov.sa', '+966512000009', 'active',    'male',   'saudi', 'none',           'بلدية الرياض',            'municipality', 'riyadh',  'تطوير برمجيات'),
      ('بشاير الهاجري',       'b.hajri@moh.gov.sa',     '+966512000010', 'active',    'female', 'saudi', 'expert',         'وزارة الصحة',              'ministry',     'eastern', 'صحة عامة'),
      ('سلطان النفيعي',       's.nafi@nca.gov.sa',      '+966512000011', 'completed', 'male',   'saudi', 'technical_lead', 'هيئة الأمن السيبراني',   'authority',    'riyadh',  'أمن المعلومات'),
      ('أمل الشمري',          'a.shamri@hrsd.gov.sa',   '+966512000012', 'active',    'female', 'saudi', 'middle_manager', 'وزارة الموارد البشرية', 'ministry',     'qassim',  'تحوّل رقمي')
    ON CONFLICT (email) DO NOTHING;
  END IF;
END $$;

-- توسعة الشركاء بأمثلة
-- ✅ التصحيح: الأعمدة هي name_ar (لا name) و contact_email (لا email)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM partners) < 8 THEN
    INSERT INTO partners (name_ar, name_en, contact_email, status, partnership_type, scope, country, website, topics_areas, technical_areas)
    VALUES
      ('MIT Sloan Executive Education',   'MIT Sloan',                'partnerships@mit.edu',          'active', 'paid_partnership', 'international', 'USA',       'https://mitsloan.mit.edu',  ARRAY['Leadership','AI Strategy','Innovation'], ARRAY['AI','Machine Learning']),
      ('Columbia Business School',        'Columbia Business School', 'exec@gsb.columbia.edu',         'active', 'paid_partnership', 'international', 'USA',       'https://gsb.columbia.edu',  ARRAY['Strategy','Digital Transformation'],     ARRAY['Strategy','Operations']),
      ('National University of Singapore','NUS',                       'nus@partnerships.nus.edu.sg',  'active', 'university',       'international', 'Singapore', 'https://nus.edu.sg',         ARRAY['Public Policy','Smart Cities'],          ARRAY['IoT','Smart Infrastructure']),
      ('UCL Institute',                   'UCL',                       'ucl-info@dga.gov.sa',          'active', 'university',       'international', 'UK',        'https://ucl.ac.uk',          ARRAY['Data Governance','Public Sector'],       ARRAY['Data Engineering','Governance']),
      ('Coursera Government',             'Coursera Gov',              'gov@coursera.org',             'active', 'paid_partnership', 'international', 'USA',       'https://coursera.org/government', ARRAY['Online Learning','Skills Tracking'], ARRAY['MOOC','Analytics']),
      ('جامعة الملك سعود',                 'King Saud University',     'partnerships@ksu.edu.sa',      'active', 'university',       'local',         'SA',        'https://ksu.edu.sa',         ARRAY['تدريب فني','أبحاث تطبيقية'],          ARRAY['الذكاء الاصطناعي','الأمن السيبراني']),
      ('معهد الإدارة العامة',              'IPA',                       'partnerships@ipa.edu.sa',      'active', 'free',             'local',         'SA',        'https://ipa.edu.sa',         ARRAY['تدريب قيادي','تطوير مهني'],            ARRAY['الإدارة','الموارد البشرية']),
      ('شركة سيسكو السعودية',              'Cisco Saudi Arabia',       'sa@cisco.com',                 'active', 'sponsored',        'local',         'SA',        'https://cisco.com/sa',       ARRAY['شبكات','أمن'],                          ARRAY['Networking','Security']);
  END IF;
END $$;
