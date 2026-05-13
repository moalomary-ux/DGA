"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import ExcelUploader from "../ExcelUploader";

type Status = 'submitted'|'under_review'|'accepted'|'rejected'|'waitlist'|'attended';

const STATUS_META: Record<Status, { label: string; color: string; bg: string; icon: string }> = {
  submitted:    { label: "متقدّمون",  color: "#3F7DD9", bg: "rgba(63,125,217,0.1)",  icon: "📝" },
  under_review: { label: "تحت المراجعة", color: "#FFB020", bg: "rgba(255,176,32,0.1)", icon: "🔍" },
  waitlist:     { label: "قائمة الانتظار", color: "#9333EA", bg: "rgba(147,51,234,0.1)", icon: "⏳" },
  accepted:     { label: "مقبولون", color: "#10B981", bg: "rgba(16,185,129,0.1)", icon: "✓" },
  attended:     { label: "حضروا فعلياً", color: "#00ABAF", bg: "rgba(0,171,175,0.1)", icon: "🎓" },
  rejected:     { label: "مرفوضون", color: "#EF4444", bg: "rgba(239,68,68,0.1)", icon: "✗" },
};

const ORDER: Status[] = ["submitted", "under_review", "waitlist", "accepted", "attended", "rejected"];

interface Nominee {
  id: number; contact_id?: number;
  name_ar: string; name_en?: string;
  email?: string; phone?: string; job_title?: string;
  organization_ar?: string; national_id?: string;
  liaison_name?: string; liaison_email?: string; liaison_phone?: string; liaison_organization?: string;
  status: Status; status_reason?: string;
  ai_score?: number; ai_reasoning?: string;
  prior_programs?: number;
  source: string; created_at: string;
  decided_by_name?: string; created_by_name?: string;
}

