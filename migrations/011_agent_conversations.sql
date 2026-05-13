-- ============================================================================
-- Migration 011: محادثات الوكلاء الذكيين
-- ============================================================================

CREATE TABLE IF NOT EXISTS agent_conversations (
  id            SERIAL PRIMARY KEY,
  agent_id      VARCHAR(60) NOT NULL,
  user_id       UUID NOT NULL REFERENCES users(id),
  title         VARCHAR(255),
  context       JSONB DEFAULT '{}'::jsonb,
  total_cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
  total_tokens  INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_msg_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS ac_user_idx  ON agent_conversations(user_id, last_msg_at DESC);
CREATE INDEX IF NOT EXISTS ac_agent_idx ON agent_conversations(agent_id, last_msg_at DESC);

CREATE TABLE IF NOT EXISTS agent_messages (
  id              BIGSERIAL PRIMARY KEY,
  conversation_id INT NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role            VARCHAR(10) NOT NULL,  -- user / agent / system / tool
  content         TEXT NOT NULL,
  metadata        JSONB DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT am_role_check CHECK (role IN ('user','agent','system','tool'))
);
CREATE INDEX IF NOT EXISTS am_conv_idx ON agent_messages(conversation_id, created_at);
