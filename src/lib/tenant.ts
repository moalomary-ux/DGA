/**
 * Tenant Configuration
 * 
 * كل بوابة (omary.cloud, advicedga.cloud, qtech.help) لها:
 * - hostname تستجيب له
 * - اسم وشعار
 * - لون أساسي
 * - عنوان SMTP للإرسال
 */

export type TenantId = 'omary' | 'advice' | 'qtech';

export interface TenantConfig {
  id: TenantId;
  hostname: string[];
  nameAr: string;
  nameEn: string;
  shortName: string;
  description: string;
  primary: string;     // اللون الأساسي
  secondary: string;   // اللون الثانوي
  smtpFrom: string;
  isMaster: boolean;   // omary.cloud هي الأم
}

export const TENANTS: Record<TenantId, TenantConfig> = {
  omary: {
    id: 'omary',
    hostname: ['omary.cloud', 'www.omary.cloud', 'localhost', '127.0.0.1'],
    nameAr: 'منصّة محمد العُمري',
    nameEn: 'Omary Platform',
    shortName: 'Omary',
    description: 'مركز التحكّم — الإدارة العامة للقدرات الرقمية',
    primary: '#1A4480',
    secondary: '#D4AF37',
    smtpFrom: 'mohammed@omary.cloud',
    isMaster: true,
  },
  advice: {
    id: 'advice',
    hostname: ['advicedga.cloud', 'www.advicedga.cloud', 'advice.local'],
    nameAr: 'الاستشارات والدراسات الرقمية',
    nameEn: 'Advisory & Studies',
    shortName: 'Advice',
    description: 'إدارة الاستشارات والدراسات الرقمية',
    primary: '#2C5F2D',
    secondary: '#A8B89E',
    smtpFrom: 'help@advicedga.cloud',
    isMaster: false,
  },
  qtech: {
    id: 'qtech',
    hostname: ['qtech.help', 'www.qtech.help', 'qtech.local'],
    nameAr: 'قدراتك — المهارات الرقمية',
    nameEn: 'Qudratok Digital Skills',
    shortName: 'Qudratok',
    description: 'إدارة برامج المهارات الرقمية',
    primary: '#702963',
    secondary: '#C9A0BD',
    smtpFrom: 'skills@qtech.help',
    isMaster: false,
  },
};

/**
 * استخراج tenant من Host header
 * يتم استدعاؤها من middleware والـ server components
 */
export function detectTenant(hostname: string): TenantConfig {
  const host = hostname.toLowerCase().split(':')[0]; // إزالة المنفذ
  for (const tenant of Object.values(TENANTS)) {
    if (tenant.hostname.includes(host)) return tenant;
  }
  // fallback: omary
  return TENANTS.omary;
}

export function getTenant(id: TenantId): TenantConfig {
  return TENANTS[id];
}
