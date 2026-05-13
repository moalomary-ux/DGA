-- ============================================================================
-- Migration 009: منتدى الأفكار + مركز التواصل + monday.com
-- ============================================================================

-- (1) منتدى الأفكار / مساحة النقاش
CREATE TABLE IF NOT EXISTS forum_topics (
  id           SERIAL PRIMARY KEY,
  tenant       VARCHAR(20) NOT NULL DEFAULT 'qtech',
  title        VARCHAR(500) NOT NULL,
  body         TEXT NOT NULL,
  category     VARCHAR(40) NOT NULL DEFAULT 'idea',  -- idea/discussion/question/announcement
  author_id    UUID NOT NULL REFERENCES users(id),
  author_name  VARCHAR(255),
  tags         TEXT[],
  status       VARCHAR(20) NOT NULL DEFAULT 'open',  -- open/in_review/accepted/implemented/archived
  views_count  INT NOT NULL DEFAULT 0,
  replies_count INT NOT NULL DEFAULT 0,
  is_pinned    BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT ft_cat_check CHECK (category IN ('idea','discussion','question','announcement','knowledge')),
  CONSTRAINT ft_status_check CHECK (status IN ('open','in_review','accepted','implemented','archived'))
);
CREATE INDEX IF NOT EXISTS ft_tenant_idx ON forum_topics(tenant, created_at DESC);

