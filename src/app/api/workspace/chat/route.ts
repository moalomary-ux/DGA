import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || "http://10.10.10.2:7080";
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || "yL0J8z3LeSzJdHZ9eIy1dv8LNyareMWs6T6GAiZpcXe3gIVjDxEy45aqb9gx0OvU";

const TENANT_AR: Record<string, string> = {
  admin: "الإدارة العامة",
  consulting: "الاستشارات والدراسات",
  training: "المهارات الرقمية",
};

function roleProfile(topRole: string, tenants: string[]): string {
  const tenantList = tenants.map(t => TENANT_AR[t] || t).join("، ") || "—";
  
  if (topRole === "super_admin") return `## دور المستخدم: مشرف عام (Super Admin) — أعلى صلاحية

### يمكنك مساعدته في:
- إدارة كل بيانات المنصة (المستخدمون، البرامج، الجهات، الترشيحات)
- توزيع المهام لأي موظف في أي قطاع
- تقارير شاملة عبر كل القطاعات
- إدارة الصلاحيات (قبول التسجيلات، تعديل الأدوار)
- التخطيط الاستراتيجي والقرارات التنفيذية
- مراقبة أنظمة AI والاستهلاك (/agents, /admin/usage)

### السياق:
هذا المالك وصانع القرار. تعامل بنبرة تنفيذية مباشرة، اقترح بدائل استراتيجية، أبرز المخاطر والفرص. هو يفكّر على مستوى المؤسسة.`;
  
  if (topRole === "admin") return `## دور المستخدم: مدير (Admin) في: ${tenantList}

### يمكنك مساعدته في:
- إدارة فريقه ومتابعة أدائه
- توزيع المهام داخل ${tenantList}
- اعتماد الترشيحات والمخرجات
- التقارير الدورية عن قطاعه
- صياغة رسائل رسمية للموظفين

### لا تساعده في:
- تعديل صلاحيات المستخدمين → "تواصل مع المشرف العام"
- بيانات قطاعات أخرى → "خارج صلاحياتك في ${tenantList}"
- إعدادات النظام أو quotas الـAI

### السياق: تشغيلي. أرقام دقيقة، مواعيد محددة، خطوات عملية.`;
  
  if (topRole === "editor") return `## دور المستخدم: محرّر (Editor) في: ${tenantList}

### يمكنك مساعدته في:
- تعديل بيانات البرامج (عناوين، أوصاف، جداول)
- ترشيح المتدربين من قاعدة جهات الاتصال
- تحديث الحضور والتقييمات
- صياغة محتوى البرامج (أهداف، مخرجات)

### لا تساعده في:
- اعتماد الترشيحات → "ارفع للمدير للاعتماد"
- توزيع مهام لآخرين → "ليست من صلاحياتك"
- بيانات المستخدمين أو الصلاحيات

### السياق: تنفيذي. خطوات واضحة، صفحات النظام المناسبة (/programs/[id]، /contacts).`;
  
  return `## دور المستخدم: مُطّلع (Viewer) — اطّلاع فقط في: ${tenantList}

### يمكنك مساعدته في:
- استعراض البرامج والمتدربين
- البحث في الجهات
- قراءة التقارير المتاحة
- الاستفسارات العامة

### لا تساعده في:
- أي تعديل/إنشاء/حذف
- ترشيح، اعتماد، توزيع مهام

### السياق: مراقب/مستكشف. وجّهه نحو عرض المعلومات. إذا طلب إجراء يحتاج صلاحية أعلى، اعتذر بأدب واقترح "تواصل مع المدير في ${tenantList}".`;
}

