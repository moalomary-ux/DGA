-- ============================================================================
-- Migration 002: Tenant-specific modules (qtech + advice)
-- ============================================================================

-- ============================================================================
-- QTECH (Digital Skills) — البرامج التدريبية
-- ============================================================================

CREATE TABLE IF NOT EXISTS programs (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(40) NOT NULL UNIQUE,
  name_ar       VARCHAR(255) NOT NULL,
  name_en       VARCHAR(255),
  description   TEXT,
  category      VARCHAR(80),
  duration_days INT,
  capacity      INT,
  status        VARCHAR(20) NOT NULL DEFAULT 'draft',
  start_date    DATE,
  end_date      DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT programs_status_check CHECK (status IN ('draft','open','running','completed','cancelled'))
);
CREATE INDEX IF NOT EXISTS programs_status_idx ON programs(status);

CREATE TABLE IF NOT EXISTS trainees (
  id            SERIAL PRIMARY KEY,
  name_ar       VARCHAR(255) NOT NULL,
  email         VARCHAR(255),
  phone         VARCHAR(40),
  organization  VARCHAR(255),
  position      VARCHAR(255),
  level         VARCHAR(40),
  enrolled_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status        VARCHAR(20) NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS trainees_status_idx ON trainees(status);

CREATE TABLE IF NOT EXISTS enrollments (
  id          SERIAL PRIMARY KEY,
  trainee_id  INT NOT NULL REFERENCES trainees(id) ON DELETE CASCADE,
  program_id  INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'enrolled',
  progress    INT NOT NULL DEFAULT 0,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(trainee_id, program_id)
);

CREATE TABLE IF NOT EXISTS partners (
  id            SERIAL PRIMARY KEY,
  name_ar       VARCHAR(255) NOT NULL,
  name_en       VARCHAR(255),
  type          VARCHAR(40),
  logo_url      VARCHAR(500),
  website       VARCHAR(255),
  contact_name  VARCHAR(255),
  contact_email VARCHAR(255),
  status        VARCHAR(20) NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- ADVICE (Studies & Consulting) — الدراسات والاستشارات
-- ============================================================================

CREATE TABLE IF NOT EXISTS clients (
  id            SERIAL PRIMARY KEY,
  name_ar       VARCHAR(255) NOT NULL,
  name_en       VARCHAR(255),
  type          VARCHAR(40),
  contact_name  VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(40),
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS studies (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(40) UNIQUE,
  title_ar      VARCHAR(500) NOT NULL,
  title_en      VARCHAR(500),
  client_id     INT REFERENCES clients(id),
  category      VARCHAR(80),
  status        VARCHAR(20) NOT NULL DEFAULT 'draft',
  priority      VARCHAR(20) DEFAULT 'medium',
  lead_user_id  UUID REFERENCES users(id),
  start_date    DATE,
  due_date      DATE,
  delivered_at  TIMESTAMPTZ,
  abstract      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studies_status_check CHECK (status IN ('draft','in_progress','review','delivered','cancelled')),
  CONSTRAINT studies_priority_check CHECK (priority IN ('low','medium','high','critical'))
);
CREATE INDEX IF NOT EXISTS studies_status_idx ON studies(status);

CREATE TABLE IF NOT EXISTS consultations (
  id            SERIAL PRIMARY KEY,
  client_id     INT REFERENCES clients(id),
  topic         VARCHAR(500) NOT NULL,
  type          VARCHAR(40),
  status        VARCHAR(20) NOT NULL DEFAULT 'requested',
  requested_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  notes         TEXT
);

-- ============================================================================
-- OMARY — Personal workspace
-- ============================================================================

CREATE TABLE IF NOT EXISTS personal_notes (
  id          SERIAL PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category    VARCHAR(40) NOT NULL,
  title       VARCHAR(500) NOT NULL,
  content     TEXT,
  tags        TEXT[],
  pinned      BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pn_category_check CHECK (category IN ('note','goal','idea','reading','research'))
);
CREATE INDEX IF NOT EXISTS pn_user_idx ON personal_notes(user_id);
CREATE INDEX IF NOT EXISTS pn_category_idx ON personal_notes(category);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- QTech: 5 programs sample
INSERT INTO programs (code, name_ar, category, duration_days, capacity, status, start_date) VALUES
  ('QT-AI-001',     'الأساسيات في الذكاء الاصطناعي',          'AI',                30, 50, 'running',   '2026-04-01'),
  ('QT-DT-001',     'القيادة الرقمية للتنفيذيين',            'Leadership',        14, 30, 'open',      '2026-06-01'),
  ('QT-DATA-001',   'تحليل البيانات للحكومة',                'Data',              45, 40, 'running',   '2026-03-15'),
  ('QT-CYBER-001',  'الأمن السيبراني للموظفين',              'Cybersecurity',     21, 60, 'completed', '2026-02-01'),
  ('QT-CLOUD-001',  'الحوسبة السحابية وSaudi Cloud',         'Cloud',             30, 25, 'draft',     NULL)
ON CONFLICT (code) DO NOTHING;

-- QTech: trainees sample
INSERT INTO trainees (name_ar, email, organization, position, level, status) VALUES
  ('سعد العتيبي',    'saad@nca.gov.sa',     'هيئة الأمن السيبراني',    'مدير إدارة',        'intermediate', 'active'),
  ('نوف القحطاني',   'nouf@spl.gov.sa',     'مكتبة الملك فهد',          'محللة بيانات',      'beginner',     'active'),
  ('فهد الدوسري',    'fahad@hrsd.gov.sa',   'وزارة الموارد البشرية',    'مهندس برمجيات',     'advanced',     'active'),
  ('ريم العنزي',     'reem@sdaia.gov.sa',   'سدايا',                     'محللة أعمال',       'intermediate', 'active'),
  ('عبدالله الشهري', 'a.shahri@nic.gov.sa', 'المركز الوطني للمعلومات',  'مهندس شبكات',       'advanced',     'active'),
  ('ليلى المطيري',   'laila@digital.gov.sa','الحكومة الرقمية',           'مديرة مشروع',       'intermediate', 'active')
ON CONFLICT DO NOTHING;

-- QTech: partners
INSERT INTO partners (name_ar, name_en, type, status) VALUES
  ('سدايا',                        'SDAIA',          'government', 'active'),
  ('هيئة الأمن السيبراني',         'NCA',            'government', 'active'),
  ('وزارة الاتصالات',              'MCIT',           'government', 'active'),
  ('مايكروسوفت العربية',           'Microsoft',      'vendor',     'active'),
  ('AWS Saudi Arabia',             'AWS',            'vendor',     'active'),
  ('IBM السعودية',                 'IBM',            'vendor',     'active')
ON CONFLICT DO NOTHING;

-- Advice: clients sample
INSERT INTO clients (name_ar, name_en, type) VALUES
  ('وزارة الموارد البشرية',         'Ministry of HR',           'ministry'),
  ('هيئة الأمن السيبراني',          'NCA',                       'authority'),
  ('وزارة الصحة',                   'Ministry of Health',        'ministry'),
  ('سدايا',                          'SDAIA',                     'authority'),
  ('هيئة الاتصالات والفضاء',       'CST',                       'authority'),
  ('بلدية الرياض',                  'Riyadh Municipality',       'municipality')
ON CONFLICT DO NOTHING;

-- Advice: studies sample
INSERT INTO studies (code, title_ar, client_id, category, status, priority, due_date, abstract) VALUES
  ('STD-2026-01', 'تأثير الذكاء الاصطناعي على إنتاجية القطاع الحكومي', 1, 'AI Strategy',    'in_progress', 'high',     '2026-06-15', 'دراسة شاملة لأثر تبني الذكاء الاصطناعي على مؤشرات الإنتاجية في الجهات الحكومية السعودية'),
  ('STD-2026-02', 'إطار حوكمة البيانات في القطاع العام',                4, 'Data Governance', 'review',      'critical', '2026-05-30', 'تطوير إطار وطني لحوكمة البيانات يتوافق مع رؤية 2030'),
  ('STD-2026-03', 'الاستثمار الرقمي في الصحة الذكية',                    3, 'HealthTech',      'in_progress', 'high',     '2026-07-01', 'تقييم فرص الاستثمار في تقنيات الصحة الذكية'),
  ('STD-2026-04', 'مؤشر النضج الرقمي للجهات الحكومية',                   5, 'Maturity Model', 'delivered',   'medium',   '2026-03-20', 'مؤشر يقيس نضج التحول الرقمي في الجهات الحكومية'),
  ('STD-2026-05', 'الكفاءات الرقمية المطلوبة لـ 2030',                    1, 'Skills Strategy','draft',       'medium',   '2026-08-15', 'دراسة الكفاءات والمهارات الرقمية المطلوبة لتحقيق رؤية 2030')
ON CONFLICT (code) DO NOTHING;

-- Advice: consultations sample
INSERT INTO consultations (client_id, topic, type, status, scheduled_at) VALUES
  (1, 'استشارة حول هيكلة فريق التحول الرقمي',                'meeting',  'scheduled', '2026-05-12 10:00:00+03'),
  (2, 'مراجعة استراتيجية الأمن السيبراني للمواقع الحكومية',  'review',   'requested', NULL),
  (4, 'ورشة عمل: تطبيقات الذكاء الاصطناعي للحكومة',           'workshop', 'completed', '2026-04-20 09:00:00+03')
ON CONFLICT DO NOTHING;

