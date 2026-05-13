-- Migration 006: User preferences (theme، locale، settings)

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  theme        VARCHAR(20) DEFAULT 'dark',          -- dark / light / navy
  locale       VARCHAR(10) DEFAULT 'ar',
  density      VARCHAR(20) DEFAULT 'comfortable',   -- compact / comfortable / cozy
  preferences  JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT up_theme_check CHECK (theme IN ('dark','light','navy')),
  CONSTRAINT up_density_check CHECK (density IN ('compact','comfortable','cozy'))
);
