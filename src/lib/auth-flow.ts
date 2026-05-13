import type { TenantId } from '@/lib/db';

export type EmailKind = 'dga' | 'personal';
export type ProposedRole = 'admin' | 'editor' | 'viewer';

const DGA_DOMAIN = 'dga.gov.sa';
const ALL_TENANTS: TenantId[] = ['omary', 'qtech', 'advice'];

export function classifyEmail(email: string): EmailKind {
  return email.toLowerCase().endsWith('@' + DGA_DOMAIN) ? 'dga' : 'personal';
}

/**
 * موظف بإيميل @dga.gov.sa → يُقترح له الوصول لكل المنصات الثلاث (pending).
 * إيميل خارجي → يُقترح له المنصة اللي سجّل عليها فقط (pending).
 * كل المقترحات تنتظر موافقة super_admin.
 */
export function proposedTenants(email: string, currentTenant: TenantId): TenantId[] {
  return classifyEmail(email) === 'dga' ? ALL_TENANTS : [currentTenant];
}

export function proposedRole(_email: string): ProposedRole {
  return 'viewer';
}
