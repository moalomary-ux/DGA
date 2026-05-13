-- ============================================================================
-- Migration 005: أنواع الخدمات + أنواع البرامج + المهام عبر البوابات
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. أنواع الخدمات الاستشارية (advice tenant) — ٣٠+ نوع
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(40) NOT NULL UNIQUE,
  name_ar         VARCHAR(255) NOT NULL,
  name_en         VARCHAR(255),
  category_group  VARCHAR(40) NOT NULL,
  description     TEXT,
  icon            VARCHAR(60),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  display_order   INT DEFAULT 100
);

INSERT INTO service_categories (code, name_ar, category_group, description) VALUES
-- مجموعة: الدراسات
('STUDY_RESEARCH',     'دراسة بحثية',                          'studies',       'دراسة علمية أكاديمية متعمّقة'),
('STUDY_SURVEY',       'دراسة استطلاعية',                      'studies',       'استطلاع آراء وتحليل بيانات ميدانية'),
('STUDY_BENCHMARK',    'دراسة مقارنة معيارية',                'studies',       'مقارنة الممارسات مع جهات رائدة'),
('STUDY_FEASIBILITY',  'دراسة جدوى',                            'studies',       'تقييم جدوى مشروع أو مبادرة'),
('STUDY_IMPACT',       'دراسة قياس أثر',                       'studies',       'قياس أثر سياسة أو برنامج'),
('STUDY_GAP',          'تحليل فجوات',                            'studies',       'تحديد الفجوات بين الواقع والمطلوب'),
('STUDY_MATURITY',     'تقييم نضج رقمي',                       'studies',       'قياس مستوى النضج الرقمي'),
('STUDY_TREND',        'دراسة اتجاهات',                          'studies',       'رصد وتحليل الاتجاهات الناشئة'),

-- مجموعة: الاستشارات
('CON_STRATEGIC',      'استشارة استراتيجية',                  'consulting',    'دعم اتخاذ قرارات استراتيجية'),
('CON_DIGITAL',        'استشارة تحوّل رقمي',                  'consulting',    'تخطيط وتنفيذ التحول الرقمي'),
('CON_TECHNICAL',      'استشارة تقنية',                          'consulting',    'استشارات في الحلول التقنية'),
('CON_DATA',           'استشارة بيانات وتحليلات',           'consulting',    'حوكمة وتحليل البيانات'),
('CON_AI',             'استشارة ذكاء اصطناعي',                'consulting',    'تبنّي وتطبيق AI'),
('CON_CYBER',          'استشارة أمن سيبراني',                  'consulting',    'تقييم وتعزيز الأمن'),
('CON_ARCH',           'استشارة معمارية مؤسسية',            'consulting',    'تصميم البنية المؤسسية'),
('CON_GOVERNANCE',     'استشارة حوكمة',                          'consulting',    'تطوير أطر الحوكمة'),
('CON_KPI',            'استشارة مؤشرات أداء',                'consulting',    'تصميم KPIs ومؤشرات قياس'),
('CON_PROCESS',        'إعادة هندسة الإجراءات',              'consulting',    'تحسين وهندسة الإجراءات'),

-- مجموعة: الخبراء المعرفيون
('EXPERT_PANEL',       'مشاركة في لجنة خبراء',                'expert',         'عضوية لجنة استشارية'),
('EXPERT_REVIEW',      'مراجعة مستقلة',                          'expert',         'مراجعة محايدة لمستندات أو أنظمة'),
('EXPERT_WORKSHOP',    'إدارة ورشة عمل تخصصية',              'expert',         'تيسير ورشة كخبير معرفي'),
('EXPERT_SPEAKER',     'متحدث ضيف في ندوة',                    'expert',         'إلقاء كلمة في فعالية'),
('EXPERT_TRAINING',    'تدريب تخصصي',                            'expert',         'تقديم محتوى تدريبي متقدم'),

-- مجموعة: تطوير الأنظمة
('SYS_REVIEW',         'مراجعة نظام',                              'systems',       'تقييم نظام قائم'),
('SYS_DESIGN',         'تصميم نظام',                                'systems',       'تصميم نظام جديد'),
('SYS_REQUIREMENTS',   'إعداد متطلبات نظام',                  'systems',       'وثيقة متطلبات تفصيلية'),
('SYS_RFP',            'إعداد كرّاسة الشروط (RFP)',         'systems',       'وثيقة طرح المنافسة'),
('SYS_AUDIT',          'تدقيق نظام',                                'systems',       'تدقيق فني/أمني للنظام'),

