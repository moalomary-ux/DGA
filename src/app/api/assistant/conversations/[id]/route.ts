import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function parseMeta(raw: any): any {
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const convId = Number(id);
  if (!Number.isFinite(convId)) return NextResponse.json({ ok: false, error: 'bad id' }, { status: 400 });

  const conv = await db<any[]>`
    SELECT id, title, model, message_count, created_at, updated_at FROM ai_conversations
    WHERE id = ${convId} AND user_id = ${session.userId}::uuid`;
  if (conv.length === 0) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });

  const messages = await db<any[]>`
    SELECT id, role, content, tokens, metadata, created_at FROM ai_messages
    WHERE conversation_id = ${convId} ORDER BY id ASC`;

  const allAttIds: number[] = [];
  for (const m of messages) {
    const meta = parseMeta(m.metadata);
    if (Array.isArray(meta.attachments)) {
      for (const id of meta.attachments) {
        const n = Number(id);
        if (Number.isFinite(n)) allAttIds.push(n);
      }
    }
  }

  let attMap: Record<number, any> = {};
  if (allAttIds.length > 0) {
    const atts = await db<any[]>`
      SELECT id, filename, mime, size_bytes FROM chat_attachments
      WHERE id = ANY(${allAttIds}::bigint[])`;
    for (const a of atts) attMap[Number(a.id)] = a;
  }

  const enriched = messages.map((m: any) => {
    const meta = parseMeta(m.metadata);
    const ids: number[] = Array.isArray(meta.attachments) ? meta.attachments : [];
    const attachments = ids.map((id: number) => attMap[Number(id)]).filter(Boolean);
    return { ...m, attachments };
  });

  return NextResponse.json({ ok: true, conversation: conv[0], messages: enriched });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const { id } = await params;
  const convId = Number(id);
  if (!Number.isFinite(convId)) return NextResponse.json({ ok: false, error: 'bad id' }, { status: 400 });

  await db`DELETE FROM ai_messages WHERE conversation_id = ${convId}`;
  const r = await db<any[]>`
    DELETE FROM ai_conversations WHERE id = ${convId} AND user_id = ${session.userId}::uuid RETURNING id`;
  return NextResponse.json({ ok: true, deleted: r.length });
}
