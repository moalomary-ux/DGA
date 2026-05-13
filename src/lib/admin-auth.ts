import { db } from "@/lib/db";

export interface AdminCheck { isAdmin: boolean; isSuperAdmin: boolean; tenants: string[]; }

export async function checkAdmin(userId: string): Promise<AdminCheck> {
  if (!userId) return { isAdmin: false, isSuperAdmin: false, tenants: [] };
  try {
    const rows = await db<{ tenant_id: string; role: string }[]>`
      SELECT tenant_id, role FROM memberships
      WHERE user_id = ${userId}::uuid AND status = 'active'
      AND role IN ('super_admin', 'admin')
    `;
    return {
      isAdmin: rows.length > 0,
      isSuperAdmin: rows.some(r => r.role === "super_admin"),
      tenants: rows.map(r => r.tenant_id),
    };
  } catch { return { isAdmin: false, isSuperAdmin: false, tenants: [] }; }
}
