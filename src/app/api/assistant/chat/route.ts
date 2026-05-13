import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BRIDGE_URL = process.env.SAMI_BRIDGE_URL || 'http://10.10.10.2:7080';
const BRIDGE_TOKEN = process.env.SAMI_BRIDGE_TOKEN || '';
const VISION_MODELS = new Set(['qwen3-vl:235b', 'qwen3-vl:235b-instruct', 'gemini-3-flash-preview']);

const ANTI_HALLUCINATION = `

⛔ قواعد صارمة (لا تنكسر):
1. ممنوع تماماً اختراع أرقام أو بيانات. لو ما عندك مصدر فعلي، قل: "ما أقدر أعطيك بيانات حقيقية الآن — Phase 3 قادم."
2. ما تقدر: استعلام DB، Mac mini، إرسال إيميل، أوامر نظام.
3. تقدر: تلخيص الملفات المرفقة (txt, md, csv, json, xlsx, docx)، كتابة وثائق، تحليل نصوص.
4. عند ملف مرفق: ابحث عن "📎". لو فيه نص → استخدمه فعلياً.
5. عند صورة + موديل vision: حلّلها كما تراها.
6. الصدق فوق الإجابة: "ما أعرف" أفضل من تلفيق.`;

const SYSTEM_PROMPTS: Record<string, string> = {
  super_admin: `أنت Hermes — مساعد المدير العام لقدراتك الرقمية في هيئة الحكومة الرقمية السعودية.
أسلوبك مباشر تنفيذي. عربي سعودي.${ANTI_HALLUCINATION}`,
  admin: `أنت Hermes — مساعد مدير قسم.${ANTI_HALLUCINATION}`,
  user: `أنت Hermes — مساعد موظف.${ANTI_HALLUCINATION}`,
};

async function getUserRole(userId: string): Promise<'super_admin'|'admin'|'user'> {
  try {
    const rows = await db<any[]>`SELECT role FROM memberships WHERE user_id = ${userId}::uuid`;
    const roles = rows.map((r: any) => (r.role || '').toLowerCase());
    if (roles.includes('super_admin')) return 'super_admin';
    if (roles.some((r: string) => r.includes('admin'))) return 'admin';
    return 'user';
  } catch { return 'user'; }
}

function parseMeta(raw: any): any {
  if (raw == null) return {};
  if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return {}; } }
  return raw;
}

function buildAttachmentBlock(att: any, maxChars = 6000, isVisionModel = false): string {
  const header = `\n\n📎 **${att.filename}** (${att.mime}, ${att.size_bytes} bytes)`;
  if (att.content_text) {
    const truncated = att.content_text.length > maxChars;
    const text = att.content_text.slice(0, maxChars);
    return `${header}\n\`\`\`\n${text}\n\`\`\`${truncated ? `\n_[اقتُطع — ${att.content_text.length} حرف]_` : ''}`;
  }
  if ((att.mime || '').startsWith('image/')) {
    if (isVisionModel) return `${header}\n_[صورة مرفقة — حلّلها كما تراها]_`;
    return `${header}\n_[صورة — هذا الموديل لا يحلّل صور. أخبر المستخدم باختيار qwen3-vl.]_`;
  }
  return `${header}\n_[ملف ثنائي — لم يُستخرج]_`;
}

