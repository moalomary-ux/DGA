import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SYSTEM_PROMPT = `أنت "قدراتك الذكي" — مساعد منصة قدراتك للقدرات الرقمية في هيئة الحكومة الرقمية السعودية.

معلومات السياق:
- المنصة تدير 284 برنامجاً تدريبياً، 395 جهة حكومية، 4020 جهة اتصال
- المستخدم: محمد العُمري، المدير العام للقدرات الرقمية
- الإجابات بالعربية السعودية، مباشرة، تنفيذية، 3-4 أسطر كحد أقصى
- إذا سُئلت عن بيانات محددة (برامج/أشخاص/جهات)، اطلب من المستخدم استخدام صفحة البحث المخصصة`;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const { message, model = 'claude-sonnet' } = await req.json();
  if (!message || typeof message !== 'string') {
    return NextResponse.json({ ok: false, error: 'invalid_message' }, { status: 400 });
  }

  // المحاولة 1: Hermes Bridge على Mac mini
  const bridgeUrl = process.env.HERMES_BRIDGE_URL || 'http://10.10.10.2:7080';
  const bridgeToken = process.env.SAMI_BRIDGE_TOKEN;
  if (bridgeToken) {
    try {
      const r = await fetch(`${bridgeUrl}/v1/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-bridge-token': bridgeToken,
        },
        body: JSON.stringify({ message, model, system: SYSTEM_PROMPT }),
        signal: AbortSignal.timeout(30000),
      });
      if (r.ok) {
        const data = await r.json();
        return NextResponse.json({ ok: true, reply: data.reply, source: 'hermes', model: data.model });
      }
    } catch { /* بنرجع للـ fallback */ }
  }

  // المحاولة 2: Anthropic API مباشرة
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const modelMap: Record<string, string> = {
        'claude-sonnet': 'claude-sonnet-4-5',
        'claude-opus': 'claude-opus-4-5',
        'claude-haiku': 'claude-haiku-4-5',
      };
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: modelMap[model] || 'claude-sonnet-4-5',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: message }],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (r.ok) {
        const data = await r.json();
        return NextResponse.json({
          ok: true,
          reply: data.content[0].text,
          source: 'anthropic',
          model: data.model,
        });
      }
      const errorText = await r.text();
      return NextResponse.json({ ok: false, error: `anthropic ${r.status}: ${errorText.slice(0, 200)}` }, { status: 500 });
    } catch (e) {
      return NextResponse.json({ ok: false, error: `anthropic_error: ${(e as Error).message}` }, { status: 500 });
    }
  }

  // المحاولة 3: ردّ افتراضي
  return NextResponse.json({
    ok: true,
    source: 'stub',
    reply: `استلمت سؤالك: "${message}". الاتصال بنماذج الذكاء غير مفعّل بعد — سيتمّ ربطه قريباً بـ Hermes Agent على Mac mini.`,
  });
}