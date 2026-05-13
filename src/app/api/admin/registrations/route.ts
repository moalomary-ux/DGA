import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { checkAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  const admin = await checkAdmin(session.userId as string);
  if (!admin.isAdmin) return NextResponse.json({ ok: false, error: "not admin" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "pending";

  const rows = await db`
    SELECT
      r.id, r.user_id, r.requested_at, r.requested_role, r.requested_tenants,
      r.invite_code, r.status, r.user_notes, r.review_notes, r.reviewed_at,
      u.email, u.name_ar, u.name_en, u.title_ar, u.created_at
    FROM registration_requests r
    LEFT JOIN users u ON u.id = r.user_id
    WHERE r.status = ${status}
    ORDER BY r.requested_at DESC LIMIT 200
  `;

  const counts = await db<{ status: string; cnt: number }[]>`
    SELECT status, COUNT(*)::int AS cnt FROM registration_requests GROUP BY status
  `;

  return NextResponse.json({ ok: true, requests: rows, counts: Object.fromEntries(counts.map(r => [r.status, r.cnt])) });
}
