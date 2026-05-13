"use client";
import { useEffect, useState, use } from "react";

interface ShareData {
  token: string; expires_at: string; max_downloads: number | null; download_count: number;
  status: string; recipient_hint: string | null; message: string | null;
  filename: string; mime_type: string; size_bytes: number; sender_name: string;
}

function fmtSize(b: number) {
  const n = Number(b);
  if (n < 1024) return n + " B";
  if (n < 1024*1024) return (n/1024).toFixed(1) + " KB";
  return (n/(1024*1024)).toFixed(2) + " MB";
}

function fmtTimeRemaining(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "منتهي";
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  if (days > 0) return `${days} يوم${hours > 0 ? ` و ${hours} ساعة` : ""}`;
  const mins = Math.floor((ms % 3600000) / 60000);
  return hours > 0 ? `${hours} ساعة و ${mins} دقيقة` : `${mins} دقيقة`;
}

export default function SharePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<ShareData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}`).then(r=>r.json()).then(d => {
      if (d.ok) setData(d.share); else setError(d.error || "خطأ");
      setLoading(false);
    }).catch(e => { setError(String(e)); setLoading(false); });
  }, [token]);

  const handleDownload = () => {
    setDownloading(true);
    window.location.href = `/api/share/${token}/download`;
    setTimeout(() => {
      setDownloading(false);
      fetch(`/api/share/${token}`).then(r=>r.json()).then(d => { if (d.ok) setData(d.share); });
    }, 2000);
  };

  if (loading) return <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#0a0e1a"}}><div style={{color:"#fff"}}>جارٍ التحميل...</div></div>;

  const isActive = data?.status === 'active' && new Date(data.expires_at) > new Date();
  const remaining = data?.max_downloads ? data.max_downloads - data.download_count : null;

  return (
    <div dir="rtl" style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0e1a,#1a1f3a)",display:"grid",placeItems:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:520,width:"100%",background:"#0f1424",border:"1px solid #1f2940",borderRadius:16,padding:32,color:"#fff",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:64,height:64,margin:"0 auto 16px",borderRadius:16,background:"linear-gradient(135deg,#00ABAF,#3F7DD9)",display:"grid",placeItems:"center",fontSize:32}}>📎</div>
          <h1 style={{fontSize:20,fontWeight:700,margin:0}}>ملف مشترك معك</h1>
          {data && <div style={{fontSize:13,color:"#94A3B8",marginTop:6}}>من {data.sender_name}</div>}
        </div>

        {error ? (
          <div style={{background:"#3a1424",border:"1px solid #5a2434",borderRadius:10,padding:20,textAlign:"center"}}>
            <div style={{fontSize:32,marginBottom:8}}>⚠️</div>
            <div style={{fontSize:14,color:"#ff8090"}}>{error}</div>
          </div>
        ) : data ? (
          <>
            <div style={{background:"#0a0e1a",border:"1px solid #1f2940",borderRadius:10,padding:20,marginBottom:20}}>
              <div style={{fontSize:15,fontWeight:600,marginBottom:8,wordBreak:"break-word"}}>{data.filename}</div>
              <div style={{display:"flex",gap:12,fontSize:12,color:"#94A3B8"}}>
                <span>{fmtSize(data.size_bytes)}</span>
                <span>•</span>
                <span style={{fontFamily:"monospace"}}>{data.mime_type}</span>
              </div>
            </div>

            {data.message && (
              <div style={{background:"#1a1f3a",borderRadius:10,padding:14,marginBottom:20,fontSize:13,fontStyle:"italic",color:"#cbd5e1"}}>
                💬 {data.message}
              </div>
            )}

            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:24,fontSize:12}}>
              <div style={{background:"#0a0e1a",borderRadius:8,padding:12,textAlign:"center"}}>
                <div style={{color:"#94A3B8",marginBottom:4}}>المدة المتبقية</div>
                <b style={{color: isActive ? "#1CC182" : "#FF6080",fontSize:13}}>{fmtTimeRemaining(data.expires_at)}</b>
              </div>
              <div style={{background:"#0a0e1a",borderRadius:8,padding:12,textAlign:"center"}}>
                <div style={{color:"#94A3B8",marginBottom:4}}>تحميلات</div>
                <b style={{fontSize:13}}>
                  {data.download_count}{data.max_downloads ? ` / ${data.max_downloads}` : " (غير محدود)"}
                </b>
              </div>
            </div>

            {isActive ? (
              <button onClick={handleDownload} disabled={downloading}
                      style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#00ABAF,#3F7DD9)",color:"#fff",border:0,borderRadius:10,fontSize:15,fontWeight:600,cursor:"pointer",opacity:downloading ? 0.6 : 1}}>
                {downloading ? "جارٍ التحميل..." : "⬇ تحميل الملف"}
              </button>
            ) : (
              <div style={{background:"#3a1424",border:"1px solid #5a2434",borderRadius:10,padding:16,textAlign:"center",fontSize:13,color:"#ff8090"}}>
                هذا الرابط لم يعد متاحاً
              </div>
            )}

            <div style={{marginTop:20,paddingTop:20,borderTop:"1px solid #1f2940",fontSize:11,color:"#64748B",textAlign:"center"}}>
              قدراتك · رابط آمن مؤقّت
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
