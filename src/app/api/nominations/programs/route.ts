import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

  const rows = await db<any[]>`
    SELECT
      p.id, p.title_ar, p.code, p.kind, p.status,
      p.start_date, p.end_date, p.partner,
      COUNT(a.id)::int AS nominees_count
    FROM ecosystem_programs p
    LEFT JOIN ecosystem_attendances a ON a.program_id = p.id
    GROUP BY p.id
    HAVING COUNT(a.id) > 0
    ORDER BY p.start_date DESC NULLS LAST, p.id DESC
    LIMIT 500
  `;
  return NextResponse.json({ ok: true, programs: rows });
}
