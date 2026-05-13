import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn) return NextResponse.json({ ok: false }, { status: 401 });

  const rows = await db<any[]>`
    SELECT p.id, p.title_ar, p.code, p.kind, p.status,
           TO_CHAR(p.start_date,'YYYY-MM-DD') AS start_date,
           TO_CHAR(p.end_date,'YYYY-MM-DD') AS end_date,
           pa.role, pa.assigned_at,
           (SELECT COUNT(*)::int FROM program_nominees n WHERE n.program_id=p.id) AS nominees_count,
           (SELECT COUNT(*)::int FROM program_nominees n WHERE n.program_id=p.id AND n.status='submitted') AS pending_review
    FROM program_assignments pa
    JOIN ecosystem_programs p ON p.id = pa.program_id
    WHERE pa.user_id = ${session.userId}::uuid
    ORDER BY pa.assigned_at DESC
    LIMIT 50
  `;
  return NextResponse.json({ ok: true, programs: rows });
}
