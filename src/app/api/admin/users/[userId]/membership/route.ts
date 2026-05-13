import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  const { userId } = await ctx.params;
  const { tenant_id, role } = await req.json();
  if (!tenant_id || !role) return NextResponse.json({ ok: false }, { status: 400 });
  if (role === "super_admin" && !admin.isSuperAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  await db`
    INSERT INTO memberships (user_id, tenant_id, role, status, granted_by, granted_at)
    VALUES (${userId}::uuid, ${tenant_id}, ${role}::user_role, 'active', ${session.userId}::uuid, NOW())
    ON CONFLICT (user_id, tenant_id) DO UPDATE
      SET role=EXCLUDED.role, status='active', granted_by=EXCLUDED.granted_by, granted_at=NOW()
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false }, { status: 403 });

  const { userId } = await ctx.params;
  const tenant_id = new URL(req.url).searchParams.get("tenant_id");
  if (!tenant_id) return NextResponse.json({ ok: false }, { status: 400 });

  await db`DELETE FROM memberships WHERE user_id=${userId}::uuid AND tenant_id=${tenant_id}`;
  return NextResponse.json({ ok: true });
}
