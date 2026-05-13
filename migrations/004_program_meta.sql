-- ============================================================================
-- Migration 004: توسيع جدول البرامج + seed data أوسع
-- ============================================================================

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS delivery_mode VARCHAR(20) DEFAULT 'in_person',
  ADD COLUMN IF NOT EXISTS scope         VARCHAR(20) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS duration_type VARCHAR(20) DEFAULT 'multi_day',
  ADD COLUMN IF NOT EXISTS location      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS trainer       VARCHAR(255),
  ADD COLUMN IF NOT EXISTS description   TEXT;

-- التحقق من الـ enum بدون كسر القيود لو موجودة
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programs_delivery_check') THEN
    ALTER TABLE programs ADD CONSTRAINT programs_delivery_check
      CHECK (delivery_mode IN ('in_person','online','hybrid'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programs_scope_check') THEN
    ALTER TABLE programs ADD CONSTRAINT programs_scope_check
      CHECK (scope IN ('local','international'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'programs_duration_type_check') THEN
    ALTER TABLE programs ADD CONSTRAINT programs_duration_type_check
      CHECK (duration_type IN ('half_day','single_day','two_day','multi_day','weekly','monthly'));
  END IF;
END $$;

-- ============================================================================
-- بيانات تجريبية متنوعة لمايو-أغسطس ٢٠٢٦
-- ============================================================================

INSERT INTO programs (code, name_ar, category, duration_days, capacity, status, start_date, end_date,
                      delivery_mode, scope, duration_type, location, trainer, description) VALUES
-- مايو ٢٠٢٦
('QT-EXEC-2026-05', 'القيادة التنفيذية في عصر الذكاء الاصطناعي', 'Leadership', 3, 25, 'open', '2026-05-12', '2026-05-14', 'in_person', 'local', 'multi_day', 'فندق الفيصلية، الرياض', 'د. عبدالله الخالدي', 'برنامج مكثّف يستهدف القيادات التنفيذية في الجهات الحكومية لتمكينهم من قيادة التحوّل الرقمي'),
('QT-DATA-LIVE-05', 'ورشة تحليل البيانات بـ Power BI', 'Data', 1, 40, 'open', '2026-05-19', '2026-05-19', 'online', 'local', 'single_day', 'Zoom', 'م. فاطمة العتيبي', 'ورشة تطبيقية ليوم واحد لتعلّم أساسيات Power BI'),
('QT-OXFORD-05', 'برنامج أكسفورد للابتكار الحكومي', 'Innovation', 7, 15, 'open', '2026-05-25', '2026-05-31', 'in_person', 'international', 'weekly', 'Oxford, UK', 'Prof. James Mitchell', 'برنامج دولي مع جامعة أكسفورد لقادة التحوّل الحكومي'),

-- يونيو ٢٠٢٦
('QT-CYBER-06', 'الأمن السيبراني للموظفين', 'Cybersecurity', 2, 60, 'open', '2026-06-02', '2026-06-03', 'hybrid', 'local', 'two_day', 'مقر DGA + Online', 'م. خالد الزهراني', 'يومان متكاملان يجمعان بين الجلسات الحضورية والافتراضية'),
('QT-AI-PROD-06', 'تطوير منتجات الذكاء الاصطناعي', 'AI', 5, 20, 'open', '2026-06-09', '2026-06-13', 'in_person', 'local', 'weekly', 'مركز التدريب، الرياض', 'د. سارة المنصور', 'برنامج أسبوعي متخصّص لمهندسي البرمجيات'),
('QT-MIT-06', 'MIT Sloan: Digital Strategy for Government', 'Strategy', 5, 12, 'draft', '2026-06-22', '2026-06-26', 'in_person', 'international', 'weekly', 'Cambridge, MA, USA', 'MIT Sloan Faculty', 'برنامج تنفيذي مع MIT Sloan'),

-- يوليو ٢٠٢٦
('QT-CLOUD-07', 'الحوسبة السحابية والـ Saudi Cloud', 'Cloud', 3, 30, 'draft', '2026-07-07', '2026-07-09', 'online', 'local', 'multi_day', 'Microsoft Teams', 'م. أحمد الشمري', 'مقدمة شاملة في الحوسبة السحابية مع التركيز على Saudi Cloud'),
('QT-WORKSHOP-07', 'ورشة الذكاء الاصطناعي التوليدي', 'AI', 1, 50, 'open', '2026-07-14', '2026-07-14', 'online', 'local', 'single_day', 'Webinar', 'فريق سدايا', 'ورشة تعريفية مفتوحة'),
('QT-LEAD-07', 'القيادة الرقمية للمدراء', 'Leadership', 4, 25, 'open', '2026-07-20', '2026-07-23', 'hybrid', 'local', 'multi_day', 'مقر DGA + Online', 'د. عبدالله الخالدي', 'برنامج للمدراء الجدد'),

-- أغسطس ٢٠٢٦
('QT-NSU-08', 'الأمن السيبراني المتقدم', 'Cybersecurity', 5, 18, 'draft', '2026-08-04', '2026-08-08', 'in_person', 'international', 'weekly', 'NSU, Singapore', 'NSU Faculty', 'برنامج دولي مع جامعة سنغافورة')
ON CONFLICT (code) DO NOTHING;

-- توسيع جدول الدراسات بمواعيد متعددة
INSERT INTO studies (code, title_ar, client_id, category, status, priority, start_date, due_date, abstract) VALUES
('STD-2026-06', 'إستراتيجية الذكاء الاصطناعي للقطاع الصحي', 3, 'AI Strategy', 'in_progress', 'high', '2026-04-15', '2026-05-25', 'تطوير إستراتيجية متكاملة لتبني AI في الجهات الصحية'),
('STD-2026-07', 'مؤشر النضج الرقمي ٢٠٢٧', 5, 'Maturity Model', 'in_progress', 'critical', '2026-04-01', '2026-05-15', 'تحديث مؤشر النضج الرقمي بناءً على رؤية ٢٠٣٠'),
('STD-2026-08', 'تقييم أثر السحابة الحكومية', 4, 'Cloud Strategy', 'draft', 'medium', '2026-05-10', '2026-06-30', 'دراسة قياس الأثر المالي والتشغيلي'),
('STD-2026-09', 'حوكمة الذكاء الاصطناعي التوليدي', 1, 'AI Governance', 'in_progress', 'high', '2026-04-20', '2026-06-15', 'إطار حوكمة GenAI في الحكومة')
ON CONFLICT (code) DO NOTHING;

-- استشارات إضافية
INSERT INTO consultations (client_id, topic, type, status, scheduled_at) VALUES
(1, 'مراجعة استراتيجية التحول الرقمي ٢٠٢٧',           'meeting',  'scheduled', '2026-05-19 10:00:00+03'),
(3, 'ورشة عمل: قياس أثر برامج التدريب',                'workshop', 'scheduled', '2026-05-26 09:00:00+03'),
(5, 'استشارة سريعة حول حوكمة البيانات',                'meeting',  'requested', '2026-05-13 14:00:00+03'),
(6, 'مراجعة خطة الأمن السيبراني للبلديات',             'review',   'scheduled', '2026-06-04 11:00:00+03')
ON CONFLICT DO NOTHING;