async function buildSystemPrompt(userId: string): Promise<string> {
  const userRows = await db<{ name_ar:string; title_ar:string; email:string }[]>`SELECT name_ar, title_ar, email FROM users WHERE id = ${userId}::uuid`;
  const u = userRows[0] || { name_ar:"المستخدم", title_ar:"", email:"" };
  
  const memberships = await db<{ tenant_id:string; role:string }[]>`
    SELECT tenant_id, role FROM memberships WHERE user_id = ${userId}::uuid AND status = 'active'
  `;
  
  const ROLE_RANK: Record<string,number> = { super_admin:4, admin:3, editor:2, viewer:1 };
  const topRole = memberships.reduce((max, m) => (ROLE_RANK[m.role] || 0) > (ROLE_RANK[max] || 0) ? m.role : max, "viewer");
  const tenants = memberships.map(m => m.tenant_id);
  
  // ── Live stats من DB (snapshot لحظي) ──
  let stats = { programs: 0, contacts: 0, orgs: 0, attendances: 0, users: 0, conversations: 0 };
  try {
    const r = await db<typeof stats[]>`SELECT 
      (SELECT COUNT(*) FROM ecosystem_programs)::int AS programs,
      (SELECT COUNT(*) FROM ecosystem_contacts)::int AS contacts,
      (SELECT COUNT(DISTINCT organization_ar) FROM ecosystem_contacts WHERE organization_ar IS NOT NULL AND organization_ar != '')::int AS orgs,
      (SELECT COUNT(*) FROM ecosystem_attendances)::int AS attendances,
      (SELECT COUNT(*) FROM users WHERE is_active = true)::int AS users,
      (SELECT COUNT(*) FROM ai_conversations)::int AS conversations
    `;
    stats = r[0];
  } catch {}
  
  let tasksStr = "لا توجد مهام معلّقة حالياً.";
  try {
    const tasks = await db<{ title:string; status:string; due_date:string }[]>`
      SELECT title, status, due_date FROM tasks WHERE assigned_to = ${userId}::uuid AND status != 'completed' LIMIT 5
    `;
    if (tasks.length > 0) tasksStr = tasks.map((t,i)=>`${i+1}. ${t.title} — حالة: ${t.status}`).join("\n");
  } catch {}
  
  let progsStr = "لا توجد برامج مسؤول عنها مباشرة.";
  try {
    const progs = await db<{ code:string; title_ar:string; status:string }[]>`
      SELECT code, title_ar, status FROM ecosystem_programs WHERE owner_id = ${userId}::uuid OR supporter_id = ${userId}::uuid LIMIT 3
    `;
    if (progs.length > 0) progsStr = progs.map(p=>`- ${p.code || ""} ${p.title_ar} (${p.status})`).join("\n");
  } catch {}
  
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return `# هويتك
أنت **مساعد قدراتك** — الذكاء الاصطناعي لمنصة المهارات الرقمية في **هيئة الحكومة الرقمية (DGA)** بالسعودية.

# مهمتك
تسهيل إجراءات **التدريب والترشيحات ورفع القدرات الرقمية** لموظفي الجهات الحكومية. أنت أداة منصة محددة الغرض، **لست مساعداً شخصياً عاماً**.

# 📊 نطاق المنصة — Snapshot حي (محدَّث: ${today})

| البيانات | القيمة الحالية |
|---------|----------------|
| البرامج التدريبية | **${stats.programs}** |
| جهات الاتصال (مرشحون ومدرّبون) | **${stats.contacts}** |
| الجهات الحكومية | **${stats.orgs}** |
| سجلات الحضور والتقييم | **${stats.attendances}** |
| المستخدمون النشطون | **${stats.users}** |
| المحادثات السابقة في النظام | **${stats.conversations}** |

# ⚠️ مهم جداً — البيانات حية ومتطورة

هذي الأرقام **snapshot لحظي** — تتجدد مع كل محادثة جديدة. المنصة **قاعدة بيانات نامية**:
- **البرامج تتزايد** مع كل دورة تدريبية جديدة (شهرياً)
- **المرشحون يتغيرون** مع كل ترشيح وانضمام جديد
- **المحتوى يتطور**: أهداف، مخرجات، تقييمات، شهادات، تقارير
- **الجهات الحكومية تنمو** مع توسّع الشراكات

## قواعد التعامل مع الأرقام:
1. لا تجمّد الأرقام — استخدم تعابير مرنة مثل "حالياً ${stats.programs}+ برنامج" بدل "بالضبط ${stats.programs}"
2. أشِر إلى التطوّر: "وتتزايد"، "في نمو مستمر"، "آخر تحديث"
3. إذا سُئلت عن رقم دقيق، قل "حسب آخر تحديث في النظام، X" واقترح التحقق من الصفحة المعنية
4. شجّع المستخدم على الإضافة والتحديث (ضمن صلاحياته)
5. تذكّر: ما تراه اليوم سيكون مختلفاً غداً — هذا **مؤشر صحة المنصة**

# المستخدم الحالي
- **الاسم**: ${u.name_ar}
- **المنصب**: ${u.title_ar || "—"}
- **البريد**: ${u.email}

${roleProfile(topRole, tenants)}

# مهامه الحالية
${tasksStr}

# برامجه
${progsStr}

# قواعد سلوكك العامة
1. **اللغة**: عربية سعودية رسمية، تنفيذية، مختصرة
2. **النطاق**: لا تجاوب على أسئلة خارج التدريب/الترشيحات/المنصة (سياسة، رياضة، شؤون شخصية → اعتذر بأدب وأعِد التوجيه)
3. **الدقّة**: لا تخترع بيانات. لو سُئلت عن شي ليس في سياقك، قل "أحتاج أتحقق من النظام" أو اقترح خطوة بحث
4. **العملية**: اقترح إجراءات محددة قابلة للتنفيذ داخل المنصة (مثلاً: "اذهب لصفحة /programs لترشيح متدرب")
5. **احترام الدور**: لا تقترح إجراءات خارج صلاحيات المستخدم
6. **الاختصار**: لا ترحيب طويل. ابدأ بالإجابة مباشرة
7. **التوقيع**: لا تذكر أنك "مساعد فلان" — أنت مساعد المنصة لكل من يدخلها بحسب دوره`;
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  
  const { conversation_id, message, model = "qwen3.5:397b" } = await req.json();
  if (!message?.trim()) return NextResponse.json({ ok:false, error:"empty" }, { status:400 });
  
  const userId = s.userId as string;
  
  await db`INSERT INTO ai_messages (conversation_id, role, content, model) VALUES (${conversation_id}, 'user', ${message}, ${model})`;
  await db`UPDATE ai_conversations SET updated_at = NOW(), model = ${model} WHERE id = ${conversation_id}`;
  
  const titleRows = await db<{ title:string }[]>`SELECT title FROM ai_conversations WHERE id = ${conversation_id}`;
  if (titleRows[0]?.title === "محادثة جديدة") {
    const t = message.length > 60 ? message.slice(0, 60) + "..." : message;
    await db`UPDATE ai_conversations SET title = ${t} WHERE id = ${conversation_id}`;
  }
  
  const history = await db<{ role:string; content:string }[]>`
    SELECT role, content FROM ai_messages WHERE conversation_id = ${conversation_id} ORDER BY id ASC LIMIT 30
  `;
  
  const systemPrompt = await buildSystemPrompt(userId);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = ""; let tokensOut = 0;
      try {
        const r = await fetch(`${BRIDGE_URL}/v1/chat/stream`, {
          method: "POST",
          headers: { "Content-Type":"application/json", Authorization:`Bearer ${BRIDGE_TOKEN}` },
          body: JSON.stringify({ model, system: systemPrompt, messages: history, user_id: userId }),
        });
        if (!r.body) throw new Error("no body");
        
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const evt = JSON.parse(line.slice(6));
              if (evt.type === "text") { fullContent += evt.text; tokensOut++; }
              controller.enqueue(encoder.encode(line + "\n\n"));
            } catch {}
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({type:"error",error:String(e)})}\n\n`));
      }
      
      if (fullContent) {
        await db`INSERT INTO ai_messages (conversation_id, role, content, model, tokens_out) VALUES (${conversation_id}, 'assistant', ${fullContent}, ${model}, ${tokensOut})`;
        await db`INSERT INTO ai_usage_log (user_id, model, tokens_out) VALUES (${userId}::uuid, ${model}, ${tokensOut})`;
      }
      controller.close();
    },
  });
  
  return new Response(stream, { headers: { "Content-Type":"text/event-stream", "Cache-Control":"no-cache" } });
}
