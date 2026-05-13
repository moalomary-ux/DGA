import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { assignOwner, removeAssignment } from "../../new/actions";

export const dynamic = "force-dynamic";

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  owner: { label: "مالك", color: "#00ABAF" },
  coordinator: { label: "منسّق", color: "#7C32C9" },
  observer: { label: "مراقب", color: "#94a3b8" },
};

export default async function Page({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ fresh?: string }>;
}) {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) redirect("/programs");

  const { id } = await params;
  const { fresh } = await searchParams;
  const programId = Number(id);
  if (!Number.isFinite(programId)) redirect("/programs");

  const programs = await db<any[]>`
    SELECT id, title_ar, code, kind, status FROM ecosystem_programs WHERE id=${programId} LIMIT 1
  `;
  if (!programs.length) redirect("/programs");
  const program = programs[0];

  const assignments = await db<any[]>`
    SELECT pa.id, pa.role, pa.assigned_at, pa.notes,
           u.id AS user_id, u.email, u.name_ar, u.title_ar AS user_title, u.department
    FROM program_assignments pa
    JOIN users u ON u.id = pa.user_id
    WHERE pa.program_id = ${programId}
    ORDER BY 
      CASE pa.role WHEN 'owner' THEN 1 WHEN 'coordinator' THEN 2 ELSE 3 END,
      pa.assigned_at DESC
  `;

  // المستخدمون المتاحون للإسناد (active + memberships في qtech أو advice)
  const users = await db<any[]>`
    SELECT DISTINCT u.id, u.email, u.name_ar, u.title_ar, u.department,
                    array_agg(DISTINCT m.tenant_id) AS tenants
    FROM users u
    JOIN memberships m ON m.user_id=u.id AND m.status='active'
    WHERE u.status='active' AND u.is_active=true
      AND m.tenant_id IN ('qtech','advice','omary')
    GROUP BY u.id, u.email, u.name_ar, u.title_ar, u.department
    ORDER BY u.name_ar
  `;

  return (
    <div style={{ padding: 24, maxWidth: 1100, margin: "0 auto" }} dir="rtl">
      <Link href={`/programs/${programId}`} style={{ fontSize: 12, color: "#94a3b8", textDecoration: "none" }}>← {program.title_ar}</Link>

      {fresh && (
        <div style={{ marginTop: 14, padding: 14, background: "rgba(16,185,129,0.1)", border: "1px solid #10b981", borderRadius: 8, color: "#10b981", fontSize: 13 }}>
          ✓ تم إنشاء البرنامج. الآن اختر الموظف المسؤول.
        </div>
      )}

      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", margin: "16px 0 4px" }}>إسناد البرنامج</h1>
      <p style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>
        كل برنامج له مالك واحد + منسّقين/مراقبين اختيارياً. المالك يدير المهام والمرشحين.
      </p>

      {/* الإسنادات الحالية */}
      <div style={{ background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10, padding: 16, marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>الإسنادات الحالية</div>
        {assignments.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "#64748b", fontSize: 13 }}>
            لا توجد إسنادات بعد — أضف مالكاً أدناه
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {assignments.map(a => {
              const r = ROLE_LABELS[a.role] || ROLE_LABELS.observer;
              return (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, background: "#1a1f2e", borderRadius: 6, borderRight: `3px solid ${r.color}` }}>
                  <div>
                    <div style={{ fontSize: 14, color: "#e2e8f0", fontWeight: 500 }}>
                      {a.name_ar}
                      <span style={{ marginRight: 10, fontSize: 11, padding: "2px 8px", background: r.color, color: "#fff", borderRadius: 4 }}>{r.label}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
                      {a.user_title || ""}{a.department ? ` · ${a.department}` : ""} · <span style={{ fontFamily: "monospace" }}>{a.email}</span>
                    </div>
                    {a.notes && <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>📝 {a.notes}</div>}
                  </div>
                  <form action={removeAssignment}>
                    <input type="hidden" name="assignment_id" value={a.id} />
                    <input type="hidden" name="program_id" value={programId} />
                    <button type="submit" style={{ padding: "5px 10px", background: "transparent", color: "#EF4444", border: "1px solid #EF4444", borderRadius: 5, fontSize: 11, cursor: "pointer" }}>إلغاء</button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form الإسناد الجديد */}
      <div style={{ background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0", marginBottom: 12 }}>إسناد موظف</div>
        
        <form action={assignOwner} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10, marginBottom: 12 }}>
          <input type="hidden" name="program_id" value={programId} />
          
          <div>
            <label style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "block" }}>الموظف</label>
            <select name="user_id" required
              style={{ width: "100%", padding: 10, background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }}>
              <option value="">— اختر موظفاً —</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name_ar} {u.title_ar ? `· ${u.title_ar}` : ""} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4, display: "block" }}>الدور</label>
            <select name="role" defaultValue="owner"
              style={{ width: "100%", padding: 10, background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }}>
              <option value="owner">مالك (Owner)</option>
              <option value="coordinator">منسّق (Coordinator)</option>
              <option value="observer">مراقب (Observer)</option>
            </select>
          </div>

          <input name="notes" placeholder="ملاحظة للإسناد (اختياري)"
            style={{ gridColumn: "1 / -1", padding: 10, background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 6, color: "#e2e8f0", fontSize: 13 }} />

          <button type="submit"
            style={{ gridColumn: "1 / -1", padding: "10px 20px", background: "#00ABAF", color: "#fff", border: 0, borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            إسناد + إرسال إشعار
          </button>
        </form>

        <div style={{ fontSize: 11, color: "#64748b", padding: 10, background: "#1a1f2e", borderRadius: 6 }}>
          💡 عند الإسناد سيتم: إرسال إشعار داخل النظام + Telegram (لو متاح) + سيظهر البرنامج في "صفحتي" → "برامجي المسندة" للموظف.
        </div>
      </div>

      <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
        <Link href={`/programs/${programId}`}
          style={{ padding: "10px 20px", background: "#0f1419", color: "#94a3b8", border: "1px solid #2a3142", borderRadius: 6, fontSize: 13, textDecoration: "none" }}>
          → الانتقال لصفحة البرنامج
        </Link>
        <Link href={`/programs/${programId}/nominations`}
          style={{ padding: "10px 20px", background: "#0f1419", color: "#94a3b8", border: "1px solid #2a3142", borderRadius: 6, fontSize: 13, textDecoration: "none" }}>
          → تاب الترشيحات
        </Link>
      </div>
    </div>
  );
}
