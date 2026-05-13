"use client";
import { useState, useEffect } from "react";

interface Tenant { id: string; name_ar: string; domain: string; }

export default function RegisterPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [form, setForm] = useState({ email: "", name_ar: "", name_en: "", tenant: "qtech", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{tenant_name:string} | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/register/tenants").then(r=>r.json()).then(d => {
      if (d.ok) {
        setTenants(d.tenants);
        if (d.tenants.length > 0 && !d.tenants.find((t:Tenant) => t.id === "qtech")) {
          setForm(f => ({...f, tenant: d.tenants[0].id}));
        }
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(form),
      });
      const data = await r.json();
      if (data.ok) setSubmitted(data);
      else setError(data.error || "حدث خطأ");
    } catch (e) { setError(String(e)); }
    setSubmitting(false);
  };

  const inputStyle = {width:"100%",padding:"11px 14px",borderRadius:8,border:"1px solid #1f2940",background:"#0a0e1a",color:"#fff",fontSize:13,fontFamily:"inherit"} as React.CSSProperties;
  const labelStyle = {display:"block",fontSize:12,fontWeight:600,marginBottom:6,color:"#cbd5e1"} as React.CSSProperties;

  if (submitted) {
    return (
      <div dir="rtl" style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0e1a,#1a1f3a)",display:"grid",placeItems:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
        <div style={{maxWidth:520,width:"100%",background:"#0f1424",border:"1px solid #1f2940",borderRadius:16,padding:36,color:"#fff",textAlign:"center"}}>
          <div style={{width:80,height:80,margin:"0 auto 18px",borderRadius:"50%",background:"linear-gradient(135deg,#1CC182,#00ABAF)",display:"grid",placeItems:"center",fontSize:40}}>✓</div>
          <h1 style={{fontSize:22,fontWeight:700,marginBottom:10}}>تم استلام طلبك</h1>
          <p style={{fontSize:14,color:"#94A3B8",marginBottom:18,lineHeight:1.7}}>
            طلب تسجيلك في <b style={{color:"#fff"}}>{submitted.tenant_name}</b> بإنتظار اعتماد المدير العام.
            <br/>سيتم تفعيل اشتراكك خلال 24-48 ساعة.
          </p>
          <div style={{background:"#0a0e1a",border:"1px solid #1f2940",borderRadius:8,padding:14,fontSize:12,color:"#94A3B8",marginBottom:18}}>
            💡 لا تحتاج لإعادة التسجيل لو رغبت بالانضمام لمنصات أخرى لاحقاً — حسابك واحد لكل المنصات
          </div>
          <a href="/" style={{display:"inline-block",padding:"10px 20px",background:"#0a0e1a",border:"1px solid #1f2940",borderRadius:8,color:"#00ABAF",textDecoration:"none",fontSize:13}}>الرجوع للصفحة الرئيسية</a>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0e1a,#1a1f3a)",display:"grid",placeItems:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:520,width:"100%",background:"#0f1424",border:"1px solid #1f2940",borderRadius:16,padding:32,color:"#fff",boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
        <div style={{textAlign:"center",marginBottom:24}}>
          <div style={{width:64,height:64,margin:"0 auto 14px",borderRadius:16,background:"linear-gradient(135deg,#00ABAF,#3F7DD9)",display:"grid",placeItems:"center",fontSize:30}}>🎯</div>
          <h1 style={{fontSize:22,fontWeight:700}}>تسجيل جديد</h1>
          <p style={{fontSize:13,color:"#94A3B8",marginTop:6}}>سجّل بإيميلك الشخصي. سيتم تفعيل اشتراكك بعد المراجعة</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:14}}>
            <label style={labelStyle}>المنصة *</label>
            <select value={form.tenant} onChange={e=>setForm({...form, tenant: e.target.value})} style={inputStyle as any}>
              {tenants.map(t => <option key={t.id} value={t.id}>{t.name_ar}</option>)}
              {tenants.length === 0 && <option value="">جارٍ التحميل...</option>}
            </select>
          </div>

          <div style={{marginBottom:14}}>
            <label style={labelStyle}>الإيميل *</label>
            <input type="email" required value={form.email} onChange={e=>setForm({...form, email: e.target.value})}
                   placeholder="example@gmail.com (أي إيميل شخصي)" style={inputStyle} dir="ltr"/>
          </div>

          <div style={{marginBottom:14}}>
            <label style={labelStyle}>الاسم الكامل (عربي) *</label>
            <input type="text" required maxLength={120} value={form.name_ar} onChange={e=>setForm({...form, name_ar: e.target.value})}
                   placeholder="مثلاً: خالد المحمد" style={inputStyle}/>
          </div>

          <div style={{marginBottom:14}}>
            <label style={labelStyle}>الاسم بالإنجليزي (اختياري)</label>
            <input type="text" maxLength={120} value={form.name_en} onChange={e=>setForm({...form, name_en: e.target.value})}
                   placeholder="Khaled AlMohammed" style={inputStyle} dir="ltr"/>
          </div>

          <div style={{marginBottom:18}}>
            <label style={labelStyle}>ملاحظات للمدير (اختياري)</label>
            <textarea maxLength={500} value={form.notes} onChange={e=>setForm({...form, notes: e.target.value})} rows={3}
                      placeholder="مثلاً: أعمل في إدارة المهارات الرقمية"
                      style={{...inputStyle, resize:"vertical"} as any}/>
          </div>

          {error && (
            <div style={{background:"#3a1424",border:"1px solid #5a2434",borderRadius:8,padding:12,marginBottom:14,fontSize:12,color:"#ff8090"}}>
              {error}
            </div>
          )}

          <button type="submit" disabled={submitting || !form.email || !form.name_ar || !form.tenant}
                  style={{width:"100%",padding:"14px",background: submitting ? "#64748B" : "linear-gradient(135deg,#00ABAF,#3F7DD9)",color:"#fff",border:0,borderRadius:10,fontSize:14,fontWeight:600,cursor: submitting ? "wait" : "pointer",fontFamily:"inherit"}}>
            {submitting ? "جارٍ التسجيل..." : "تسجيل + طلب الاعتماد"}
          </button>

          <div style={{textAlign:"center",marginTop:16,fontSize:12,color:"#64748B"}}>
            عندك حساب مسبقاً؟ <a href="/login" style={{color:"#00ABAF"}}>سجّل دخول</a>
          </div>
        </form>
      </div>
    </div>
  );
}
