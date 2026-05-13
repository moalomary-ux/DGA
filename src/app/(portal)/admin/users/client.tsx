"use client";
import { useState } from "react";

const TENANT_LABELS: Record<string, string> = {
  qtech: "المهارات", advice: "الاستشارات", omary: "البوابة العامة",
};
const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  super_admin: { label: "مدير عام", color: "#7C32C9" },
  admin: { label: "أدمن", color: "#00ABAF" },
  editor: { label: "محرر", color: "#3F7DD9" },
  viewer: { label: "مشاهد", color: "#64748b" },
};

export default function UsersClient({ users, isSuperAdmin, currentUserId }: {
  users: any[]; isSuperAdmin: boolean; currentUserId: string;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const filtered = users.filter(u => {
    if (filter === "active" && u.status !== "active") return false;
    if (filter === "pending" && u.status !== "pending") return false;
    if (filter === "rejected" && u.status !== "rejected") return false;
    if (search) {
      const q = search.toLowerCase();
      return u.name_ar?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }} dir="rtl">
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e2e8f0", marginBottom: 16 }}>إدارة المستخدمين</h1>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو الإيميل..."
          style={{ flex: 1, padding: "10px 14px", background: "#0f1419", border: "1px solid #2a3142", borderRadius: 8, color: "#e2e8f0", fontSize: 14 }} />
        <select value={filter} onChange={e => setFilter(e.target.value)}
          style={{ padding: "10px 14px", background: "#0f1419", border: "1px solid #2a3142", borderRadius: 8, color: "#e2e8f0", fontSize: 13 }}>
          <option value="all">الكل ({users.length})</option>
          <option value="active">فعّال ({users.filter(u => u.status==='active').length})</option>
          <option value="pending">قيد المراجعة ({users.filter(u => u.status==='pending').length})</option>
          <option value="rejected">مرفوض ({users.filter(u => u.status==='rejected').length})</option>
        </select>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(u => (
          <UserRow key={u.id} u={u} isSuperAdmin={isSuperAdmin} isMe={u.id === currentUserId} />
        ))}
      </div>
    </div>
  );
}

function UserRow({ u, isSuperAdmin, isMe }: { u: any; isSuperAdmin: boolean; isMe: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const updateUser = async (changes: any) => {
    setBusy(true);
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(changes),
    });
    setBusy(false);
    location.reload();
  };

  const updateMembership = async (tenant: string, role: string) => {
    setBusy(true);
    await fetch(`/api/admin/users/${u.id}/membership`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tenant_id: tenant, role }),
    });
    setBusy(false);
    location.reload();
  };

  const removeMembership = async (tenant: string) => {
    if (!confirm(`إزالة العضوية من ${TENANT_LABELS[tenant]}؟`)) return;
    setBusy(true);
    await fetch(`/api/admin/users/${u.id}/membership?tenant_id=${tenant}`, { method: "DELETE" });
    setBusy(false);
    location.reload();
  };

  const statusColor = u.status === "active" ? "#10b981" : u.status === "pending" ? "#FFB020" : "#EF4444";

  return (
    <div style={{ background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10, padding: 14 }}>
      <div onClick={() => setExpanded(!expanded)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{u.name_ar || u.email}</span>
            <span style={{ fontSize: 10, padding: "2px 8px", background: statusColor, color: "#fff", borderRadius: 4 }}>
              {u.status === "active" ? "فعّال" : u.status === "pending" ? "قيد المراجعة" : u.status === "rejected" ? "مرفوض" : u.status}
            </span>
            {isMe && <span style={{ fontSize: 10, padding: "2px 6px", background: "#7C32C9", color: "#fff", borderRadius: 4 }}>أنت</span>}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 3 }}>
            {u.email} {u.title_ar && <>· {u.title_ar}</>}{u.department && <> · {u.department}</>}
          </div>
          {u.memberships?.length > 0 && (
            <div style={{ marginTop: 6, display: "flex", gap: 4 }}>
              {u.memberships.map((m: any) => {
                const rl = ROLE_LABELS[m.role];
                return <span key={m.tenant_id+m.role} style={{ fontSize: 10, padding: "2px 6px", background: rl?.color || "#64748b", color: "#fff", borderRadius: 3 }}>
                  {TENANT_LABELS[m.tenant_id]} · {rl?.label || m.role}
                </span>;
              })}
            </div>
          )}
        </div>
        <div style={{ color: "#64748b", fontSize: 13 }}>{expanded ? "▲" : "▼"}</div>
      </div>
      
      {expanded && (
        <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #1f2937" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, fontSize: 12, marginBottom: 14 }}>
            <Field label="الهاتف" v={u.phone} mono />
            <Field label="Telegram" v={u.telegram_chat_id ? "✓ مربوط" : "—"} />
            <Field label="آخر دخول" v={u.last_login_at ? new Date(u.last_login_at).toLocaleDateString("ar-SA") : "ما دخل بعد"} />
          </div>

          {/* Memberships management */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>العضويات في القطاعات</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
              {["qtech", "advice", "omary"].map(t => {
                const m = u.memberships?.find((x: any) => x.tenant_id === t);
                return (
                  <div key={t} style={{ background: "#1a1f2e", padding: 10, borderRadius: 6 }}>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{TENANT_LABELS[t]}</div>
                    <select value={m?.role || ""} onChange={e => e.target.value ? updateMembership(t, e.target.value) : removeMembership(t)}
                      disabled={busy || isMe}
                      style={{ width: "100%", padding: 6, background: "#0f1419", border: "1px solid #2a3142", borderRadius: 4, color: "#e2e8f0", fontSize: 12 }}>
                      <option value="">— لا توجد —</option>
                      <option value="viewer">مشاهد</option>
                      <option value="editor">محرر</option>
                      <option value="admin">أدمن</option>
                      {isSuperAdmin && <option value="super_admin">مدير عام</option>}
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            {u.status === "active" ? (
              <button onClick={() => updateUser({ status: "suspended" })} disabled={busy || isMe}
                style={btn("#FFB020", true)}>⏸ تعليق مؤقّت</button>
            ) : (
              <button onClick={() => updateUser({ status: "active" })} disabled={busy || isMe}
                style={btn("#10b981", true)}>✓ تفعيل</button>
            )}
            {isSuperAdmin && !isMe && (
              <button onClick={() => { if (confirm(`حذف ${u.name_ar} نهائياً؟`)) updateUser({ delete: true }); }}
                style={btn("#EF4444", true)}>🗑️ حذف نهائي</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, v, mono }: any) {
  return <div>
    <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{label}</div>
    <div style={{ color: "#cbd5e1", fontFamily: mono ? "monospace" : undefined, fontSize: 12 }}>{v || "—"}</div>
  </div>;
}

function btn(color: string, outline: boolean): React.CSSProperties {
  return {
    padding: "7px 14px", fontSize: 12, borderRadius: 5, cursor: "pointer",
    background: outline ? "transparent" : color, color: outline ? color : "#fff",
    border: `1px solid ${color}`,
  };
}
