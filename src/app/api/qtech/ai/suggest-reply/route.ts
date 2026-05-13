import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const OLLAMA_URL = process.env.OLLAMA_HOST || 'http://10.10.10.2:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';

const SYSTEM_PROMPT = `أنت مساعد مهني لبرنامج "قدراتك" التابع لهيئة الحكومة الرقمية في السعودية. وظيفتك صياغة ردود رسمية مهذّبة على إيميلات ضباط الاتصال في الجهات الحكومية.

القواعد:
1. النبرة: رسمية ودودة بالعربية الفصحى
2. ابدأ بـ "الأستاذ/ة [الاسم] المحترم،" أو "تحية طيبة،"
3. اختم بـ "مع التحية،\\nفريق برنامج قدراتك\\nهيئة الحكومة الرقمية"
4. لا تضع توقيعاً إضافياً
5. لا تستخدم emojis
6. لا تذكر معلومات سرية (تكلفة، مزود الخدمة)
7. الرد قصير ومركّز (3-5 أسطر)
8. أرجع 3 خيارات للرد: قبول، اعتذار، طلب توضيح

أرجع JSON صحيح فقط بهذا الشكل:
{
  "options": [
    { "label": "قبول/تأكيد", "subject": "...", "body": "..." },
    { "label": "اعتذار/رفض مهذّب", "subject": "...", "body": "..." },
    { "label": "طلب توضيح", "subject": "...", "body": "..." }
  ]
}`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { inboundId } = body;

  if (!inboundId) return NextResponse.json({ error: 'inboundId required' }, { status: 400 });

  try {
    const [msg] = await db<any[]>`
      SELECT 
        qi.from_addr, qi.from_name, qi.subject, qi.body_text,
        l.name AS liaison_name, l.title AS liaison_title,
        o.name_ar AS org_name
      FROM qtech_inbound qi
      LEFT JOIN qtech_liaisons l ON l.id = qi.liaison_id
      LEFT JOIN qtech_orgs o ON o.id = l.org_id
      WHERE qi.id = ${parseInt(inboundId, 10)} LIMIT 1
    `;
    if (!msg) return NextResponse.json({ error: 'message not found' }, { status: 404 });

    const senderName = msg.liaison_name || msg.from_name || msg.from_addr.split('@')[0];
    const orgContext = msg.org_name ? `الجهة: ${msg.org_name}` : '';
    const titleContext = msg.liaison_title ? `المسمى: ${msg.liaison_title}` : '';

    const userPrompt = `الإيميل الوارد من ${senderName}.
${titleContext}
${orgContext}

الموضوع: ${msg.subject}

محتوى الإيميل:
${(msg.body_text || '').substring(0, 2000)}

اكتب 3 خيارات للرد على هذا الإيميل بصيغة JSON.`;

    const ollamaResp = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        format: 'json',
        options: { temperature: 0.6, num_ctx: 4096 },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!ollamaResp.ok) {
      const errTxt = await ollamaResp.text();
      return NextResponse.json({ error: 'ollama_error', detail: errTxt.substring(0, 300) }, { status: 502 });
    }

    const result = await ollamaResp.json();
    const content = result.message?.content || '';

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else return NextResponse.json({ error: 'parse_failed', raw: content.substring(0, 500) }, { status: 502 });
    }

    return NextResponse.json({
      suggestions: parsed.options || [],
      model: OLLAMA_MODEL,
      sender: { name: senderName, org: msg.org_name, title: msg.liaison_title },
    });
  } catch (e: any) {
    return NextResponse.json({
      error: 'ai_error',
      detail: e.message?.substring(0, 300) || 'Unknown',
    }, { status: 503 });
  }
}
