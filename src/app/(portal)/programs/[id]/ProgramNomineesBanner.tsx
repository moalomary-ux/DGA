"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Counts {
  total: number; submitted: number; under_review: number;
  waitlist: number; accepted: number; attended: number; rejected: number;
  nominations_open: boolean;
}

export default function ProgramNomineesBanner({ programId }: { programId: number | string }) {
  const [c, setC] = useState<Counts | null>(null);

  useEffect(() => {
    fetch(`/api/programs/${programId}/nominees-summary`)
      .then(r => r.json()).then(d => { if (d.ok) setC(d); }).catch(() => {});
  }, [programId]);

  if (!c) return null;
  const open = c.nominations_open !== false;

  return (
    <Link href={`/programs/${programId}/nominations`} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ background: "linear-gradient(135deg, #0f1419, #1a1f2e)", border: "1px solid #2a3142", borderRadius: 10, padding: 14, marginBottom: 16, cursor: "pointer" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>
            المرشّحون: {c.total}
            <span style={{ marginRight: 10, fontSize: 11, padding: "2px 8px", background: open ? "#10b981" : "#64748b", color: "#fff", borderRadius: 4 }}>
              {open ? "🟢 مفتوحة" : "🔒 مُقفلة"}
            </span>
          </div>
          <span style={{ fontSize: 11, color: "#00ABAF" }}>إدارة الترشيحات →</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 6 }}>
          <Stat label="متقدّمون" v={c.submitted} color="#3F7DD9" />
          <Stat label="مراجعة" v={c.under_review} color="#FFB020" />
          <Stat label="انتظار" v={c.waitlist} color="#9333EA" />
          <Stat label="مقبول" v={c.accepted} color="#10b981" />
          <Stat label="حضر" v={c.attended} color="#00ABAF" />
          <Stat label="مرفوض" v={c.rejected} color="#EF4444" />
        </div>
      </div>
    </Link>
  );
}

function Stat({ label, v, color }: { label: string; v: number; color: string }) {
  return (
    <div style={{ background: "#0f1419", padding: 8, borderRadius: 6, textAlign: "center" }}>
      <div style={{ fontSize: 10, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color: v > 0 ? color : "#475569" }}>{v || 0}</div>
    </div>
  );
}
