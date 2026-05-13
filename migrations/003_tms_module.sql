-- ============================================================================
-- Migration 003: نظام إدارة الترشيحات (مستلهم من G-TMS)
-- يضيف: ضباط الاتصال، معايير القبول، الترشيحات، الشهادات، قوالب الإيميلات
-- ============================================================================

-- ============================================================================
-- 1. الجهات الحكومية المستهدفة (للترشيحات)
--    ملاحظة: clients جدول موجود، هذا extension للجهات اللي ترشّح أشخاص
-- ============================================================================
CREATE TABLE IF NOT EXISTS government_entities (
  id              SERIAL PRIMARY KEY,
  name_ar         VARCHAR(255) NOT NULL,
  name_en         VARCHAR(255),
  email_domain    VARCHAR(100) NOT NULL UNIQUE, -- مثال: moe.gov.sa للربط التلقائي
  entity_type     VARCHAR(40),                  -- ministry / authority / institution
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ge_type_check CHECK (entity_type IN ('ministry','authority','institution','municipality'))
);
CREATE INDEX IF NOT EXISTS ge_email_domain_idx ON government_entities(email_domain);

-- ============================================================================
-- 2. ضباط الاتصال (الشخص المسؤول عن الترشيح في كل جهة)
-- ============================================================================
CREATE TABLE IF NOT EXISTS liaison_officers (
  id              SERIAL PRIMARY KEY,
  entity_id       INT NOT NULL REFERENCES government_entities(id) ON DELETE CASCADE,
  full_name       VARCHAR(255) NOT NULL,
  email           VARCHAR(320) NOT NULL UNIQUE,
  mobile          VARCHAR(40),
  job_title       VARCHAR(255),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS lo_entity_idx ON liaison_officers(entity_id);

-- ============================================================================
-- 3. معايير قبول البرامج (extends الجدول الموجود `programs`)
-- ============================================================================
CREATE TABLE IF NOT EXISTS program_criteria (
  id                          SERIAL PRIMARY KEY,
  program_id                  INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE UNIQUE,
  required_specializations    TEXT[],     -- مثال: {'تقنية المعلومات','الذكاء الاصطناعي'}
  min_experience_years        INT,
  max_experience_years        INT,
  required_job_levels         TEXT[],     -- مثال: {'مدير','رئيس قسم'}
  targeted_entity_ids         INT[],      -- IDs من government_entities
  additional_requirements     TEXT,
  training_hours              INT,
  classification              VARCHAR(40), -- specialized / leadership
  CONSTRAINT pc_classif_check CHECK (classification IN ('specialized','leadership','technical','executive'))
);

-- ============================================================================
-- 4. المرشحون (الأشخاص اللي يتم ترشيحهم)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nominees (
  id                  SERIAL PRIMARY KEY,
  full_name_ar        VARCHAR(255) NOT NULL,
  full_name_en        VARCHAR(255),
  national_id         VARCHAR(20) UNIQUE,
  email               VARCHAR(320) NOT NULL UNIQUE,
  mobile              VARCHAR(40),
  job_title           VARCHAR(255),
  specialization      VARCHAR(255),
  years_of_experience INT,
  job_level           VARCHAR(100),
  entity_id           INT REFERENCES government_entities(id),
  liaison_officer_id  INT REFERENCES liaison_officers(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS nominees_entity_idx ON nominees(entity_id);

-- ============================================================================
-- 5. الترشيحات (program × nominee مع match score)
-- ============================================================================
CREATE TABLE IF NOT EXISTS nominations (
  id                  SERIAL PRIMARY KEY,
  program_id          INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  nominee_id          INT NOT NULL REFERENCES nominees(id) ON DELETE CASCADE,
  status              VARCHAR(30) NOT NULL DEFAULT 'waiting',
  match_score         INT,                        -- 0-100
  rejection_reason    VARCHAR(50),
  rejection_note      TEXT,
  confirmed_at        TIMESTAMPTZ,
  attendance_status   VARCHAR(20),                -- attended / absent
  reviewed_by         UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(program_id, nominee_id),
  CONSTRAINT nom_status_check CHECK (status IN ('waiting','accepted','rejected','confirmed','withdrawn','attended','absent','certified')),
  CONSTRAINT nom_reject_check CHECK (rejection_reason IS NULL OR rejection_reason IN (
    'specialization_mismatch','experience_below','experience_above','job_level_mismatch',
    'entity_not_targeted','duplicate_program','seats_full','incomplete_data','other'
  ))
);
CREATE INDEX IF NOT EXISTS nom_status_idx   ON nominations(status);
CREATE INDEX IF NOT EXISTS nom_program_idx  ON nominations(program_id);

-- ============================================================================
-- 6. الشهادات
-- ============================================================================
CREATE TABLE IF NOT EXISTS certificates (
  id                  SERIAL PRIMARY KEY,
  nomination_id       INT NOT NULL REFERENCES nominations(id) ON DELETE CASCADE,
  certificate_number  VARCHAR(100) NOT NULL UNIQUE,
  certificate_type    VARCHAR(40) NOT NULL,
  issue_date          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  qr_code             TEXT,
  verification_url    VARCHAR(500),
  pdf_url             VARCHAR(500),
  CONSTRAINT cert_type_check CHECK (certificate_type IN ('training_program','workshop','attendance'))
);

-- ============================================================================
-- 7. قوالب الإيميلات
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id              SERIAL PRIMARY KEY,
  template_name   VARCHAR(255) NOT NULL UNIQUE,
  template_type   VARCHAR(60) NOT NULL,
  subject         VARCHAR(500) NOT NULL,
  body_html       TEXT NOT NULL,
  variables       TEXT[],         -- {nominee_name, program_name, ...}
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT et_type_check CHECK (template_type IN (
    'monthly_programs_announcement',
    'acceptance_notification',
    'rejection_notification',
    'mid_month_summary',
    'certificate_issued',
    'attendance_reminder'
  ))
);

-- ============================================================================
-- SEED — قوالب إيميلات افتراضية (3 الأهم)
-- ============================================================================
INSERT INTO email_templates (template_name, template_type, subject, body_html, variables) VALUES
(
  'إعلان البرامج الشهرية',
  'monthly_programs_announcement',
  '[قدراتك] برامج شهر {{month}} — {{program_count}} برنامج جديد',
  '<div dir="rtl"><h2>السلام عليكم {{officer_name}}،</h2><p>يسرّنا إطلاعكم على برامج شهر <strong>{{month}}</strong>:</p>{{programs_list}}<p>للترشيح، يرجى الدخول على البوابة قبل {{deadline}}.</p></div>',
  ARRAY['officer_name','month','program_count','programs_list','deadline']
),
(
  'إشعار قبول ترشيح',
  'acceptance_notification',
  '[قدراتك] تم قبول ترشيحكم لبرنامج {{program_name}}',
  '<div dir="rtl"><h2>عزيزي {{nominee_name}}،</h2><p>نهنّئكم بقبول ترشيحكم لبرنامج <strong>{{program_name}}</strong>.</p><p>تاريخ البداية: {{start_date}}<br>الموقع: {{location}}</p></div>',
  ARRAY['nominee_name','program_name','start_date','location']
),
(
  'إشعار رفض ترشيح',
  'rejection_notification',
  '[قدراتك] حالة ترشيحكم لبرنامج {{program_name}}',
  '<div dir="rtl"><h2>عزيزي {{nominee_name}}،</h2><p>نأسف لإعلامكم بأن ترشيحكم لبرنامج <strong>{{program_name}}</strong> لم يتم قبوله.</p><p>السبب: {{rejection_reason}}</p></div>',
  ARRAY['nominee_name','program_name','rejection_reason']
)
ON CONFLICT (template_name) DO NOTHING;
