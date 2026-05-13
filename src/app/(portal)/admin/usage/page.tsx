"use client";
import { useEffect, useState } from "react";
import QIcon from "@/components/QIcon";

interface Stat { total: number; users: number; tokens: number; }
interface UserUsage { name_ar: string; email: string; calls: number; tokens: number; }
interface ModelUsage { model: string; calls: number; tokens: number; }
interface DayUsage { day: string; calls: number; tokens: number; }

export default function UsagePage() {
  const [today, setToday] = useState<Stat | null>(null);
  const [week, setWeek] = useState<Stat | null>(null);
  const [month, setMonth] = useState<Stat | null>(null);
  const [byUser, setByUser] = useState<UserUsage[]>([]);
  const [byModel, setByModel] = useState<ModelUsage[]>([]);
  const [daily, setDaily] = useState<DayUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/usage").then(r => r.json()).then(r => {
      if (r.ok) {
        setToday(r.today); setWeek(r.week); setMonth(r.month);
        setByUser(r.byUser); setByModel(r.byModel); setDaily(r.daily);
      } else setError(r.error || "خطأ");
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="page" style={{padding:60,textAlign:"center"}}><div className="spin" style={{margin:"0 auto"}}/></div>;
  if (error) return <div className="page"><div className="card"><div className="card-body" style={{color:"#E03A4D"}}>⚠ {error}</div></div></div>;

  const maxDaily = Math.max(...daily.map(d => d.tokens), 1);

  return (
    <div className="page fade-in" dir="rtl">
      <div className="card" style={{background:"linear-gradient(135deg,#3F7DD9,#7C32C9)",border:0,marginBottom:14,color:"#fff"}}>
        <div className="card-body" style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"grid",placeItems:"center"}}><QIcon n="chart" size={22}/></div>
          <div>
            <div style={{fontSize:11,letterSpacing:".1em",fontFamily:"var(--font-en)",fontWeight:700,opacity:.85}}>AI USAGE · DASHBOARD</div>
            <h1 style={{fontSize:20,fontWeight:700,marginTop:2}}>لوحة استهلاك الذكاء الاصطناعي</h1>
            <div style={{fontSize:12,opacity:.85,marginTop:4}}>من يستخدم ماذا، كم، ومتى</div>
          </div>
        </div>
      </div>

      <div className="row r-3" style={{margin:0,marginBottom:14}}>
        {[
          { label:"اليوم", s:today, color:"#1CC182" },
          { label:"آخر 7 أيام", s:week, color:"#FF8533" },
          { label:"آخر 30 يوم", s:month, color:"#7C32C9" },
        ].map((card, i) => (
          <div key={i} className="card" style={{borderInlineStart:`3px solid ${card.color}`}}>
            <div className="card-body" style={{padding:14}}>
              <div style={{fontSize:11,color:"var(--text-3)",marginBottom:6}}>{card.label}</div>
              <div style={{display:"flex",gap:16}}>
                <div><b style={{fontSize:22,color:card.color}}>{card.s?.total || 0}</b><div style={{fontSize:10,color:"var(--text-3)"}}>استدعاء</div></div>
                <div><b style={{fontSize:22}}>{card.s?.users || 0}</b><div style={{fontSize:10,color:"var(--text-3)"}}>مستخدم</div></div>
                <div><b style={{fontSize:22}}>{(card.s?.tokens || 0).toLocaleString()}</b><div style={{fontSize:10,color:"var(--text-3)"}}>token</div></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Daily chart */}
      <div className="card" style={{marginBottom:14}}>
        <div className="card-head"><h3>الاستهلاك اليومي (14 يوم)</h3></div>
        <div className="card-body" style={{padding:"14px 18px"}}>
          {daily.length === 0 ? <div style={{color:"var(--text-3)",fontSize:12}}>لا توجد بيانات بعد</div> : (
            <div style={{display:"flex",alignItems:"flex-end",gap:6,height:120}}>
              {daily.map(d => (
                <div key={d.day} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <div title={`${d.tokens.toLocaleString()} tokens · ${d.calls} استدعاء`}
                       style={{width:"100%",height:`${(d.tokens / maxDaily) * 100}px`,minHeight:2,background:"linear-gradient(180deg,#7C32C9,#3F7DD9)",borderRadius:"4px 4px 0 0",transition:"all 240ms"}}/>
                  <div style={{fontSize:9,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>{d.day.slice(5)}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="row r-2" style={{margin:0}}>
        {/* By user */}
        <div className="card">
          <div className="card-head"><h3>أكثر المستخدمين استهلاكاً</h3></div>
          <div className="card-body tight">
            <table className="tbl">
              <thead><tr><th>المستخدم</th><th>استدعاءات</th><th>tokens</th></tr></thead>
              <tbody>
                {byUser.slice(0,10).map((u,i) => (
                  <tr key={i}>
                    <td><b style={{fontSize:12}}>{u.name_ar || u.email}</b><div style={{fontSize:10,color:"var(--text-3)"}}>{u.email}</div></td>
                    <td>{u.calls}</td>
                    <td><b>{u.tokens.toLocaleString()}</b></td>
                  </tr>
                ))}
                {byUser.length === 0 && <tr><td colSpan={3} style={{textAlign:"center",color:"var(--text-3)",padding:20}}>لا توجد بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* By model */}
        <div className="card">
          <div className="card-head"><h3>توزيع النماذج</h3></div>
          <div className="card-body tight">
            <table className="tbl">
              <thead><tr><th>النموذج</th><th>استدعاءات</th><th>tokens</th></tr></thead>
              <tbody>
                {byModel.map((m,i) => (
                  <tr key={i}>
                    <td><span className="mono" style={{fontSize:11}}>{m.model}</span></td>
                    <td>{m.calls}</td>
                    <td><b>{m.tokens.toLocaleString()}</b></td>
                  </tr>
                ))}
                {byModel.length === 0 && <tr><td colSpan={3} style={{textAlign:"center",color:"var(--text-3)",padding:20}}>لا توجد بيانات</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
