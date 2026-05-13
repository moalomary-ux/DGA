import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const { id } = await ctx.params;
  await db`DELETE FROM ai_conversations WHERE id = ${Number(id)} AND user_id = ${s.userId as string}::uuid`;
  return NextResponse.json({ ok:true });
}
