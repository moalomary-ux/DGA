"use client";

export default function PendingPage() {
  return (
    <div dir="rtl" style={{minHeight:"100vh",background:"linear-gradient(135deg,#0a0e1a,#1a1f3a)",display:"grid",placeItems:"center",padding:20,fontFamily:"system-ui,sans-serif"}}>
      <div style={{maxWidth:520,width:"100%",background:"#0f1424",border:"1px solid #1f2940",borderRadius:16,padding:36,color:"#fff",textAlign:"center"}}>
        <div style={{width:80,height:80,margin:"0 auto 18px",borderRadius:"50%",background:"linear-gradient(135deg,#FFB020,#FF8533)",display:"grid",placeItems:"center",fontSize:36}}>⏳</div>
        <h1 style={{fontSize:22,fontWeight:700,marginBottom:10}}>بإنتظار التفعيل</h1>
        <p style={{fontSize:14,color:"#94A3B8",marginBottom:18,lineHeight:1.7}}>
          حسابك مسجّل بنجاح ولكنه بإنتظار اعتماد المدير العام.
          <br/>سيتم التواصل معك عند تفعيل اشتراكك.
        </p>
        <div style={{display:"flex",gap:8,justifyContent:"center"}}>
          <a href="/login" style={{padding:"10px 18px",background:"#0a0e1a",border:"1px solid #1f2940",borderRadius:8,color:"#00ABAF",textDecoration:"none",fontSize:13}}>تسجيل دخول</a>
          <a href="/" style={{padding:"10px 18px",background:"#0a0e1a",border:"1px solid #1f2940",borderRadius:8,color:"#94A3B8",textDecoration:"none",fontSize:13}}>الصفحة الرئيسية</a>
        </div>
      </div>
    </div>
  );
}
