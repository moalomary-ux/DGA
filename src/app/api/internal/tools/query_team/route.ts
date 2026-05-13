import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
const TOKEN = process.env.BRIDGE_INTERNAL_TOKEN || "";

export async function POST(req: NextRequest) {
  if (!TOKEN || req.headers.get("x-bridge-token") !== TOKEN) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  if (!body?.user_id) return NextResponse.json({ ok: false, error: "missing user_id" }, { status: 400 });

  const args = body.args || {};
  const filterRole = args.filter_role || null;
  const limit = Math.min(Number(args.limit) || 50, 100);
  const userRole = (body.role || 'user').toLowerCase();

  try {
    let rows: any[];
    if (userRole === 'user') {
      rows = await db<any[]>`
        SELECT u.*, m.role AS member_role, m.tenant_id
        FROM users u
        LEFT JOIN memberships m ON m.user_id = u.id
        WHERE u.id = ${body.user_id}::uuid
        LIMIT 10
      `;
    } else if (filterRole) {
      rows = await db<any[]>`
        SELECT u.*, m.role AS member_role, m.tenant_id
        FROM memberships m
        JOIN users u ON u.id = m.user_id
        WHERE m.role = ${filterRole}
        ORDER BY u.id
        LIMIT ${limit}
      `;
    } else {
      rows = await db<any[]>`
        SELECT u.*, m.role AS member_role, m.tenant_id
        FROM memberships m
        JOIN users u ON u.id = m.user_id
        ORDER BY
          CASE m.role
            WHEN 'super_admin' THEN 1
            WHEN 'admin' THEN 2
            ELSE 3
          END,
          u.id
        LIMIT ${limit}
      `;
    }

    const members = rows.map(r => ({
      id: r.id,
      email: r.email,
      name: r.full_name || r.name || r.display_name || (r.email ? r.email.split('@')[0] : 'مجهول'),
      role: r.member_role,
      tenant_id: r.tenant_id,
    }));

    return NextResponse.json({ ok: true, count: members.length, members });
  } catch (e: any) {
    console.error("query_team error:", e?.message);
    return NextResponse.json({ ok: false, error: e?.message || "db error" }, { status: 500 });
  }
}
