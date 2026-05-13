-- ============================================================================
-- Omary Platform — Initial Schema
-- ============================================================================
-- يُشغّل مرة واحدة على PostgreSQL على VPS
--   docker exec -i sami-postgres psql -U sami -d sami < migrations/001_initial.sql
-- ============================================================================

-- UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Tenants
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id          VARCHAR(20) PRIMARY KEY,
  name_ar     VARCHAR(120) NOT NULL,
  name_en     VARCHAR(120) NOT NULL,
  primary_color VARCHAR(10),
  smtp_from   VARCHAR(255),
  is_master   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tenants (id, name_ar, name_en, primary_color, smtp_from, is_master) VALUES
  ('omary',  'منصّة محمد العُمري',          'Omary Platform',          '#1A4480', 'mohammed@omary.cloud',  true),
  ('advice', 'الاستشارات والدراسات الرقمية', 'Advisory & Studies',      '#2C5F2D', 'help@advicedga.cloud',  false),
  ('qtech',  'قدراتك — المهارات الرقمية',     'Qudratok Digital Skills', '#702963', 'skills@qtech.help',     false)
ON CONFLICT (id) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  name_en = EXCLUDED.name_en,
  primary_color = EXCLUDED.primary_color,
  smtp_from = EXCLUDED.smtp_from;

-- ============================================================================
-- Users (الفريق فقط — 6 أشخاص حالياً)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         VARCHAR(255) NOT NULL UNIQUE,
  name_ar       VARCHAR(120) NOT NULL,
  name_en       VARCHAR(120),
  position      VARCHAR(255),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  is_active     BOOLEAN NOT NULL DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT users_status_check CHECK (status IN ('active','pending','rejected','suspended'))
);

CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_status_idx ON users(status);

-- ============================================================================
-- Memberships (user × tenant × role)
-- ============================================================================
CREATE TABLE IF NOT EXISTS memberships (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id  VARCHAR(20) NOT NULL REFERENCES tenants(id),
  role       VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, tenant_id),
  CONSTRAINT memberships_role_check CHECK (role IN ('super_admin','admin','editor','viewer'))
);

CREATE INDEX IF NOT EXISTS memberships_user_idx ON memberships(user_id);
CREATE INDEX IF NOT EXISTS memberships_tenant_idx ON memberships(tenant_id);

-- ============================================================================
-- Auth Codes (OTP)
-- ============================================================================
CREATE TABLE IF NOT EXISTS auth_codes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id   VARCHAR(20) NOT NULL REFERENCES tenants(id),
  code_hash   VARCHAR(64) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_at     TIMESTAMPTZ,
  attempts    INT NOT NULL DEFAULT 0,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_codes_user_idx ON auth_codes(user_id);
CREATE INDEX IF NOT EXISTS auth_codes_expires_idx ON auth_codes(expires_at);

-- ============================================================================
-- Invite Codes (للتسجيل السريع بدون مراجعة)
-- ============================================================================
CREATE TABLE IF NOT EXISTS invite_codes (
  id            SERIAL PRIMARY KEY,
  code          VARCHAR(20) NOT NULL UNIQUE,
  tenant_id     VARCHAR(20) NOT NULL REFERENCES tenants(id),
  default_role  VARCHAR(20) NOT NULL DEFAULT 'viewer',
  max_uses      INT NOT NULL DEFAULT 1,
  used_count    INT NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ,
  notes         TEXT,
  created_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS invite_codes_code_idx ON invite_codes(code);

-- ============================================================================
-- Registration Requests
-- ============================================================================
CREATE TABLE IF NOT EXISTS registration_requests (
  id           SERIAL PRIMARY KEY,
  email        VARCHAR(255) NOT NULL,
  name_ar      VARCHAR(120) NOT NULL,
  position     VARCHAR(255),
  notes        TEXT,
  tenant_id    VARCHAR(20) NOT NULL REFERENCES tenants(id),
  invite_code  VARCHAR(20),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',
  reviewed_by  UUID REFERENCES users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reg_status_check CHECK (status IN ('pending','approved','rejected'))
);

CREATE INDEX IF NOT EXISTS reg_status_idx ON registration_requests(status);

-- ============================================================================
-- Ecosystem Contacts (مزامنة من Mac mini)
-- ============================================================================
CREATE TABLE IF NOT EXISTS ecosystem_contacts (
  id            SERIAL PRIMARY KEY,
  external_id   INT,                   -- المعرّف من قاعدة Mac mini SQLite
  name_ar       VARCHAR(120) NOT NULL,
  name_en       VARCHAR(120),
  email         VARCHAR(255),
  phone         VARCHAR(40),
  organization  VARCHAR(255),
  department    VARCHAR(255),
  position      VARCHAR(255),
  relationship  VARCHAR(40),
  scope         VARCHAR(40),
  importance    INT DEFAULT 3,
  synced_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(external_id)
);

CREATE INDEX IF NOT EXISTS contacts_email_idx ON ecosystem_contacts(email);
CREATE INDEX IF NOT EXISTS contacts_scope_idx ON ecosystem_contacts(scope);

-- ============================================================================
-- Audit Log
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_log (
  id          BIGSERIAL PRIMARY KEY,
  event       VARCHAR(80) NOT NULL,
  actor_id    UUID REFERENCES users(id),
  tenant_id   VARCHAR(20) REFERENCES tenants(id),
  metadata    JSONB,
  ip_address  VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_event_idx ON audit_log(event);
CREATE INDEX IF NOT EXISTS audit_actor_idx ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_log(created_at DESC);

-- ============================================================================
-- Seed: محمد العمري (super_admin)
-- ============================================================================
INSERT INTO users (email, name_ar, name_en, position, status, is_active) VALUES
  ('mohammed@omary.cloud', 'محمد العُمري', 'Mohammed AlOmary', 'المدير العام للقدرات الرقمية', 'active', true)
ON CONFLICT (email) DO NOTHING;

-- صلاحيات super_admin على البوابات الثلاث
INSERT INTO memberships (user_id, tenant_id, role)
SELECT u.id, t.id, 'super_admin'
FROM users u, tenants t
WHERE u.email = 'mohammed@omary.cloud'
ON CONFLICT (user_id, tenant_id) DO NOTHING;
