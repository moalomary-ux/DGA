"use client";
import { useState, useRef } from "react";

const DUP: Record<string, string> = { email: "إيميل مكرّر", phone: "جوال مكرّر", national_id: "هوية مكرّرة", contact: "نفس الشخص (KG)", name: "اسم مكرّر" };
const MATCH: Record<string, string> = { email: "إيميل", phone: "جوال", national_id: "هوية", name: "اسم" };

export default function ExcelUploader({ programId, onSuccess }: { programId: number; onSuccess?: () => void }) {
  const [up, setUp] = useState(false), [scoring, setScoring] = useState(false), [r, setR] = useState<any>(null);
  const ref = useRef<HTMLInputElement>(null);
  
  const handle = async (f: File) => {
    setUp(true); setR(null);
    const fd = new FormData(); fd.append("file", f);
    try {
      const res = await fetch(`/api/programs/${programId}/imports/upload`, { method: "POST", body: fd });
      setR(await res.json());
      if (onSuccess) onSuccess();
    } catch (e: any) { setR({ ok: false, error: e.message }); }
    setUp(false);
  };
  
  const score = async (importId: number) => {
    setScoring(true);
    try {
      const res = await fetch(`/api/programs/${programId}/imports/${importId}/score`, { method: "POST" });
      const d = await res.json();
      setR((p: any) => ({ ...p, aiScored: d.scored }));
      if (onSuccess) onSuccess();
    } catch {}
    setScoring(false);
  };
  
  return (
    <div dir="rtl" style={{ background: "linear-gradient(135deg, #131826, #0f1419)", border: "1px solid #2a3142", borderRadius: 12, padding: 18, marginBottom: 20 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>📊 استيراد دفعة من Excel</div>
      <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14, lineHeight: 1.7 }}>
        أعمدة الملف: الاسم، الإيميل، الجوال، المسمى، الجهة، الهوية.<br/>
        النظام يكشف التكرار بـ <b style={{ color: "#FFB020" }}>5 إشارات</b>: الإيميل + الجوال (موحّد) + الهوية + الاسم (موحّد عربي) + ربط KG.
      </div>
      <input ref={ref} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }}
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
      <button onClick={() => ref.current?.click()} disabled={up}
        style={{ padding: "10px 22px", background: up ? "#1f2937" : "#00ABAF", color: "#fff", border: 0, borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: up ? "wait" : "pointer" }}>
        {up ? "⏳ معالجة..." : "📤 اختر ملف Excel"}
      </button>
      
      {r && (
        <div style={{ marginTop: 14, padding: 14, background: r.ok ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.1)", border: `1px solid ${r.ok ? "#10b981" : "#EF4444"}33`, borderRadius: 8, fontSize: 13, color: "#e2e8f0" }}>
          {r.ok ? (
            <>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>✓ تم استيراد {r.inserted} من {r.total}</div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: "#94a3b8", flexWrap: "wrap", marginBottom: 10 }}>
                <span>📋 الكل: <b style={{ color: "#e2e8f0" }}>{r.total}</b></span>
                <span>✓ مُضاف: <b style={{ color: "#10b981" }}>{r.inserted}</b></span>
                <span>🚫 سبق حضوره: <b style={{ color: "#EF4444" }}>{r.prevAttended || 0}</b></span>
                <span>🏢 جهة موصولة: <b style={{ color: "#9333EA" }}>{r.orgMatched || 0}</b></span>
                <span>🔗 KG: <b style={{ color: "#3F7DD9" }}>{r.matched}</b></span>
                <span>⚠ مكرّر: <b style={{ color: "#FFB020" }}>{r.duplicates}</b></span>
              </div>
              
              {r.duplicates > 0 && r.dupBreakdown && (
                <div style={{ background: "rgba(255,176,32,0.08)", border: "1px solid rgba(255,176,32,0.2)", borderRadius: 6, padding: 10, marginBottom: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#FFB020", marginBottom: 6 }}>كُشف التكرار عبر:</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#cbd5e1", flexWrap: "wrap" }}>
                    {Object.entries(r.dupBreakdown).filter(([_, v]: any) => v > 0).map(([k, v]: any) => (
                      <span key={k}>• {DUP[k] || k}: <b>{v}</b></span>
                    ))}
                  </div>
                </div>
              )}
              {r.matched > 0 && r.matchBreakdown && (
                <div style={{ background: "rgba(63,125,217,0.08)", border: "1px solid rgba(63,125,217,0.2)", borderRadius: 6, padding: 10, marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#3F7DD9", marginBottom: 6 }}>المطابقة في KG عبر:</div>
                  <div style={{ display: "flex", gap: 12, fontSize: 11, color: "#cbd5e1", flexWrap: "wrap" }}>
                    {Object.entries(r.matchBreakdown).filter(([_, v]: any) => v > 0).map(([k, v]: any) => (
                      <span key={k}>• {MATCH[k] || k}: <b>{v}</b></span>
                    ))}
                  </div>
                </div>
              )}
              
              {r.importId && r.aiScored == null && (
                <button onClick={() => score(r.importId)} disabled={scoring}
                  style={{ padding: "6px 14px", background: scoring ? "#1f2937" : "#7C32C9", color: "#fff", border: 0, borderRadius: 6, fontSize: 11, cursor: scoring ? "wait" : "pointer" }}>
                  {scoring ? "⏳ AI يقيّم..." : "🤖 تقييم AI (Ollama)"}
                </button>
              )}
              {r.aiScored != null && <div style={{ marginTop: 6, fontSize: 11, color: "#a855f7" }}>🤖 AI قيّم {r.aiScored} مرشح</div>}
            </>
          ) : <div>✗ خطأ: {r.error}</div>}
        </div>
      )}
    </div>
  );
}
