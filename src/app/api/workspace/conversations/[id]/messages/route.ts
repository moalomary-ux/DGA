import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const { id } = await ctx.params;
  const rows = await db`
    SELECT m.id, m.role, m.content, m.model, m.tokens_out, m.created_at
    FROM ai_messages m
    JOIN ai_conversations c ON c.id = m.conversation_id
    WHERE c.id = ${Number(id)} AND c.user_id = ${s.userId as string}::uuid
    ORDER BY m.id ASC
  `;
  return NextResponse.json({ ok:true, messages: rows });
}
