/**
 * Agent Registry — التعريف الرسمي للوكلاء الذكيين في قدراتك
 *
 * كل وكيل = bundle (system prompt + skills + model + tools).
 * عند المحادثة، الـ Bridge يستدعي Hermes والذي بدوره يشغّل الوكيل.
 */

export type AgentStatus = 'enabled' | 'beta' | 'coming_soon' | 'disabled';

export interface AgentDef {
  id: string;
  slug: string;             // للـ URL: /agents/{slug}
  name_ar: string;
  name_en: string;
  emoji: string;
  description: string;
  status: AgentStatus;
  capabilities: string[];   // tags بالإنجليزي للـ UI
  /** المهارات اللي يستخدمها هذا الوكيل (skill_id من Mac mini) */
  skills: string[];
  /** الـ LLM الافتراضي */
  default_model: string;
  /** سياق إضافي اختياري — مثل tenant scope */
  scope?: 'qtech' | 'advice' | 'omary' | 'all';
}

export const AGENTS: Record<string, AgentDef> = {
  'sami-orchestrator': {
    id: 'sami-orchestrator',
    slug: 'sami',
    name_ar: 'SAMI – الموجّه الرئيسي',
    name_en: 'SAMI Orchestrator',
    emoji: '🤖',
    description: 'الوكيل الرئيسي اللي يفهم طلباتك بالعربي، يحلّلها، وينسّق بين الوكلاء الآخرين لإتمام المهام المركّبة.',
    status: 'enabled',
    capabilities: ['Task decomposition', 'Multi-agent orchestration', 'Telegram interface'],
    skills: ['task-decomposer', 'agent-router'],
    default_model: 'claude-sonnet-4-6',
    scope: 'all',
  },

  'nomination-reviewer': {
    id: 'nomination-reviewer',
    slug: 'nomination-reviewer',
    name_ar: 'مراجع الترشيحات',
    name_en: 'Nomination Reviewer',
    emoji: '📋',
    description: 'يحلّل بيانات المرشّحين ويحسب match score مع معايير قبول البرنامج. يقترح القبول أو الرفض مع السبب.',
    status: 'enabled',
    capabilities: ['Priority ranking', 'Auto-rejection rationale', 'Match scoring'],
    skills: ['nomination-scorer', 'criteria-extractor'],
    default_model: 'claude-sonnet-4-6',
    scope: 'qtech',
  },

  'program-designer': {
    id: 'program-designer',
    slug: 'program-designer',
    name_ar: 'مصمم البرامج',
    name_en: 'Program Designer',
    emoji: '📚',
    description: 'يساعد في صياغة وصف البرنامج، تحديد المخرجات التعليمية، اقتراح المدرّبين، وتوليد جدول جلسات مبدئي.',
    status: 'enabled',
    capabilities: ['Schedule drafting', 'Trainer matching', 'Outline generation'],
    skills: ['program-outliner', 'trainer-matcher'],
    default_model: 'claude-sonnet-4-6',
    scope: 'qtech',
  },

  'email-composer': {
    id: 'email-composer',
    slug: 'email-composer',
    name_ar: 'كاتب الإيميلات',
    name_en: 'Email Composer',
    emoji: '✉️',
    description: 'يكتب إيميلات قبول/رفض/تذكير بناءً على القوالب، ويخصّصها للجهة والمرشّح والبرنامج.',
    status: 'enabled',
    capabilities: ['Multi-tone (formal/friendly)', 'Template variables', 'Bulk-send queue'],
    skills: ['email-templater', 'language-stylist'],
    default_model: 'claude-sonnet-4-6',
    scope: 'qtech',
  },

  'data-analyst': {
    id: 'data-analyst',
    slug: 'data-analyst',
    name_ar: 'محلل البيانات',
    name_en: 'Data Analyst',
    emoji: '📊',
    description: 'يجيب على أسئلة عن المتدربين، البرامج، الحضور، التقييمات. يولّد رسوم بيانية وتقارير PDF/Excel فوراً.',
    status: 'beta',
    capabilities: ['KPI dashboards', 'Auto-charts', 'Natural language SQL'],
    skills: ['nl-to-sql', 'report-generator', 'chart-builder'],
    default_model: 'claude-sonnet-4-6',
    scope: 'qtech',
  },

  'partner-relations': {
    id: 'partner-relations',
    slug: 'partner-relations',
    name_ar: 'إدارة الشراكات',
    name_en: 'Partner Relations',
    emoji: '🤝',
    description: 'يتابع تواصل الجهات الحكومية والمزوّدين. يكتشف فرص الشراكة، ويذكّرك بمواعيد التجديد.',
    status: 'coming_soon',
    capabilities: ['Relationship score', 'Renewal alerts', 'CRM-lite'],
    skills: ['relationship-tracker'],
    default_model: 'claude-sonnet-4-6',
    scope: 'qtech',
  },
};

export function getAgent(slug: string): AgentDef | null {
  return Object.values(AGENTS).find((a) => a.slug === slug || a.id === slug) || null;
}

export function listEnabledAgents(scope?: string): AgentDef[] {
  return Object.values(AGENTS).filter(
    (a) => (a.status === 'enabled' || a.status === 'beta') && (!scope || a.scope === 'all' || a.scope === scope)
  );
}
