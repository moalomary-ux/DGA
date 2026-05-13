"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import QIcon, { fmt, useCounter } from "@/components/QIcon";

const KIND_META: Record<string, { ar: string; color: string }> = {
  local: { ar: "محلي", color: "#3F7DD9" },
  international: { ar: "دولي", color: "#7C32C9" },
  workshop: { ar: "ورش عمل", color: "#FF8533" },
  virtual: { ar: "ندوات", color: "#00ABAF" },
};

export default function ReportsPage() {
  const router = useRouter();
  const [data, setData] = useState<{ totals: { programs: number; people: number; attendances: number; completed: number }; byType: { program_type: string; cnt: number }[]; byYear: { yr: number; cnt: number }[]; byCategory: { category: string; cnt: number }[]; topOrgs: { name: string; cnt: number }[]; topPrograms: { id: number; title_ar: string; code: string; cnt: number; program_type: string }[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setData(d);
        else setError(d.error || "فشل تحميل التقارير");
      })
      .catch(e => setError("خطأ شبكة: " + e.message));
  }, []);

  if (error) return (
    <div className="page" style={{padding:30}}>
      <div className="card" style={{borderInlineStart:"4px solid #E03A4D"}}>
        <div className="card-body">
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <QIcon n="warning" size={20}/>
            <h2 style={{fontSize:18,fontWeight:600}}>تعذّر تحميل التقارير</h2>
          </div>
          <pre style={{background:"var(--bg-2)",padding:12,borderRadius:8,fontSize:12,color:"var(--text-2)"}}>{error}</pre>
        </div>
      </div>
    </div>
  );

  if (!data) return <div className="page" style={{padding:60,textAlign:"center"}}><div className="spin" style={{margin:"0 auto"}}/></div>;

  const { totals, byType, byYear, topOrgs, topPrograms } = data;
  const completionRate = totals.attendances > 0 ? Math.round((totals.completed / totals.attendances) * 100) : 0;

  return (
    <div className="page fade-in" dir="rtl">
      <div style={{marginBottom:16}}>
        <div style={{fontSize:11,color:"var(--text-3)",letterSpacing:".1em",fontFamily:"var(--font-en)",fontWeight:700,marginBottom:4}}>ANALYTICS &amp; REPORTS</div>
        <h1 style={{fontSize:22,fontWeight:700}}>التقارير والتحليلات</h1>
        <div style={{fontSize:12,color:"var(--text-3)",marginTop:4}}>نظرة شاملة على البرامج والمتدربين والجهات</div>
      </div>

      {/* KPI cards */}
      <div className="row r-4" style={{margin:0,marginBottom:16}}>
        <KPI v={totals.programs} t="إجمالي البرامج" sub="برنامج تدريبي" color="#7C32C9" icon="book"/>
        <KPI v={totals.people} t="إجمالي المتدربين" sub="جهة اتصال" color="#3F7DD9" icon="users"/>
        <KPI v={totals.attendances} t="مرات الحضور" sub="تسجيل" color="#FF8533" icon="check2"/>
        <KPI v={completionRate} t="نسبة الإكمال" sub="%" color="#1CC182" icon="award" suffix="%"/>
      </div>

      {/* By type chart */}
      <div className="row r-2-1" style={{margin:0,marginBottom:16}}>
        <div className="card">
          <div className="card-head"><h3>توزيع البرامج حسب النوع</h3></div>
          <div className="card-body">
            {byType.map(t => {
              const meta = KIND_META[t.program_type] || { ar: t.program_type, color: "#94A3B8" };
              const max = Math.max(...byType.map(x => x.cnt), 1);
              const pct = (t.cnt / max) * 100;
              return (
                <div key={t.program_type} style={{marginBottom:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
                    <span style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{width:10,height:10,borderRadius:"50%",background:meta.color}}></span>
                      {meta.ar}
                    </span>
                    <span className="mono" style={{color:"var(--text-2)",fontWeight:600}}>{t.cnt}</span>
                  </div>
                  <div style={{height:8,background:"var(--bg-2)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:meta.color,borderRadius:99,transition:"width 800ms cubic-bezier(0.4,0,0.2,1)"}}/>
                  </div>
                </div>
              );
            })}
            {byType.length === 0 && <div style={{textAlign:"center",padding:20,color:"var(--text-3)"}}>—</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>البرامج عبر السنوات</h3></div>
          <div className="card-body">
            {byYear.slice(0, 6).map(y => {
              const max = Math.max(...byYear.map(x => x.cnt), 1);
              const pct = (y.cnt / max) * 100;
              return (
                <div key={y.yr} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                    <span className="mono">{y.yr}</span>
                    <span className="mono" style={{color:"var(--text-2)"}}>{y.cnt}</span>
                  </div>
                  <div style={{height:6,background:"var(--bg-2)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"var(--grad-1, #00ABAF)",borderRadius:99,transition:"width 800ms"}}/>
                  </div>
                </div>
              );
            })}
            {byYear.length === 0 && <div style={{textAlign:"center",padding:20,color:"var(--text-3)"}}>—</div>}
          </div>
        </div>
      </div>

      {/* Top programs + Top orgs */}
      <div className="row r-2-1" style={{margin:0}}>
        <div className="card">
          <div className="card-head">
            <h3>أكثر البرامج استقطاباً</h3>
            <button className="btn btn-ghost btn-sm" style={{width:"auto"}} onClick={()=>router.push("/programs")}>عرض الكل ←</button>
          </div>
          <div className="card-body tight">
            <table className="tbl">
              <thead><tr><th>الرمز</th><th>البرنامج</th><th>النوع</th><th>الحضور</th></tr></thead>
              <tbody>
                {topPrograms.map(p => {
                  const meta = KIND_META[p.program_type] || { ar: p.program_type, color: "#94A3B8" };
                  return (
                    <tr key={p.id} onClick={()=>router.push(`/programs/${p.id}`)} style={{cursor:"pointer"}}>
                      <td className="code">{p.code || `#${p.id}`}</td>
                      <td className="name">{p.title_ar}</td>
                      <td><span style={{fontSize:11,color:meta.color}}>{meta.ar}</span></td>
                      <td className="mono"><b>{p.cnt}</b></td>
                    </tr>
                  );
                })}
                {topPrograms.length === 0 && <tr><td colSpan={4} style={{textAlign:"center",padding:30,color:"var(--text-3)"}}>—</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><h3>أبرز الجهات المشاركة</h3></div>
          <div className="card-body">
            {topOrgs.slice(0, 8).map((o, i) => {
              const max = topOrgs[0]?.cnt || 1;
              const pct = (o.cnt / max) * 100;
              return (
                <div key={i} style={{marginBottom:10}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:12}}>
                    <span style={{maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{o.name}</span>
                    <span className="mono" style={{color:"var(--text-2)",fontWeight:600}}>{o.cnt}</span>
                  </div>
                  <div style={{height:5,background:"var(--bg-2)",borderRadius:99,overflow:"hidden"}}>
                    <div style={{height:"100%",width:`${pct}%`,background:"var(--grad-purple, #7C32C9)",borderRadius:99,transition:"width 800ms"}}/>
                  </div>
                </div>
              );
            })}
            {topOrgs.length === 0 && <div style={{textAlign:"center",padding:20,color:"var(--text-3)"}}>—</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ v, t, sub, color, icon, suffix = "" }: { v: number; t: string; sub: string; color: string; icon: string; suffix?: string }) {
  const animated = useCounter(v);
  return (
    <div className="card" style={{borderInlineStart:`3px solid ${color}`,transition:"all 240ms"}}>
      <div className="card-body" style={{padding:16}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div style={{fontSize:11,color:"var(--text-3)",fontWeight:600}}>{t}</div>
          <div style={{width:32,height:32,borderRadius:8,background:`${color}22`,color:color,display:"grid",placeItems:"center"}}>
            <QIcon n={icon} size={16}/>
          </div>
        </div>
        <div className="mono" style={{fontSize:28,fontWeight:700,color:color}}>{fmt(animated)}{suffix}</div>
        <div style={{fontSize:11,color:"var(--text-3)",marginTop:4}}>{sub}</div>
      </div>
    </div>
  );
}
