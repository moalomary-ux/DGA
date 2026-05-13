import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false, error: "not admin" }, { status: 403 });

  const users = await db`
    SELECT
      u.id, u.email, u.name_ar, u.name_en, u.title_ar, u.title_en, u.phone,
      u.is_active, u.status::text AS status, u.created_at, u.last_login_at,
      COALESCE(
        json_agg(
          json_build_object('tenant', m.tenant_id, 'role', m.role, 'status', m.status)
          ORDER BY m.tenant_id
        ) FILTER (WHERE m.tenant_id IS NOT NULL),
        '[]'::json
      ) AS memberships
    FROM users u
    LEFT JOIN memberships m ON m.user_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT 500
  `;

  return NextResponse.json({ ok: true, users });
}
