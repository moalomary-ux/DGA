"use client";
import { useEffect, useState, useCallback } from "react";
import QIcon from "@/components/QIcon";

interface Agent { id: string; label: string; title_ar: string; title_en: string; icon: string; color: string; category: string; description: string; can_stop: boolean; critical: boolean; loaded: boolean; running: boolean; pid: number | null; exit_code: number | null; error?: string; }
interface AuditEntry { ts: string; actor: string; action: string; agent: string; status: string; }

const CATEGORIES = {
  intelligence: { ar: "ذكاء", color: "#7C32C9", icon: "sparkles" },
  data: { ar: "بيانات", color: "#FF8533", icon: "database" },
  communication: { ar: "تواصل", color: "#3F7DD9", icon: "chat" },
  infrastructure: { ar: "بنية تحتية", color: "#94A3B8", icon: "settings" },
};

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [logsModal, setLogsModal] = useState<{ agentId: string; logs: { file: string; lines: string[] }[] } | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const r = await fetch("/api/agent-control/list").then(r => r.json());
      if (r.ok) { setAgents(r.agents); setError(null); }
      else setError(r.error || "تعذّر الاتصال بالـ Bridge");
    } catch (e) { setError(`خطأ شبكة: ${e}`); }
    finally { setLoading(false); }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const r = await fetch("/api/agent-control/audit").then(r => r.json());
      if (r.ok) setAudit(r.entries || []);
    } catch {}
  }, []);

  useEffect(() => {
    fetchAgents(); fetchAudit();
    const t = setInterval(() => { fetchAgents(); fetchAudit(); }, 15000);
    return () => clearInterval(t);
  }, [fetchAgents, fetchAudit]);

  const action = async (id: string, act: "restart"|"start"|"stop") => {
    if (act === "stop" && !confirm(`إيقاف الوكيل ${id}؟`)) return;
    setBusy(id);
    try {
      const r = await fetch(`/api/agent-control/${id}/action`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      }).then(r => r.json());
      if (r.ok) { await fetchAgents(); await fetchAudit(); }
      else alert(`خطأ: ${r.error || "فشل العملية"}`);
    } catch (e) { alert(`خطأ: ${e}`); }
    finally { setBusy(null); }
  };

  const showLogs = async (id: string) => {
    setBusy(id);
    try {
      const r = await fetch(`/api/agent-control/${id}/logs?n=80`).then(r => r.json());
      if (r.ok) setLogsModal({ agentId: id, logs: r.logs || [] });
      else alert("لا توجد سجلات: " + r.error);
    } catch (e) { alert(`خطأ: ${e}`); }
    finally { setBusy(null); }
  };

  if (loading) return <div className="page" style={{padding:60,textAlign:"center"}}><div className="spin" style={{margin:"0 auto"}}/></div>;

  const grouped = agents.reduce((acc, a) => { (acc[a.category] = acc[a.category] || []).push(a); return acc; }, {} as Record<string, Agent[]>);
  const runningCount = agents.filter(a => a.running).length;

  return (
    <div className="page fade-in" dir="rtl">
      <div className="card" style={{background:"var(--grad-hero, linear-gradient(135deg,#7C32C9,#00ABAF))",border:0,marginBottom:16,color:"#fff"}}>
        <div className="card-body" style={{display:"flex",alignItems:"center",gap:16}}>
          <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"grid",placeItems:"center"}}><QIcon n="rocket" size={24}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,letterSpacing:".1em",fontFamily:"var(--font-en)",fontWeight:700,opacity:.85}}>AGENTS · OPERATIONS CENTER</div>
            <h1 style={{fontSize:20,fontWeight:700,marginTop:2}}>مركز عمليات الوكلاء</h1>
            <div style={{fontSize:12,opacity:.85,marginTop:4}}>{agents.length} وكيل · <b>{runningCount}</b> شغّال · مرتبط بـ Mac mini عبر WireGuard</div>
          </div>
          <button className="btn btn-ghost btn-sm" style={{width:"auto",background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.3)"}} onClick={()=>{ fetchAgents(); fetchAudit(); }}><QIcon n="refresh" size={12}/> تحديث</button>
        </div>
      </div>

      {error && (
        <div className="card" style={{borderInlineStart:"4px solid #E03A4D",marginBottom:16}}>
          <div className="card-body" style={{display:"flex",alignItems:"center",gap:12}}>
            <QIcon n="warning" size={20}/>
            <div>
              <b style={{fontSize:14,color:"#E03A4D"}}>تعذّر الاتصال بالـ Mac mini Bridge</b>
              <div style={{fontSize:12,color:"var(--text-3)",marginTop:4}}>{error}</div>
              <div style={{fontSize:11,color:"var(--text-3)",marginTop:6}}>تحقّق: WireGuard متصل؟ Bridge شغّال؟</div>
            </div>
          </div>
        </div>
      )}

      {Object.entries(grouped).map(([cat, list]) => {
        const meta = CATEGORIES[cat as keyof typeof CATEGORIES] || { ar: cat, color: "#94A3B8", icon: "info" };
        return (
          <div key={cat} style={{marginBottom:18}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,padding:"0 4px"}}>
              <QIcon n={meta.icon} size={14}/>
              <h3 style={{fontSize:13,fontWeight:600,color:meta.color}}>{meta.ar}</h3>
              <span style={{fontSize:11,color:"var(--text-3)"}}>· {list.length} وكيل</span>
            </div>
            <div className="row r-3" style={{margin:0}}>
              {list.map(a => <AgentCard key={a.id} a={a} busy={busy===a.id} onAction={action} onLogs={showLogs}/>)}
            </div>
          </div>
        );
      })}

      <div className="card" style={{marginTop:16}}>
        <div className="card-head"><h3>سجل النشاط <span className="mono" style={{opacity:.5,marginInlineStart:6}}>({audit.length})</span></h3></div>
        <div className="card-body tight">
          <table className="tbl">
            <thead><tr><th>الوقت</th><th>المُنفِّذ</th><th>الإجراء</th><th>الوكيل</th><th>الحالة</th></tr></thead>
            <tbody>
              {audit.slice(0, 30).map((e, i) => (
                <tr key={i}>
                  <td className="mono" style={{fontSize:10,color:"var(--text-3)"}}>{e.ts.slice(11,19)}</td>
                  <td style={{fontSize:11}}>{e.actor}</td>
                  <td><span className="pill muted" style={{fontSize:10}}>{e.action}</span></td>
                  <td style={{fontSize:11}}>{e.agent}</td>
                  <td><span className={`pill ${e.status.startsWith("OK")?"success":e.status.startsWith("BLOCKED")?"warning":"muted"}`} style={{fontSize:10}}>{e.status}</span></td>
                </tr>
              ))}
              {audit.length === 0 && <tr><td colSpan={5} style={{textAlign:"center",padding:20,color:"var(--text-3)"}}>لا توجد إجراءات بعد</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {logsModal && (
        <div onClick={()=>setLogsModal(null)} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",display:"grid",placeItems:"center",zIndex:1000,padding:20}}>
          <div onClick={e=>e.stopPropagation()} className="card" style={{maxWidth:900,width:"100%",maxHeight:"80vh",overflow:"auto"}}>
            <div className="card-head" style={{position:"sticky",top:0,background:"var(--bg-3)",zIndex:1}}>
              <h3>سجل: {logsModal.agentId}</h3>
              <button onClick={()=>setLogsModal(null)} style={{background:"none",border:0,cursor:"pointer",fontSize:18,color:"var(--text)"}}>✕</button>
            </div>
            <div className="card-body" style={{padding:0}}>
              {logsModal.logs.length === 0 ? <div style={{textAlign:"center",padding:30,color:"var(--text-3)"}}>لا توجد ملفات سجل</div> : logsModal.logs.map((f, i) => (
                <div key={i} style={{borderBottom:"1px solid var(--line)"}}>
                  <div style={{padding:"8px 14px",background:"var(--bg-2)",fontSize:11,color:"var(--text-3)",fontFamily:"var(--font-mono)"}}>📄 {f.file}</div>
                  <pre style={{padding:14,fontSize:11,fontFamily:"var(--font-mono)",lineHeight:1.5,color:"var(--text-2)",whiteSpace:"pre-wrap",margin:0}}>{f.lines.join("\n")}</pre>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AgentCard({ a, busy, onAction, onLogs }: { a: Agent; busy: boolean; onAction: (id: string, act: "restart"|"start"|"stop") => void; onLogs: (id: string) => void }) {
  const statusDot = a.running ? "#1CC182" : a.exit_code !== null && a.exit_code !== 0 ? "#E03A4D" : "#94A3B8";
  const statusText = a.running ? "شغّال" : a.exit_code !== null && a.exit_code !== 0 ? "خطأ" : "متوقف";

  return (
    <div className="card" style={{borderInlineStart:`3px solid ${a.color}`,transition:"all 240ms"}}>
      <div className="card-body" style={{padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
          <div style={{width:32,height:32,borderRadius:8,background:`${a.color}22`,color:a.color,display:"grid",placeItems:"center",flexShrink:0}}>
            <QIcon n={a.icon} size={16}/>
          </div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:statusDot,boxShadow:`0 0 8px ${statusDot}99`}}></span>
              <b style={{fontSize:13}}>{a.title_ar}</b>
              {a.critical && <span title="حرج" style={{fontSize:10}}>🔒</span>}
            </div>
            <div style={{fontSize:10,color:"var(--text-3)",fontFamily:"var(--font-en)"}}>{a.title_en}</div>
          </div>
          <span className={`pill ${a.running?"success":"muted"}`} style={{fontSize:10}}>{statusText}</span>
        </div>
        <div style={{fontSize:11,color:"var(--text-3)",marginBottom:10,minHeight:32,lineHeight:1.5}}>{a.description}</div>
        <div style={{display:"flex",gap:6,fontSize:10,color:"var(--text-3)",marginBottom:10}}>
          {a.pid && <span className="mono">PID {a.pid}</span>}
          {a.exit_code !== null && a.exit_code !== 0 && <span style={{color:"#E03A4D"}}>· exit {a.exit_code}</span>}
        </div>
        <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
          <button className="btn btn-ghost btn-sm" disabled={busy || a.critical} onClick={()=>onAction(a.id,"restart")} style={{width:"auto",fontSize:11}}>
            <QIcon n="refresh" size={11}/> {busy?"...":"إعادة تشغيل"}
          </button>
          {a.running ? (
            <button className="btn btn-ghost btn-sm" disabled={busy || !a.can_stop} onClick={()=>onAction(a.id,"stop")} style={{width:"auto",fontSize:11,color:"#E03A4D"}}>إيقاف</button>
          ) : (
            <button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>onAction(a.id,"start")} style={{width:"auto",fontSize:11,color:"#1CC182"}}>تشغيل</button>
          )}
          <button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>onLogs(a.id)} style={{width:"auto",fontSize:11}}>
            <QIcon n="file" size={11}/> السجل
          </button>
        </div>
      </div>
    </div>
  );
}
