import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false, error: "ليس لديك صلاحية" }, { status: 403 });
  const { id } = await ctx.params;
  const r = await db<any[]>`
    UPDATE ecosystem_programs SET nominations_open = NOT COALESCE(nominations_open, true)
    WHERE id=${Number(id)} RETURNING nominations_open
  `;
  return NextResponse.json({ ok: true, nominations_open: r[0].nominations_open });
}
