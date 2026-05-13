import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { getAgent } from '@/lib/agents/registry';
import { chatWithAgent } from '@/lib/bridge';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { slug } = await params;
  const agent = getAgent(slug);
  if (!agent) return NextResponse.json({ error: 'agent_not_found' }, { status: 404 });
  if (agent.status === 'coming_soon' || agent.status === 'disabled') {
    return NextResponse.json({ error: 'agent_unavailable', message: 'هذا الوكيل قادم قريباً' }, { status: 423 });
  }

  const body = await req.json();
  const { message, conversation_id, context } = body;
  if (!message || !message.trim()) {
    return NextResponse.json({ error: 'empty_message' }, { status: 400 });
  }

  // log user message
  let convId = conversation_id;
  if (!convId) {
    const convs = await db<{ id: number }[]>`
      INSERT INTO agent_conversations (agent_id, user_id, started_at)
      VALUES (${agent.id}, ${session.userId}, NOW())
      RETURNING id
    `.catch(() => [{ id: 0 }]);
    convId = convs[0]?.id;
  }

  if (convId) {
    await db`
      INSERT INTO agent_messages (conversation_id, role, content, created_at)
      VALUES (${convId}, 'user', ${message}, NOW())
    `.catch(() => {});
  }

  // ─── استدعاء Bridge → Hermes → LLM ───
  try {
    const result = await chatWithAgent({
      agent_id: agent.id,
      conversation_id: convId ? String(convId) : undefined,
      user_id: session.userId,
      message,
      context: { ...context, agent_def: agent },
    });

    // log agent reply
    if (convId) {
      await db`
        INSERT INTO agent_messages (conversation_id, role, content, metadata, created_at)
        VALUES (${convId}, 'agent', ${result.reply}, ${db.json({ tool_calls: result.tool_calls, cost: result.cost })}, NOW())
      `.catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      conversation_id: convId,
      reply: result.reply,
      artifacts: result.artifacts || [],
      cost_usd: result.cost?.usd || 0,
    });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('[agent chat]', msg);

    // ─── Fallback: لو الـ Bridge مش متصل، نرجع رسالة واضحة ───
    const fallbackReply = msg.includes('BRIDGE_TOKEN')
      ? '⚠️ الوكيل غير مُعدّ بعد. يحتاج المسؤول ربط BRIDGE_TOKEN.'
      : msg.includes('timeout')
      ? '⏱️ المحرّك يستجيب ببطء. حاول مرّة أخرى.'
      : msg.includes('ECONNREFUSED') || msg.includes('fetch failed')
      ? '🔌 المحرّك (Mac mini Riyadh) غير متصل حالياً. تحقّق من WireGuard tunnel.'
      : `⚠️ خطأ في المحرّك: ${msg}`;

    if (convId) {
      await db`
        INSERT INTO agent_messages (conversation_id, role, content, metadata, created_at)
        VALUES (${convId}, 'agent', ${fallbackReply}, ${db.json({ error: msg })}, NOW())
      `.catch(() => {});
    }

    return NextResponse.json({
      ok: false,
      conversation_id: convId,
      reply: fallbackReply,
      error: msg,
    });
  }
}
