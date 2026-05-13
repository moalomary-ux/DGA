import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  const { userId } = await ctx.params;
  if (userId === session.userId) return NextResponse.json({ ok: false, error: "لا يمكنك تعديل نفسك" }, { status: 400 });

  const body = await req.json();

  if (body.delete) {
    if (!admin.isSuperAdmin) return NextResponse.json({ ok: false, error: "super_admin only" }, { status: 403 });
    await db`DELETE FROM users WHERE id=${userId}::uuid`;
    return NextResponse.json({ ok: true, deleted: true });
  }

  if (body.status) {
    const validStatuses = ["active", "pending", "rejected", "suspended"];
    if (!validStatuses.includes(body.status)) return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
    await db`UPDATE users SET status=${body.status}::user_status, is_active=${body.status === "active"} WHERE id=${userId}::uuid`;
  }

  await db`INSERT INTO audit_log (event, actor_id, metadata) VALUES ('user_updated', ${session.userId}::uuid, ${db.json({ target: userId, changes: body })})`;

  return NextResponse.json({ ok: true });
}
