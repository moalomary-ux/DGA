"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export async function decideRegistration(formData: FormData) {
  const session = await getSession();
  if (!session.isLoggedIn) return { ok: false, error: "unauthorized" };
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return { ok: false, error: "not admin" };

  const reqId = Number(formData.get("request_id"));
  const action = String(formData.get("action") || "");
  const role = String(formData.get("role") || "editor");
  const tenants = (formData.getAll("tenants") as string[]).filter(Boolean);
  const notes = String(formData.get("notes") || "");

  if (!["approve", "reject"].includes(action)) return { ok: false, error: "bad action" };

  const reqRows = await db<any[]>`
    SELECT rr.id, rr.user_id, rr.requested_tenants, rr.status, u.email, u.name_ar
    FROM registration_requests rr LEFT JOIN users u ON u.id=rr.user_id
    WHERE rr.id=${reqId} LIMIT 1
  `;
  if (!reqRows.length) return { ok: false, error: "not found" };
  const r = reqRows[0];
  if (r.status !== "pending") return { ok: false, error: `already ${r.status}` };

  try {
    if (action === "reject") {
      await db`UPDATE users SET status='rejected'::user_status, is_active=false WHERE id=${r.user_id}::uuid`;
      await db`UPDATE registration_requests SET status='rejected', reviewed_by=${session.userId}::uuid, reviewed_at=NOW(), review_notes=${notes} WHERE id=${reqId}`;
      await db`INSERT INTO audit_log (event, actor_id, metadata) VALUES ('registration_rejected', ${session.userId}::uuid, ${db.json({ request_id: reqId, target: r.email })})`;
    } else {
      const finalTenants = tenants.length ? tenants : (r.requested_tenants || []);
      if (!finalTenants.length) return { ok: false, error: "اختر قطاع واحد على الأقل" };

      await db`UPDATE users SET status='active'::user_status, is_active=true WHERE id=${r.user_id}::uuid`;
      for (const t of finalTenants) {
        await db`
          INSERT INTO memberships (user_id, tenant_id, role, status, granted_by, granted_at)
          VALUES (${r.user_id}::uuid, ${t}, ${role}::user_role, 'active', ${session.userId}::uuid, NOW())
          ON CONFLICT (user_id, tenant_id) DO UPDATE
            SET role=EXCLUDED.role, status='active', granted_by=EXCLUDED.granted_by, granted_at=NOW()
        `;
      }
      await db`UPDATE registration_requests SET status='approved', reviewed_by=${session.userId}::uuid, reviewed_at=NOW(), review_notes=${notes} WHERE id=${reqId}`;
      await db`INSERT INTO audit_log (event, actor_id, metadata) VALUES ('registration_approved', ${session.userId}::uuid, ${db.json({ request_id: reqId, target: r.email, role, tenants: finalTenants })})`;
    }
    revalidatePath("/admin/registrations");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e: any) {
    console.error("[action] decideRegistration:", e?.message || e);
    return { ok: false, error: String(e?.message || e) };
  }
}
