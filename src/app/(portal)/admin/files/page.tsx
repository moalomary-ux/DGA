"use client";
import { useEffect, useState } from "react";
import QIcon from "@/components/QIcon";

interface UserStat { id:string; name_ar:string; email:string; vault_slug:string; file_count:number; total_bytes:number; last_upload:string|null; }
interface RecentFile { id:string; filename:string; mime_type:string; size_bytes:number; uploaded_at:string; user_name:string; }
interface DiskUser { slug:string; files:number; size_mb:number; }

function fmtSize(bytes:number) {
  const b = Number(bytes);
  if (b < 1024) return b + " B";
  if (b < 1024*1024) return (b/1024).toFixed(1) + " KB";
  return (b/(1024*1024)).toFixed(2) + " MB";
}
function fmtDate(iso:string|null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString('ar-SA', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
}

export default function AdminFilesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);

  useEffect(() => {
    fetch("/api/admin/files").then(r=>r.json()).then(d => {
      if (d.ok) setData(d); else setError(d.error || "فشل تحميل البيانات");
      setLoading(false);
    }).catch(e => { setError(String(e)); setLoading(false); });
  }, []);

  if (loading) return <div style={{padding:60,textAlign:"center"}}><div className="spin" style={{margin:"0 auto"}}/></div>;
  if (error) return <div className="card" style={{padding:40,margin:20}}><h3>خطأ</h3><p>{error}</p></div>;
  if (!data) return null;

  return (
    <div className="page fade-in" dir="rtl">
      <div className="card" style={{background:"linear-gradient(135deg,#7C32C9,#3F7DD9)",border:0,marginBottom:14,color:"#fff"}}>
        <div className="card-body" style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"grid",placeItems:"center"}}><QIcon n="database" size={22}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,letterSpacing:".1em",fontWeight:700,opacity:.85}}>ADMIN · VAULT OVERVIEW</div>
            <h1 style={{fontSize:20,fontWeight:700,marginTop:2}}>ملفات كل الموظفين — نافذة Mac mini</h1>
            <div style={{fontSize:12,opacity:.85,marginTop:4}}>{data.totals.users_count} موظف · {fmtSize(Number(data.totals.total_bytes))} مخزّن · {data.totals.total_files} ملف</div>
          </div>
        </div>
      </div>

      {data.lastMaintenance && data.lastMaintenance.timestamp && (
        <div className="card" style={{marginBottom:14,borderInlineStart:"3px solid #1CC182"}}>
          <div className="card-body" style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:14}}>
            <div>
              <b style={{fontSize:13}}>🔧 آخر صيانة تلقائية</b>
              <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>{fmtDate(data.lastMaintenance.timestamp)}</div>
              <div style={{fontSize:11,color:"var(--text-3)",marginTop:2}}>تعمل يومياً 3:00 ص · تنقل الملفات التي لم تُفتح منذ 90 يوم للأرشيف</div>
            </div>
            <div style={{display:"flex",gap:14,fontSize:12}}>
              <div><b style={{fontSize:16,color:"#1CC182"}}>{data.lastMaintenance.files_active||0}</b><div style={{color:"var(--text-3)",fontSize:10}}>نشط</div></div>
              <div><b style={{fontSize:16,color:"#FFB020"}}>{data.lastMaintenance.files_archived||0}</b><div style={{color:"var(--text-3)",fontSize:10}}>مؤرشف</div></div>
            </div>
          </div>
        </div>
      )}

      <div className="card" style={{marginBottom:14}}>
        <div className="card-head"><h3>الموظفون حسب الاستهلاك</h3></div>
        <div className="card-body tight">
          <table style={{width:"100%",fontSize:12}}>
            <thead><tr style={{borderBottom:"1px solid var(--line)",color:"var(--text-3)"}}>
              <th style={{textAlign:"start",padding:"8px 12px"}}>الموظف</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>slug</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>ملفات</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>الحجم</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>آخر رفع</th>
            </tr></thead>
            <tbody>{data.users.map((u:UserStat) => (
              <tr key={u.id} style={{borderBottom:"1px solid var(--line)"}}>
                <td style={{padding:"10px 12px"}}><b>{u.name_ar || u.email.split('@')[0]}</b><div style={{fontSize:10,color:"var(--text-3)"}}>{u.email}</div></td>
                <td style={{padding:"10px 12px",fontFamily:"monospace",fontSize:11,color:"var(--text-2)"}}>{u.vault_slug}</td>
                <td style={{padding:"10px 12px"}}>{u.file_count}</td>
                <td style={{padding:"10px 12px"}}>{fmtSize(Number(u.total_bytes))}</td>
                <td style={{padding:"10px 12px",fontSize:11,color:"var(--text-3)"}}>{fmtDate(u.last_upload)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      {data.diskScan && data.diskScan.users && data.diskScan.users.length > 0 && (
        <div className="card" style={{marginBottom:14}}>
          <div className="card-head"><h3>على القرص فعلياً</h3><span style={{fontSize:10,color:"var(--text-3)",fontFamily:"monospace"}}>~/sami-vault/users/</span></div>
          <div className="card-body tight">
            <table style={{width:"100%",fontSize:12}}>
              <thead><tr style={{borderBottom:"1px solid var(--line)",color:"var(--text-3)"}}>
                <th style={{textAlign:"start",padding:"8px 12px"}}>slug على القرص</th>
                <th style={{textAlign:"start",padding:"8px 12px"}}>ملفات</th>
                <th style={{textAlign:"start",padding:"8px 12px"}}>MB</th>
              </tr></thead>
              <tbody>{data.diskScan.users.map((u:DiskUser) => (
                <tr key={u.slug} style={{borderBottom:"1px solid var(--line)"}}>
                  <td style={{padding:"10px 12px",fontFamily:"monospace"}}>{u.slug}</td>
                  <td style={{padding:"10px 12px"}}>{u.files}</td>
                  <td style={{padding:"10px 12px"}}>{u.size_mb}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-head"><h3>أحدث الملفات (كل الموظفين)</h3></div>
        <div className="card-body tight">
          <table style={{width:"100%",fontSize:12}}>
            <thead><tr style={{borderBottom:"1px solid var(--line)",color:"var(--text-3)"}}>
              <th style={{textAlign:"start",padding:"8px 12px"}}>الملف</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>النوع</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>الحجم</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>الموظف</th>
              <th style={{textAlign:"start",padding:"8px 12px"}}>تاريخ</th>
            </tr></thead>
            <tbody>{data.recent.map((f:RecentFile) => (
              <tr key={f.id} style={{borderBottom:"1px solid var(--line)"}}>
                <td style={{padding:"10px 12px"}}><b>{f.filename}</b></td>
                <td style={{padding:"10px 12px",fontSize:10,color:"var(--text-3)"}}>{f.mime_type}</td>
                <td style={{padding:"10px 12px"}}>{fmtSize(Number(f.size_bytes))}</td>
                <td style={{padding:"10px 12px"}}>{f.user_name}</td>
                <td style={{padding:"10px 12px",fontSize:11,color:"var(--text-3)"}}>{fmtDate(f.uploaded_at)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
