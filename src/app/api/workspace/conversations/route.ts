import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const rows = await db`
    SELECT c.id, c.title, c.model, c.created_at, c.updated_at,
      (SELECT COUNT(*)::int FROM ai_messages m WHERE m.conversation_id = c.id) AS message_count,
      (SELECT content FROM ai_messages m WHERE m.conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_message
    FROM ai_conversations c
    WHERE c.user_id = ${s.userId as string}::uuid
    ORDER BY c.updated_at DESC
    LIMIT 50
  `;
  return NextResponse.json({ ok:true, conversations: rows });
}

export async function POST(req: NextRequest) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const { title, model } = await req.json();
  const r = await db<{ id: number }[]>`
    INSERT INTO ai_conversations (user_id, title, model)
    VALUES (${s.userId as string}::uuid, ${title || "محادثة جديدة"}, ${model || "qwen3.5:397b"})
    RETURNING id
  `;
  return NextResponse.json({ ok:true, id: r[0].id });
}
