import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const rows = await db<any[]>`
    SELECT id, title, model, message_count, created_at, updated_at
    FROM ai_conversations
    WHERE user_id = ${session.userId}::uuid
    ORDER BY updated_at DESC
    LIMIT 50
  `;
  return NextResponse.json({ ok: true, conversations: rows.map(r => ({
    id: Number(r.id),
    title: r.title,
    model: r.model,
    message_count: Number(r.message_count || 0),
    created_at: r.created_at,
    updated_at: r.updated_at,
  })) });
}
