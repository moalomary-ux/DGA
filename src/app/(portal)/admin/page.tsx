"use client";
import { useState, useEffect, useCallback } from "react";
import QIcon from "@/components/QIcon";

interface RegRequest { id: number; user_id: string; email: string; name_ar: string | null; name_en: string | null; title_ar: string | null; requested_role: string; requested_tenants: string[]; user_notes: string | null; requested_at: string; status: string; }
interface Membership { tenant: string; role: string; status: string; }
interface User { id: string; email: string; name_ar: string | null; name_en: string | null; title_ar: string | null; phone: string | null; is_active: boolean; status: string; created_at: string; last_login_at: string | null; memberships: Membership[]; }

const TENANTS = [
  { id: "admin", ar: "إدارة" },
  { id: "consulting", ar: "استشارات" },
  { id: "training", ar: "تدريب" },
];
const ROLES = [
  { id: "viewer", ar: "مشاهد" },
  { id: "editor", ar: "محرر" },
  { id: "admin", ar: "أدمن" },
  { id: "super_admin", ar: "سوبر أدمن" },
];

export default function AdminPage() {
  const [tab, setTab] = useState<"pending" | "users" | "audit">("pending");
  const [pending, setPending] = useState<RegRequest[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);

  const loadPending = useCallback(async () => {
    const r = await fetch("/api/admin/registrations?status=pending").then(r => r.json());
    if (r.ok) { setPending(r.requests); setCounts(r.counts || {}); }
  }, []);
  const loadUsers = useCallback(async () => {
    const r = await fetch("/api/admin/users").then(r => r.json());
    if (r.ok) setUsers(r.users);
  }, []);

  useEffect(() => { if (tab === "pending") loadPending(); else if (tab === "users") loadUsers(); }, [tab, loadPending, loadUsers]);

  const decide = async (id: number, action: "approve" | "reject", role = "viewer", tenants = ["consulting"]) => {
    setBusy(true);
    const r = await fetch(`/api/admin/registrations/${id}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, role, tenants })
    }).then(r => r.json());
    setBusy(false);
    if (r.ok) loadPending(); else alert("خطأ: " + r.error);
  };

  const userAction = async (userId: string, payload: Record<string, unknown>) => {
    setBusy(true);
    const r = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(r => r.json());
    setBusy(false);
    if (r.ok) loadUsers(); else alert("خطأ: " + r.error);
  };

  const deleteUser = async (userId: string, email: string) => {
    if (!confirm(`حذف ${email} نهائياً؟ لا يمكن التراجع.`)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" }).then(r => r.json());
    setBusy(false);
    if (r.ok) loadUsers(); else alert("خطأ: " + r.error);
  };

  return (
    <div className="page fade-in">
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--text-3)",letterSpacing:".1em",fontFamily:"var(--font-en)",fontWeight:700,marginBottom:4}}>ADMIN CENTER</div>
        <h1 style={{fontSize:22,fontWeight:700}}>مركز الإدارة</h1>
        <div style={{fontSize:12,color:"var(--text-3)",marginTop:4}}>إدارة المستخدمين والصلاحيات والمسجّلين الجدد</div>
      </div>

      <div className="card">
        <div className="card-head" style={{padding:"6px 12px"}}>
          <div className="chips" style={{margin:0}}>
            <button className={`chip ${tab==="pending"?"active":""}`} onClick={()=>setTab("pending")}>
              <QIcon n="inbox" size={12}/> المسجّلون الجدد
              {(counts.pending || 0) > 0 && <span style={{marginInlineStart:6,padding:"1px 6px",borderRadius:99,background:"#FF8533",color:"#fff",fontSize:10}}>{counts.pending}</span>}
            </button>
            <button className={`chip ${tab==="users"?"active":""}`} onClick={()=>setTab("users")}>
              <QIcon n="users" size={12}/> المستخدمون
            </button>
            <button className={`chip ${tab==="audit"?"active":""}`} onClick={()=>setTab("audit")}>
              <QIcon n="chart" size={12}/> سجل النشاط
            </button>
          </div>
        </div>

        {tab === "pending" && (
          <div className="card-body" style={{padding:0}}>
            {pending.length === 0 && <div style={{padding:40,textAlign:"center",color:"var(--text-3)"}}>لا توجد طلبات معلّقة 🎉</div>}
            {pending.map(r => <PendingCard key={r.id} r={r} onDecide={decide} busy={busy}/>)}
          </div>
        )}

        {tab === "users" && (
          <div className="card-body tight">
            <table className="tbl">
              <thead><tr><th>المستخدم</th><th>البريد</th><th>المنصب</th><th>الصلاحيات</th><th>الحالة</th><th>إجراءات</th></tr></thead>
              <tbody>
                {users.map(u => <UserRow key={u.id} u={u} onAction={userAction} onDelete={deleteUser} busy={busy}/>)}
                {users.length === 0 && <tr><td colSpan={6} style={{textAlign:"center",padding:30,color:"var(--text-3)"}}>لا يوجد مستخدمون</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {tab === "audit" && (
          <div className="card-body" style={{padding:40,textAlign:"center",color:"var(--text-3)"}}>
            سجل النشاط قيد التطوير (سيقرأ من جدول audit_log)
          </div>
        )}
      </div>
    </div>
  );
}

function PendingCard({ r, onDecide, busy }: { r: RegRequest; onDecide: (id: number, a: "approve" | "reject", role?: string, tenants?: string[]) => void; busy: boolean }) {
  const [role, setRole] = useState(r.requested_role || "viewer");
  const [tenants, setTenants] = useState<string[]>(r.requested_tenants || ["consulting"]);
  const toggleTenant = (t: string) => setTenants(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  return (
    <div style={{padding:14,borderBottom:"1px solid var(--line)",display:"grid",gridTemplateColumns:"1fr auto",gap:14}}>
      <div>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:6}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:"var(--grad-purple)",color:"#fff",display:"grid",placeItems:"center",fontWeight:600,fontSize:13}}>
            {(r.name_ar || r.email).split(" ").map(w=>w[0]).slice(0,2).join("")}
          </div>
          <div>
            <b style={{fontSize:14}}>{r.name_ar || r.name_en || "بدون اسم"}</b>
            <div style={{fontSize:11,color:"var(--text-3)"}}>{r.email} · {r.title_ar || "—"}</div>
          </div>
        </div>
        {r.user_notes && <div style={{fontSize:12,color:"var(--text-2)",background:"var(--bg-2)",padding:8,borderRadius:6,marginTop:6}}>📝 {r.user_notes}</div>}
        <div style={{display:"flex",gap:8,alignItems:"center",marginTop:10,flexWrap:"wrap"}}>
          <span style={{fontSize:11,color:"var(--text-3)"}}>الدور:</span>
          <select value={role} onChange={e=>setRole(e.target.value)}
                  style={{padding:"4px 10px",background:"var(--bg-2)",color:"var(--text)",border:"1px solid var(--line)",borderRadius:99,fontSize:11}}>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.ar}</option>)}
          </select>
          <span style={{fontSize:11,color:"var(--text-3)",marginInlineStart:8}}>القطاعات:</span>
          {TENANTS.map(t => (
            <button key={t.id} onClick={()=>toggleTenant(t.id)}
                    className={`chip ${tenants.includes(t.id)?"active":""}`} style={{fontSize:10}}>{t.ar}</button>
          ))}
        </div>
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:6,alignItems:"flex-end"}}>
        <span style={{fontSize:10,color:"var(--text-3)"}}>{new Date(r.requested_at).toLocaleDateString("ar-SA")}</span>
        <div style={{display:"flex",gap:6}}>
          <button className="btn btn-primary btn-sm" disabled={busy} onClick={()=>onDecide(r.id, "approve", role, tenants)} style={{width:"auto"}}>
            <QIcon n="check" size={12}/> اعتماد
          </button>
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>onDecide(r.id, "reject")} style={{width:"auto",color:"#E03A4D"}}>
            <QIcon n="x" size={12}/> رفض
          </button>
        </div>
      </div>
    </div>
  );
}

function UserRow({ u, onAction, onDelete, busy }: { u: User; onAction: (id: string, p: Record<string, unknown>) => void; onDelete: (id: string, email: string) => void; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const isMine = false; // TODO: detect self

  return (
    <>
      <tr>
        <td>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:"var(--grad-2,var(--grad-purple))",color:"#fff",display:"grid",placeItems:"center",fontSize:10,fontWeight:600}}>
              {(u.name_ar || u.email).split(" ").map(w=>w[0]).slice(0,2).join("")}
            </div>
            <b style={{fontSize:13}}>{u.name_ar || u.name_en || "بدون اسم"}</b>
          </div>
        </td>
        <td style={{fontSize:12,color:"var(--text-2)"}}>{u.email}</td>
        <td style={{fontSize:12}}>{u.title_ar || "—"}</td>
        <td>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {u.memberships.length === 0 && <span className="pill muted" style={{fontSize:10}}>بدون</span>}
            {u.memberships.map(m => (
              <span key={m.tenant} className={`pill ${m.role==="super_admin"?"accent":m.role==="admin"?"info":"muted"}`} style={{fontSize:10}}>
                {TENANTS.find(t=>t.id===m.tenant)?.ar || m.tenant}: {ROLES.find(r=>r.id===m.role)?.ar || m.role}
              </span>
            ))}
          </div>
        </td>
        <td>
          <span className={`pill ${u.is_active && u.status === "active" ? "success" : "muted"}`}>
            {u.is_active && u.status === "active" ? "نشط" : "موقف"}
          </span>
        </td>
        <td>
          <div style={{display:"flex",gap:4}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(!open)} style={{width:"auto",fontSize:11}}>{open ? "إخفاء" : "تعديل"}</button>
            <button className="btn btn-ghost btn-sm" disabled={busy || isMine} onClick={()=>onAction(u.id, {action:"toggle_active", is_active: !u.is_active})} style={{width:"auto",fontSize:11}}>
              {u.is_active ? "تعطيل" : "تفعيل"}
            </button>
            <button className="btn btn-ghost btn-sm" disabled={busy || isMine} onClick={()=>onDelete(u.id, u.email)} style={{width:"auto",fontSize:11,color:"#E03A4D"}}>حذف</button>
          </div>
        </td>
      </tr>
      {open && (
        <tr><td colSpan={6} style={{background:"var(--bg-2)",padding:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <span style={{fontSize:11,color:"var(--text-3)"}}>تعيين دور لقطاع:</span>
            {TENANTS.map(t => (
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:4,padding:"4px 8px",background:"var(--bg-3)",borderRadius:8}}>
                <span style={{fontSize:11}}>{t.ar}:</span>
                <select onChange={e => e.target.value && onAction(u.id, {action:"set_role", tenant:t.id, role:e.target.value})}
                        defaultValue={u.memberships.find(m=>m.tenant===t.id)?.role || ""}
                        style={{padding:"2px 6px",background:"var(--bg-2)",color:"var(--text)",border:"1px solid var(--line)",borderRadius:6,fontSize:11}}>
                  <option value="">— لا شيء —</option>
                  {ROLES.map(r => <option key={r.id} value={r.id}>{r.ar}</option>)}
                </select>
                {u.memberships.find(m=>m.tenant===t.id) && (
                  <button onClick={()=>onAction(u.id, {action:"remove_membership", tenant:t.id})} style={{background:"none",border:0,color:"#E03A4D",cursor:"pointer",fontSize:11}}>✕</button>
                )}
              </div>
            ))}
          </div>
        </td></tr>
      )}
    </>
  );
}
