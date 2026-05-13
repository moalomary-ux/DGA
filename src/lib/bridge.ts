/**
 * Bridge API Client — يربط qtech-platform (VPS Frankfurt) بـ Hermes Agent (Mac mini Riyadh)
 *
 * المسار: VPS → WireGuard tunnel → Bridge :7080 → Hermes → Skills/LLMs
 *
 * البروتوكول:
 *   - Bearer token authentication
 *   - JSON request/response
 *   - Timeout: 30s default, 120s للـ AI tasks
 */

const BRIDGE_URL = process.env.BRIDGE_URL || 'http://10.10.10.2:7080';
const BRIDGE_TOKEN = process.env.BRIDGE_TOKEN || '';
const DEFAULT_TIMEOUT = 30_000;
const AI_TIMEOUT = 120_000;

interface BridgeOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeout?: number;
}

/** الاستدعاء الأساسي للـ Bridge — كل الدوال تستخدمه */
async function bridgeRequest<T = unknown>(path: string, opts: BridgeOptions = {}): Promise<T> {
  if (!BRIDGE_TOKEN) {
    throw new Error('BRIDGE_TOKEN not configured');
  }

  const url = `${BRIDGE_URL}${path.startsWith('/') ? path : '/' + path}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeout || DEFAULT_TIMEOUT);

  try {
    const res = await fetch(url, {
      method: opts.method || 'GET',
      headers: {
        'Authorization': `Bearer ${BRIDGE_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Source': 'qtech-platform',
      },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Bridge ${res.status}: ${text}`);
    }
    return res.json() as Promise<T>;
  } catch (e) {
    clearTimeout(timeout);
    if ((e as Error).name === 'AbortError') {
      throw new Error(`Bridge timeout after ${opts.timeout || DEFAULT_TIMEOUT}ms`);
    }
    throw e;
  }
}

/* ════════════════════════════════════════════════════════════════════════
 * Health check — هل الـ Bridge شغّال؟
 * ════════════════════════════════════════════════════════════════════════ */
export interface BridgeHealth {
  status: 'ok' | 'degraded' | 'down';
  hermes_version: string;
  skills_count: number;
  models: string[];
  uptime_seconds: number;
  last_check?: string;
}

export async function checkBridgeHealth(): Promise<BridgeHealth | null> {
  try {
    return await bridgeRequest<BridgeHealth>('/v1/health', { timeout: 5000 });
  } catch (e) {
    console.warn('[bridge] health check failed:', (e as Error).message);
    return null;
  }
}

/* ════════════════════════════════════════════════════════════════════════
 * Skill execution — يشغّل skill على Mac mini
 * ════════════════════════════════════════════════════════════════════════ */
export interface SkillExecuteInput {
  skill_id: string;          // مثل: "dga-studies-designer", "email-composer"
  inputs: Record<string, unknown>;
  model?: string;            // مثل: "claude-sonnet-4-6" (default)
  user_id?: string;
}

export interface SkillExecuteResult {
  execution_id: string;
  status: 'success' | 'failed' | 'partial';
  output: unknown;
  artifacts?: Array<{ name: string; url: string; mime: string; size: number }>;
  duration_ms: number;
  cost?: { input_tokens: number; output_tokens: number; usd: number };
  error?: string;
}

export async function executeSkill(input: SkillExecuteInput): Promise<SkillExecuteResult> {
  return bridgeRequest<SkillExecuteResult>('/v1/skills/execute', {
    method: 'POST',
    body: input,
    timeout: AI_TIMEOUT,
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * Agent chat — محادثة مع وكيل ذكي (يستدعي LLM داخلياً)
 * ════════════════════════════════════════════════════════════════════════ */
export interface AgentChatInput {
  agent_id: string;
  conversation_id?: string;        // لاستمرار المحادثة
  user_id: string;
  message: string;
  context?: Record<string, unknown>;  // بيانات إضافية مثل: program_id
}

export interface AgentChatResult {
  conversation_id: string;
  message_id: string;
  reply: string;
  artifacts?: Array<{ name: string; url: string; mime: string }>;
  tool_calls?: Array<{ name: string; result: unknown }>;
  cost?: { usd: number };
}

export async function chatWithAgent(input: AgentChatInput): Promise<AgentChatResult> {
  return bridgeRequest<AgentChatResult>('/v1/agents/chat', {
    method: 'POST',
    body: input,
    timeout: AI_TIMEOUT,
  });
}

/* ════════════════════════════════════════════════════════════════════════
 * Notifications — إشعار محمد عن الأحداث
 * ════════════════════════════════════════════════════════════════════════ */
export interface RegistrationNotification {
  request_id: number;
  email: string;
  name_ar: string;
  position?: string | null;
  notes?: string | null;
  tenant: string;
}

export async function notifyRegistration(payload: RegistrationNotification): Promise<void> {
  await bridgeRequest('/v1/notify/registration', { method: 'POST', body: payload });
}

/* ════════════════════════════════════════════════════════════════════════
 * Skills registry — قائمة المهارات المتاحة على Mac mini
 * ════════════════════════════════════════════════════════════════════════ */
export interface SkillMeta {
  id: string;
  name_ar: string;
  name_en: string;
  category: string;        // 18 فئة
  description: string;
  inputs_schema?: Record<string, unknown>;
  models_compatible?: string[];
  cost_estimate_usd?: number;
}

export async function listSkills(category?: string): Promise<SkillMeta[]> {
  const path = category ? `/v1/skills?category=${encodeURIComponent(category)}` : '/v1/skills';
  return bridgeRequest<SkillMeta[]>(path);
}

/* ════════════════════════════════════════════════════════════════════════
 * Models registry — الـ LLMs المتاحة (Claude Sonnet 4.6 + 7)
 * ════════════════════════════════════════════════════════════════════════ */
export interface ModelInfo {
  id: string;             // مثل: "claude-sonnet-4-6"
  provider: string;       // anthropic / ollama / minimax
  context_window: number;
  cost_per_1m_input: number;
  cost_per_1m_output: number;
  capabilities: string[]; // ["text", "vision", "tools"]
}

export async function listModels(): Promise<ModelInfo[]> {
  return bridgeRequest<ModelInfo[]>('/v1/models');
}
