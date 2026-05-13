// MOCK AUTH — كامل الصلاحيات لكل الصفحات
import { MOCK_USER } from './mock-data';

export async function getSession() {
  return {
    userId: MOCK_USER.id, role: MOCK_USER.role, email: MOCK_USER.email,
    fullName: MOCK_USER.full_name, tenant: MOCK_USER.tenant,
    isAuthenticated: true, isAdmin: true, isSuperAdmin: true,
  };
}
export async function requireAuth() { return getSession(); }
export async function requireAdmin() { return getSession(); }
export async function requireSuperAdmin() { return getSession(); }
export async function createSession(_userId: number) { return { ok: true, sessionId: 'mock' }; }
export async function clearSession() { return { ok: true }; }
export async function getUser() { return MOCK_USER; }
export async function hasPermission(_perm: string) { return true; }
export async function canAccess(_resource: string) { return true; }
