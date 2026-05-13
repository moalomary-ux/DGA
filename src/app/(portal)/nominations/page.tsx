import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

const KIND_COLORS: Record<string, string> = {
  international: "#7C32C9", local: "#00ABAF", workshop: "#FF8533",
  seminar: "#3F7DD9", closed: "#7A82A8",
};
const KIND_LABELS: Record<string, string> = {
  international: "دولي", local: "محلي", workshop: "ورشة", seminar: "ندوة", closed: "مغلق",
};

export default async function Page() {
  const session = await getSession();
  if (!session.isLoggedIn) redirect("/login");

  // كل البرامج + إحصاءات المرشحين من program_nominees
  const programs = await db<any[]>`
    SELECT
      p.id, p.title_ar, p.code, p.kind, p.status, p.partner,
      TO_CHAR(p.start_date,'YYYY-MM-DD') AS start_date,
      TO_CHAR(p.end_date,'YYYY-MM-DD') AS end_date,
      COUNT(n.id)::int AS total,
      COUNT(*) FILTER (WHERE n.status='submitted')::int    AS submitted,
      COUNT(*) FILTER (WHERE n.status='under_review')::int AS under_review,
      COUNT(*) FILTER (WHERE n.status='waitlist')::int     AS waitlist,
      COUNT(*) FILTER (WHERE n.status='accepted')::int     AS accepted,
      COUNT(*) FILTER (WHERE n.status='attended')::int     AS attended,
      COUNT(*) FILTER (WHERE n.status='rejected')::int     AS rejected
    FROM ecosystem_programs p
    LEFT JOIN program_nominees n ON n.program_id=p.id
    GROUP BY p.id
    HAVING COUNT(n.id) > 0
    ORDER BY p.start_date DESC NULLS LAST, p.id DESC
    LIMIT 500
  `;

  return (
    <div style={{ padding: 24, maxWidth: 1300, margin: "0 auto" }} dir="rtl">
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 18 }}>الترشيحات — كل البرامج</h1>
      
      <div style={{ marginBottom: 16, fontSize: 13, color: "#94a3b8" }}>
        {programs.length} برنامج · {programs.reduce((s, p) => s + (p.total || 0), 0)} مرشّح إجمالاً
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))", gap: 12 }}>
        {programs.map(p => (
          <Link key={p.id} href={`/programs/${p.id}/nominations`}
            style={{ textDecoration: "none", display: "block" }}>
            <div style={{
              background: "#0f1419", border: "1px solid #1f2937", borderRadius: 10,
              padding: 14, borderRight: `3px solid ${KIND_COLORS[p.kind] || "#7A82A8"}`,
              cursor: "pointer", transition: "transform 0.1s",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f0", flex: 1 }}>{p.title_ar}</div>
                <span style={{ fontSize: 10, padding: "2px 8px", background: KIND_COLORS[p.kind] || "#7A82A8", color: "#fff", borderRadius: 4, whiteSpace: "nowrap" }}>
                  {KIND_LABELS[p.kind] || "—"}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 10 }}>
                {p.code || `#${p.id}`} {p.partner && <>· {p.partner}</>}
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4, fontSize: 11 }}>
                <Stat label="متقدّمون" value={p.submitted} color="#3F7DD9" />
                <Stat label="مراجعة" value={p.under_review} color="#FFB020" />
                <Stat label="انتظار" value={p.waitlist} color="#9333EA" />
                <Stat label="مقبول" value={p.accepted} color="#10B981" />
                <Stat label="حضر" value={p.attended} color="#00ABAF" />
                <Stat label="مرفوض" value={p.rejected} color="#EF4444" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ background: "#1a1f2e", padding: "6px 8px", borderRadius: 4, textAlign: "center" }}>
      <div style={{ color: "#64748b", fontSize: 10 }}>{label}</div>
      <div style={{ color: value > 0 ? color : "#475569", fontWeight: 600, fontSize: 14 }}>{value}</div>
    </div>
  );
}
