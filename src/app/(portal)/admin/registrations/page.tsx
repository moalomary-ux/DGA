import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import { decideRegistration } from "./actions";

export const dynamic = "force-dynamic";

const TENANT_LABELS: Record<string, string> = {
  omary: "البوابة العامة",
  qtech: "المهارات الرقمية",
  advice: "الاستشارات والدراسات",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "مدير عام",
  admin: "أدمن",
  editor: "محرر",
  viewer: "مشاهد",
};

export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) redirect("/");

  const { status: filterStatus } = await searchParams;
  const status = filterStatus || "pending";

  const rows = await db<any[]>`
    SELECT rr.id, rr.requested_at, rr.requested_role, rr.requested_tenants,
           rr.user_notes, rr.status, rr.reviewed_at, rr.review_notes,
           u.email, u.name_ar, u.title_ar, u.position, u.department, u.phone
    FROM registration_requests rr LEFT JOIN users u ON u.id=rr.user_id
    WHERE rr.status=${status} ORDER BY rr.requested_at DESC LIMIT 100
  `;

  const counts = await db<any[]>`SELECT status, COUNT(*)::int AS c FROM registration_requests GROUP BY status`;
  const cmap = Object.fromEntries(counts.map(r => [r.status, r.c]));

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }} dir="rtl">
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>طلبات التسجيل</h1>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["pending", "approved", "rejected"].map(s => (
          <a key={s} href={`/admin/registrations?status=${s}`}
            style={{
              padding: "8px 14px", borderRadius: 8, textDecoration: "none",
              background: s === status ? "#00ABAF" : "#1a1f2e",
              color: s === status ? "#fff" : "#94a3b8",
              border: "1px solid " + (s === status ? "#00ABAF" : "#2a3142"),
              fontSize: 13,
            }}>
            {s === "pending" ? "قيد المراجعة" : s === "approved" ? "معتمد" : "مرفوض"}
            <span style={{ marginRight: 6, opacity: 0.7 }}>({cmap[s] || 0})</span>
          </a>
        ))}
      </div>

      {rows.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "#64748b", background: "#0f1419", borderRadius: 10 }}>
          لا يوجد طلبات بهذه الحالة
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {rows.map(r => (
          <div key={r.id} style={{ background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0" }}>{r.name_ar || "—"}</div>
                <div style={{ fontSize: 13, color: "#94a3b8" }}>{r.email}</div>
                {(r.title_ar || r.position) && <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{r.title_ar || r.position}{r.department ? ` · ${r.department}` : ""}</div>}
                {r.phone && <div style={{ fontSize: 12, color: "#64748b" }}>📞 {r.phone}</div>}
              </div>
              <div style={{ fontSize: 11, color: "#64748b" }}>#{r.id} · {new Date(r.requested_at).toLocaleDateString("ar-SA")}</div>
            </div>

            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
              <span style={{ color: "#64748b" }}>طُلب: </span>
              {(r.requested_tenants || []).map((t: string) => TENANT_LABELS[t] || t).join("، ") || "—"}
              <span style={{ color: "#64748b", marginRight: 12 }}>الدور: </span>
              {ROLE_LABELS[r.requested_role] || r.requested_role}
            </div>

            {r.user_notes && (
              <div style={{ fontSize: 12, color: "#94a3b8", padding: 10, background: "#1a1f2e", borderRadius: 6, marginBottom: 12 }}>
                💬 {r.user_notes}
              </div>
            )}

            {status === "pending" ? (
              <form action={decideRegistration} style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12, padding: 12, background: "#1a1f2e", borderRadius: 8 }}>
                <input type="hidden" name="request_id" value={r.id} />

                <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <label style={{ fontSize: 12, color: "#94a3b8" }}>
                    الدور:
                    <select name="role" defaultValue={r.requested_role || "editor"} style={{ marginRight: 6, padding: "4px 8px", background: "#0f1419", color: "#e2e8f0", border: "1px solid #2a3142", borderRadius: 4 }}>
                      <option value="viewer">مشاهد</option>
                      <option value="editor">محرر</option>
                      <option value="admin">أدمن</option>
                      {admin.isSuperAdmin && <option value="super_admin">مدير عام</option>}
                    </select>
                  </label>

                  <div style={{ display: "flex", gap: 10, fontSize: 12, color: "#94a3b8" }}>
                    <span>القطاعات:</span>
                    {["qtech", "advice", "omary"].map(t => (
                      <label key={t} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <input type="checkbox" name="tenants" value={t}
                          defaultChecked={(r.requested_tenants || []).includes(t)}
                          disabled={!admin.isSuperAdmin && !admin.tenants.includes(t)} />
                        {TENANT_LABELS[t]}
                      </label>
                    ))}
                  </div>
                </div>

                <input name="notes" placeholder="ملاحظة (اختياري)" style={{ padding: 8, background: "#0f1419", color: "#e2e8f0", border: "1px solid #2a3142", borderRadius: 4, fontSize: 13 }} />

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" name="action" value="approve"
                    style={{ padding: "8px 16px", background: "#10b981", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                    ✓ اعتماد
                  </button>
                  <button type="submit" name="action" value="reject"
                    style={{ padding: "8px 16px", background: "#ef4444", color: "#fff", border: 0, borderRadius: 6, cursor: "pointer", fontSize: 13 }}>
                    ✗ رفض
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ fontSize: 12, color: "#64748b", marginTop: 8 }}>
                {r.reviewed_at && <>تمت المراجعة: {new Date(r.reviewed_at).toLocaleDateString("ar-SA")}</>}
                {r.review_notes && <> · {r.review_notes}</>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