-- مجموعة: السياسات والأطر
('POL_FRAMEWORK',      'إطار سياسات',                              'policy',        'تطوير إطار حوكمة/سياسات'),
('POL_REGULATION',     'مراجعة لائحة تنظيمية',                'policy',        'مراجعة وتحديث اللوائح'),
('POL_GUIDE',          'إصدار دليل إرشادي',                    'policy',        'دليل تنفيذي للجهات'),
('POL_STANDARD',       'تطوير معيار',                              'policy',        'صياغة معايير وطنية')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE studies ADD COLUMN IF NOT EXISTS service_category_id INT REFERENCES service_categories(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. أنواع البرامج (qtech tenant) — صيغ التدريب
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS program_formats (
  id              SERIAL PRIMARY KEY,
  code            VARCHAR(40) NOT NULL UNIQUE,
  name_ar         VARCHAR(255) NOT NULL,
  description     TEXT,
  display_order   INT DEFAULT 100
);

INSERT INTO program_formats (code, name_ar, description) VALUES
('PROG_LOCAL',       'برنامج تدريبي محلي',                'برنامج تدريبي يُقدَّم داخل المملكة'),
('PROG_INTL',        'برنامج تدريبي دولي',                'برنامج بالشراكة مع جهة دولية'),
('WORKSHOP',         'ورشة عمل',                              'ورشة عمل تطبيقية قصيرة'),
('WEBINAR',          'ندوة افتراضية',                       'ندوة عن بُعد عبر منصات افتراضية'),
('SEMINAR',          'ندوة معرفية',                          'ندوة حضورية لتبادل المعرفة'),
('ONLINE_COURSE',    'برنامج أونلاين',                       'دورة كاملة أونلاين'),
('SKILLS_DEV',       'تطوير المهارات الرقمية',          'مسار تطوير مهارات متخصصة'),
('CERT_PROG',        'برنامج شهادة احترافية',             'برنامج يقود لشهادة معترف بها'),
('BOOTCAMP',         'معسكر تدريبي',                          'معسكر مكثّف عملي'),
('MENTORSHIP',       'برنامج إرشادي (Mentorship)',      'إرشاد فردي مع خبير')
ON CONFLICT (code) DO NOTHING;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS format_id INT REFERENCES program_formats(id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. المهام عبر البوابات (task assignments)
--    موظف من قدراتك يقدر يشارك في مهمة من الاستشارات والعكس
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_assignments (
  id            SERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_tenant VARCHAR(20) NOT NULL,         -- البوابة الأم للمهمة
  task_type     VARCHAR(20) NOT NULL,         -- program / study / consultation
  task_id       INT NOT NULL,                  -- ID في الجدول المرجعي
  role          VARCHAR(40),                   -- lead / contributor / reviewer / observer
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  assigned_by   UUID REFERENCES users(id),
  notes         TEXT,
  UNIQUE(user_id, source_tenant, task_type, task_id),
  CONSTRAINT ta_tenant_check CHECK (source_tenant IN ('qtech','advice','omary')),
  CONSTRAINT ta_type_check   CHECK (task_type IN ('program','study','consultation')),
  CONSTRAINT ta_role_check   CHECK (role IN ('lead','contributor','reviewer','observer','expert'))
);
CREATE INDEX IF NOT EXISTS ta_user_idx ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS ta_task_idx ON task_assignments(source_tenant, task_type, task_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. monday.com config per tenant
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monday_configs (
  tenant        VARCHAR(20) PRIMARY KEY,
  api_token     TEXT,                  -- مشفّر لاحقاً
  board_ids     TEXT[],                -- IDs البوردات المرتبطة
  is_active     BOOLEAN NOT NULL DEFAULT false,
  last_sync_at  TIMESTAMPTZ,
  CONSTRAINT mc_tenant_check CHECK (tenant IN ('qtech','advice','omary'))
);

INSERT INTO monday_configs (tenant, is_active) VALUES
  ('qtech',  false),
  ('advice', false),
  ('omary',  false)
ON CONFLICT (tenant) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ربط الدراسات الموجودة بأنواع الخدمات
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'CON_AI')        WHERE category = 'AI Strategy';
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'CON_DATA')      WHERE category = 'Data Governance';
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'STUDY_FEASIBILITY') WHERE category = 'HealthTech';
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'STUDY_MATURITY') WHERE category = 'Maturity Model';
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'STUDY_GAP')      WHERE category = 'Skills Strategy';
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'CON_AI')         WHERE category = 'AI Governance';
UPDATE studies SET service_category_id = (SELECT id FROM service_categories WHERE code = 'CON_DIGITAL')    WHERE category = 'Cloud Strategy';

-- ربط البرامج بصيغها
UPDATE programs SET format_id = (SELECT id FROM program_formats WHERE code = 'PROG_LOCAL')   WHERE scope = 'local'         AND duration_days >= 3 AND delivery_mode = 'in_person';
UPDATE programs SET format_id = (SELECT id FROM program_formats WHERE code = 'PROG_INTL')    WHERE scope = 'international';
UPDATE programs SET format_id = (SELECT id FROM program_formats WHERE code = 'WORKSHOP')     WHERE duration_days <= 1      AND duration_type = 'single_day';
UPDATE programs SET format_id = (SELECT id FROM program_formats WHERE code = 'WEBINAR')      WHERE delivery_mode = 'online' AND duration_days <= 1;
UPDATE programs SET format_id = (SELECT id FROM program_formats WHERE code = 'ONLINE_COURSE') WHERE delivery_mode = 'online' AND duration_days > 1;
UPDATE programs SET format_id = (SELECT id FROM program_formats WHERE code = 'SEMINAR')      WHERE format_id IS NULL AND category LIKE '%Leadership%';