function autoRouteModel(message: string, attachmentMimes: string[]): { model: string; reason: string } {
  if (attachmentMimes.some(m => (m || '').startsWith('image/'))) {
    return { model: 'qwen3-vl:235b', reason: 'صورة' };
  }
  const codeRegex = /\b(function|class|import\s|def\s|const\s|let\s|var\s|return\s|async\s|await\s|select\s|insert\s|update\s|delete\s|console\.log|print\()/i;
  if (codeRegex.test(message) || /```/.test(message)) {
    return { model: 'qwen3-coder:480b', reason: 'كود' };
  }
  const reasoningRegex = /(خطة|استراتيجية|قارن|تحليل\s|اقترح|راجع|دراسة|roadmap|architecture|kanban|اطار|إطار)/i;
  if (reasoningRegex.test(message) && message.length > 80) {
    return { model: 'kimi-k2-thinking', reason: 'تحليل عميق' };
  }
  if (message.length < 80 && attachmentMimes.length === 0) {
    return { model: 'deepseek-v4-flash', reason: 'سؤال قصير' };
  }
  return { model: 'qwen3.5:397b', reason: 'افتراضي عربي' };
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let body: any;
  try { body = await req.json(); } catch {
    return NextResponse.json({ ok: false, error: 'invalid json' }, { status: 400 });
  }
  const message = String(body?.message || '').trim();
  let conversationId = body?.conversationId ? Number(body.conversationId) : null;
  const requestedModel = String(body?.model || '__auto__');
  const attachmentIds: number[] = Array.isArray(body?.attachments)
    ? body.attachments.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
    : [];

  if (!message && attachmentIds.length === 0) {
    return NextResponse.json({ ok: false, error: 'no message or attachments' }, { status: 400 });
  }

  // ★ Resolve __auto__ → actual model
  let effectiveModel = requestedModel;
  let routeReason = 'manual';
  if (requestedModel === '__auto__' || requestedModel === 'auto') {
    let attMimes: string[] = [];
    if (attachmentIds.length > 0) {
      const atts = await db<any[]>`SELECT mime FROM chat_attachments WHERE id = ANY(${attachmentIds}::bigint[])`;
      attMimes = atts.map((a: any) => a.mime || '');
    }
    const routed = autoRouteModel(message, attMimes);
    effectiveModel = routed.model;
    routeReason = `auto: ${routed.reason}`;
  }

  const isVisionModel = VISION_MODELS.has(effectiveModel);
  const userRole = await getUserRole(session.userId);
  const systemPrompt = SYSTEM_PROMPTS[userRole] || SYSTEM_PROMPTS.user;

  if (!conversationId) {
    const title = (message || `محادثة بمرفق ${attachmentIds.length}`).slice(0, 80);
    const rows = await db<any[]>`
      INSERT INTO ai_conversations (user_id, title, model)
      VALUES (${session.userId}::uuid, ${title}, ${effectiveModel}) RETURNING id`;
    conversationId = Number(rows[0].id);
  } else {
    const check = await db<any[]>`SELECT id FROM ai_conversations WHERE id = ${conversationId} AND user_id = ${session.userId}::uuid`;
    if (check.length === 0) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  }

  if (attachmentIds.length > 0) {
    await db`UPDATE chat_attachments SET conversation_id = ${conversationId}
      WHERE user_id = ${session.userId}::uuid AND id = ANY(${attachmentIds}::bigint[]) AND conversation_id IS NULL`;
  }

  await db`INSERT INTO ai_messages (conversation_id, role, content, metadata)
    VALUES (${conversationId}, 'user', ${message || '(مرفقات فقط)'}, ${JSON.stringify({ attachments: attachmentIds, requested: requestedModel })}::jsonb)`;

  const rawHistory = await db<any[]>`
    SELECT id, role, content, metadata FROM ai_messages
    WHERE conversation_id = ${conversationId} ORDER BY id DESC LIMIT 20`;
  rawHistory.reverse();

  const allAttIds: number[] = [];
  for (const m of rawHistory) {
    const meta = parseMeta(m.metadata);
    if (Array.isArray(meta.attachments)) {
      for (const id of meta.attachments) {
        const n = Number(id);
        if (Number.isFinite(n)) allAttIds.push(n);
      }
    }
  }

  let attMap = new Map<number, any>();
  if (allAttIds.length > 0) {
    const allAtts = await db<any[]>`SELECT id, filename, mime, size_bytes, content_text, storage_b64 FROM chat_attachments WHERE id = ANY(${allAttIds}::bigint[])`;
    for (const a of allAtts) attMap.set(Number(a.id), a);
  }

  const messagesForLLM = rawHistory.map((m: any) => {
    let content = m.content;
    const images: string[] = [];
    const meta = parseMeta(m.metadata);
    if (Array.isArray(meta.attachments) && meta.attachments.length > 0) {
      for (const id of meta.attachments) {
        const a = attMap.get(Number(id));
        if (!a) continue;
        const isImage = (a.mime || '').startsWith('image/');
        if (isImage && isVisionModel && a.storage_b64) {
          content += buildAttachmentBlock(a, 6000, true);
          images.push(a.storage_b64);
        } else {
          content += buildAttachmentBlock(a, 6000, false);
        }
      }
    }
    const msg: any = { role: m.role, content };
    if (images.length > 0) msg.images = images;
    return msg;
  });

  const t0 = Date.now();
  let bridgeRes: Response;
  try {
    bridgeRes = await fetch(`${BRIDGE_URL}/v1/chat/stream`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${BRIDGE_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: effectiveModel,
        messages: messagesForLLM,
        user_id: session.userId,
        system: systemPrompt,
        role: userRole,
        conversation_id: conversationId,
        enable_tools: true,
      }),
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: `bridge: ${e?.message}` }, { status: 502 });
  }
  if (!bridgeRes.ok || !bridgeRes.body) {
    return NextResponse.json({ ok: false, error: `bridge HTTP ${bridgeRes.status}` }, { status: 502 });
  }

  const userId = session.userId;
  const convId = conversationId;
  let fullReply = '';
  let tokens = 0;
  let model = effectiveModel;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({
        type: 'meta', conversationId: convId, role: userRole,
        vision: isVisionModel, resolvedModel: effectiveModel, routeReason,
      })}\n\n`));
      const reader = bridgeRes.body!.getReader();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(value);
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split('\n\n');
          buffer = blocks.pop() || '';
          for (const block of blocks) {
            const line = block.trim();
            if (!line.startsWith('data: ')) continue;
            try {
              const chunk = JSON.parse(line.slice(6));
              if (chunk.type === 'text') fullReply += chunk.text;
              else if (chunk.type === 'done') { tokens = chunk.tokens || 0; model = chunk.model || model; }
            } catch {}
          }
        }
      } catch {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'stream interrupted' })}\n\n`));
      } finally {
        controller.close();
        const duration = Date.now() - t0;
        if (fullReply) {
          try {
            await db`INSERT INTO ai_messages (conversation_id, role, content, tokens, metadata)
              VALUES (${convId}, 'assistant', ${fullReply}, ${tokens},
                ${JSON.stringify({ bridge: 'ok', model, ms: duration, role: userRole, routeReason })}::jsonb)`;
            await db`UPDATE ai_conversations SET message_count = message_count + 2, updated_at = now(), model = ${model} WHERE id = ${convId}`;
            await db`INSERT INTO ai_usage_log (user_id, user_role, action, conversation_id, model, tokens_out, duration_ms, success, metadata)
              VALUES (${userId}::uuid, ${userRole}, 'chat', ${convId}, ${model}, ${tokens}, ${duration}, true,
                ${JSON.stringify({ requested: requestedModel, routeReason })}::jsonb)`;
          } catch (e) { console.error('persist fail', e); }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no', 'X-Conversation-Id': String(convId),
    },
  });
}
