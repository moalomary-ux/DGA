-- ============================================================================
-- Migration 008: امتدادات البرنامج (نقاش + مراحل + ترشيحات للجهات + sessions + sectors)
-- ============================================================================

-- (1) قطاعات الجهات الحكومية + جنسية المتدرب + بيانات تفصيلية
ALTER TABLE government_entities ADD COLUMN IF NOT EXISTS sector VARCHAR(40);  -- ministry/authority/municipality/court/other
ALTER TABLE government_entities ADD COLUMN IF NOT EXISTS region VARCHAR(40);  -- riyadh/makkah/eastern/...

ALTER TABLE nominees ADD COLUMN IF NOT EXISTS gender VARCHAR(10);             -- male/female
ALTER TABLE nominees ADD COLUMN IF NOT EXISTS nationality VARCHAR(40);        -- saudi/non_saudi
ALTER TABLE nominees ADD COLUMN IF NOT EXISTS age_group VARCHAR(20);          -- under_30/30_40/40_50/over_50
ALTER TABLE nominees ADD COLUMN IF NOT EXISTS education_level VARCHAR(40);
ALTER TABLE nominees ADD COLUMN IF NOT EXISTS leadership_role VARCHAR(40);    -- expert/technical_lead/middle_manager/senior_manager/none

-- (2) جلسات/مراحل البرنامج (مثلاً: تخطيط → ترشيح → تنفيذ → إقفال)
CREATE TABLE IF NOT EXISTS program_stages (
  id           SERIAL PRIMARY KEY,
  program_id   INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  stage_code   VARCHAR(40) NOT NULL,
  stage_label  VARCHAR(100) NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/active/done
  order_index  INT NOT NULL DEFAULT 0,
  started_at   TIMESTAMPTZ,
  finished_at  TIMESTAMPTZ,
  notes        TEXT,
  CONSTRAINT ps_status_check CHECK (status IN ('pending','active','done','blocked'))
);
CREATE INDEX IF NOT EXISTS ps_program_idx ON program_stages(program_id, order_index);

-- (3) سجل تغيير المراحل (audit trail)
CREATE TABLE IF NOT EXISTS program_stage_history (
  id           SERIAL PRIMARY KEY,
  program_id   INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  from_stage   VARCHAR(40),
  to_stage     VARCHAR(40) NOT NULL,
  changed_by   UUID REFERENCES users(id),
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note         TEXT
);
CREATE INDEX IF NOT EXISTS psh_program_idx ON program_stage_history(program_id, changed_at DESC);

-- (4) النقاشات والتعليقات على مستوى البرنامج (مثل to-do)
CREATE TABLE IF NOT EXISTS program_comments (
  id           SERIAL PRIMARY KEY,
  program_id   INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id),
  author_name  VARCHAR(255),
  body         TEXT NOT NULL,
  comment_type VARCHAR(20) NOT NULL DEFAULT 'note',  -- note/update/alert/blocker/decision
  parent_id    INT REFERENCES program_comments(id) ON DELETE CASCADE,
  is_pinned    BOOLEAN NOT NULL DEFAULT false,
  is_resolved  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT pc_type_check CHECK (comment_type IN ('note','update','alert','blocker','decision','question'))
);
CREATE INDEX IF NOT EXISTS pc_program_idx ON program_comments(program_id, created_at DESC);

-- (5) سجل النشاط العام (timeline) للبرنامج
CREATE TABLE IF NOT EXISTS program_activity (
  id           SERIAL PRIMARY KEY,
  program_id   INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id),
  actor_name   VARCHAR(255),
  action       VARCHAR(60) NOT NULL,  -- stage_changed / nomination_received / status_updated / file_uploaded / comment_added
  description  TEXT,
  metadata     JSONB DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pa_program_idx ON program_activity(program_id, created_at DESC);

-- (6) ملفات البرنامج
CREATE TABLE IF NOT EXISTS program_files (
  id           SERIAL PRIMARY KEY,
  program_id   INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  uploader_id  UUID REFERENCES users(id),
  file_name    VARCHAR(500) NOT NULL,
  file_path    VARCHAR(1000),
  file_size    BIGINT,
  file_type    VARCHAR(60),
  description  TEXT,
  uploaded_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS pf_program_idx ON program_files(program_id, uploaded_at DESC);

-- (7) تعريف الترشيحات لكل جهة (لتتبع التجاوب)
CREATE TABLE IF NOT EXISTS program_entity_invitations (
  id              SERIAL PRIMARY KEY,
  program_id      INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  entity_id       INT NOT NULL REFERENCES government_entities(id),
  invited_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by      UUID REFERENCES users(id),
  status          VARCHAR(20) NOT NULL DEFAULT 'invited', -- invited/responded/declined/expired
  expected_count  INT,
  responded_count INT NOT NULL DEFAULT 0,
  response_at     TIMESTAMPTZ,
  notes           TEXT,
  UNIQUE(program_id, entity_id)
);
CREATE INDEX IF NOT EXISTS pei_program_idx ON program_entity_invitations(program_id);

-- (8) شراكات (تطوير جدول الشركاء)
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partnership_type VARCHAR(40);  -- free/university/paid_partnership/sponsored/exchange
ALTER TABLE partners ADD COLUMN IF NOT EXISTS scope VARCHAR(20);              -- local/international
ALTER TABLE partners ADD COLUMN IF NOT EXISTS topics_areas TEXT[];            -- مجالات تدريبية
ALTER TABLE partners ADD COLUMN IF NOT EXISTS technical_areas TEXT[];         -- مجالات فنية
ALTER TABLE partners ADD COLUMN IF NOT EXISTS country VARCHAR(60);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS website VARCHAR(255);
ALTER TABLE partners ADD COLUMN IF NOT EXISTS notes TEXT;

-- (9) جدول ربط البرامج بالشركاء (many-to-many)
CREATE TABLE IF NOT EXISTS program_partners (
  id           SERIAL PRIMARY KEY,
  program_id   INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  partner_id   INT NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role         VARCHAR(40),  -- training_provider/sponsor/co_organizer/content_partner
  contribution TEXT,
  UNIQUE(program_id, partner_id)
);