CREATE TABLE IF NOT EXISTS forum_replies (
  id           SERIAL PRIMARY KEY,
  topic_id     INT NOT NULL REFERENCES forum_topics(id) ON DELETE CASCADE,
  parent_id    INT REFERENCES forum_replies(id) ON DELETE CASCADE,
  author_id    UUID NOT NULL REFERENCES users(id),
  author_name  VARCHAR(255),
  body         TEXT NOT NULL,
  is_solution  BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS fr_topic_idx ON forum_replies(topic_id, created_at);

-- (2) قوالب الإيميلات
CREATE TABLE IF NOT EXISTS email_template_library (
  id              SERIAL PRIMARY KEY,
  tenant          VARCHAR(20) NOT NULL DEFAULT 'qtech',
  template_code   VARCHAR(60) NOT NULL UNIQUE,
  name_ar         VARCHAR(255) NOT NULL,
  category        VARCHAR(40) NOT NULL,  -- acceptance/rejection/waitlist/file_request/reminder/welcome/certificate
  subject         VARCHAR(500) NOT NULL,
  body_html       TEXT NOT NULL,
  body_plain      TEXT,
  variables       TEXT[],  -- {{program_name}}, {{trainee_name}}, {{date}}, ...
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT etl_cat_check CHECK (category IN ('acceptance','rejection','waitlist','file_request','reminder','welcome','certificate','followup','other'))
);

-- (3) سجل الإيميلات المُولّدة (لتتبع ما أُرسل وما لم يُرسل بعد)
CREATE TABLE IF NOT EXISTS email_outbox (
  id              SERIAL PRIMARY KEY,
  template_id     INT REFERENCES email_template_library(id),
  program_id      INT REFERENCES programs(id) ON DELETE SET NULL,
  nominee_id      INT REFERENCES nominees(id) ON DELETE SET NULL,
  to_email        VARCHAR(255) NOT NULL,
  to_name         VARCHAR(255),
  cc              TEXT,
  subject         VARCHAR(500) NOT NULL,
  body_html       TEXT NOT NULL,
  body_plain      TEXT,
  status          VARCHAR(20) NOT NULL DEFAULT 'draft',  -- draft/exported/sent/failed
  exported_at     TIMESTAMPTZ,
  sent_at         TIMESTAMPTZ,
  generated_by    UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT eo_status_check CHECK (status IN ('draft','exported','sent','failed','cancelled'))
);
CREATE INDEX IF NOT EXISTS eo_status_idx ON email_outbox(status, created_at DESC);

-- (4) monday.com configurations & mappings
ALTER TABLE monday_configs ADD COLUMN IF NOT EXISTS workspace_id VARCHAR(60);
ALTER TABLE monday_configs ADD COLUMN IF NOT EXISTS sync_direction VARCHAR(20) DEFAULT 'bidirectional';

CREATE TABLE IF NOT EXISTS monday_program_mappings (
  id              SERIAL PRIMARY KEY,
  program_id      INT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  monday_board_id VARCHAR(60),
  monday_item_id  VARCHAR(60),
  last_synced_at  TIMESTAMPTZ,
  sync_status     VARCHAR(20) DEFAULT 'pending',  -- pending/synced/failed/conflict
  UNIQUE(program_id)
);

CREATE TABLE IF NOT EXISTS monday_sync_log (
  id              BIGSERIAL PRIMARY KEY,
  tenant          VARCHAR(20) NOT NULL,
  direction       VARCHAR(20) NOT NULL,    -- pull/push
  entity_type     VARCHAR(40) NOT NULL,    -- program/task/comment
  entity_id       INT,
  monday_id       VARCHAR(60),
  status          VARCHAR(20),
  message         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- (5) قوالب جاهزة (seed)
INSERT INTO email_template_library (template_code, name_ar, category, subject, body_html, body_plain, variables) VALUES
  ('ACCEPT_STD',
   'قبول مبدئي للبرنامج',
   'acceptance',
   'تم قبولكم في برنامج {{program_name}}',
   '<p>الأستاذ/ة <b>{{trainee_name}}</b> المحترم،</p><p>يسرّنا إبلاغكم بقبولكم للالتحاق ببرنامج <b>{{program_name}}</b> المُقرر إقامته في الفترة من {{start_date}} إلى {{end_date}}.</p><p>يُرجى تأكيد الحضور قبل تاريخ {{deadline_date}} عبر الرد على هذا الإيميل.</p><p>مع التحية،<br>فريق قدراتك<br>هيئة الحكومة الرقمية</p>',
   'الأستاذ/ة {{trainee_name}} المحترم،

يسرّنا إبلاغكم بقبولكم للالتحاق ببرنامج {{program_name}} المُقرر إقامته في الفترة من {{start_date}} إلى {{end_date}}.

يُرجى تأكيد الحضور قبل تاريخ {{deadline_date}}.

مع التحية،
فريق قدراتك',
   ARRAY['trainee_name','program_name','start_date','end_date','deadline_date']),

  ('REJECT_STD',
   'اعتذار عن الترشيح',
   'rejection',
   'بخصوص ترشيحكم لبرنامج {{program_name}}',
   '<p>الأستاذ/ة <b>{{trainee_name}}</b> المحترم،</p><p>نشكر لكم اهتمامكم بالترشّح لبرنامج <b>{{program_name}}</b>. نظراً لمحدودية المقاعد وكثافة الطلب، نعتذر عن قبول ترشيحكم في هذه الدورة.</p><p>سنحرص على إشعاركم بالبرامج القادمة المناسبة لمسارك المهني.</p><p>مع التحية،<br>فريق قدراتك</p>',
   '',
   ARRAY['trainee_name','program_name']),

  ('WAITLIST_STD',
   'قائمة الانتظار',
   'waitlist',
   'تم إدراجكم على قائمة الانتظار - {{program_name}}',
   '<p>الأستاذ/ة <b>{{trainee_name}}</b>،</p><p>تم إدراجكم على قائمة الانتظار لبرنامج <b>{{program_name}}</b>. سنبلغكم فور توفر مقعد.</p><p>مع التحية،<br>فريق قدراتك</p>',
   '',
   ARRAY['trainee_name','program_name']),

  ('FILE_REQUEST',
   'طلب ملفات إضافية',
   'file_request',
   'مطلوب: مستندات إضافية لبرنامج {{program_name}}',
   '<p>الأستاذ/ة <b>{{trainee_name}}</b>،</p><p>لاستكمال إجراءات قبولكم في برنامج <b>{{program_name}}</b>، نحتاج للمستندات التالية:</p><ul>{{required_files}}</ul><p>يُرجى إرسالها قبل {{deadline_date}}.</p><p>شكراً لتعاونكم،<br>فريق قدراتك</p>',
   '',
   ARRAY['trainee_name','program_name','required_files','deadline_date']),

  ('REMINDER_STD',
   'تذكير قبل البرنامج',
   'reminder',
   'تذكير: بدء برنامج {{program_name}} قريباً',
   '<p>الأستاذ/ة <b>{{trainee_name}}</b>،</p><p>نذكّركم ببدء برنامج <b>{{program_name}}</b> في {{start_date}}.</p><p>التفاصيل:<br>📍 المكان: {{location}}<br>🕒 الوقت: {{start_time}}<br>👤 المدرّب: {{trainer_name}}</p><p>نتطلع لرؤيتكم،<br>فريق قدراتك</p>',
   '',
   ARRAY['trainee_name','program_name','start_date','location','start_time','trainer_name'])
ON CONFLICT (template_code) DO NOTHING;

-- (6) seed: مراحل افتراضية
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN SELECT id FROM programs LOOP
    INSERT INTO program_stages (program_id, stage_code, stage_label, status, order_index)
    VALUES
      (p.id, 'planning',     'تخطيط',         'done',    1),
      (p.id, 'content_dev',  'تطوير المحتوى', 'done',    2),
      (p.id, 'review',       'مراجعة',         'active',  3),
      (p.id, 'nomination',   'فتح الترشيح',   'pending', 4),
      (p.id, 'execution',    'تنفيذ',          'pending', 5),
      (p.id, 'closure',      'إقفال',          'pending', 6)
    ON CONFLICT DO NOTHING;
  END LOOP;
END $$;