export default function NominationsClient({ programId, program }: { programId: number; program: any }) {
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<Status>("submitted");
  const [showAddModal, setShowAddModal] = useState(false);
  const [decisionModal, setDecisionModal] = useState<{ nominee: Nominee; newStatus: Status } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/programs/${programId}/nominations`);
    const d = await r.json();
    if (d.ok) { setNominees(d.nominees); setCounts(d.counts); }
    setLoading(false);
  }, [programId]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = nominees.filter(n => n.status === activeStatus);

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }} dir="rtl">
      <ExcelUploader programId={programId} onSuccess={refresh} />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
        <div>
          <Link href={`/programs/${programId}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px',
            background: 'color-mix(in srgb, #00ABAF 14%, transparent)',
            border: '1px solid color-mix(in srgb, #00ABAF 38%, transparent)',
            borderRadius: 100, fontSize: 12, color: '#00ABAF',
            textDecoration: 'none', fontWeight: 600, marginBottom: 14,
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 14 }}>{'\u2190'}</span> العودة للبرنامج
          </Link>
          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontWeight: 500, letterSpacing: 0.5, textTransform: 'uppercase' }}>البرنامج</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', margin: '0 0 6px' }}>
            {program.title_ar}
            {program.code && <span style={{ marginInlineStart: 10, fontSize: 12, fontFamily: 'monospace', color: '#64748b', fontWeight: 400 }}>{program.code}</span>}
          </h1>
          <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#00ABAF' }} />
            إدارة المرشحين
          </div>
        </div>
        <button onClick={() => setShowAddModal(true)}
          style={{ padding: "10px 18px", background: "#00ABAF", color: "#fff", border: 0, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
          + إضافة يدوي
        </button>
      </div>

      {/* 4 buckets (status tabs) — actually 6 statuses */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8, marginBottom: 18 }}>
        {ORDER.map(s => {
          const m = STATUS_META[s];
          const isActive = s === activeStatus;
          const n = counts[s] || 0;
          return (
            <button key={s} onClick={() => setActiveStatus(s)}
              style={{
                padding: 14, background: isActive ? m.bg : "#0f1419",
                border: "2px solid " + (isActive ? m.color : "#1f2937"),
                borderRadius: 10, cursor: "pointer", textAlign: "center",
                transition: "all 0.15s",
              }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontSize: 12, color: isActive ? m.color : "#94a3b8", fontWeight: 600 }}>{m.label}</div>
              <div style={{ fontSize: 20, color: isActive ? m.color : "#e2e8f0", fontWeight: 700, marginTop: 4 }}>{n}</div>
            </button>
          );
        })}
      </div>

      {/* Active list */}
      <div style={{ background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10, padding: 16 }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
            لا يوجد مرشحون في حالة "{STATUS_META[activeStatus].label}"
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(n => (
              <NomineeRow key={n.id} n={n} programId={programId}
                onChangeStatus={(newStatus) => setDecisionModal({ nominee: n, newStatus })}
                onDelete={async () => {
                  if (!confirm("حذف هذا المرشّح؟")) return;
                  await fetch(`/api/programs/${programId}/nominations/${n.id}`, { method: "DELETE" });
                  refresh();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <AddNomineeModal programId={programId} onClose={() => setShowAddModal(false)} onSaved={() => { setShowAddModal(false); refresh(); }} />
      )}

      {decisionModal && (
        <DecisionModal modal={decisionModal} programId={programId}
          onClose={() => setDecisionModal(null)}
          onSaved={() => { setDecisionModal(null); refresh(); }}
        />
      )}
    </div>
  );
}

function NomineeRow({ n, programId, onChangeStatus, onDelete }: {
  n: Nominee; programId: number;
  onChangeStatus: (s: Status) => void; onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const m = STATUS_META[n.status];

  return (
    <div style={{ background: "#1a1f2e", border: "1px solid #2a3142", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div onClick={() => setExpanded(!expanded)} style={{ flex: 1, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f0" }}>{n.name_ar}</span>
            {n.prior_programs ? (
              <span style={{ fontSize: 10, padding: "2px 6px", background: "#7C32C9", color: "#fff", borderRadius: 4 }}>
                حضر {n.prior_programs} برنامج سابقاً
              </span>
            ) : null}
            {n.source === "manual" && (
              <span style={{ fontSize: 10, padding: "2px 6px", background: "#0f1419", color: "#94a3b8", borderRadius: 4 }}>يدوي</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>
            {n.job_title || "—"} {n.organization_ar && <>· <span style={{ color: "#cbd5e1" }}>{n.organization_ar}</span></>}
          </div>
          {n.liaison_name && (
            <div style={{ fontSize: 11, color: "#7C32C9", marginTop: 2 }}>
              👤 رفعه: {n.liaison_name}{n.liaison_organization && ` (${n.liaison_organization})`}
            </div>
          )}
        </div>
        <div style={{ color: "#64748b", fontSize: 13, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
          {expanded ? "▲" : "▼"}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: 14, background: "#0f1419", borderTop: "1px solid #2a3142" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, fontSize: 13, marginBottom: 14 }}>
            <Field label="الإيميل" value={n.email} mono />
            <Field label="الهاتف" value={n.phone} mono />
            <Field label="المسمى الوظيفي" value={n.job_title} />
            <Field label="الجهة" value={n.organization_ar} />
            <Field label="الهوية" value={n.national_id} mono />
            <Field label="المصدر" value={
              n.source === "manual" ? "إدخال يدوي" :
              n.source === "attendance_import" ? "استيراد حضور سابق" :
              n.source === "excel_upload" ? "ملف Excel" : n.source
            } />
          </div>

          {n.liaison_name && (
            <div style={{ padding: 10, background: "#1a2332", borderRadius: 6, borderRight: "3px solid #7C32C9", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 4 }}>👤 ضابط اتصال الجهة (مَن رفع الاسم)</div>
              <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 500 }}>{n.liaison_name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2, fontFamily: "monospace" }}>
                {n.liaison_organization && <>{n.liaison_organization} · </>}
                {n.liaison_email && <>{n.liaison_email} · </>}
                {n.liaison_phone && <>{n.liaison_phone}</>}
              </div>
            </div>
          )}

          {n.status_reason && (
            <div style={{ padding: 10, background: "#1a2332", borderRadius: 6, marginBottom: 14, fontSize: 12, color: "#cbd5e1" }}>
              <strong>السبب:</strong> {n.status_reason}
              {n.decided_by_name && <div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>القرار: {n.decided_by_name}</div>}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["accepted","rejected","waitlist","under_review","attended"] as Status[]).filter(s => s !== n.status).map(s => {
              const sm = STATUS_META[s];
              return (
                <button key={s} onClick={() => onChangeStatus(s)}
                  style={{ padding: "6px 12px", fontSize: 12, background: "transparent", color: sm.color, border: `1px solid ${sm.color}`, borderRadius: 5, cursor: "pointer" }}>
                  {sm.icon} {sm.label}
                </button>
              );
            })}
            {n.email && (
              <a href={`mailto:${n.email}`} style={{ padding: "6px 12px", fontSize: 12, background: "#00ABAF", color: "#fff", textDecoration: "none", borderRadius: 5 }}>✉️ مراسلة</a>
            )}
            {n.source === "manual" && (
              <button onClick={onDelete} style={{ padding: "6px 12px", fontSize: 12, background: "transparent", color: "#EF4444", border: "1px solid #EF4444", borderRadius: 5, cursor: "pointer", marginRight: "auto" }}>🗑️ حذف</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value?: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>{label}</div>
      <div style={{ color: "#cbd5e1", fontFamily: mono ? "monospace" : undefined }}>{value || "—"}</div>
    </div>
  );
}

function AddNomineeModal({ programId, onClose, onSaved }: { programId: number; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>({
    name_ar: "", email: "", phone: "", job_title: "", organization_ar: "", national_id: "",
    liaison_name: "", liaison_email: "", liaison_phone: "", liaison_organization: "",
    status: "submitted", status_reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!form.name_ar.trim()) return setError("اسم المرشّح مطلوب");
    setSaving(true); setError("");
    const r = await fetch(`/api/programs/${programId}/nominations`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    const d = await r.json();
    setSaving(false);
    if (d.ok) onSaved();
    else setError(d.error || "خطأ");
  };

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={modalBox} onClick={e => e.stopPropagation()} dir="rtl">
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#e2e8f0", margin: "0 0 16px" }}>إضافة مرشّح يدوياً</h3>

        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>بيانات المرشّح</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <Input label="الاسم *" v={form.name_ar} onCh={v => setForm({...form, name_ar: v})} />
          <Input label="الإيميل" v={form.email} onCh={v => setForm({...form, email: v})} mono />
          <Input label="الهاتف" v={form.phone} onCh={v => setForm({...form, phone: v})} mono />
          <Input label="المسمى الوظيفي" v={form.job_title} onCh={v => setForm({...form, job_title: v})} />
          <Input label="الجهة" v={form.organization_ar} onCh={v => setForm({...form, organization_ar: v})} />
          <Input label="الهوية الوطنية" v={form.national_id} onCh={v => setForm({...form, national_id: v})} mono />
        </div>

        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>ضابط الاتصال (مَن رفع الاسم)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
          <Input label="اسم ضابط الاتصال" v={form.liaison_name} onCh={v => setForm({...form, liaison_name: v})} />
          <Input label="جهة ضابط الاتصال" v={form.liaison_organization} onCh={v => setForm({...form, liaison_organization: v})} />
          <Input label="إيميل ضابط الاتصال" v={form.liaison_email} onCh={v => setForm({...form, liaison_email: v})} mono />
          <Input label="هاتف ضابط الاتصال" v={form.liaison_phone} onCh={v => setForm({...form, liaison_phone: v})} mono />
        </div>

        <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>الحالة الأولية</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 8, marginBottom: 16 }}>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})} style={inputStyle}>
            {ORDER.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
          <Input label="" placeholder="سبب/ملاحظة (اختياري)" v={form.status_reason} onCh={v => setForm({...form, status_reason: v})} />
        </div>

        {error && <div style={{ color: "#EF4444", fontSize: 12, marginBottom: 12 }}>{error}</div>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary}>إلغاء</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.5 : 1 }}>
            {saving ? "..." : "حفظ"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DecisionModal({ modal, programId, onClose, onSaved }: {
  modal: { nominee: Nominee; newStatus: Status }; programId: number;
  onClose: () => void; onSaved: () => void;
}) {
  const [reason, setReason] = useState(modal.nominee.status_reason || "");
  const [saving, setSaving] = useState(false);
  const m = STATUS_META[modal.newStatus];

  const save = async () => {
    setSaving(true);
    await fetch(`/api/programs/${programId}/nominations/${modal.nominee.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: modal.newStatus, status_reason: reason }),
    });
    setSaving(false);
    onSaved();
  };

  return (
    <div style={modalBackdrop} onClick={onClose}>
      <div style={{ ...modalBox, maxWidth: 480 }} onClick={e => e.stopPropagation()} dir="rtl">
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", margin: "0 0 6px" }}>
          {m.icon} نقل إلى: <span style={{ color: m.color }}>{m.label}</span>
        </h3>
        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 16 }}>{modal.nominee.name_ar}</div>

        <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>السبب / الملاحظة</div>
        <textarea value={reason} onChange={e => setReason(e.target.value)}
          rows={3} placeholder={`اشرح سبب ${m.label}...`}
          style={{ ...inputStyle, width: "100%", resize: "vertical", marginBottom: 16 }} />

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onClose} style={btnSecondary}>إلغاء</button>
          <button onClick={save} disabled={saving} style={{ ...btnPrimary, background: m.color, opacity: saving ? 0.5 : 1 }}>
            {saving ? "..." : "تأكيد"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, v, onCh, mono, placeholder }: { label?: string; v: string; onCh: (v: string) => void; mono?: boolean; placeholder?: string }) {
  return (
    <div>
      {label && <div style={{ fontSize: 11, color: "#64748b", marginBottom: 3 }}>{label}</div>}
      <input value={v || ""} onChange={e => onCh(e.target.value)} placeholder={placeholder}
        style={{ ...inputStyle, fontFamily: mono ? "monospace" : undefined }} />
    </div>
  );
}

const modalBackdrop: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex",
  alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20,
};
const modalBox: React.CSSProperties = {
  background: "#0f1419", border: "1px solid #2a3142", borderRadius: 12, padding: 24,
  maxWidth: 720, width: "100%", maxHeight: "90vh", overflowY: "auto",
};
const inputStyle: React.CSSProperties = {
  padding: "8px 10px", background: "#1a1f2e", border: "1px solid #2a3142",
  borderRadius: 6, color: "#e2e8f0", fontSize: 13, width: "100%", boxSizing: "border-box",
};
const btnPrimary: React.CSSProperties = {
  padding: "9px 18px", background: "#00ABAF", color: "#fff", border: 0,
  borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: "pointer",
};
const btnSecondary: React.CSSProperties = {
  padding: "9px 18px", background: "transparent", color: "#94a3b8",
  border: "1px solid #2a3142", borderRadius: 6, fontSize: 13, cursor: "pointer",
};
