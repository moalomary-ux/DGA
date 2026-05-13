"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import QIcon from "@/components/QIcon";

interface Skill { name: string; description: string; category: string; source?: string; }
interface Cat { id: string; count: number; }

const CATEGORY_AR: Record<string, string> = {
  general: "عام", presentation: "عروض تقديمية", document: "وثائق", spreadsheet: "جداول",
  pdf: "PDF", communication: "تواصل", data: "بيانات", design: "تصميم", automation: "أتمتة", extraction: "قراءة واستخراج",
};

const CATEGORY_ICONS: Record<string, string> = {
  general: "info", presentation: "presentation", document: "file-text", spreadsheet: "grid",
  pdf: "file", communication: "mail", data: "database", design: "palette", automation: "settings", extraction: "search",
};

const PAGE_SIZE = 60;

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const fetchSkills = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (selectedCat) params.set("category", selectedCat);
      const r = await fetch(`/api/skills?${params}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (data.ok && Array.isArray(data.skills)) {
        setSkills(data.skills.filter((s: Skill) => s && s.name && typeof s.description === "string"));
        setVisibleCount(PAGE_SIZE);
      } else {
        setError(data.error || "خطأ في البيانات");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [q, selectedCat]);

  useEffect(() => {
    const t = setTimeout(fetchSkills, 300);
    return () => clearTimeout(t);
  }, [fetchSkills]);

  useEffect(() => {
    fetch("/api/skills/categories")
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(r => { if (r.ok && Array.isArray(r.categories)) setCats(r.categories); })
      .catch(() => {});
  }, []);

  const visibleSkills = useMemo(() => skills.slice(0, visibleCount), [skills, visibleCount]);
  const hasMore = visibleCount < skills.length;

  return (
    <div className="page fade-in" dir="rtl">
      <div className="card" style={{background:"linear-gradient(135deg,#7C32C9,#00ABAF)",border:0,marginBottom:14,color:"#fff"}}>
        <div className="card-body" style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:48,height:48,borderRadius:12,background:"rgba(255,255,255,0.2)",display:"grid",placeItems:"center"}}><QIcon n="sparkles" size={22}/></div>
          <div style={{flex:1}}>
            <div style={{fontSize:11,letterSpacing:".1em",fontFamily:"var(--font-en)",fontWeight:700,opacity:.85}}>SKILLS · CATALOG</div>
            <h1 style={{fontSize:20,fontWeight:700,marginTop:2}}>كتالوج المهارات</h1>
            <div style={{fontSize:12,opacity:.85,marginTop:4}}>{skills.length} مهارة جاهزة · مصدرها Mac mini عبر Bridge</div>
          </div>
        </div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",gap:14,alignItems:"flex-start"}}>
        <div className="card" style={{position:"sticky",top:14}}>
          <div className="card-head"><h3>الفئات</h3></div>
          <div className="card-body tight" style={{padding:6}}>
            <div onClick={() => setSelectedCat("")} style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:12,background:selectedCat===""?"var(--bg-2)":"transparent",marginBottom:2,display:"flex",justifyContent:"space-between"}}>
              <span style={{fontWeight:600}}>الكل</span>
              <span style={{color:"var(--text-3)",fontSize:11}}>{cats.reduce((a,c)=>a+(c.count||0), 0)}</span>
            </div>
            {cats.map(c => (
              <div key={c.id} onClick={() => setSelectedCat(c.id)} style={{padding:"8px 10px",borderRadius:6,cursor:"pointer",fontSize:12,background:selectedCat===c.id?"var(--bg-2)":"transparent",marginBottom:2,display:"flex",alignItems:"center",gap:6}}>
                <QIcon n={CATEGORY_ICONS[c.id] || "info"} size={12}/>
                <span style={{flex:1}}>{CATEGORY_AR[c.id] || c.id}</span>
                <span style={{color:"var(--text-3)",fontSize:11}}>{c.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{marginBottom:14}}>
            <input type="text" placeholder="🔍 ابحث في المهارات..." value={q} onChange={e=>setQ(e.target.value)}
                   style={{width:"100%",padding:"10px 14px",borderRadius:10,border:"1px solid var(--line)",background:"var(--bg-2)",color:"var(--text)",fontSize:13,fontFamily:"inherit"}}/>
          </div>

          {error && <div className="card" style={{borderInlineStart:"4px solid #E03A4D",marginBottom:14}}><div className="card-body">⚠ {error}</div></div>}

          {loading ? <div style={{padding:40,textAlign:"center"}}><div className="spin" style={{margin:"0 auto"}}/></div>
            : visibleSkills.length === 0 ? <div style={{padding:40,textAlign:"center",color:"var(--text-3)"}}>لا توجد مهارات مطابقة</div>
            : (
              <>
                <div className="row r-3" style={{margin:0}}>
                  {visibleSkills.map(s => (
                    <div key={s.name} className="card">
                      <div className="card-body" style={{padding:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                          <div style={{width:30,height:30,borderRadius:7,background:"var(--bg-2)",display:"grid",placeItems:"center",color:"var(--primary,#00ABAF)"}}>
                            <QIcon n={CATEGORY_ICONS[s.category] || "info"} size={14}/>
                          </div>
                          <div style={{flex:1,minWidth:0}}>
                            <b style={{fontSize:13,display:"block",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.name}</b>
                            <span style={{fontSize:10,color:"var(--text-3)"}}>{CATEGORY_AR[s.category] || s.category}</span>
                          </div>
                        </div>
                        <div style={{fontSize:11,color:"var(--text-2)",lineHeight:1.6,minHeight:48,maxHeight:64,overflow:"hidden"}}>{(s.description || "").slice(0,180)}</div>
                        <button className="btn btn-ghost btn-sm" style={{width:"100%",marginTop:8,fontSize:11}}
                                onClick={() => window.location.href = `/workspace?skill=${encodeURIComponent(s.name)}`}>
                          <QIcon n="play" size={11}/> استخدم في Workspace
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                
                {hasMore && (
                  <div style={{textAlign:"center",marginTop:16}}>
                    <button className="btn btn-ghost" style={{width:"auto",margin:"0 auto"}} onClick={() => setVisibleCount(c => c + PAGE_SIZE)}>
                      عرض المزيد ({skills.length - visibleCount} متبقّية)
                    </button>
                  </div>
                )}
                <div style={{textAlign:"center",fontSize:11,color:"var(--text-3)",marginTop:12}}>
                  عرض {Math.min(visibleCount, skills.length)} من {skills.length}
                </div>
              </>
            )
          }
        </div>
      </div>
    </div>
  );
}
