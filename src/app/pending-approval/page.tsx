export default function PendingApprovalPage() {
  return (
    <div style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"linear-gradient(135deg,#0A0A1F,#161640)",color:"#fff",direction:"rtl",fontFamily:"system-ui"}}>
      <div style={{maxWidth:480,padding:40,textAlign:"center"}}>
        <div style={{fontSize:60,marginBottom:20}}>⏳</div>
        <h1 style={{fontSize:24,fontWeight:700,marginBottom:12}}>حسابك قيد المراجعة</h1>
        <p style={{fontSize:14,color:"#94A3B8",lineHeight:1.7,marginBottom:30}}>
          شكراً لتسجيلك في منصة قدراتك. تمّ استلام طلبك وسيتم مراجعته من قبل الإدارة قريباً.
          ستصلك رسالة بالبريد عند الموافقة على حسابك.
        </p>
        <a href="/login" style={{display:"inline-block",padding:"10px 20px",background:"#00ABAF",color:"#fff",borderRadius:8,textDecoration:"none",fontSize:13}}>العودة لتسجيل الدخول</a>
      </div>
    </div>
  );
}
