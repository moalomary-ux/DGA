import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const s = await getSession();
  if (!s.isLoggedIn) return NextResponse.json({ ok:false }, { status:401 });
  const { token } = await ctx.params;
  await db`
    UPDATE file_shares SET status = 'revoked' 
    WHERE token = ${token} AND shared_by = ${s.userId as string}::uuid AND status = 'active'
  `;
  return NextResponse.json({ ok:true });
}
